const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const { loadSpeechConfig } = require('../lib/config');

/**
 * Real-time speech-to-text route.
 *
 * The backend acts as a WebSocket proxy between the browser (which sends raw
 * PCM16 audio chunks) and a local inference endpoint serving a streaming ASR
 * model via the OpenAI Realtime API.
 *
 * When the inference server isn't already running, the backend will
 * automatically start it using the configured runtime (e.g. ramalama) and
 * stream startup progress to the client.
 *
 * Protocol (browser  <->  this server):
 *   Browser sends:  binary PCM16 audio frames  OR  JSON control messages
 *   Server sends:   { type: 'starting' | 'connected' | 'transcript' |
 *                           'transcript_final' | 'error' | 'disconnected', ... }
 */

// ──────────────────────────────────────────────
//  Managed inference server (ramalama / vLLM)
// ──────────────────────────────────────────────

let managedProcess = null;
let managedProcessStarting = false;

/**
 * Check whether the speech inference endpoint is reachable.
 */
function isEndpointReady(apiUrl) {
  return new Promise((resolve) => {
    try {
      const httpUrl = apiUrl
        .replace(/^ws:\/\//, 'http://')
        .replace(/^wss:\/\//, 'https://');
      const baseUrl = httpUrl.replace(/\/v1\/realtime.*/, '');
      const healthUrl = `${baseUrl}/v1/models`;

      const req = http.get(healthUrl, { timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Spawn the configured runtime (default: ramalama) to serve the speech model.
 */
function startManagedServer(config) {
  const model = config.model || 'mistralai/Voxtral-Mini-4B-Realtime-2602';

  // Extract port from apiUrl
  let port = '8000';
  try {
    const url = new URL(config.apiUrl.replace(/^ws/, 'http'));
    if (url.port) port = url.port;
  } catch {}

  const runtime = config.runtime || 'ramalama';
  const args = ['serve', '--port', port, model];

  console.log(`[speech] Starting ${runtime}: ${runtime} ${args.join(' ')}`);

  managedProcess = spawn(runtime, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  managedProcess.stdout.on('data', (d) => {
    console.log(`[speech/${runtime}] ${d.toString().trim()}`);
  });
  managedProcess.stderr.on('data', (d) => {
    console.log(`[speech/${runtime}] ${d.toString().trim()}`);
  });

  managedProcess.on('error', (err) => {
    console.error(`[speech] Failed to start ${runtime}: ${err.message}`);
    managedProcess = null;
    managedProcessStarting = false;
  });

  managedProcess.on('exit', (code) => {
    console.log(`[speech] ${runtime} exited (code ${code})`);
    managedProcess = null;
    managedProcessStarting = false;
  });
}

/**
 * Ensure the inference endpoint is reachable. If not, start it with the
 * configured runtime and poll until it's healthy. Sends progress messages
 * to `clientWs` so the browser can show startup state.
 *
 * Returns true if the endpoint is ready, false on timeout / failure.
 */
async function ensureEndpoint(config, clientWs) {
  // Already running?
  if (await isEndpointReady(config.apiUrl)) return true;

  const runtime = config.runtime || 'ramalama';

  // Start the managed server if not already in progress
  if (!managedProcess && !managedProcessStarting) {
    managedProcessStarting = true;
    startManagedServer(config);
  }

  // Poll until the endpoint is reachable (up to ~120 s)
  const deadline = Date.now() + 120_000;
  let tick = 0;
  while (Date.now() < deadline) {
    tick++;
    try {
      clientWs.send(JSON.stringify({
        type: 'starting',
        message: `Starting speech model via ${runtime}…`,
        elapsed: tick * 3
      }));
    } catch { break; } // client disconnected

    await new Promise((r) => setTimeout(r, 3000));

    if (await isEndpointReady(config.apiUrl)) {
      managedProcessStarting = false;
      return true;
    }
  }

  managedProcessStarting = false;
  return false;
}

// Clean up the managed server on process exit
function cleanupManagedServer() {
  if (managedProcess) {
    console.log('[speech] Stopping managed inference server…');
    managedProcess.kill('SIGTERM');
    managedProcess = null;
  }
}
process.on('exit', cleanupManagedServer);
process.on('SIGINT', () => { cleanupManagedServer(); process.exit(); });
process.on('SIGTERM', () => { cleanupManagedServer(); process.exit(); });

// ──────────────────────────────────────────────
//  Express + WebSocket route
// ──────────────────────────────────────────────

function createSpeechRouter(app) {
  const router = express.Router();

  // REST: config / health check
  router.get('/config', (req, res) => {
    const config = loadSpeechConfig();
    res.json({
      configured: !!(config && config.apiUrl),
      model: (config && config.model) || '',
      runtime: (config && config.runtime) || 'ramalama',
      serverRunning: !!managedProcess
    });
  });

  // REST: status of the managed server
  router.get('/server-status', async (req, res) => {
    const config = loadSpeechConfig();
    if (!config || !config.apiUrl) {
      return res.json({ running: false, configured: false });
    }
    const running = await isEndpointReady(config.apiUrl);
    res.json({ running, configured: true, starting: managedProcessStarting });
  });

  // WebSocket: real-time speech-to-text stream
  app.ws('/api/speech/stream', async (clientWs, req) => {
    const config = loadSpeechConfig();

    if (!config || !config.apiUrl) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Speech-to-text is not configured. Add a "speech" section to data/config.json with apiUrl and model.'
      }));
      clientWs.close();
      return;
    }

    // ── Phase 1: ensure the inference server is up ──
    const ready = await ensureEndpoint(config, clientWs);
    if (!ready) {
      try {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: 'Speech model server failed to start within the timeout. Check the server logs.'
        }));
        clientWs.close();
      } catch {}
      return;
    }

    // ── Phase 2: connect to the inference endpoint ──
    const model = config.model || '';
    const baseUrl = config.apiUrl.replace(/\/+$/, '');
    const realtimeUrl = model
      ? `${baseUrl}?model=${encodeURIComponent(model)}`
      : baseUrl;

    console.log(`[speech] Proxying to inference endpoint: ${realtimeUrl}`);

    let inferenceWs = null;
    try {
      inferenceWs = new WebSocket(realtimeUrl);
    } catch (err) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: `Failed to connect to speech endpoint: ${err.message}`
      }));
      clientWs.close();
      return;
    }

    inferenceWs.on('open', () => {
      console.log('[speech] Connected to inference endpoint');
      clientWs.send(JSON.stringify({ type: 'connected' }));

      // Configure the realtime session for transcription
      inferenceWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text'],
          input_audio_format: 'pcm16',
          input_audio_transcription: { model },
          turn_detection: { type: 'server_vad' }
        }
      }));
    });

    inferenceWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          // Incremental transcript deltas
          case 'response.audio_transcript.delta':
          case 'response.text.delta':
          case 'conversation.item.input_audio_transcription.delta':
            clientWs.send(JSON.stringify({ type: 'transcript', text: msg.delta || '' }));
            break;

          // Completed transcript segments
          case 'response.audio_transcript.done':
            clientWs.send(JSON.stringify({ type: 'transcript_final', text: msg.transcript || '' }));
            break;
          case 'response.text.done':
            clientWs.send(JSON.stringify({ type: 'transcript_final', text: msg.text || '' }));
            break;
          case 'conversation.item.input_audio_transcription.completed':
            clientWs.send(JSON.stringify({ type: 'transcript_final', text: msg.transcript || '' }));
            break;

          // Session lifecycle
          case 'session.created':
          case 'session.updated':
            clientWs.send(JSON.stringify({ type: 'session', event: msg.type }));
            break;

          // Errors from the inference server
          case 'error':
            console.error('[speech] Inference error:', msg.error);
            clientWs.send(JSON.stringify({
              type: 'error',
              message: msg.error?.message || 'Unknown error from speech model'
            }));
            break;

          default:
            if (process.env.NODE_ENV === 'development') {
              console.log('[speech] Inference event:', msg.type);
            }
            break;
        }
      } catch {
        // Non-JSON payload — ignore
      }
    });

    inferenceWs.on('error', (err) => {
      console.error('[speech] Inference WS error:', err.message);
      try {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: `Speech model error: ${err.message}`
        }));
      } catch {}
    });

    inferenceWs.on('close', (code) => {
      console.log(`[speech] Inference connection closed (${code})`);
      try {
        clientWs.send(JSON.stringify({ type: 'disconnected' }));
        clientWs.close();
      } catch {}
    });

    // ── Handle audio & control messages from the browser ──
    clientWs.on('message', (data) => {
      if (!inferenceWs || inferenceWs.readyState !== WebSocket.OPEN) return;

      if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        // Binary PCM16 audio → base64 → Realtime API envelope
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        inferenceWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: buf.toString('base64')
        }));
      } else {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'stop') {
            inferenceWs.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
            inferenceWs.send(JSON.stringify({ type: 'response.create' }));
          } else {
            inferenceWs.send(data.toString());
          }
        } catch {}
      }
    });

    clientWs.on('close', () => {
      console.log('[speech] Client disconnected');
      if (inferenceWs) inferenceWs.close();
    });

    clientWs.on('error', (err) => {
      console.error('[speech] Client WS error:', err.message);
      if (inferenceWs) inferenceWs.close();
    });
  });

  return router;
}

module.exports = createSpeechRouter;

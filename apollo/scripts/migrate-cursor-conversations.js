#!/usr/bin/env node

/**
 * Migrate Cursor IDE conversations into Apollo's data/conversations/ folder.
 *
 * Data sources (in priority order):
 *   1. Agent transcripts  – plain-text files at
 *      ~/.cursor/projects/<project-hash>/agent-transcripts/<uuid>.txt
 *   2. SQLite chat stores  – binary blob DBs at
 *      ~/.cursor/chats/<workspace-hash>/<uuid>/store.db
 *      (metadata only – name, mode, createdAt; blobs are binary/protobuf)
 *
 * The script:
 *   - Parses each transcript into user / assistant message pairs
 *   - Extracts thinking blocks and tool-call metadata from assistant turns
 *   - Enriches with SQLite metadata when the same conversation ID exists there
 *   - Writes each conversation as an Apollo session folder:
 *       data/conversations/<timestamp-id>/metadata.yaml + messages.json
 *   - Skips conversations already imported (dedup by cursorConversationId)
 *
 * Usage:
 *   node scripts/migrate-cursor-conversations.js [--dry-run] [--verbose]
 *
 * Can also be imported as a module for the server-side sync endpoint.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const YAML = require('yaml');

// ─── Paths ──────────────────────────────────────────────────────────────────

const APOLLO_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(APOLLO_ROOT, 'data');
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations');

const CURSOR_HOME = path.join(os.homedir(), '.cursor');
const CURSOR_PROJECTS_DIR = path.join(CURSOR_HOME, 'projects');
const CURSOR_CHATS_DIR = path.join(CURSOR_HOME, 'chats');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find the Cursor project directory for this workspace.
 * Cursor uses the workspace absolute path with '/' replaced by '-' as the folder name.
 */
function findCursorProjectDir() {
  if (!fs.existsSync(CURSOR_PROJECTS_DIR)) return null;

  // Encode the workspace path the way Cursor does: replace / with -
  // e.g. /Users/abraren/acorn/local/code/apollo/apollo → Users-abraren-acorn-local-code-apollo-apollo
  const workspacePath = APOLLO_ROOT;
  const encoded = workspacePath.replace(/^\//, '').replace(/\//g, '-');

  const projectDir = path.join(CURSOR_PROJECTS_DIR, encoded);
  if (fs.existsSync(projectDir)) return projectDir;

  // Fallback: scan for a directory that contains our workspace name
  try {
    const dirs = fs.readdirSync(CURSOR_PROJECTS_DIR);
    for (const dir of dirs) {
      if (dir.includes('apollo')) {
        const candidate = path.join(CURSOR_PROJECTS_DIR, dir);
        if (fs.statSync(candidate).isDirectory()) {
          const transcriptsDir = path.join(candidate, 'agent-transcripts');
          if (fs.existsSync(transcriptsDir)) return candidate;
        }
      }
    }
  } catch { /* ignore */ }

  return null;
}

/**
 * Find the Cursor workspace hash directory for SQLite chat stores.
 */
function findCursorWorkspaceHash() {
  if (!fs.existsSync(CURSOR_CHATS_DIR)) return null;
  try {
    const dirs = fs.readdirSync(CURSOR_CHATS_DIR).filter(d =>
      fs.statSync(path.join(CURSOR_CHATS_DIR, d)).isDirectory()
    );
    // Usually there's only one workspace hash; return the first
    return dirs.length > 0 ? dirs[0] : null;
  } catch { return null; }
}

/**
 * Read SQLite metadata for a conversation (if sqlite3 available via better-sqlite3 or child_process).
 * Returns { name, mode, createdAt } or null.
 */
function readSqliteMetadata(conversationId) {
  const hash = findCursorWorkspaceHash();
  if (!hash) return null;

  const dbPath = path.join(CURSOR_CHATS_DIR, hash, conversationId, 'store.db');
  if (!fs.existsSync(dbPath)) return null;

  try {
    // Use child_process to call sqlite3 since we don't want to add a native dependency
    const { execSync } = require('child_process');
    const hexValue = execSync(
      `sqlite3 "${dbPath}" "SELECT value FROM meta WHERE key='0';"`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();

    if (!hexValue) return null;
    const json = Buffer.from(hexValue, 'hex').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Generate an Apollo session folder name from a timestamp.
 * Format: YYYY-MM-DD-HH-mm-ss-SSS-<8-char-hex>
 */
function generateSessionFolderName(timestamp) {
  const date = new Date(timestamp);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const uid = crypto.randomBytes(4).toString('hex');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
    uid
  ].join('-');
}

// ─── Transcript Parser ──────────────────────────────────────────────────────

/**
 * Parse a Cursor agent transcript text file into structured messages.
 *
 * Transcript format:
 *   user:
 *   <user_query>
 *   [message content]
 *   </user_query>
 *
 *   A:
 *   [Thinking] [thinking text]
 *   [Tool call] [tool name]
 *     param: value
 *   [Tool result] [result text]
 *   assistant:
 *   [response text]
 *
 * Returns an array of message objects.
 */
function parseTranscript(text) {
  const messages = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── User message ──
    if (line.trim() === 'user:') {
      i++;
      // Look for <user_query> tag
      while (i < lines.length && !lines[i].includes('<user_query>')) i++;
      if (i >= lines.length) break;

      // Collect content between <user_query> and </user_query>
      let content = '';
      const firstLine = lines[i].replace('<user_query>', '').trim();
      if (firstLine) content += firstLine + '\n';
      i++;

      while (i < lines.length && !lines[i].includes('</user_query>')) {
        content += lines[i] + '\n';
        i++;
      }
      i++; // skip </user_query>

      content = content.trim();
      if (content) {
        messages.push({
          role: 'user',
          content
        });
      }
      continue;
    }

    // ── Assistant turn (starts with "A:" or "assistant:") ──
    if (line.trim() === 'A:' || line.trim() === 'assistant:') {
      i++;

      let thinking = [];
      let toolCalls = [];
      let assistantContent = '';
      let currentToolCall = null;

      while (i < lines.length) {
        const aLine = lines[i];

        // Next user turn or another A: block means we're done
        if (aLine.trim() === 'user:') break;

        // Thinking block
        if (aLine.startsWith('[Thinking]')) {
          const thinkText = aLine.replace('[Thinking]', '').trim();
          if (thinkText) thinking.push(thinkText);
          i++;
          // Collect continuation lines (indented or until next marker)
          while (i < lines.length) {
            const nextLine = lines[i];
            if (nextLine.startsWith('[') || nextLine.trim() === 'user:' ||
                nextLine.trim() === 'A:' || nextLine.trim() === 'assistant:') break;
            if (nextLine.trim()) thinking.push(nextLine.trim());
            i++;
          }
          continue;
        }

        // Tool call
        if (aLine.startsWith('[Tool call]')) {
          const toolName = aLine.replace('[Tool call]', '').trim();
          currentToolCall = { tool: toolName, params: {} };
          i++;
          // Collect parameters (indented lines with key: value)
          while (i < lines.length) {
            const paramLine = lines[i];
            if (!paramLine.startsWith('  ') || paramLine.startsWith('[')) break;
            const colonIdx = paramLine.indexOf(':');
            if (colonIdx > 0) {
              const key = paramLine.substring(0, colonIdx).trim();
              const value = paramLine.substring(colonIdx + 1).trim();
              currentToolCall.params[key] = value;
            }
            i++;
          }
          toolCalls.push(currentToolCall);
          currentToolCall = null;
          continue;
        }

        // Tool result – skip the content (it's verbose and not needed for conversation display)
        if (aLine.startsWith('[Tool result]')) {
          i++;
          // Skip until next marker
          while (i < lines.length) {
            const nextLine = lines[i];
            if (nextLine.startsWith('[') || nextLine.trim() === 'user:' ||
                nextLine.trim() === 'A:' || nextLine.trim() === 'assistant:') break;
            i++;
          }
          continue;
        }

        // New A: or assistant: section within the same turn
        if (aLine.trim() === 'A:' || aLine.trim() === 'assistant:') {
          // Flush current assistant content if any, then start fresh section
          // Actually this is continuation of the same turn in transcripts
          i++;
          continue;
        }

        // Regular content line (assistant's actual response)
        if (aLine.trim()) {
          assistantContent += aLine + '\n';
        }
        i++;
      }

      assistantContent = assistantContent.trim();

      // Build the assistant message
      if (assistantContent || thinking.length > 0 || toolCalls.length > 0) {
        const msg = {
          role: 'assistant',
          content: assistantContent || '(No text response)'
        };

        if (thinking.length > 0) {
          msg.thinking = thinking.join('\n');
        }

        if (toolCalls.length > 0) {
          msg.toolCalls = toolCalls;
        }

        messages.push(msg);
      }
      continue;
    }

    i++;
  }

  return messages;
}

/**
 * Extract a title from the first user message.
 * Truncates to ~80 chars for readability.
 */
function extractTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser || !firstUser.content) return 'Untitled Cursor conversation';

  let title = firstUser.content
    .split('\n')[0]  // First line only
    .replace(/[#*_`]/g, '')  // Strip markdown
    .trim();

  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }

  return title || 'Untitled Cursor conversation';
}

// ─── Import Logic ───────────────────────────────────────────────────────────

/**
 * Get a Map of Cursor conversation IDs already imported to Apollo.
 * Returns Map<cursorConversationId, { sessionFolder, importedAt }>.
 */
function getAlreadyImportedMap() {
  const imported = new Map();
  if (!fs.existsSync(CONVERSATIONS_DIR)) return imported;

  try {
    const folders = fs.readdirSync(CONVERSATIONS_DIR).filter(f =>
      fs.statSync(path.join(CONVERSATIONS_DIR, f)).isDirectory()
    );

    for (const folder of folders) {
      const metaPath = path.join(CONVERSATIONS_DIR, folder, 'metadata.yaml');
      if (!fs.existsSync(metaPath)) continue;

      try {
        const meta = YAML.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (meta && meta.cursorConversationId) {
          imported.set(meta.cursorConversationId, {
            sessionFolder: folder,
            importedAt: meta.importedAt || meta.updatedAt || meta.createdAt
          });
        }
      } catch { /* skip corrupted files */ }
    }
  } catch { /* ignore */ }

  return imported;
}

/**
 * Backward-compatible wrapper: returns a Set of already-imported IDs.
 */
function getAlreadyImportedIds() {
  return new Set(getAlreadyImportedMap().keys());
}

/**
 * Find conversations that were imported recently but whose source transcript
 * has been modified since the last import (i.e. the conversation continued).
 *
 * @param {number} [maxAgeDays=7] - Only check imports from the last N days.
 * @returns {Array<{ cursorConversationId, sessionFolder, importedAt, transcriptPath, transcriptMtime }>}
 */
function getStaleImports(maxAgeDays = 7) {
  const stale = [];
  const importedMap = getAlreadyImportedMap();
  if (importedMap.size === 0) return stale;

  const projectDir = findCursorProjectDir();
  if (!projectDir) return stale;

  const transcriptsDir = path.join(projectDir, 'agent-transcripts');
  if (!fs.existsSync(transcriptsDir)) return stale;

  const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);

  for (const [cursorId, info] of importedMap) {
    // Only check recently imported conversations
    const importedTime = new Date(info.importedAt).getTime();
    if (importedTime < cutoff) continue;

    const transcriptPath = path.join(transcriptsDir, `${cursorId}.txt`);
    if (!fs.existsSync(transcriptPath)) continue;

    try {
      const stat = fs.statSync(transcriptPath);
      const transcriptMtime = stat.mtime.getTime();

      // If the transcript was modified after we imported it, it's stale
      if (transcriptMtime > importedTime) {
        stale.push({
          cursorConversationId: cursorId,
          sessionFolder: info.sessionFolder,
          importedAt: info.importedAt,
          transcriptPath,
          transcriptMtime: stat.mtime.toISOString()
        });
      }
    } catch { /* skip */ }
  }

  return stale;
}

/**
 * Import a single Cursor conversation into Apollo.
 *
 * @param {string} conversationId - Cursor's UUID
 * @param {string} transcriptPath - Path to the .txt transcript
 * @param {object} [options] - { dryRun, verbose }
 * @returns {{ success: boolean, sessionId?: string, skipped?: boolean, error?: string }}
 */
function importConversation(conversationId, transcriptPath, options = {}) {
  const { dryRun = false, verbose = false } = options;

  try {
    // Read and parse the transcript
    const text = fs.readFileSync(transcriptPath, 'utf-8');
    const messages = parseTranscript(text);

    if (messages.length === 0) {
      if (verbose) console.log(`  Skipping ${conversationId}: no parseable messages`);
      return { success: false, skipped: true, error: 'No parseable messages' };
    }

    // Get file timestamps
    const stat = fs.statSync(transcriptPath);
    const createdAt = stat.birthtime || stat.ctime;
    const updatedAt = stat.mtime;

    // Try to enrich with SQLite metadata
    const sqliteMeta = readSqliteMetadata(conversationId);

    // Determine creation time: prefer SQLite createdAt (ms timestamp), fall back to file birthtime
    const creationTime = sqliteMeta && sqliteMeta.createdAt
      ? new Date(sqliteMeta.createdAt)
      : createdAt;

    // Generate Apollo session folder
    const sessionFolderName = generateSessionFolderName(creationTime);

    // Build metadata
    const title = extractTitle(messages);
    const metadata = {
      id: sessionFolderName,
      conversationId: null,
      cursorConversationId: conversationId,
      importSource: 'cursor',
      importedAt: new Date().toISOString(),
      source: 'cursor-agent',
      title,
      model: null,  // Not reliably available from transcripts
      provider: 'cursor',
      assistant: {
        id: 'cursor-agent',
        name: sqliteMeta ? (sqliteMeta.name || 'Cursor Agent') : 'Cursor Agent',
        type: 'agent',
        isClaudeCode: false,
        isCursorCli: false,
        isKagi: false
      },
      cursorMode: sqliteMeta ? sqliteMeta.mode : null,
      settings: {},
      createdAt: new Date(creationTime).toISOString(),
      updatedAt: new Date(updatedAt).toISOString(),
      messageCount: messages.length,
      status: 'completed'
    };

    // Add timestamps to messages
    const totalMessages = messages.length;
    const startTime = new Date(creationTime).getTime();
    const endTime = new Date(updatedAt).getTime();
    const timeSpan = endTime - startTime;

    const timestampedMessages = messages.map((msg, idx) => ({
      ...msg,
      timestamp: new Date(startTime + (timeSpan * idx / Math.max(totalMessages - 1, 1))).toISOString()
    }));

    if (dryRun) {
      if (verbose) {
        console.log(`  [DRY RUN] Would import ${conversationId}`);
        console.log(`    Title: ${title}`);
        console.log(`    Messages: ${messages.length}`);
        console.log(`    Created: ${metadata.createdAt}`);
      }
      return { success: true, sessionId: sessionFolderName, dryRun: true };
    }

    // Write to disk
    const sessionDir = path.join(CONVERSATIONS_DIR, sessionFolderName);
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(
      path.join(sessionDir, 'metadata.yaml'),
      YAML.stringify(metadata),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(sessionDir, 'messages.json'),
      JSON.stringify(timestampedMessages, null, 2),
      'utf-8'
    );

    return { success: true, sessionId: sessionFolderName };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update an already-imported conversation by re-reading its transcript.
 * Overwrites messages.json and updates metadata in the existing session folder.
 *
 * @param {string} conversationId - Cursor's UUID
 * @param {string} transcriptPath - Path to the .txt transcript
 * @param {string} sessionFolder - Existing Apollo session folder name
 * @param {object} [options] - { dryRun, verbose }
 * @returns {{ success: boolean, updated?: boolean, error?: string }}
 */
function updateConversation(conversationId, transcriptPath, sessionFolder, options = {}) {
  const { dryRun = false, verbose = false } = options;

  try {
    const text = fs.readFileSync(transcriptPath, 'utf-8');
    const messages = parseTranscript(text);

    if (messages.length === 0) {
      return { success: false, error: 'No parseable messages' };
    }

    // Read existing metadata
    const sessionDir = path.join(CONVERSATIONS_DIR, sessionFolder);
    const metaPath = path.join(sessionDir, 'metadata.yaml');

    if (!fs.existsSync(metaPath)) {
      return { success: false, error: 'Session metadata not found' };
    }

    const existingMeta = YAML.parse(fs.readFileSync(metaPath, 'utf-8'));
    const existingMessageCount = existingMeta.messageCount || 0;

    // Only update if message count actually changed
    if (messages.length <= existingMessageCount) {
      if (verbose) console.log(`  Skipping update for ${conversationId}: no new messages (${messages.length} <= ${existingMessageCount})`);
      return { success: true, updated: false };
    }

    // Get file timestamps for message distribution
    const stat = fs.statSync(transcriptPath);
    const createdAt = existingMeta.createdAt
      ? new Date(existingMeta.createdAt)
      : (stat.birthtime || stat.ctime);
    const updatedAt = stat.mtime;

    // Enrich with SQLite metadata
    const sqliteMeta = readSqliteMetadata(conversationId);

    // Add timestamps to messages
    const startTime = new Date(createdAt).getTime();
    const endTime = new Date(updatedAt).getTime();
    const timeSpan = endTime - startTime;

    const timestampedMessages = messages.map((msg, idx) => ({
      ...msg,
      timestamp: new Date(startTime + (timeSpan * idx / Math.max(messages.length - 1, 1))).toISOString()
    }));

    if (dryRun) {
      if (verbose) {
        console.log(`  [DRY RUN] Would update ${conversationId}`);
        console.log(`    Messages: ${existingMessageCount} → ${messages.length}`);
      }
      return { success: true, updated: true, dryRun: true, oldMessageCount: existingMessageCount, newMessageCount: messages.length };
    }

    // Update metadata
    const updatedMeta = {
      ...existingMeta,
      importedAt: new Date().toISOString(), // Track when we last synced
      updatedAt: new Date(updatedAt).toISOString(),
      messageCount: messages.length,
      title: extractTitle(messages),
      cursorMode: sqliteMeta ? (sqliteMeta.mode || existingMeta.cursorMode) : existingMeta.cursorMode
    };

    // Write updated files
    fs.writeFileSync(metaPath, YAML.stringify(updatedMeta), 'utf-8');
    fs.writeFileSync(
      path.join(sessionDir, 'messages.json'),
      JSON.stringify(timestampedMessages, null, 2),
      'utf-8'
    );

    if (verbose) {
      console.log(`  Updated ${conversationId}: ${existingMessageCount} → ${messages.length} messages`);
    }

    return { success: true, updated: true, oldMessageCount: existingMessageCount, newMessageCount: messages.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Run the full migration: find all Cursor transcripts, skip already-imported,
 * and import the rest.
 *
 * @param {object} [options] - { dryRun, verbose, onProgress }
 * @returns {{ imported: number, skipped: number, failed: number, alreadyImported: number, total: number, details: Array }}
 */
function migrateAll(options = {}) {
  const { dryRun = false, verbose = false, onProgress } = options;

  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    alreadyImported: 0,
    total: 0,
    details: []
  };

  // Find transcript directory
  const projectDir = findCursorProjectDir();
  if (!projectDir) {
    console.error('Could not find Cursor project directory for this workspace.');
    console.error('Expected at:', path.join(CURSOR_PROJECTS_DIR, 'Users-abraren-acorn-local-code-apollo-apollo'));
    return results;
  }

  const transcriptsDir = path.join(projectDir, 'agent-transcripts');
  if (!fs.existsSync(transcriptsDir)) {
    console.error('No agent-transcripts directory found at:', transcriptsDir);
    return results;
  }

  // Get list of transcript files
  const transcriptFiles = fs.readdirSync(transcriptsDir)
    .filter(f => f.endsWith('.txt'))
    .sort();

  results.total = transcriptFiles.length;

  if (verbose) {
    console.log(`Found ${transcriptFiles.length} Cursor transcripts`);
    console.log(`Transcripts dir: ${transcriptsDir}`);
  }

  // Get already-imported IDs (as Map for update detection)
  const importedMap = getAlreadyImportedMap();
  const alreadyImported = new Set(importedMap.keys());
  if (verbose) {
    console.log(`Already imported: ${alreadyImported.size} conversations`);
  }

  // Detect stale imports that need updating
  const staleImports = getStaleImports();
  const staleIds = new Set(staleImports.map(s => s.cursorConversationId));
  if (verbose && staleImports.length > 0) {
    console.log(`Stale imports to update: ${staleImports.length} conversations`);
  }

  // Ensure conversations directory exists
  if (!dryRun && !fs.existsSync(CONVERSATIONS_DIR)) {
    fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
  }

  // Phase 1: Import new conversations
  for (let idx = 0; idx < transcriptFiles.length; idx++) {
    const file = transcriptFiles[idx];
    const conversationId = file.replace('.txt', '');
    const transcriptPath = path.join(transcriptsDir, file);

    // Skip if already imported (will handle stale ones in phase 2)
    if (alreadyImported.has(conversationId)) {
      results.alreadyImported++;
      if (verbose) console.log(`  Already imported: ${conversationId}`);
      continue;
    }

    if (verbose) {
      console.log(`  Processing ${idx + 1}/${transcriptFiles.length}: ${conversationId}`);
    }

    const result = importConversation(conversationId, transcriptPath, { dryRun, verbose });

    if (result.skipped) {
      results.skipped++;
    } else if (result.success) {
      results.imported++;
    } else {
      results.failed++;
      if (verbose) console.log(`    FAILED: ${result.error}`);
    }

    results.details.push({
      conversationId,
      ...result
    });

    if (onProgress) {
      onProgress({
        current: idx + 1,
        total: transcriptFiles.length,
        conversationId,
        result
      });
    }
  }

  // Phase 2: Update stale (recently imported but modified since) conversations
  for (const staleInfo of staleImports) {
    const { cursorConversationId, sessionFolder, transcriptPath } = staleInfo;

    if (verbose) {
      console.log(`  Updating stale: ${cursorConversationId}`);
    }

    const result = updateConversation(cursorConversationId, transcriptPath, sessionFolder, { dryRun, verbose });

    if (result.success && result.updated) {
      results.updated++;
      results.details.push({
        conversationId: cursorConversationId,
        action: 'updated',
        ...result
      });
    } else if (result.success && !result.updated) {
      // Transcript was modified but no new messages (e.g. file touch)
      if (verbose) console.log(`    No new messages, skipping update`);
    } else {
      results.failed++;
      if (verbose) console.log(`    UPDATE FAILED: ${result.error}`);
      results.details.push({
        conversationId: cursorConversationId,
        action: 'update-failed',
        ...result
      });
    }
  }

  return results;
}

/**
 * Check for new (unimported) and stale (updated since import) Cursor conversations.
 * Returns a summary without actually importing anything.
 */
function checkForNew() {
  const projectDir = findCursorProjectDir();
  if (!projectDir) return { available: 0, stale: 0, alreadyImported: 0, total: 0 };

  const transcriptsDir = path.join(projectDir, 'agent-transcripts');
  if (!fs.existsSync(transcriptsDir)) return { available: 0, stale: 0, alreadyImported: 0, total: 0 };

  const transcriptFiles = fs.readdirSync(transcriptsDir).filter(f => f.endsWith('.txt'));
  const alreadyImported = getAlreadyImportedIds();

  const transcriptIds = new Set(transcriptFiles.map(f => f.replace('.txt', '')));
  let available = 0;
  for (const id of transcriptIds) {
    if (!alreadyImported.has(id)) available++;
  }

  // Check for stale imports (recently imported but transcript modified since)
  const staleImports = getStaleImports();

  return {
    available,
    stale: staleImports.length,
    alreadyImported: alreadyImported.size,
    total: transcriptFiles.length
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('');
  console.log('  Cursor → Apollo Conversation Migration');
  console.log('  ═══════════════════════════════════════');
  console.log('');

  if (dryRun) {
    console.log('  Mode: DRY RUN (no files will be written)');
    console.log('');
  }

  // First check what's available
  const status = checkForNew();
  console.log(`  Cursor transcripts found: ${status.total}`);
  console.log(`  Already imported:         ${status.alreadyImported}`);
  console.log(`  Available to import:      ${status.available}`);
  console.log(`  Stale (need update):      ${status.stale}`);
  console.log('');

  if (status.available === 0 && status.stale === 0) {
    console.log('  Nothing new to import. All conversations are up to date.');
    process.exit(0);
  }

  const parts = [];
  if (status.available > 0) parts.push(`importing ${status.available}`);
  if (status.stale > 0) parts.push(`updating ${status.stale} stale`);
  console.log(`  ${parts.join(', ')} conversations...`);
  console.log('');

  const results = migrateAll({
    dryRun,
    verbose,
    onProgress: ({ current, total }) => {
      if (!verbose) {
        // Simple progress bar
        const pct = Math.round((current / total) * 100);
        process.stdout.write(`\r  Progress: ${current}/${total} (${pct}%)`);
      }
    }
  });

  if (!verbose) console.log(''); // newline after progress bar
  console.log('');
  console.log('  Results:');
  console.log(`    Imported:         ${results.imported}`);
  console.log(`    Updated:          ${results.updated}`);
  console.log(`    Already imported: ${results.alreadyImported}`);
  console.log(`    Skipped (empty):  ${results.skipped}`);
  console.log(`    Failed:           ${results.failed}`);
  console.log('');

  if (results.failed > 0) {
    console.log('  Failed conversations:');
    results.details
      .filter(d => !d.success && !d.skipped)
      .forEach(d => console.log(`    ${d.conversationId}: ${d.error}`));
    console.log('');
  }

  console.log('  Done.');
  console.log('');
}

// ─── Exports for server-side sync endpoint ──────────────────────────────────

module.exports = {
  migrateAll,
  checkForNew,
  importConversation,
  updateConversation,
  parseTranscript,
  extractTitle,
  getAlreadyImportedIds,
  getAlreadyImportedMap,
  getStaleImports,
  findCursorProjectDir
};

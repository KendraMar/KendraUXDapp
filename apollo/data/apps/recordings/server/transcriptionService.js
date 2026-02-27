const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const { loadTranscriptionConfig } = require('../../../../server/lib/config');

// Vendor paths for Apollo built-in transcription
const vendorDir = path.join(__dirname, '..', '..', '..', 'vendor');
const whisperDir = path.join(vendorDir, 'whisper.cpp');
const modelsDir = path.join(vendorDir, 'models');
const whisperBinary = path.join(whisperDir, 'build', 'bin', 'whisper-cli');
const modelFile = path.join(modelsDir, 'ggml-large-v3-turbo-q8_0.bin');

// Helper function to convert media to WAV format for whisper-cli
async function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Use ffmpeg to extract audio and convert to 16kHz mono WAV (optimal for Whisper)
    const args = [
      '-i', inputPath,
      '-ar', '16000',      // 16kHz sample rate (Whisper's native rate)
      '-ac', '1',          // Mono
      '-c:a', 'pcm_s16le', // 16-bit PCM
      '-y',                // Overwrite output file
      outputPath
    ];
    
    console.log(`Converting to WAV: ffmpeg ${args.join(' ')}`);
    
    const ffmpeg = spawn('ffmpeg', args);
    
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Audio conversion complete');
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });
    
    ffmpeg.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('ffmpeg not found. Please install ffmpeg (brew install ffmpeg)'));
      } else {
        reject(new Error(`Failed to start ffmpeg: ${err.message}`));
      }
    });
  });
}

// Helper function to run transcription using local whisper.cpp
async function transcribeWithWhisperCpp(mediaPath, transcriptPath) {
  const ext = path.extname(mediaPath).toLowerCase();
  const supportedFormats = ['.flac', '.mp3', '.ogg', '.wav'];
  
  let audioPath = mediaPath;
  let tempWavPath = null;
  
  // Convert to WAV if not a supported format
  if (!supportedFormats.includes(ext)) {
    tempWavPath = mediaPath.replace(/\.[^.]+$/, '_temp.wav');
    console.log(`Media format ${ext} not directly supported, converting to WAV...`);
    await convertToWav(mediaPath, tempWavPath);
    audioPath = tempWavPath;
  }
  
  try {
    await new Promise((resolve, reject) => {
      // whisper-cli arguments:
      // -m: model path
      // -ovtt: output VTT format
      // -of: output file path (without extension, whisper adds .vtt)
      // input file is passed as positional argument at the end
      const outputBase = transcriptPath.replace('.vtt', '');
      const args = [
        '-m', modelFile,
        '-ovtt',
        '-of', outputBase,
        audioPath
      ];
      
      console.log(`Running whisper-cli: ${whisperBinary} ${args.join(' ')}`);
      
      const whisperProcess = spawn(whisperBinary, args, {
        cwd: whisperDir
      });
      
      let stdout = '';
      let stderr = '';
      
      whisperProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`whisper-cli: ${data.toString().trim()}`);
      });
      
      whisperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(`whisper-cli stderr: ${data.toString().trim()}`);
      });
      
      whisperProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`whisper-cli exited with code ${code}: ${stderr}`));
        }
      });
      
      whisperProcess.on('error', (err) => {
        reject(new Error(`Failed to start whisper-cli: ${err.message}`));
      });
    });
  } finally {
    // Clean up temporary WAV file
    if (tempWavPath && fs.existsSync(tempWavPath)) {
      console.log('Cleaning up temporary WAV file...');
      fs.unlinkSync(tempWavPath);
    }
  }
}

// Check if ffmpeg is available
function checkFfmpeg() {
  try {
    execSync('which ffmpeg', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Convert WebM video to MP4 using ffmpeg
async function convertWebmToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Use ffmpeg to convert WebM to MP4 with H.264 video and AAC audio
    // -c:v libx264 - H.264 video codec (widely compatible)
    // -preset fast - Balance between speed and compression
    // -crf 23 - Quality level (lower = better quality, 23 is default)
    // -c:a aac - AAC audio codec
    // -movflags +faststart - Optimize for web streaming
    const args = [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y', // Overwrite output file
      outputPath
    ];
    
    console.log(`Converting to MP4: ffmpeg ${args.join(' ')}`);
    
    const ffmpeg = spawn('ffmpeg', args);
    
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Video conversion to MP4 complete');
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });
    
    ffmpeg.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('ffmpeg not found. Please install ffmpeg (brew install ffmpeg)'));
      } else {
        reject(new Error(`Failed to start ffmpeg: ${err.message}`));
      }
    });
  });
}

module.exports = {
  vendorDir,
  whisperDir,
  modelsDir,
  whisperBinary,
  modelFile,
  convertToWav,
  transcribeWithWhisperCpp,
  checkFfmpeg,
  convertWebmToMp4
};

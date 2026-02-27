import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const RecordingContext = createContext(null);

export const useRecorder = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecorder must be used within a RecordingProvider');
  }
  return context;
};

export const RecordingProvider = ({ children }) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingType, setRecordingType] = useState(null); // 'audio' or 'screen'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const [recordingSuccess, setRecordingSuccess] = useState(null);
  
  // Recording refs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const durationIntervalRef = useRef(null);
  
  // Callback for when recording is saved successfully
  const onRecordingSavedRef = useRef(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Format recording duration as HH:MM:SS
  const formatRecordingDuration = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Convert audio blob to WAV format
  const convertToWav = async (blob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    const wavBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(wavBuffer);
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const clampedSample = Math.max(-1, Math.min(1, sample));
        const intSample = clampedSample < 0 
          ? clampedSample * 0x8000 
          : clampedSample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    await audioContext.close();
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  // Start audio recording
  const startAudioRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      setRecordingSuccess(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media recording is not available. This feature requires a secure context (HTTPS or localhost).');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(1000);
      recordingStartTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingType('audio');
      setRecordingDuration(0);
      
      durationIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current - pausedTimeRef.current) / 1000));
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setRecordingError(`Failed to start audio recording: ${err.message}`);
    }
  }, [isPaused]);

  // Start screen recording
  const startScreenRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      setRecordingSuccess(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen recording is not available. This feature requires a secure context (HTTPS or localhost).');
      }
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          displaySurface: 'monitor',
          cursor: 'always'
        },
        audio: true
      });
      
      let micStream = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (micErr) {
        console.log('Microphone access not available, recording screen only:', micErr.message);
      }
      
      const tracks = [...displayStream.getVideoTracks()];
      const displayAudioTracks = displayStream.getAudioTracks();
      if (displayAudioTracks.length > 0) {
        tracks.push(...displayAudioTracks);
      }
      
      if (micStream && micStream.getAudioTracks().length > 0) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
        
        if (displayAudioTracks.length > 0) {
          const displayAudioStream = new MediaStream(displayAudioTracks);
          const displaySource = audioContext.createMediaStreamSource(displayAudioStream);
          displaySource.connect(destination);
        }
        
        const videoOnlyTracks = tracks.filter(t => t.kind === 'video');
        tracks.length = 0;
        tracks.push(...videoOnlyTracks);
        tracks.push(...destination.stream.getAudioTracks());
        
        displayStream.audioContext = audioContext;
      }
      
      const combinedStream = new MediaStream(tracks);
      combinedStream.originalDisplayStream = displayStream;
      combinedStream.originalMicStream = micStream;
      
      mediaStreamRef.current = combinedStream;
      chunksRef.current = [];
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        combinedStream.getTracks().forEach(track => track.stop());
        if (combinedStream.originalDisplayStream) {
          combinedStream.originalDisplayStream.getTracks().forEach(track => track.stop());
        }
        if (combinedStream.originalMicStream) {
          combinedStream.originalMicStream.getTracks().forEach(track => track.stop());
        }
        if (displayStream.audioContext) {
          displayStream.audioContext.close();
        }
      };
      
      // Handle when user stops sharing via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        if (isRecording) {
          stopRecording();
        }
      };
      
      mediaRecorder.start(1000);
      recordingStartTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingType('screen');
      setRecordingDuration(0);
      
      durationIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current - pausedTimeRef.current) / 1000));
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error starting screen recording:', err);
      if (err.name === 'NotAllowedError') {
        setRecordingError('Screen sharing was cancelled or not allowed.');
      } else {
        setRecordingError(`Failed to start screen recording: ${err.message}`);
      }
    }
  }, [isRecording, isPaused]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      const pauseDuration = Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = pauseDuration;
      setIsPaused(false);
    }
  }, []);

  // Stop recording (returns data for saving)
  const stopRecording = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    // Return the recording data for the modal
    return {
      type: recordingType,
      duration: recordingDuration,
      formattedDuration: formatRecordingDuration(recordingDuration)
    };
  }, [recordingType, recordingDuration, formatRecordingDuration]);

  // Save the recording
  const saveRecording = useCallback(async (title) => {
    try {
      setIsSaving(true);
      
      const originalMimeType = mediaRecorderRef.current?.mimeType || 
        (recordingType === 'audio' ? 'audio/webm' : 'video/webm');
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        const recorder = mediaRecorderRef.current;
        
        const dataPromise = new Promise((resolve) => {
          recorder.ondataavailable = (event) => {
            console.log(`ondataavailable: received chunk of size ${event.data.size}`);
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
            if (recorder.state === 'inactive') {
              console.log('Recorder inactive, final chunk received');
              resolve();
            }
          };
        });
        
        const stopPromise = new Promise((resolve) => {
          const originalOnStop = recorder.onstop;
          recorder.onstop = (event) => {
            console.log('onstop event fired');
            if (originalOnStop) {
              originalOnStop.call(recorder, event);
            }
            resolve();
          };
        });
        
        console.log(`Stopping recorder, current chunks: ${chunksRef.current.length}`);
        recorder.stop();
        
        await Promise.all([
          Promise.race([dataPromise, new Promise(resolve => setTimeout(resolve, 3000))]),
          Promise.race([stopPromise, new Promise(resolve => setTimeout(resolve, 3000))])
        ]);
        
        console.log(`After stop, chunks collected: ${chunksRef.current.length}`);
      }
      
      console.log(`Creating blob from ${chunksRef.current.length} chunks, mimeType: ${originalMimeType}`);
      const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
      console.log(`Total chunk data size: ${totalSize} bytes`);
      
      let blob = new Blob(chunksRef.current, { type: originalMimeType });
      console.log(`Blob created, size: ${blob.size} bytes`);
      let finalMimeType = originalMimeType;
      
      if (recordingType === 'audio') {
        try {
          console.log('Converting audio to WAV format...');
          blob = await convertToWav(blob);
          finalMimeType = 'audio/wav';
          console.log('WAV conversion complete');
        } catch (conversionErr) {
          console.error('WAV conversion failed, using original format:', conversionErr);
        }
      }
      
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;
      
      const durationSeconds = recordingDuration;
      const duration = formatRecordingDuration(durationSeconds);
      
      const response = await fetch('/api/recordings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          mediaType: recordingType === 'audio' ? 'audio' : 'video',
          mediaData: base64Data,
          mimeType: finalMimeType,
          duration: duration,
          durationSeconds: durationSeconds
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save recording');
      }
      
      setRecordingSuccess(`Recording saved: ${title}`);
      
      // Call the callback if set
      if (onRecordingSavedRef.current) {
        onRecordingSavedRef.current();
      }
      
      return { success: true, title };
      
    } catch (err) {
      console.error('Error saving recording:', err);
      setRecordingError(`Failed to save recording: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingType(null);
      setRecordingDuration(0);
      chunksRef.current = [];
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
    }
  }, [recordingType, recordingDuration, formatRecordingDuration]);

  // Cancel recording without saving
  const cancelRecording = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingType(null);
    setRecordingDuration(0);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
  }, []);

  // Set callback for when recording is saved
  const setOnRecordingSaved = useCallback((callback) => {
    onRecordingSavedRef.current = callback;
  }, []);

  // Clear error/success messages
  const clearMessages = useCallback(() => {
    setRecordingError(null);
    setRecordingSuccess(null);
  }, []);

  const value = {
    // State
    isRecording,
    isPaused,
    recordingType,
    recordingDuration,
    isSaving,
    recordingError,
    recordingSuccess,
    
    // Actions
    startAudioRecording,
    startScreenRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecording,
    cancelRecording,
    setOnRecordingSaved,
    clearMessages,
    
    // Utilities
    formatRecordingDuration
  };
  
  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

export default RecordingContext;

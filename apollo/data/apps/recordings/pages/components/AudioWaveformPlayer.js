import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, VolumeUpIcon } from '@patternfly/react-icons';

const AudioWaveformPlayer = ({ audioRef, recordingId, recording, sourceId, currentTime, onTimeUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(recording.durationSeconds || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [smoothTime, setSmoothTime] = useState(0);
  const waveformRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lastTimestampRef = useRef(0);

  // Use smooth interpolated time for display
  const displayTime = smoothTime;

  // Generate pseudo-random waveform data based on recording id for consistency
  const waveformBars = React.useMemo(() => {
    const seed = recordingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bars = [];
    for (let i = 0; i < 120; i++) {
      // Generate a consistent but varied height
      const noise = Math.sin(seed + i * 0.3) * 0.3 + Math.sin(seed * 2 + i * 0.7) * 0.2;
      const height = 0.3 + Math.abs(noise) + Math.sin(i * 0.1) * 0.15;
      bars.push(Math.min(1, Math.max(0.15, height)));
    }
    return bars;
  }, [recordingId]);

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || isDragging) {
      // Cancel animation when not playing or dragging
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      // Calculate elapsed time since last frame
      const elapsed = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      // Interpolate smooth time based on elapsed real time
      setSmoothTime(prev => {
        const effectiveDur = (duration > 0 && isFinite(duration)) 
          ? duration 
          : (recording.durationSeconds || 0);
        const newTime = prev + elapsed;
        return Math.min(newTime, effectiveDur);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isDragging, duration, recording.durationSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      lastTimestampRef.current = 0; // Reset for fresh animation
    };
    const handlePause = () => setIsPlaying(false);
    
    // Handle time updates - sync smooth time with actual audio time
    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setLocalCurrentTime(time);
      // Sync smooth time with actual time (corrects any drift)
      setSmoothTime(time);
      lastTimeRef.current = time;
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    };
    
    // Handle seeking
    const handleSeeked = () => {
      const time = audio.currentTime;
      setSmoothTime(time);
      lastTimeRef.current = time;
      lastTimestampRef.current = 0;
    };
    
    // Handle duration - WAV files may not report duration until fully loaded
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleLoadedMetadata = () => updateDuration();
    const handleDurationChange = () => updateDuration();
    
    // Also check on canplaythrough for WAV files that load duration late
    const handleCanPlayThrough = () => updateDuration();

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    
    // Check duration immediately in case it's already loaded
    updateDuration();

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [audioRef, onTimeUpdate]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleWaveformClick = (e) => {
    if (!waveformRef.current || !audioRef.current) return;
    
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    // Use effective duration for seeking
    const seekDuration = (duration > 0 && isFinite(duration)) 
      ? duration 
      : (recording.durationSeconds || 0);
    const seekTime = percent * seekDuration;
    
    audioRef.current.currentTime = Math.max(0, Math.min(seekTime, seekDuration));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleWaveformClick(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleWaveformClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Use actual duration if available, otherwise fall back to metadata
  const effectiveDuration = (duration > 0 && isFinite(duration)) 
    ? duration 
    : (recording.durationSeconds || 0);
  const progressPercent = effectiveDuration > 0 ? (displayTime / effectiveDuration) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      flexShrink: 0,
      background: 'linear-gradient(180deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)',
      padding: '2rem 1.5rem'
    }}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={`/api/recordings/${recordingId}/stream${sourceId ? `?sourceId=${sourceId}` : ''}`}
        preload="metadata"
      />

      {/* Waveform Container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? (
            <PauseIcon style={{ fontSize: '28px', color: '#fff' }} />
          ) : (
            <PlayIcon style={{ fontSize: '28px', color: '#fff', marginLeft: '4px' }} />
          )}
        </button>

        {/* Waveform Visualization */}
        <div 
          ref={waveformRef}
          onMouseDown={handleMouseDown}
          style={{
            flex: 1,
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            cursor: 'pointer',
            position: 'relative',
            padding: '0 4px'
          }}
        >
          {waveformBars.map((height, i) => {
            const barPosition = (i / waveformBars.length) * 100;
            const isPast = barPosition < progressPercent;
            
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${height * 100}%`,
                  backgroundColor: isPast ? '#3b82f6' : 'rgba(100, 160, 255, 0.3)',
                  borderRadius: '2px',
                  minWidth: '2px'
                }}
              />
            );
          })}

          {/* Playhead */}
          <div
            style={{
              position: 'absolute',
              left: `${progressPercent}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: '#fff',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Volume Icon */}
        <VolumeUpIcon style={{ 
          fontSize: '24px', 
          color: 'rgba(255, 255, 255, 0.6)',
          flexShrink: 0
        }} />
      </div>

      {/* Time Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '1rem',
        paddingLeft: 'calc(64px + 1.5rem)',
        paddingRight: '2.5rem'
      }}>
        <span style={{
          color: '#3b82f6',
          fontSize: '0.875rem',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontWeight: '500'
        }}>
          {formatTime(displayTime)}
        </span>
        <span style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.875rem',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
        }}>
          {formatTime(effectiveDuration)}
        </span>
      </div>

      {/* Recording title overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <VolumeUpIcon style={{ 
          fontSize: '14px', 
          color: 'rgba(255, 255, 255, 0.4)' 
        }} />
        <span style={{
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Audio Recording
        </span>
      </div>
    </div>
  );
};

export default AudioWaveformPlayer;

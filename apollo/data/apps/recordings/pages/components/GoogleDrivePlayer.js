import React, { useState, useEffect, useRef } from 'react';

// Google Drive Embedded Video Player Component with manual time tracking
const GoogleDrivePlayer = ({ fileId, thumbnail, durationSeconds, currentTime, onTimeUpdate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  
  // Google Drive embed URL for video preview
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  
  // Format time as HH:MM:SS or MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  // Start/stop timer based on play state
  useEffect(() => {
    if (isPlaying && durationSeconds > 0) {
      lastUpdateRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;
        
        if (onTimeUpdate) {
          onTimeUpdate(prevTime => {
            const newTime = prevTime + elapsed;
            // Stop at the end
            if (newTime >= durationSeconds) {
              setIsPlaying(false);
              return durationSeconds;
            }
            return newTime;
          });
        }
      }, 100); // Update every 100ms for smooth progress
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, durationSeconds, onTimeUpdate]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Reset to beginning
  const resetTime = () => {
    setIsPlaying(false);
    if (onTimeUpdate) {
      onTimeUpdate(0);
    }
  };
  
  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      flexShrink: 0
    }}>
      {/* Video container */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // 16:9 aspect ratio
        backgroundColor: '#000'
      }}>
        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            color: '#fff',
            backgroundColor: '#000'
          }}>
            {thumbnail && (
              <img 
                src={thumbnail} 
                alt="Video thumbnail" 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: 0.3
                }}
              />
            )}
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              zIndex: 1
            }} />
            <span style={{ fontSize: '0.9rem', zIndex: 1 }}>Loading Google Drive video...</span>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        )}
        
        {/* Google Drive video iframe */}
        <iframe
          src={embedUrl}
          title="Google Drive Video Player"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
        
        {/* Google Drive branding indicator */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '6px 12px',
          borderRadius: '4px',
          pointerEvents: 'none',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}>
          <svg width="16" height="16" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
          <span style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            Google Drive
          </span>
        </div>
      </div>
      
      {/* Manual playback controls bar - for syncing timeline with embedded video */}
      {durationSeconds > 0 && (
        <div style={{
          backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
          borderTop: '1px solid var(--pf-t--global--border--color--default)',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--pf-t--global--text--color--regular)',
              borderRadius: '4px'
            }}
            title={isPlaying ? 'Pause timeline' : 'Start timeline'}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          {/* Reset button */}
          <button
            onClick={resetTime}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--pf-t--global--text--color--subtle)',
              borderRadius: '4px'
            }}
            title="Reset to beginning"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          
          {/* Time display */}
          <span style={{
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            color: 'var(--pf-t--global--text--color--regular)',
            minWidth: '80px'
          }}>
            {formatTime(currentTime)} / {formatTime(durationSeconds)}
          </span>
          
          {/* Info text */}
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--pf-t--global--text--color--subtle)',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            Sync timeline with video manually
          </span>
        </div>
      )}
    </div>
  );
};

export default GoogleDrivePlayer;

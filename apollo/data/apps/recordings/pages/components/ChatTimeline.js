import React, { useState, useRef } from 'react';
import { ClockIcon } from '@patternfly/react-icons';
import { getAvatarColor } from '../utils/timeFormatters';

// Chat Timeline Component - Shows dots on timeline for chat messages
const ChatTimeline = ({ chatMessages, durationSeconds, currentTime, onSeek }) => {
  const [hoveredDot, setHoveredDot] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const trackRef = useRef(null);

  const handleDotMouseEnter = (msg, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredDot(msg);
  };

  const handleDotMouseLeave = () => {
    setHoveredDot(null);
  };

  // Handle click on the timeline track to seek to that position
  const handleTrackClick = (e) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const seekTime = percent * durationSeconds;
    
    // Clamp to valid range
    const clampedTime = Math.max(0, Math.min(seekTime, durationSeconds));
    onSeek(clampedTime);
  };

  // Calculate progress percentage
  const progressPercent = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      padding: '12px 16px',
      backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
      borderTop: '1px solid var(--pf-t--global--border--color--default)'
    }}>
      {/* Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <ClockIcon style={{ 
          fontSize: '0.75rem', 
          color: 'var(--pf-t--global--text--color--subtle)' 
        }} />
        <span style={{ 
          fontSize: '0.7rem', 
          color: 'var(--pf-t--global--text--color--subtle)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '500'
        }}>
          Timeline
        </span>
        <span style={{ 
          fontSize: '0.7rem', 
          color: 'var(--pf-t--global--text--color--subtle)',
          marginLeft: 'auto'
        }}>
          {chatMessages.length} messages
        </span>
      </div>

      {/* Timeline Track */}
      <div 
        ref={trackRef}
        onClick={handleTrackClick}
        style={{
          position: 'relative',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        {/* Background track */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'var(--pf-t--global--border--color--default)',
          borderRadius: '2px',
          pointerEvents: 'none'
        }} />

        {/* Progress track */}
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${progressPercent}%`,
          height: '4px',
          backgroundColor: 'var(--pf-t--global--color--brand--default)',
          borderRadius: '2px',
          transition: 'width 0.1s linear',
          pointerEvents: 'none'
        }} />

        {/* Chat message dots */}
        {chatMessages.map((msg) => {
          if (msg.recordingTimeSeconds === undefined) return null;
          
          const positionPercent = (msg.recordingTimeSeconds / durationSeconds) * 100;
          const isPast = msg.recordingTimeSeconds <= currentTime;
          const isHovered = hoveredDot?.id === msg.id;
          
          return (
            <button
              key={msg.id}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(msg.recordingTimeSeconds);
              }}
              onMouseEnter={(e) => handleDotMouseEnter(msg, e)}
              onMouseLeave={handleDotMouseLeave}
              style={{
                position: 'absolute',
                left: `${positionPercent}%`,
                transform: 'translateX(-50%)',
                width: isHovered ? '14px' : '10px',
                height: isHovered ? '14px' : '10px',
                borderRadius: '50%',
                backgroundColor: isPast 
                  ? getAvatarColor(msg.user)
                  : 'var(--pf-t--global--background--color--primary--default)',
                border: `2px solid ${isPast ? getAvatarColor(msg.user) : 'var(--pf-t--global--border--color--default)'}`,
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease',
                zIndex: isHovered ? 10 : 1,
                boxShadow: isHovered 
                  ? '0 2px 8px rgba(0,0,0,0.25)' 
                  : isPast 
                    ? '0 1px 3px rgba(0,0,0,0.15)' 
                    : 'none'
              }}
              title={`${msg.user} at ${msg.recordingTime}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`}
            />
          );
        })}

        {/* Playhead indicator */}
        <div style={{
          position: 'absolute',
          left: `${progressPercent}%`,
          transform: 'translateX(-50%)',
          width: '3px',
          height: '16px',
          backgroundColor: 'var(--pf-t--global--color--brand--default)',
          borderRadius: '1.5px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          zIndex: 5,
          transition: 'left 0.1s linear',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Tooltip for hovered dot */}
      {hoveredDot && (
        <div style={{
          position: 'fixed',
          left: tooltipPosition.x,
          top: tooltipPosition.y - 8,
          transform: 'translate(-50%, -100%)',
          backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
          border: '1px solid var(--pf-t--global--border--color--default)',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '280px',
          pointerEvents: 'none'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: getAvatarColor(hoveredDot.user),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: '#fff',
              fontWeight: '600'
            }}>
              {hoveredDot.user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <span style={{ 
              fontWeight: '600',
              fontSize: '0.8rem'
            }}>
              {hoveredDot.user}
            </span>
            <span style={{ 
              color: 'var(--pf-t--global--color--brand--default)',
              fontSize: '0.7rem',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: '500',
              marginLeft: 'auto'
            }}>
              {hoveredDot.recordingTime}
            </span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.8rem',
            lineHeight: '1.4',
            color: 'var(--pf-t--global--text--color--regular)'
          }}>
            {hoveredDot.message}
          </p>
          {/* Tooltip arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
            borderRight: '1px solid var(--pf-t--global--border--color--default)',
            borderBottom: '1px solid var(--pf-t--global--border--color--default)'
          }} />
        </div>
      )}
    </div>
  );
};

export default ChatTimeline;

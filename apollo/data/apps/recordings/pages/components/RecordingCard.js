import React from 'react';
import { Card, CardBody, Label, Flex, FlexItem } from '@patternfly/react-core';
import {
  PlayIcon,
  ClockIcon,
  CalendarAltIcon,
  EyeIcon,
  VolumeUpIcon
} from '@patternfly/react-icons';

const RecordingCard = ({ recording, onClick, formatDate }) => {
  return (
    <Card
      isClickable
      isSelectable
      onClick={() => onClick(recording)}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid var(--pf-v6-global--BorderColor--100)',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Media Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%', // 16:9 aspect ratio for all recordings
          background: recording.mediaType === 'audio' 
            ? 'linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 50%, #1e3a5f 100%)'
            : 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 50%, #1a1f2e 100%)',
          borderRadius: '4px 4px 0 0',
          overflow: 'hidden'
        }}
      >
        {/* Waveform visualization for audio */}
        {recording.mediaType === 'audio' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '0 40px'
            }}
          >
            {/* Animated waveform bars */}
            {[...Array(24)].map((_, i) => {
              const baseHeight = 15 + Math.sin(i * 0.5) * 10 + Math.random() * 15;
              return (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${baseHeight}%`,
                    backgroundColor: 'rgba(100, 180, 255, 0.6)',
                    borderRadius: '2px',
                    transition: 'height 0.3s ease'
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Play button overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease, background-color 0.2s ease'
            }}
          >
            {recording.mediaType === 'audio' ? (
              <VolumeUpIcon style={{ 
                fontSize: '28px', 
                color: '#1e3a5f'
              }} />
            ) : (
              <PlayIcon style={{ 
                fontSize: '28px', 
                color: '#1a1f2e',
                marginLeft: '4px'
              }} />
            )}
          </div>
        </div>
        
        {/* Duration badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          <ClockIcon style={{ marginRight: '4px' }} />
          {recording.duration || recording.sizeFormatted}
        </div>
      </div>

      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
          {/* Title */}
          <FlexItem>
            <h3 style={{
              margin: 0,
              marginTop: '4px',
              fontSize: '1rem',
              fontWeight: '600',
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {recording.title}
            </h3>
          </FlexItem>

          {/* Metadata */}
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--pf-v6-global--Color--200)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CalendarAltIcon />
                  {formatDate(recording.recordedAt)}
                </span>
              </FlexItem>
              <FlexItem>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--pf-v6-global--Color--200)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <EyeIcon />
                  {recording.views} views
                </span>
              </FlexItem>
            </Flex>
          </FlexItem>

          {/* Format label */}
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Label 
                  color={recording.mediaType === 'audio' ? 'cyan' : 'blue'} 
                  isCompact
                >
                  {recording.mediaType === 'audio' ? 'AUDIO' : 'VIDEO'} &bull; {recording.externalSource === 'google-drive' ? 'GOOGLE DRIVE' : (recording.mediaExtension || recording.videoExtension || 'mp4').toUpperCase()}
                </Label>
              </FlexItem>
              {recording.externalSource === 'google-drive' && (
                <FlexItem>
                  <Label color="gold" isCompact>
                    External
                  </Label>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default RecordingCard;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Spinner,
  Button,
  SearchInput,
  Split,
  SplitItem,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Checkbox,
  Divider,
  Slider,
  Tooltip
} from '@patternfly/react-core';
import {
  PlayIcon,
  PauseIcon,
  StepForwardIcon,
  StepBackwardIcon,
  RedoIcon,
  RandomIcon,
  VolumeUpIcon,
  VolumeMuteIcon,
  ExclamationCircleIcon,
  SyncAltIcon,
  TableIcon
} from '@patternfly/react-icons';
import logoAppleMusic from '../../../../src/assets/logos/logo-apple-music.svg';
import { useMusicPlayer } from '../../../../src/lib/MusicContext';

// Default columns configuration
const DEFAULT_COLUMNS = [
  { id: 'title', label: 'Title', visible: true, width: 'auto' },
  { id: 'artist', label: 'Artist', visible: true, width: '200px' },
  { id: 'album', label: 'Album', visible: true, width: '200px' },
  { id: 'duration', label: 'Duration', visible: true, width: '80px' },
  { id: 'genre', label: 'Genre', visible: true, width: '120px' },
  { id: 'playCount', label: 'Plays', visible: true, width: '60px' }
];

// Format duration from milliseconds to MM:SS
const formatDuration = (ms) => {
  if (!ms) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format time for progress display
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Music = () => {
  const navigate = useNavigate();
  
  // Use music context for player state
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    shuffleMode,
    musicKitReady,
    musicKitError,
    isAuthorized,
    initMusicKit,
    playSong,
    togglePlayPause,
    seek,
    setVolumeLevel,
    toggleMute,
    handlePrevious,
    handleNext,
    toggleRepeat,
    toggleShuffle,
    authorize
  } = useMusicPlayer();
  
  // Initialize MusicKit when visiting the Music page
  useEffect(() => {
    initMusicKit();
  }, [initMusicKit]);
  
  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Column configuration
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('apollo-music-columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Save columns to localStorage when they change
  useEffect(() => {
    localStorage.setItem('apollo-music-columns', JSON.stringify(columns));
  }, [columns]);
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryRes, songsRes] = await Promise.all([
        fetch('/api/applemusic/summary'),
        fetch('/api/applemusic/library/songs?limit=100&offset=0')
      ]);
      
      const summaryData = await summaryRes.json();
      const songsData = await songsRes.json();
      
      if (!summaryData.success || !songsData.success) {
        setError(summaryData.error || songsData.error || 'Failed to load Apple Music data');
        return;
      }
      
      setSummary(summaryData.summary);
      setSongs(songsData.songs);
      setHasMore(!!songsData.next);
      setOffset(songsData.meta?.offset + songsData.meta?.limit || 100);
    } catch (err) {
      setError(`Error connecting to Apple Music: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMoreSongs = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const res = await fetch(`/api/applemusic/library/songs?limit=100&offset=${offset}`);
      const data = await res.json();
      
      if (data.success) {
        setSongs(prev => [...prev, ...data.songs]);
        setHasMore(!!data.next);
        setOffset(data.meta?.offset + data.meta?.limit || offset + 100);
      }
    } catch (err) {
      console.error('Error loading more songs:', err);
    } finally {
      setLoadingMore(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    await loadData();
    setRefreshing(false);
  };
  
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    
    try {
      const res = await fetch(`/api/applemusic/library/search?term=${encodeURIComponent(query)}&limit=50`);
      const data = await res.json();
      
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('Error searching:', err);
    }
  };
  
  // Play a song with the current display songs as queue
  const handlePlaySong = (song) => {
    const displaySongs = searchResults || songs;
    const index = displaySongs.findIndex(s => s.id === song.id);
    playSong(song, displaySongs, index);
  };
  
  // Handle volume change (convert from 0-100 to 0-1)
  const handleVolumeChange = (value) => {
    setVolumeLevel(value / 100);
  };
  
  // Column management
  const toggleColumnVisibility = (columnId) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };
  
  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
  };
  
  const visibleColumns = columns.filter(col => col.visible);
  const displaySongs = searchResults || songs;
  
  if (loading) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
            <img src={logoAppleMusic} alt="Apple Music" style={{ width: '32px', height: '32px' }} />
            <Title headingLevel="h1" size="2xl">Music</Title>
          </Flex>
        </PageSection>
        <PageSection isFilled>
          <Flex justifyContent={{ default: 'justifyContentCenter' }} alignItems={{ default: 'alignItemsCenter' }} style={{ height: '300px' }}>
            <Spinner size="xl" />
          </Flex>
        </PageSection>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
            <img src={logoAppleMusic} alt="Apple Music" style={{ width: '32px', height: '32px' }} />
            <Title headingLevel="h1" size="2xl">Music</Title>
          </Flex>
        </PageSection>
        <PageSection isFilled>
          <EmptyState
            titleText="Unable to connect to Apple Music"
            headingLevel="h2"
            icon={ExclamationCircleIcon}
            status="danger"
          >
            <EmptyStateBody>
              {error}
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={() => navigate('/settings')}>
                  Configure Apple Music
                </Button>
                <Button variant="secondary" onClick={loadData}>
                  Retry
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </PageSection>
      </>
    );
  }
  
  return (
    <>
      {/* Header */}
      <PageSection variant={PageSectionVariants.light}>
        <Split hasGutter>
          <SplitItem isFilled>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              <img src={logoAppleMusic} alt="Apple Music" style={{ width: '32px', height: '32px' }} />
              <div>
                <Title headingLevel="h1" size="2xl">Music</Title>
                <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  {summary?.songCount || 0} songs • {summary?.albumCount || 0} albums • {summary?.artistCount || 0} artists
                </Content>
              </div>
            </Flex>
          </SplitItem>
          <SplitItem>
            <Button 
              variant="secondary" 
              icon={<SyncAltIcon />} 
              onClick={handleRefresh}
              isLoading={refreshing}
            >
              Refresh
            </Button>
          </SplitItem>
        </Split>
      </PageSection>
      
      {/* Player Controls */}
      {currentSong && (
        <PageSection variant={PageSectionVariants.light} style={{ paddingTop: 0, paddingBottom: '1rem' }}>
          <Card isCompact>
            <CardBody>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapLg' }}>
                {/* Album Art */}
                <FlexItem>
                  {currentSong.artwork?.url ? (
                    <img 
                      src={currentSong.artwork.url} 
                      alt={currentSong.album}
                      style={{ width: '60px', height: '60px', borderRadius: '4px' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '4px', 
                      backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img src={logoAppleMusic} alt="No artwork" style={{ width: '30px', height: '30px', opacity: 0.5 }} />
                    </div>
                  )}
                </FlexItem>
                
                {/* Song Info */}
                <FlexItem style={{ minWidth: '150px' }}>
                  <div style={{ fontWeight: 600 }}>{currentSong.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    {currentSong.artist}
                  </div>
                  {musicKitError && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--danger-color--100)', marginTop: '2px' }}>
                      {musicKitError}
                    </div>
                  )}
                  {!musicKitReady && !musicKitError && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--warning-color--100)', marginTop: '2px' }}>
                      Initializing MusicKit...
                    </div>
                  )}
                </FlexItem>
                
                {/* Controls */}
                <FlexItem grow={{ default: 'grow' }}>
                  <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    {/* Playback buttons */}
                    <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <Tooltip content={shuffleMode ? 'Shuffle On' : 'Shuffle Off'}>
                        <Button 
                          variant="plain" 
                          onClick={toggleShuffle}
                          style={{ color: shuffleMode ? 'var(--pf-v6-global--primary-color--100)' : undefined }}
                        >
                          <RandomIcon />
                        </Button>
                      </Tooltip>
                      <Button variant="plain" onClick={handlePrevious}>
                        <StepBackwardIcon />
                      </Button>
                      <Button variant="primary" onClick={togglePlayPause} style={{ borderRadius: '50%', width: '40px', height: '40px' }}>
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </Button>
                      <Button variant="plain" onClick={handleNext}>
                        <StepForwardIcon />
                      </Button>
                      <Tooltip content={repeatMode === 'off' ? 'Repeat Off' : repeatMode === 'all' ? 'Repeat All' : 'Repeat One'}>
                        <Button 
                          variant="plain" 
                          onClick={toggleRepeat}
                          style={{ color: repeatMode !== 'off' ? 'var(--pf-v6-global--primary-color--100)' : undefined }}
                        >
                          <RedoIcon />
                          {repeatMode === 'one' && <span style={{ fontSize: '0.6rem', position: 'absolute', marginTop: '6px' }}>1</span>}
                        </Button>
                      </Tooltip>
                    </Flex>
                    
                    {/* Progress bar */}
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ width: '100%', maxWidth: '500px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)', minWidth: '40px' }}>
                        {formatTime(currentTime)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <Slider
                          value={currentTime}
                          max={duration || 100}
                          onChange={(_e, value) => seek(value)}
                          areCustomStepsContinuous
                          showTicks={false}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)', minWidth: '40px' }}>
                        {formatTime(duration)}
                      </span>
                    </Flex>
                  </Flex>
                </FlexItem>
                
                {/* Volume */}
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    <Button variant="plain" onClick={toggleMute}>
                      {isMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                    </Button>
                    <div style={{ width: '80px' }}>
                      <Slider
                        value={isMuted ? 0 : volume * 100}
                        max={100}
                        onChange={(_e, value) => handleVolumeChange(value)}
                        areCustomStepsContinuous
                        showTicks={false}
                      />
                    </div>
                  </Flex>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </PageSection>
      )}
      
      {/* Search and Table Controls */}
      <PageSection isFilled>
        <Flex gap={{ default: 'gapMd' }} style={{ marginBottom: '1rem' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <SearchInput
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(_e, value) => handleSearch(value)}
              onClear={() => handleSearch('')}
            />
          </FlexItem>
          <FlexItem>
            <Dropdown
              isOpen={isColumnMenuOpen}
              onOpenChange={setIsColumnMenuOpen}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                  variant="secondary"
                  icon={<TableIcon />}
                >
                  Columns
                </MenuToggle>
              )}
              popperProps={{ position: 'right' }}
            >
              <DropdownList>
                {columns.map(col => (
                  <DropdownItem
                    key={col.id}
                    onClick={() => toggleColumnVisibility(col.id)}
                  >
                    <Checkbox
                      id={`col-${col.id}`}
                      isChecked={col.visible}
                      onChange={() => {}}
                      label={col.label}
                    />
                  </DropdownItem>
                ))}
                <Divider />
                <DropdownItem onClick={resetColumns}>
                  Reset to defaults
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          </FlexItem>
        </Flex>
        
        {/* Songs Table */}
        <div style={{
          border: '1px solid var(--pf-v6-global--BorderColor--100)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `48px ${visibleColumns.map(col => col.width || '1fr').join(' ')}`,
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
            borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            <div>#</div>
            {visibleColumns.map(col => (
              <div key={col.id}>{col.label}</div>
            ))}
          </div>
          
          {/* Table Body */}
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {displaySongs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--pf-v6-global--Color--200)' }}>
                {searchQuery ? 'No songs match your search' : 'No songs in your library'}
              </div>
            ) : (
              displaySongs.map((song, index) => (
                <div
                  key={song.id}
                  onClick={() => handlePlaySong(song)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `48px ${visibleColumns.map(col => col.width || '1fr').join(' ')}`,
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
                    cursor: 'pointer',
                    backgroundColor: currentSong?.id === song.id 
                      ? 'var(--pf-v6-global--BackgroundColor--200)' 
                      : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentSong?.id !== song.id) {
                      e.currentTarget.style.backgroundColor = 'var(--pf-v6-global--BackgroundColor--100)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentSong?.id !== song.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ color: 'var(--pf-v6-global--Color--200)', display: 'flex', alignItems: 'center' }}>
                    {currentSong?.id === song.id && isPlaying ? (
                      <div className="music-playing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {visibleColumns.map(col => {
                    if (col.id === 'title') {
                      return (
                        <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {song.artwork?.url ? (
                            <img 
                              src={song.artwork.url} 
                              alt={song.album}
                              style={{ width: '40px', height: '40px', borderRadius: '4px' }}
                            />
                          ) : (
                            <div style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '4px', 
                              backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)'
                            }} />
                          )}
                          <span style={{ fontWeight: currentSong?.id === song.id ? 600 : 400 }}>
                            {song.title}
                          </span>
                        </div>
                      );
                    }
                    if (col.id === 'duration') {
                      return <div key={col.id}>{formatDuration(song.duration)}</div>;
                    }
                    if (col.id === 'playCount') {
                      return <div key={col.id}>{song.playCount || 0}</div>;
                    }
                    return <div key={col.id}>{song[col.id] || '-'}</div>;
                  })}
                </div>
              ))
            )}
            
            {/* Load More */}
            {hasMore && !searchResults && (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Button 
                  variant="link" 
                  onClick={loadMoreSongs}
                  isLoading={loadingMore}
                >
                  Load more songs
                </Button>
              </div>
            )}
          </div>
        </div>
      </PageSection>
      
      {/* CSS for playing indicator */}
      <style>{`
        .music-playing-indicator {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 16px;
        }
        .music-playing-indicator span {
          width: 3px;
          background-color: var(--pf-v6-global--primary-color--100);
          animation: music-bar 0.5s ease infinite alternate;
        }
        .music-playing-indicator span:nth-child(1) {
          height: 60%;
          animation-delay: 0s;
        }
        .music-playing-indicator span:nth-child(2) {
          height: 100%;
          animation-delay: 0.2s;
        }
        .music-playing-indicator span:nth-child(3) {
          height: 40%;
          animation-delay: 0.4s;
        }
        @keyframes music-bar {
          from { height: 30%; }
          to { height: 100%; }
        }
      `}</style>
    </>
  );
};

export default Music;

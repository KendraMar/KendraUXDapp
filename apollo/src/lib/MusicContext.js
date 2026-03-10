import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const MusicContext = createContext(null);

// Helper to dynamically load MusicKit script
const loadMusicKitScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window.MusicKit !== 'undefined') {
      resolve();
      return;
    }
    
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="musickit"]');
    if (existingScript) {
      // Script exists but MusicKit not ready yet, wait for it
      const checkInterval = setInterval(() => {
        if (typeof window.MusicKit !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('MusicKit JS failed to load'));
      }, 10000);
      return;
    }
    
    // Create and inject script
    const script = document.createElement('script');
    script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
    script.async = true;
    
    script.onload = () => {
      // Wait for MusicKit to be available after script loads
      const checkInterval = setInterval(() => {
        if (typeof window.MusicKit !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('MusicKit JS failed to initialize'));
      }, 10000);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load MusicKit JS'));
    };
    
    document.head.appendChild(script);
  });
};

export const useMusicPlayer = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicProvider');
  }
  return context;
};

export const MusicProvider = ({ children }) => {
  // Player state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [shuffleMode, setShuffleMode] = useState(false);
  
  // Queue state
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  
  // MusicKit state
  const [musicKitReady, setMusicKitReady] = useState(false);
  const [musicKitError, setMusicKitError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const musicKitRef = useRef(null);
  const initializingRef = useRef(false);
  
  // Initialize MusicKit (called on-demand, not on mount)
  const initMusicKit = useCallback(async () => {
    // Prevent double initialization
    if (initializingRef.current || musicKitRef.current) return;
    initializingRef.current = true;
    
    try {
      // Dynamically load the MusicKit script
      await loadMusicKitScript();
        
      // Fetch tokens from our API
      const tokenResponse = await fetch('/api/applemusic/musickit-token');
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.success) {
        console.log('MusicKit: No tokens configured, playback disabled');
        setMusicKitError('Apple Music not configured');
        initializingRef.current = false;
        return;
      }
      
      // Configure MusicKit
      await window.MusicKit.configure({
        developerToken: tokenData.developerToken,
        app: {
          name: 'Apollo',
          build: '1.0.0'
        }
      });
      
      const music = window.MusicKit.getInstance();
      musicKitRef.current = music;
      
      // Set up event listeners
      music.addEventListener('playbackStateDidChange', (event) => {
        const state = event.state;
        // MusicKit states: none, loading, playing, paused, stopped, ended, seeking, waiting, stalled, completed
        setIsPlaying(state === window.MusicKit.PlaybackStates.playing);
      });
      
      music.addEventListener('playbackTimeDidChange', (event) => {
        setCurrentTime(event.currentPlaybackTime);
      });
      
      music.addEventListener('playbackDurationDidChange', (event) => {
        setDuration(event.duration);
      });
      
      music.addEventListener('nowPlayingItemDidChange', (event) => {
        if (event.item) {
          // Update current song info from MusicKit
          setDuration(event.item.playbackDuration / 1000);
        }
      });
      
      music.addEventListener('queueItemsDidChange', () => {
        // Queue updated
      });
      
      // Try to authorize with the media user token if available
      if (tokenData.mediaUserToken) {
        try {
          // MusicKit v3 uses the token directly
          music.musicUserToken = tokenData.mediaUserToken;
          setIsAuthorized(true);
          console.log('MusicKit: Authorized with media user token');
        } catch (authError) {
          console.warn('MusicKit: Could not set user token, will prompt for authorization', authError);
        }
      }
      
      // Set initial volume
      music.volume = volume;
      
      setMusicKitReady(true);
      setMusicKitError(null);
      console.log('MusicKit: Initialized successfully');
      
    } catch (error) {
      console.error('MusicKit initialization error:', error);
      setMusicKitError(error.message);
      initializingRef.current = false;
    }
  }, [volume]);
  
  // Sync volume with MusicKit
  useEffect(() => {
    if (musicKitRef.current) {
      musicKitRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Play a specific song
  const playSong = useCallback(async (song, songQueue = null, index = -1) => {
    setCurrentSong(song);
    setCurrentTime(0);
    setMusicKitError(null);
    
    if (songQueue) {
      setQueue(songQueue);
      setQueueIndex(index);
    }
    
    // Try to play with MusicKit
    if (musicKitRef.current && song) {
      const music = musicKitRef.current;
      const songId = song.id;
      
      console.log('MusicKit: Attempting to play:', {
        id: songId,
        title: song.title,
        playParams: song.playParams,
        isAuthorized: music.isAuthorized
      });
      
      // Check if authorized, if not, try to authorize
      if (!music.isAuthorized) {
        try {
          console.log('MusicKit: Requesting authorization...');
          await music.authorize();
          setIsAuthorized(true);
          console.log('MusicKit: Authorization successful');
        } catch (authError) {
          console.error('MusicKit: Authorization failed', authError);
          setMusicKitError('Please authorize Apple Music access');
          return;
        }
      }
      
      // Try multiple approaches to play the song
      const playbackMethods = [
        // Method 1: Use songs array with startPlaying (most common for library)
        async () => {
          console.log('MusicKit: Trying songs array with startPlaying:', songId);
          await music.setQueue({ songs: [songId], startPlaying: true });
          return true;
        },
        
        // Method 2: Use playParams.id if available
        async () => {
          if (song.playParams?.id) {
            console.log('MusicKit: Trying playParams.id:', song.playParams.id);
            await music.setQueue({ songs: [song.playParams.id], startPlaying: true });
            return true;
          }
          return false;
        },
        
        // Method 3: Library song with song: parameter
        async () => {
          console.log('MusicKit: Trying song: parameter:', songId);
          await music.setQueue({ song: songId, startPlaying: true });
          return true;
        },
        
        // Method 4: Catalog ID if available (for songs in Apple Music catalog)
        async () => {
          if (song.playParams?.catalogId) {
            console.log('MusicKit: Trying catalogId:', song.playParams.catalogId);
            await music.setQueue({ songs: [song.playParams.catalogId], startPlaying: true });
            return true;
          }
          return false;
        },
        
        // Method 5: setQueue then() chain then play()
        async () => {
          console.log('MusicKit: Trying setQueue().then(play):', songId);
          await music.setQueue({ songs: [songId] }).then(() => music.play());
          return true;
        },
        
        // Method 6: Library items format
        async () => {
          console.log('MusicKit: Trying library-songs items:', songId);
          await music.setQueue({
            items: [{ id: songId, type: 'library-songs' }],
            startPlaying: true
          });
          return true;
        }
      ];
      
      let success = false;
      let lastError = null;
      
      for (const method of playbackMethods) {
        try {
          const result = await method();
          if (result) {
            success = true;
            setIsPlaying(true);
            setMusicKitError(null);
            console.log('MusicKit: Playback started successfully');
            break;
          }
        } catch (error) {
          console.warn('MusicKit: Playback method failed:', error.message || error);
          lastError = error;
          // Continue to next method
        }
      }
      
      if (!success) {
        console.error('MusicKit: All playback methods failed', lastError);
        setMusicKitError(`Unable to play: ${lastError?.message || 'Unknown error'}`);
      }
      
    } else if (!musicKitRef.current) {
      // MusicKit not available, just update state for UI
      console.log('MusicKit not available, updating UI state only');
      setIsPlaying(true);
    }
  }, []);
  
  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!currentSong) return;
    
    if (musicKitRef.current) {
      try {
        if (isPlaying) {
          await musicKitRef.current.pause();
        } else {
          await musicKitRef.current.play();
        }
      } catch (error) {
        console.error('MusicKit toggle error:', error);
      }
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong, isPlaying]);
  
  // Seek to position
  const seek = useCallback(async (time) => {
    setCurrentTime(time);
    if (musicKitRef.current) {
      try {
        await musicKitRef.current.seekToTime(time);
      } catch (error) {
        console.error('MusicKit seek error:', error);
      }
    }
  }, []);
  
  // Set volume
  const setVolumeLevel = useCallback((level) => {
    setVolume(level);
    setIsMuted(level === 0);
    if (musicKitRef.current) {
      musicKitRef.current.volume = level;
    }
  }, []);
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    if (musicKitRef.current) {
      if (isMuted) {
        musicKitRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        musicKitRef.current.volume = 0;
        setIsMuted(true);
      }
    } else {
      setIsMuted(prev => !prev);
    }
  }, [isMuted, volume]);
  
  // Previous track
  const handlePrevious = useCallback(async () => {
    if (musicKitRef.current) {
      try {
        // If we're more than 3 seconds in, restart the track
        if (currentTime > 3) {
          await musicKitRef.current.seekToTime(0);
          return;
        }
        await musicKitRef.current.skipToPreviousItem();
      } catch (error) {
        // Fallback to our queue
        if (queue.length === 0 || queueIndex <= 0) return;
        const newIndex = queueIndex - 1;
        playSong(queue[newIndex], queue, newIndex);
      }
    } else {
      if (queue.length === 0 || queueIndex <= 0) return;
      const newIndex = queueIndex - 1;
      playSong(queue[newIndex], queue, newIndex);
    }
  }, [queue, queueIndex, playSong, currentTime]);
  
  // Next track
  const handleNext = useCallback(async () => {
    if (musicKitRef.current) {
      try {
        await musicKitRef.current.skipToNextItem();
      } catch (error) {
        // Fallback to our queue
        goToNextTrack();
      }
    } else {
      goToNextTrack();
    }
    
    function goToNextTrack() {
      if (queue.length === 0) return;
      
      if (repeatMode === 'one') {
        seek(0);
        return;
      }
      
      let nextIndex;
      if (shuffleMode) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') {
            nextIndex = 0;
          } else {
            setIsPlaying(false);
            return;
          }
        }
      }
      
      playSong(queue[nextIndex], queue, nextIndex);
    }
  }, [queue, queueIndex, repeatMode, shuffleMode, playSong, seek]);
  
  // Toggle repeat mode
  const toggleRepeat = useCallback(() => {
    const modes = ['off', 'all', 'one'];
    setRepeatMode(prev => {
      const idx = modes.indexOf(prev);
      const newMode = modes[(idx + 1) % modes.length];
      
      // Sync with MusicKit
      if (musicKitRef.current) {
        // MusicKit repeat modes: none, one, all
        const mkRepeatMode = newMode === 'off' ? 0 : newMode === 'one' ? 1 : 2;
        musicKitRef.current.repeatMode = mkRepeatMode;
      }
      
      return newMode;
    });
  }, []);
  
  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setShuffleMode(prev => {
      const newMode = !prev;
      
      // Sync with MusicKit
      if (musicKitRef.current) {
        musicKitRef.current.shuffleMode = newMode ? 1 : 0;
      }
      
      return newMode;
    });
  }, []);
  
  // Stop playback
  const stop = useCallback(async () => {
    setCurrentSong(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQueue([]);
    setQueueIndex(-1);
    
    if (musicKitRef.current) {
      try {
        await musicKitRef.current.stop();
      } catch (error) {
        console.error('MusicKit stop error:', error);
      }
    }
  }, []);
  
  // Authorize MusicKit (for manual authorization trigger)
  const authorize = useCallback(async () => {
    if (musicKitRef.current && !isAuthorized) {
      try {
        await musicKitRef.current.authorize();
        setIsAuthorized(true);
        setMusicKitError(null);
        return true;
      } catch (error) {
        console.error('MusicKit authorization error:', error);
        setMusicKitError('Authorization failed');
        return false;
      }
    }
    return isAuthorized;
  }, [isAuthorized]);
  
  const value = {
    // State
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    shuffleMode,
    queue,
    queueIndex,
    
    // MusicKit state
    musicKitReady,
    musicKitError,
    isAuthorized,
    
    // Actions
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
    stop,
    authorize
  };
  
  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

export default MusicContext;

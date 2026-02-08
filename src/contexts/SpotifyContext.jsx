import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const SpotifyContext = createContext();

// Spotify API endpoints
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

export function SpotifyProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('spotify_access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('spotify_refresh_token'));
  const [expiresAt, setExpiresAt] = useState(localStorage.getItem('spotify_expires_at'));
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [playbackState, setPlaybackState] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  const playerRef = useRef(null);
  const currentTrackIdRef = useRef(null);

  // --- HELPER FUNCTIONS ---

  // PKCE helpers
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  };

  const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  };

  const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // 1. Define logout first (used by player listeners)
  const logout = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect();
    }
    
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    setUser(null);
    setPlayer(null);
    setDeviceId(null);
    setIsReady(false);
    setPlaybackState(null);
    
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
    localStorage.removeItem('spotify_code_verifier');
  }, []);

  // 2. Define apiRequest (used by many functions)
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    };

    // Only set Content-Type if there's a body
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle non-JSON error responses
      const contentType = response.headers.get('content-type');
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error?.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (e) {
        // If parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 429) {
        throw new Error('API rate limit exceeded');
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }, [accessToken]);

  // 3. Define refreshAccessToken
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return;
    
    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        }),
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem('spotify_access_token', data.access_token);
        
        const newExpiresAt = Date.now() + data.expires_in * 1000;
        setExpiresAt(newExpiresAt);
        localStorage.setItem('spotify_expires_at', newExpiresAt);
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
    }
  }, [refreshToken]);

  // 4. Define fetchUserProfile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [accessToken]);

  // 5. Define fetchAudioAnalysis
  const fetchAudioAnalysis = useCallback(async (trackId) => {
    try {
      const analysis = await apiRequest(`/audio-analysis/${trackId}`);
      if (analysis) {
        setAudioAnalysis(analysis);
      }
      
      const features = await apiRequest(`/audio-features/${trackId}`);
      if (features) {
        setAudioFeatures(features);
      }
    } catch (e) {
      // access denied or deprecated endpoint - fallback to simulation
      console.warn("Audio analysis unavailable (using simulation mode):", e.message);
      setAudioAnalysis(null);
      setAudioFeatures(null);
    }
  }, [apiRequest]);

  // 6. Define transferPlayback
  const transferPlayback = useCallback(async (deviceId) => {
    try {
      await fetch(`${SPOTIFY_API_BASE}/me/player`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });
    } catch (err) {
      console.error('Failed to transfer playback:', err);
    }
  }, [accessToken]);

  // --- EFFECTS ---

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    document.body.appendChild(script);
    
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Retro Spotify Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5,
      });
      
      playerRef.current = player;
      setPlayer(player);
      
      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
        setError('Failed to initialize player: ' + message);
      });
      
      player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
        setError('Authentication failed. Please log in again.');
        logout();
      });
      
      player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
        setError('Premium account required for playback.');
      });
      
      player.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
      });
      
      // Playback state updates
      player.addListener('player_state_changed', (state) => {
        if (state) {
          setPlaybackState(state);
        }
      });
      
      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        
        // Transfer playback to this device
        transferPlayback(device_id);
      });
      
      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });
      
      player.connect();
    };
    
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [accessToken, logout, transferPlayback]);

  // Check token expiration and refresh if needed
  useEffect(() => {
    if (!expiresAt) return;
    
    const now = Date.now();
    const expTime = parseInt(expiresAt);
    
    if (now >= expTime - 60000) { // Refresh 1 minute before expiration
      refreshAccessToken();
    }
  }, [expiresAt, refreshAccessToken]);

  // Fetch user profile
  useEffect(() => {
    if (accessToken && !user) {
      fetchUserProfile();
    }
  }, [accessToken, user, fetchUserProfile]);

  // Monitor track changes to fetch analysis
  useEffect(() => {
    if (!playbackState) return;
    
    const trackId = playbackState.track_window?.current_track?.id;
    if (trackId && trackId !== currentTrackIdRef.current) {
      currentTrackIdRef.current = trackId;
      setAudioAnalysis(null); // Clear old analysis
      fetchAudioAnalysis(trackId);
    }
  }, [playbackState, fetchAudioAnalysis]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      setError('Authorization failed: ' + error);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      // Exchange code for tokens
      const exchangeCode = async () => {
        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
        const codeVerifier = localStorage.getItem('spotify_code_verifier');

        if (!codeVerifier) {
          console.error('No code verifier found');
          return;
        }

        try {
          const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier,
            }),
          });

          const data = await response.json();

          if (data.access_token) {
            setAccessToken(data.access_token);
            localStorage.setItem('spotify_access_token', data.access_token);

            if (data.refresh_token) {
              setRefreshToken(data.refresh_token);
              localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }

            const expiresAt = Date.now() + data.expires_in * 1000;
            setExpiresAt(expiresAt);
            localStorage.setItem('spotify_expires_at', expiresAt);

            // Clear code verifier
            localStorage.removeItem('spotify_code_verifier');

            // Clear query params
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error('Token exchange failed:', data);
            setError('Failed to get access token');
          }
        } catch (err) {
          console.error('Token exchange error:', err);
          setError('Failed to exchange authorization code');
        }
      };

      exchangeCode();
    }
  }, []);

  // --- PUBLIC API WRAPPERS ---

  const login = async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-library-modify',
      'user-read-recently-played',
      'user-follow-read',
      'user-follow-modify',
      'user-top-read',
    ];

    // Generate PKCE parameters
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    // Store code verifier for later
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true',
    });
    
    const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
    window.location.href = authUrl;
  };

  const play = useCallback(async (contextUri = null, uris = null, offset = null) => {
    if (!playerRef.current) return;
    
    // Validate and clean parameters - filter out DOM elements/objects
    const cleanContextUri = typeof contextUri === 'string' ? contextUri : null;
    const cleanUris = Array.isArray(uris) ? uris : null;
    const cleanOffset = typeof offset === 'object' && offset !== null && !offset.nodeType ? offset : null;
    
    const body = {};
    if (cleanContextUri) body.context_uri = cleanContextUri;
    if (cleanUris) body.uris = cleanUris;
    if (cleanOffset) body.offset = cleanOffset;
    
    try {
      await apiRequest('/me/player/play', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error('Play error:', err);
    }
  }, [apiRequest]);

  const pause = useCallback(async () => {
    if (!playerRef.current) return;
    
    try {
      await apiRequest('/me/player/pause', {
        method: 'PUT',
      });
    } catch (err) {
      console.error('Pause error:', err);
    }
  }, [apiRequest]);

  const next = useCallback(async () => {
    if (!playerRef.current) return;
    
    try {
      await apiRequest('/me/player/next', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Next error:', err);
    }
  }, [apiRequest]);

  const previous = useCallback(async () => {
    if (!playerRef.current) return;
    
    try {
      await apiRequest('/me/player/previous', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Previous error:', err);
    }
  }, [apiRequest]);

  const seek = useCallback(async (positionMs) => {
    if (!playerRef.current) return;
    
    try {
      await apiRequest(`/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
      });
    } catch (err) {
      console.error('Seek error:', err);
    }
  }, [apiRequest]);

  const setVolume = useCallback(async (volumePercent) => {
    if (!playerRef.current) return;
    
    try {
      await apiRequest(`/me/player/volume?volume_percent=${volumePercent}`, {
        method: 'PUT',
      });
    } catch (err) {
      console.error('Volume error:', err);
    }
  }, [apiRequest]);

  const getPlaylists = useCallback(async (limit = 20, offset = 0) => {
    return apiRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
  }, [apiRequest]);

  const getPlaylistTracks = useCallback(async (playlistId, limit = 100, offset = 0) => {
    return apiRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
  }, [apiRequest]);

  const getLikedSongs = useCallback(async (limit = 50, offset = 0) => {
    return apiRequest(`/me/tracks?limit=${limit}&offset=${offset}`);
  }, [apiRequest]);

  const getRecentlyPlayed = useCallback(async (limit = 50) => {
    return apiRequest(`/me/player/recently-played?limit=${limit}`);
  }, [apiRequest]);

  const checkSavedTracks = useCallback(async (trackIds) => {
    if (!trackIds || trackIds.length === 0) return [];
    try {
      const result = await apiRequest(`/me/tracks/contains?ids=${trackIds.join(',')}`);
      return Array.isArray(result) ? result : [];
    } catch (e) {
      console.error("Error checking saved tracks:", e);
      return [];
    }
  }, [apiRequest]);

  const saveTracks = useCallback(async (trackIds) => {
    if (!trackIds || trackIds.length === 0) return null;
    return apiRequest('/me/tracks', {
      method: 'PUT',
      body: JSON.stringify({ ids: trackIds }),
    });
  }, [apiRequest]);

  const removeTracks = useCallback(async (trackIds) => {
    if (!trackIds || trackIds.length === 0) return null;
    return apiRequest('/me/tracks', {
      method: 'DELETE',
      body: JSON.stringify({ ids: trackIds }),
    });
  }, [apiRequest]);

  const value = {
    accessToken,
    user,
    player,
    playbackState,
    deviceId,
    audioAnalysis,
    audioFeatures,
    isReady,
    isAuthenticated: !!accessToken,
    error,
    login,
    logout,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    getPlaylists,
    getPlaylistTracks,
    getLikedSongs,
    getRecentlyPlayed,
    checkSavedTracks,
    saveTracks,
    removeTracks,
    apiRequest,
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
}
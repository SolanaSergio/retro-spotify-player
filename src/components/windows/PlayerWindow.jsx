import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSpotify } from '../../contexts/SpotifyContext';
import { getCurrentAudioValues } from '../../utils/audioUtils';
import { Visualizers } from '../../utils/visualizers';
import { VISUALIZER_THEMES } from '../../utils/themes';

const VISUALIZER_KEYS = Object.keys(Visualizers);
const THEME_KEYS = Object.keys(VISUALIZER_THEMES);

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

// --- UTILS ---
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height: rect.height };
}

function UniversalVisualizer({ mode, isPlaying, audioAnalysis, audioFeatures, playbackState, sensitivity = 1, theme }) {
  const canvasRef = useRef(null);
  const positionRef = useRef(playbackState?.position || 0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (playbackState) {
      positionRef.current = playbackState.position;
      lastTimeRef.current = Date.now();
    }
  }, [playbackState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    
    lastTimeRef.current = Date.now(); // Initialize here
    let animationId;
    const render = () => {
      const now = Date.now();
      if (isPlaying) positionRef.current += (now - lastTimeRef.current);
      lastTimeRef.current = now;

      // Inject sensitivity into the syncData object hackily or pass it to visualizer
      const syncData = getCurrentAudioValues(audioAnalysis, audioFeatures, positionRef.current);
      if (syncData) {
          syncData.sensitivity = sensitivity; // Pass raw sensitivity
      }
      
      const renderFn = Visualizers[mode] || Visualizers.spectrum_pro;
      if (renderFn) {
        renderFn(ctx, width, height, syncData, isPlaying, theme);
      }
      
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [mode, isPlaying, audioAnalysis, audioFeatures, sensitivity, theme]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// --- COMPONENTS ---

// Sidebar Item
const SidebarItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '8px 12px',
      cursor: 'pointer',
      backgroundColor: active ? '#000080' : 'transparent',
      color: active ? '#ffffff' : '#000000',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '12px',
      borderBottom: '1px dotted #ccc'
    }}
  >
    <span style={{ fontSize: '16px' }}>{icon}</span>
    <span style={{ fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
  </div>
);

// Track Row Component
const TrackRow = ({ track, index, isPlaying, onClick }) => (
  <div 
    onClick={onClick}
    className="win95-list-item"
    style={{
      display: 'grid',
      gridTemplateColumns: '30px 1fr 1fr 60px',
      gap: '10px',
      padding: '4px 8px',
      alignItems: 'center',
      backgroundColor: isPlaying ? '#000080' : 'transparent',
      color: isPlaying ? '#ffffff' : 'inherit',
    }}
  >
    <div style={{ textAlign: 'right', opacity: 0.7 }}>{index + 1}</div>
    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {track.name}
    </div>
    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9 }}>
      {track.artists?.map(a => a.name).join(', ')}
    </div>
    <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
      {track.duration_ms ? new Date(track.duration_ms).toISOString().substr(14, 5) : '--:--'}
    </div>
  </div>
);

// Track List Component
const TrackList = ({ view, playlistId, getPlaylistTracks, getLikedSongs, getRecentlyPlayed, onPlayTrack, currentTrackId }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const listRef = useRef(null);
  const PAGE_SIZE = 50;

  useEffect(() => {
    setTracks([]);
    setSearchQuery('');
    setHasMore(false);
    setTotal(0);
    const fetchTracks = async () => {
      setLoading(true);
      try {
        let data;
        if (view === 'playlist_detail' && playlistId) {
          data = await getPlaylistTracks(playlistId);
          setTracks(data?.items?.map(i => i.track) || []);
          setTotal(data?.total || 0);
          setHasMore((data?.items?.length || 0) < (data?.total || 0));
        } else if (view === 'liked') {
          data = await getLikedSongs(PAGE_SIZE, 0);
          setTracks(data?.items?.map(i => i.track) || []);
          setTotal(data?.total || 0);
          setHasMore((data?.items?.length || 0) < (data?.total || 0));
        } else if (view === 'recent') {
          data = await getRecentlyPlayed();
          setTracks(data?.items?.map(i => i.track) || []);
        }
      } catch (e) {
        console.error("Error fetching tracks", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [view, playlistId, getPlaylistTracks, getLikedSongs, getRecentlyPlayed]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      let data;
      if (view === 'liked') {
        data = await getLikedSongs(PAGE_SIZE, tracks.length);
        const newTracks = data?.items?.map(i => i.track) || [];
        setTracks(prev => [...prev, ...newTracks]);
        setHasMore(tracks.length + newTracks.length < (data?.total || 0));
      } else if (view === 'playlist_detail' && playlistId) {
        data = await getPlaylistTracks(playlistId, 100, tracks.length);
        const newTracks = data?.items?.map(i => i.track) || [];
        setTracks(prev => [...prev, ...newTracks]);
        setHasMore(tracks.length + newTracks.length < (data?.total || 0));
      }
    } catch (e) {
      console.error("Error loading more tracks", e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, view, tracks.length, getLikedSongs, getPlaylistTracks, playlistId]);

  const handleScroll = useCallback((e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      loadMore();
    }
  }, [loadMore]);

  const filteredTracks = searchQuery
    ? tracks.filter(t => t && (
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artists?.some(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.album?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : tracks;

  if (loading) return <div style={{ padding: 20 }}>Loading tracks...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(view === 'liked' || view === 'playlist_detail') && (
        <div style={{ padding: '6px 8px', borderBottom: '1px solid #ccc', backgroundColor: '#f0f0f0' }}>
          <div className="win95-sunken" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '2px 4px' }}>
            <span style={{ fontSize: '12px', marginRight: '4px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by title, artist, or album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win95-input"
              style={{ border: 'none', flex: 1, fontSize: '11px', outline: 'none', padding: '3px 4px', backgroundColor: 'transparent' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}>✕</button>
            )}
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
            {searchQuery
              ? `${filteredTracks.length} result${filteredTracks.length !== 1 ? 's' : ''} of ${total || tracks.length} songs`
              : `${tracks.length} of ${total || tracks.length} songs loaded`}
          </div>
        </div>
      )}
      <div ref={listRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>
        {filteredTracks.map((track, i) => (
          track ? (
            <TrackRow
              key={track.id + i}
              track={track}
              index={i}
              isPlaying={currentTrackId === track.id}
              onClick={() => onPlayTrack(track.uri)}
            />
          ) : null
        ))}
        {loadingMore && (
          <div style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: '#666' }}>Loading more songs...</div>
        )}
        {hasMore && !loadingMore && !searchQuery && (
          <div style={{ padding: '8px', textAlign: 'center' }}>
            <button className="win95-button" onClick={loadMore} style={{ fontSize: '11px', padding: '4px 12px' }}>
              Load More ({tracks.length} / {total})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PlayerWindow() {
  const { 
    playbackState, isReady, play, pause, next, previous, seek, setVolume, 
    getPlaylists, getLikedSongs, getRecentlyPlayed, getPlaylistTracks, audioAnalysis, audioFeatures,
    checkSavedTracks, saveTracks, removeTracks
  } = useSpotify();

  // Navigation State
  const [activeView, setActiveView] = useState('now_playing'); 
  const [libraryItems, setLibraryItems] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [currentVisIndex, setCurrentVisIndex] = useState(0);
  const [currentThemeKey, setCurrentThemeKey] = useState('retro_wave');
  const [showVisControls, setShowVisControls] = useState(false);
  
  // Playback State
  const [volume, setLocalVolume] = useState(50);
  const [seekPos, setSeekPos] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [visSensitivity, setVisSensitivity] = useState(1.5); // Default higher
  const [isLiked, setIsLiked] = useState(false);

  // Computed
  const track = playbackState?.track_window?.current_track;
  const isPlaying = !playbackState?.paused;
  const duration = track?.duration_ms || 0;
  const position = playbackState?.position || 0;

  useEffect(() => {
    if (!isSeeking) setSeekPos(position);
  }, [position, isSeeking]);

  // Check liked status
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (track?.id) {
        try {
          const [liked] = await checkSavedTracks([track.id]);
          setIsLiked(liked);
        } catch (e) {
          console.error("Failed to check like status", e);
        }
      } else {
        setIsLiked(false);
      }
    };
    checkLikeStatus();
  }, [track?.id, checkSavedTracks]);

  const toggleLike = async () => {
    if (!track?.id) return;
    try {
      if (isLiked) {
        await removeTracks([track.id]);
        setIsLiked(false);
      } else {
        await saveTracks([track.id]);
        setIsLiked(true);
      }
    } catch (e) {
      console.error("Failed to toggle like", e);
    }
  };

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const playlists = await getPlaylists(20);
        setLibraryItems(playlists?.items || []);
      } catch (err) {
        console.error("Failed to load library", err);
      }
    };
    loadLibrary();
  }, [getPlaylists]);

  const nextVisualizer = () => {
    setCurrentVisIndex((prev) => (prev + 1) % VISUALIZER_KEYS.length);
  };

  const debouncedSetVolume = useDebounce(setVolume, 300);

  if (!isReady) return <div style={{ padding: 20 }}>Connecting to Spotify...</div>;

  return (
    <div className="win95-window" style={{ 
      position: 'relative', width: '100%', height: '100%', 
      display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none'
    }}>
      
      {/* --- MAIN BODY --- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div className="win95-sunken" style={{ 
          width: '200px', display: 'flex', flexDirection: 'column',
          backgroundColor: '#c0c0c0', borderRight: 'none', padding: '2px', overflowY: 'auto'
        }}>
          <div style={{ padding: '8px 10px', fontWeight: 'bold', color: '#444', marginTop: '4px' }}>MAIN</div>
          <SidebarItem icon="💿" label="Now Playing" active={activeView === 'now_playing'} onClick={() => setActiveView('now_playing')} />
          <SidebarItem icon="🎨" label="Visuals" active={activeView === 'visuals'} onClick={() => setActiveView('visuals')} />
          <SidebarItem icon="❤️" label="Liked Songs" active={activeView === 'liked'} onClick={() => setActiveView('liked')} />
          <SidebarItem icon="🕒" label="Recent" active={activeView === 'recent'} onClick={() => setActiveView('recent')} />
          
          <div style={{ padding: '12px 10px 4px', fontWeight: 'bold', color: '#444' }}>PLAYLISTS</div>
          {libraryItems.map(pl => (
             <SidebarItem 
                key={pl.id}
                icon="📁"
                label={pl.name}
                active={activeView === 'playlist_detail' && selectedPlaylist?.id === pl.id}
                onClick={() => { setSelectedPlaylist(pl); setActiveView('playlist_detail'); }}
             />
          ))}
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: activeView === 'now_playing' ? '#000' : '#fff', overflow: 'hidden', position: 'relative' }}>
          
          {/* VIEW: NOW PLAYING */}
          {activeView === 'now_playing' && (
             <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <UniversalVisualizer 
                  mode={VISUALIZER_KEYS[currentVisIndex]} 
                  isPlaying={isPlaying} 
                  audioAnalysis={audioAnalysis} 
                  audioFeatures={audioFeatures}
                  playbackState={playbackState}
                  sensitivity={visSensitivity}
                  theme={VISUALIZER_THEMES[currentThemeKey]}
                />

                {/* VISUALS CONTROLS (Top Left) */}
                <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 30 }}>
                  <button 
                    className="win95-button" 
                    onClick={() => setShowVisControls(!showVisControls)}
                    style={{ fontWeight: 'bold', padding: '4px 8px' }}
                  >
                    🎨 OPTIONS {showVisControls ? '▲' : '▼'}
                  </button>
                  
                  {showVisControls && (
                    <div className="win95-window" style={{ 
                      marginTop: '5px', 
                      width: '220px', 
                      backgroundColor: '#c0c0c0', 
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 'bold' }}>THEME</div>
                        <select 
                          className="win95-input" 
                          style={{ width: '100%' }}
                          value={currentThemeKey}
                          onChange={(e) => setCurrentThemeKey(e.target.value)}
                        >
                          {THEME_KEYS.map(key => (
                            <option key={key} value={key}>{VISUALIZER_THEMES[key].label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 'bold' }}>SENSITIVITY: {visSensitivity.toFixed(1)}</div>
                        <input 
                           type="range" className="win95-slider" min="0.1" max="5.0" step="0.1" 
                           value={visSensitivity} onChange={(e) => setVisSensitivity(parseFloat(e.target.value))}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 'bold' }}>MODE</div>
                        <select 
                          className="win95-input" 
                          style={{ width: '100%' }}
                          value={currentVisIndex}
                          onChange={(e) => setCurrentVisIndex(parseInt(e.target.value))}
                        >
                          {VISUALIZER_KEYS.map((key, i) => (
                            <option key={key} value={i}>{key.replace(/_/g, ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="win95-window" style={{ 
                   position: 'absolute', 
                   bottom: 20, 
                   left: 20, 
                   width: '300px',
                   zIndex: 10,
                   backgroundColor: 'rgba(192, 192, 192, 0.85)',
                   backdropFilter: 'blur(4px)',
                   display: 'flex',
                   flexDirection: 'row',
                   padding: '4px',
                   gap: '10px',
                   alignItems: 'center',
                   minHeight: '80px'
                }}>
                   <div className="win95-sunken" style={{ width: '70px', height: '70px', flexShrink: 0 }}>
                      {track?.album?.images?.[0]?.url ? (
                        <img src={track.album.images[0].url} alt="" style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#000' }}></div>
                      )}
                   </div>
                   
                   <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track?.name || 'No Track'}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '2px' }}>
                        {track?.artists?.[0]?.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                        {track?.album?.name}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* VIEW: VISUALS SELECTOR */}
          {activeView === 'visuals' && (
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#c0c0c0', overflowY: 'auto' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #808080', paddingBottom: '10px' }}>
                  <h2 style={{ margin: 0 }}>Visualizer Config</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                     <span style={{ fontSize: '12px' }}>Sensitivity: {visSensitivity.toFixed(1)}</span>
                     <input 
                        type="range" className="win95-slider" min="0.5" max="3.0" step="0.1" 
                        value={visSensitivity} onChange={(e) => setVisSensitivity(parseFloat(e.target.value))}
                        style={{ width: '100px' }}
                     />
                  </div>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                  {VISUALIZER_KEYS.map((key, i) => (
                     <div 
                        key={key}
                        className={currentVisIndex === i ? 'win95-sunken' : 'win95-raised'}
                        style={{ 
                           padding: '10px', 
                           textAlign: 'center', 
                           cursor: 'pointer',
                           backgroundColor: currentVisIndex === i ? '#000' : '#fff',
                           color: currentVisIndex === i ? '#fff' : '#000',
                           height: '100px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           fontWeight: 'bold',
                           textTransform: 'uppercase'
                        }}
                        onClick={() => {
                           setCurrentVisIndex(i);
                           // Optional: automatically switch back to Now Playing or stay here
                        }}
                     >
                        {key}
                     </div>
                  ))}
               </div>
               
               <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button className="win95-button" onClick={() => setActiveView('now_playing')} style={{ padding: '8px 20px' }}>
                     LAUNCH VISUALIZER
                  </button>
               </div>
            </div>
          )}

          {/* VIEW: LISTS */}
          {activeView !== 'now_playing' && activeView !== 'visuals' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'hidden' }}>
               <div style={{ padding: '10px', borderBottom: '1px solid #ccc', backgroundColor: '#f0f0f0' }}>
                  <h3 style={{ margin: 0 }}>
                    {activeView === 'liked' && 'Liked Songs'}
                    {activeView === 'recent' && 'Recently Played'}
                    {activeView === 'playlist_detail' && (selectedPlaylist?.name || 'Playlist')}
                  </h3>
               </div>
               <div className="win95-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <TrackList
                    view={activeView}
                    playlistId={selectedPlaylist?.id}
                    getPlaylistTracks={getPlaylistTracks}
                    getLikedSongs={getLikedSongs}
                    getRecentlyPlayed={getRecentlyPlayed}
                    currentTrackId={track?.id}
                    onPlayTrack={uri => play(activeView === 'playlist_detail' ? selectedPlaylist.uri : null, activeView === 'playlist_detail' ? undefined : [uri])}
                  />
               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="win95-raised" style={{ 
         height: '80px', backgroundColor: '#c0c0c0', display: 'flex', alignItems: 'center', 
         padding: '0 15px', gap: '20px', zIndex: 100 
      }}>
         {/* Controls */}
         <div style={{ display: 'flex', gap: '8px' }}>
            <button className="win95-button" onClick={previous} style={{ minWidth: '50px', height: '40px', fontSize: '20px' }}>⏮</button>
            <button className="win95-button" onClick={() => isPlaying ? pause() : play()} style={{ minWidth: '60px', height: '40px', fontSize: '20px' }}>
               {isPlaying ? '||' : '▶'}
            </button>
            <button className="win95-button" onClick={next} style={{ minWidth: '50px', height: '40px', fontSize: '20px' }}>⏭</button>
            <button 
              className={`win95-button ${isLiked ? 'active' : ''}`} 
              onClick={toggleLike}
              style={{ color: isLiked ? '#ff0000' : 'inherit', minWidth: '50px', height: '40px', fontSize: '24px' }}
              title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
            >
              ♥
            </button>
         </div>

         <div className="win95-sunken" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5px 10px', height: '50px', backgroundColor: '#d0d0d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <span style={{ fontSize: '12px', fontFamily: 'monospace', minWidth: '40px', fontWeight: 'bold' }}>
                  {Math.floor(seekPos/60000)}:{Math.floor((seekPos%60000)/1000).toString().padStart(2,'0')}
               </span>
               <input 
                  type="range" className="win95-slider"
                  min={0} max={duration || 100} value={seekPos} 
                  onChange={(e) => setSeekPos(parseInt(e.target.value))}
                  onMouseDown={() => setIsSeeking(true)}
                  onMouseUp={() => { seek(seekPos); setIsSeeking(false); }}
                  style={{ flex: 1, height: '30px' }} 
               />
               <span style={{ fontSize: '12px', fontFamily: 'monospace', minWidth: '40px', fontWeight: 'bold' }}>
                  {Math.floor(duration/60000)}:{Math.floor((duration%60000)/1000).toString().padStart(2,'0')}
               </span>
            </div>
         </div>

         <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px', border: '1px dotted #808080' }}>
            <span style={{ fontSize: '20px' }}>🔈</span>
            <input 
               type="range" className="win95-slider" min={0} max={100} value={volume} 
               onChange={(e) => { 
                 const v = parseInt(e.target.value);
                 setLocalVolume(v); 
                 debouncedSetVolume(v); 
               }}
               style={{ height: '30px' }}
            />
         </div>
      </div>
    </div>
  );
}
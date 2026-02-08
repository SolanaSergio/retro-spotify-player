import React, { useState, useEffect, useCallback } from 'react';
import { useSpotify } from '../../contexts/SpotifyContext';

function PlaylistWindow() {
  const { getPlaylists, getPlaylistTracks, getLikedSongs, getRecentlyPlayed, play, playbackState } = useSpotify();
  
  const [activeTab, setActiveTab] = useState('playlists');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const tabs = [
    { id: 'playlists', label: 'Playlists' },
    { id: 'liked', label: 'Liked Songs' },
    { id: 'recent', label: 'Recently Played' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      switch (activeTab) {
        case 'playlists':
          data = await getPlaylists(50);
          setItems(data.items || []);
          break;
        case 'liked':
          data = await getLikedSongs(50);
          setItems(data.items?.map(item => ({
            ...item.track,
            added_at: item.added_at,
          })) || []);
          break;
        case 'recent':
          data = await getRecentlyPlayed(50);
          setItems(data.items?.map(item => item.track) || []);
          break;
        default:
          setItems([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, getPlaylists, getLikedSongs, getRecentlyPlayed]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleItemDoubleClick = async (item) => {
    if (activeTab === 'playlists') {
      // Play entire playlist
      await play(item.uri);
    } else {
      // Play specific track
      await play(null, [item.uri]);
    }
  };

  const renderItem = (item, index) => {
    const isSelected = selectedItem?.id === item.id || selectedItem?.uri === item.uri;
    
    let title, subtitle;
    
    if (activeTab === 'playlists') {
      title = item.name;
      subtitle = `${item.tracks?.total || 0} tracks`;
    } else {
      title = item.name;
      subtitle = item.artists?.map(a => a.name).join(', ');
    }

    return (
      <div
        key={item.id || item.uri || index}
        className={`win95-list-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handleItemClick(item)}
        onDoubleClick={() => handleItemDoubleClick(item)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ 
            fontWeight: isSelected ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: '10px',
            color: '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {subtitle}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      padding: '4px',
    }}>
      {/* Tab Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '2px',
        marginBottom: '4px',
        padding: '2px',
        backgroundColor: '#c0c0c0',
        border: '1px solid',
        borderColor: '#808080 #ffffff #ffffff #808080',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="win95-button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              fontSize: '10px',
              borderColor: activeTab === tab.id 
                ? '#808080 #ffffff #ffffff #808080'
                : '#ffffff #808080 #808080 #ffffff',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="win95-list win95-scrollbar" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div className="win95-loading"></div>
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            color: 'red',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
            <div>{error}</div>
            <button 
              className="win95-button" 
              onClick={fetchData}
              style={{ marginTop: '10px' }}
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            color: '#666',
          }}>
            No items found
          </div>
        ) : (
          items.map((item, index) => renderItem(item, index))
        )}
      </div>

      {/* Status Bar */}
      <div className="win95-status-bar" style={{ marginTop: '4px' }}>
        <span className="win95-status-section">
          {items.length} {activeTab === 'playlists' ? 'playlists' : 'tracks'}
        </span>
        <span className="win95-status-section" style={{ textAlign: 'center' }}>
          {selectedItem ? selectedItem.name : 'No selection'}
        </span>
        <span className="win95-status-section" style={{ textAlign: 'right' }}>
          Double-click to play
        </span>
      </div>
    </div>
  );
}

export default PlaylistWindow;

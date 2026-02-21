import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSpotify } from '../../contexts/SpotifyContext';

function PlaylistWindow() {
  const { getPlaylists, getPlaylistTracks, getLikedSongs, getRecentlyPlayed, play, playbackState } = useSpotify();

  const [activeTab, setActiveTab] = useState('playlists');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const listRef = useRef(null);
  const PAGE_SIZE = 50;

  const tabs = [
    { id: 'playlists', label: 'Playlists' },
    { id: 'liked', label: 'Liked Songs' },
    { id: 'recent', label: 'Recently Played' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearchQuery('');
    setHasMore(false);
    setTotal(0);

    try {
      let data;
      switch (activeTab) {
        case 'playlists':
          data = await getPlaylists(50);
          setItems(data.items || []);
          setTotal(data?.total || 0);
          setHasMore((data?.items?.length || 0) < (data?.total || 0));
          break;
        case 'liked':
          data = await getLikedSongs(PAGE_SIZE, 0);
          setItems(data.items?.map(item => ({
            ...item.track,
            added_at: item.added_at,
          })) || []);
          setTotal(data?.total || 0);
          setHasMore((data?.items?.length || 0) < (data?.total || 0));
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

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      let data;
      if (activeTab === 'liked') {
        data = await getLikedSongs(PAGE_SIZE, items.length);
        const newItems = data?.items?.map(item => ({
          ...item.track,
          added_at: item.added_at,
        })) || [];
        setItems(prev => [...prev, ...newItems]);
        setHasMore(items.length + newItems.length < (data?.total || 0));
      } else if (activeTab === 'playlists') {
        data = await getPlaylists(50, items.length);
        const newItems = data?.items || [];
        setItems(prev => [...prev, ...newItems]);
        setHasMore(items.length + newItems.length < (data?.total || 0));
      }
    } catch (err) {
      console.error("Error loading more items", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, activeTab, items.length, getLikedSongs, getPlaylists]);

  const handleScroll = useCallback((e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      loadMore();
    }
  }, [loadMore]);

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

  const filteredItems = searchQuery
    ? items.filter(item => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'playlists') {
          return item.name?.toLowerCase().includes(query);
        }
        return (
          item.name?.toLowerCase().includes(query) ||
          item.artists?.some(a => a.name?.toLowerCase().includes(query)) ||
          item.album?.name?.toLowerCase().includes(query)
        );
      })
    : items;

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

      {/* Search Bar */}
      {(activeTab === 'liked' || activeTab === 'playlists') && !loading && !error && items.length > 0 && (
        <div style={{ marginBottom: '4px', padding: '2px' }}>
          <div className="win95-sunken" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '2px 4px' }}>
            <span style={{ fontSize: '12px', marginRight: '4px' }}>🔍</span>
            <input
              type="text"
              placeholder={activeTab === 'playlists' ? 'Search playlists...' : 'Search by title, artist, or album...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win95-input"
              style={{ border: 'none', flex: 1, fontSize: '11px', outline: 'none', padding: '3px 4px', backgroundColor: 'transparent' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}>✕</button>
            )}
          </div>
          {searchQuery && (
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px', paddingLeft: '4px' }}>
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} of {total || items.length}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="win95-list win95-scrollbar"
        style={{ flex: 1 }}
      >
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
        ) : filteredItems.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
          }}>
            {searchQuery ? 'No matching items found' : 'No items found'}
          </div>
        ) : (
          <>
            {filteredItems.map((item, index) => renderItem(item, index))}
            {loadingMore && (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: '#666' }}>Loading more...</div>
            )}
            {hasMore && !loadingMore && !searchQuery && (
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <button className="win95-button" onClick={loadMore} style={{ fontSize: '11px', padding: '4px 12px' }}>
                  Load More ({items.length} / {total})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="win95-status-bar" style={{ marginTop: '4px' }}>
        <span className="win95-status-section">
          {searchQuery
            ? `${filteredItems.length} found`
            : `${items.length}${total > items.length ? ` / ${total}` : ''} ${activeTab === 'playlists' ? 'playlists' : 'tracks'}`}
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

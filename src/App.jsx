import React, { useState, useEffect, useCallback } from 'react';
import { WindowProvider, useWindows, WINDOW_TYPES } from './contexts/WindowContext';
import { SpotifyProvider, useSpotify } from './contexts/SpotifyContext';
import Window from './components/Window';
import PlayerWindow from './components/windows/PlayerWindow';
import PlaylistWindow from './components/windows/PlaylistWindow';
import SettingsWindow from './components/windows/SettingsWindow';
import AboutWindow from './components/windows/AboutWindow';
import Taskbar from './components/Taskbar';
import BootScreen from './components/BootScreen';
import Desktop from './components/Desktop';
import LoginDialog from './components/LoginDialog';
import './windows95.css';

function AppContent() {
  const { 
    windows, 
    activeWindowId, 
    createWindow, 
    closeWindow, 
    focusWindow, 
    minimizeWindow,
    restoreWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useWindows();
  
  const { 
    isAuthenticated, 
    user, 
    isReady, 
    error,
    play,
    pause,
    next,
    previous,
    playbackState,
    setVolume,
  } = useSpotify();
  
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [bootComplete, setBootComplete] = useState(false);
  const [volume, setLocalVolume] = useState(50);

  // Show boot screen initially
  useEffect(() => {
    const timer = setTimeout(() => {
      setBootComplete(true);
      setTimeout(() => {
        setShowBootScreen(false);
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Don't capture if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const isPlaying = !playbackState?.paused;
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          play();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        previous();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const newVolUp = Math.min(100, volume + 5);
        setLocalVolume(newVolUp);
        setVolume(newVolUp);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const newVolDown = Math.max(0, volume - 5);
        setLocalVolume(newVolDown);
        setVolume(newVolDown);
        break;
      default:
        break;
    }
  }, [playbackState, play, pause, next, previous, volume, setVolume]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Open player window on boot
  useEffect(() => {
    if (!bootComplete || windows.length > 0) return;
    
    createWindow({
      type: WINDOW_TYPES.PLAYER,
      title: 'Retro Spotify Player',
      width: 450,
      height: 400,
      x: 100,
      y: 50,
    });
  }, [bootComplete, windows.length, createWindow]);

  const renderWindowContent = (window) => {
    switch (window.type) {
      case WINDOW_TYPES.PLAYER:
        return <PlayerWindow onOpenPlaylist={() => {
          createWindow({
            type: WINDOW_TYPES.PLAYLIST,
            title: 'Playlist Browser',
            width: 500,
            height: 450,
            x: 200,
            y: 100,
          });
        }} />;
      case WINDOW_TYPES.PLAYLIST:
        return <PlaylistWindow />;
      case WINDOW_TYPES.SETTINGS:
        return <SettingsWindow />;
      case WINDOW_TYPES.ABOUT:
        return <AboutWindow />;
      default:
        return null;
    }
  };

  if (showBootScreen) {
    return <BootScreen />;
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="crt-overlay"></div>
      {/* Desktop */}
      <Desktop onOpenWindow={(type, config = {}) => {
        const windowConfig = {
          [WINDOW_TYPES.PLAYER]: {
            title: 'Retro Spotify Player',
            width: 450,
            height: 400,
          },
          [WINDOW_TYPES.PLAYLIST]: {
            title: 'Playlist Browser',
            width: 500,
            height: 450,
          },
          [WINDOW_TYPES.SETTINGS]: {
            title: 'Settings',
            width: 400,
            height: 350,
          },
          [WINDOW_TYPES.ABOUT]: {
            title: 'About',
            width: 350,
            height: 300,
          },
        };

        // Check if window already exists
        const existingWindow = windows.find(w => w.type === type);
        if (existingWindow) {
          if (existingWindow.minimized) {
            restoreWindow(existingWindow.id);
          }
          focusWindow(existingWindow.id);
          return;
        }

        createWindow({
          type,
          ...windowConfig[type],
          x: 50 + windows.length * 30,
          y: 50 + windows.length * 30,
          ...config,
        });
      }} />

      {/* Windows */}
      {windows.map(window => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          width={window.width}
          height={window.height}
          x={window.x}
          y={window.y}
          zIndex={window.zIndex}
          isActive={activeWindowId === window.id}
          isMinimized={window.minimized}
          onFocus={() => focusWindow(window.id)}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onUpdatePosition={(x, y) => updateWindowPosition(window.id, x, y)}
          onUpdateSize={(width, height) => updateWindowSize(window.id, width, height)}
          resizable={true}
        >
          {renderWindowContent(window)}
        </Window>
      ))}

      {/* Login Dialog */}
      {!isAuthenticated && <LoginDialog />}

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}

function App() {
  return (
    <SpotifyProvider>
      <WindowProvider>
        <AppContent />
      </WindowProvider>
    </SpotifyProvider>
  );
}

export default App;

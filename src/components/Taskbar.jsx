import React, { useState, useEffect, useRef } from 'react';
import { useWindows, WINDOW_TYPES } from '../contexts/WindowContext';
import { useSpotify } from '../contexts/SpotifyContext';

function Taskbar() {
  const { 
    windows, 
    activeWindowId, 
    createWindow, 
    focusWindow, 
    restoreWindow,
    minimizeWindow,
    minimizeAll,
  } = useWindows();

  const { logout } = useSpotify();

  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const startMenuRef = useRef(null);
  const startButtonRef = useRef(null);

  // Close start menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If menu is closed, do nothing
      if (!startMenuOpen) return;

      // If clicking inside menu or on start button, do nothing
      if (
        startMenuRef.current?.contains(event.target) || 
        startButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setStartMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [startMenuOpen]);

  const handleTaskbarClick = (window) => {
    if (window.minimized) {
      restoreWindow(window.id);
    } else if (activeWindowId === window.id) {
      minimizeWindow(window.id);
    } else {
      focusWindow(window.id);
    }
  };

  const handleStartButton = (e) => {
    // Prevent document listener from firing immediately
    e.stopPropagation();
    setStartMenuOpen(!startMenuOpen);
  };

  const handleStartMenuClick = (action) => {
    setStartMenuOpen(false);
    
    if (action === 'shutdown') {
       if(confirm("It is now safe to turn off your computer.")) {
         window.location.reload(); 
       }
       return;
    }

    if (action === 'restart') {
        if(confirm("Are you sure you want to restart the system?")) {
            window.location.reload();
        }
        return;
    }

    if (action === 'logout') {
        if(confirm("Are you sure you want to log out of Spotify?")) {
            logout();
        }
        return;
    }
    
    if (action === 'run') {
        const cmd = prompt("Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.\nOpen:");
        if (!cmd) return;
        
        const lower = cmd.toLowerCase().trim();
        if (lower === 'calc' || lower === 'calculator') alert("🧮 Calculator is not installed.");
        else if (lower === 'notepad') alert("📝 Notepad is not installed.");
        else if (lower === 'matrix') {
            document.documentElement.setAttribute('data-theme', 'matrix');
            alert("Follow the white rabbit. 🐇");
        }
        else if (lower === 'classic' || lower === 'reset') {
            document.documentElement.setAttribute('data-theme', 'classic');
        }
        else if (lower === 'vaporwave') {
            document.documentElement.setAttribute('data-theme', 'vaporwave');
        }
        else if (lower.startsWith('http')) {
            window.open(lower, '_blank');
        }
        else {
            alert(`Cannot find file '${cmd}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.`);
        }
        return;
    }

    // Window Launch Logic
    const existing = windows.find(w => w.type === action);
    if (existing) {
      if (existing.minimized) restoreWindow(existing.id);
      focusWindow(existing.id);
    } else {
      const config = {
          [WINDOW_TYPES.PLAYER]: { title: 'Retro Spotify Player', width: 600, height: 500 },
          [WINDOW_TYPES.PLAYLIST]: { title: 'Playlist Browser', width: 500, height: 450 },
          [WINDOW_TYPES.SETTINGS]: { title: 'Settings', width: 400, height: 350 },
          [WINDOW_TYPES.ABOUT]: { title: 'About', width: 350, height: 300 },
      };
      
      if (config[action]) {
          createWindow({ type: action, ...config[action] });
      }
    }
  };

  // Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="win95-taskbar">
      
      {/* --- START MENU POPUP --- */}
      {startMenuOpen && (
        <div ref={startMenuRef} className="win95-raised" style={{
          position: 'absolute',
          bottom: '28px',
          left: '2px',
          width: '200px',
          display: 'flex',
          flexDirection: 'row',
          zIndex: 2147483647,
          padding: '2px',
          border: '2px solid #fff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          backgroundColor: '#c0c0c0'
        }}>
          {/* Side Banner */}
          <div style={{
            background: 'linear-gradient(180deg, #000080 0%, #1084d0 100%)',
            width: '25px',
            display: 'flex',
            alignItems: 'flex-end',
            paddingBottom: '5px'
          }}>
            <span style={{ 
                transform: 'rotate(-90deg)', 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: 'bold', 
                whiteSpace: 'nowrap',
                marginLeft: '-5px',
                marginBottom: '10px'
            }}>
                Windows 95
            </span>
          </div>

          {/* Menu Items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <MenuItem icon="🎵" label="Media Player" onClick={() => handleStartMenuClick(WINDOW_TYPES.PLAYER)} />
             <MenuItem icon="📁" label="My Playlists" onClick={() => handleStartMenuClick(WINDOW_TYPES.PLAYLIST)} />
             <MenuItem icon="⚙️" label="Settings" onClick={() => handleStartMenuClick(WINDOW_TYPES.SETTINGS)} />
             <MenuItem icon="❓" label="Help" onClick={() => handleStartMenuClick(WINDOW_TYPES.ABOUT)} />
             
             <div style={{ borderTop: '1px solid #808080', borderBottom: '1px solid #fff', margin: '4px 2px' }}></div>
             
             <MenuItem icon="💻" label="Run..." onClick={() => handleStartMenuClick('run')} />
             
             <div style={{ borderTop: '1px solid #808080', borderBottom: '1px solid #fff', margin: '4px 2px' }}></div>
             
             <MenuItem icon="🔓" label="Log Out..." onClick={() => handleStartMenuClick('logout')} />
             <div style={{ borderTop: '1px solid #808080', borderBottom: '1px solid #fff', margin: '4px 2px' }}></div>
             <MenuItem icon="🔄" label="Restart..." onClick={() => handleStartMenuClick('restart')} />
             <MenuItem icon="🔌" label="Shut Down..." onClick={() => handleStartMenuClick('shutdown')} />
          </div>
        </div>
      )}

      {/* --- START BUTTON --- */}
      <button 
        ref={startButtonRef}
        className={`win95-button win95-start-button ${startMenuOpen ? 'active' : ''}`} 
        onMouseDown={handleStartButton}
        style={{ 
            borderStyle: startMenuOpen ? 'inset' : 'outset',
            fontWeight: 'bold',
            fontStyle: 'italic'
        }}
      >
        <span style={{ fontSize: '16px', marginRight: '4px' }}>🪟</span>
        Start
      </button>

      <div className="win95-taskbar-divider" />
      
      {/* --- QUICK LAUNCH --- */}
      <button
        className="win95-taskbar-item"
        onClick={minimizeAll}
        title="Show Desktop"
        style={{
            minWidth: '24px',
            width: '24px',
            padding: '2px',
            justifyContent: 'center',
            flex: '0 0 auto',
            marginRight: '2px'
        }}
      >
        <span style={{ fontSize: '14px' }}>🖥️</span>
      </button>
      
      <div className="win95-taskbar-divider" />

      {/* --- OPEN WINDOWS --- */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: '2px' }}>
        {windows.map(window => (
          <button
            key={window.id}
            className={`win95-taskbar-item ${activeWindowId === window.id && !window.minimized ? 'active' : ''}`}
            onClick={() => handleTaskbarClick(window)}
            title={window.title}
            style={{
                flex: 1,
                maxWidth: '160px',
                textAlign: 'left',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderStyle: (activeWindowId === window.id && !window.minimized) ? 'inset' : 'outset',
                backgroundColor: (activeWindowId === window.id && !window.minimized) ? '#eeeeee' : '#c0c0c0', // Checker pattern sim
                backgroundImage: (activeWindowId === window.id && !window.minimized) 
                    ? 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==)' 
                    : 'none'
            }}
          >
            <span style={{ fontSize: '14px' }}>
              {window.type === WINDOW_TYPES.PLAYER ? '🎵' : 
               window.type === WINDOW_TYPES.SETTINGS ? '⚙️' : '📁'}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: (activeWindowId === window.id && !window.minimized) ? 'bold' : 'normal' }}>
              {window.title}
            </span>
          </button>
        ))}
      </div>

      <div className="win95-taskbar-divider" />

      {/* --- TRAY AREA --- */}
      <div className="win95-sunken" 
        title={time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        style={{
            padding: '2px 8px',
            fontSize: '11px',
            minWidth: '70px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#c0c0c0',
            cursor: 'default'
      }}>
        <img 
            src="https://win98icons.alexmeub.com/icons/png/loudspeaker_rays-0.png" 
            alt="vol" 
            style={{ width: '16px', height: '16px' }} 
        />
        <span>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// Helper
const MenuItem = ({ icon, label, onClick }) => (
    <div 
        className="win95-menu-item" 
        onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}
    >
        <span style={{ width: '20px', textAlign: 'center' }}>{icon}</span>
        <span>{label}</span>
    </div>
);

export default Taskbar;

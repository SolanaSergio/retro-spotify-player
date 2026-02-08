import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { WINDOW_TYPES } from '../contexts/WindowContext';

const DesktopIcon = ({ item, onOpenWindow }) => {
  const nodeRef = useRef(null);

  return (
    <Draggable nodeRef={nodeRef} bounds="parent">
      <div 
        ref={nodeRef}
        className="win95-desktop-icon"
        onDoubleClick={() => {
          if (item.action) item.action();
          else onOpenWindow(item.type);
        }}
        style={{ position: 'relative' }} // Ensure it works with Draggable
      >
        <div className="win95-desktop-icon-img" style={{
          fontSize: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {item.icon}
        </div>
        <div className="win95-desktop-label">
          {item.label}
        </div>
      </div>
    </Draggable>
  );
};

function Desktop({ onOpenWindow }) {
  const icons = [
    { 
      type: 'MY_COMPUTER', 
      label: 'My Computer',
      icon: '💻',
      action: () => alert("System: RetroOS 95\nMemory: 64MB RAM\nProcessor: React Virtual CPU"),
    },
    { 
      type: WINDOW_TYPES.PLAYER, 
      label: 'My Music',
      icon: '🎵',
    },
    { 
      type: WINDOW_TYPES.PLAYLIST, 
      label: 'Playlists',
      icon: '📁',
    },
    { 
      type: WINDOW_TYPES.SETTINGS, 
      label: 'Settings',
      icon: '⚙️',
    },
    { 
      type: WINDOW_TYPES.ABOUT, 
      label: 'About',
      icon: 'ℹ️',
    },
  ];

  return (
    <div className="win95-desktop">
      {icons.map((item) => (
        <DesktopIcon key={item.type} item={item} onOpenWindow={onOpenWindow} />
      ))}

      {/* Desktop Label */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        right: '10px',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        opacity: 0.7,
        pointerEvents: 'none'
      }}>
        Retro Spotify
      </div>
    </div>
  );
}

export default Desktop;

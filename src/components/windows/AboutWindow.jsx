import React from 'react';

function AboutWindow() {
  return (
    <div style={{ 
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      height: '100%',
    }}>
      {/* Logo/Icon */}
      <div style={{ 
        width: '64px', 
        height: '64px',
        backgroundColor: '#008080',
        border: '2px solid',
        borderColor: '#ffffff #808080 #808080 #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        marginBottom: '16px',
      }}>
        🎵
      </div>

      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
        Retro Spotify Player
      </div>

      <div style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>
        Version 1.0.0
      </div>

      <div style={{ 
        fontSize: '11px',
        lineHeight: '1.6',
        marginBottom: '16px',
        maxWidth: '280px',
      }}>
        A nostalgic desktop music player inspired by classic Microsoft Windows 
        (95/98/XP era) that streams music through Spotify.
      </div>

      <div style={{ 
        borderTop: '1px solid #808080',
        borderBottom: '1px solid #ffffff',
        width: '100%',
        margin: '8px 0',
      }} />

      <div style={{ 
        fontSize: '10px',
        color: '#666',
        marginBottom: '8px',
      }}>
        <strong>Credits:</strong>
      </div>

      <div style={{ 
        fontSize: '10px',
        lineHeight: '1.5',
        color: '#666',
      }}>
        <div>Powered by Spotify Web API</div>
        <div>Built with React & Vite</div>
        <div style={{ marginTop: '8px' }}>
          © 2026 Retro Spotify Player
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button 
          className="win95-button"
          onClick={() => window.open('https://developer.spotify.com/documentation/web-playback-sdk/', '_blank')}
        >
          Spotify SDK Documentation
        </button>
      </div>
    </div>
  );
}

export default AboutWindow;

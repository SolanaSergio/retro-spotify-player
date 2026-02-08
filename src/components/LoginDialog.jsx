import React from 'react';
import { useSpotify } from '../contexts/SpotifyContext';

function LoginDialog() {
  const { login } = useSpotify();

  return (
    <div className="win95-dialog-overlay">
      <div className="win95-dialog" style={{ minWidth: '400px' }}>
        {/* Title Bar */}
        <div className="win95-title-bar">
          <div className="win95-title-text">
            <span>🎵</span>
            <span>Connect to Spotify</span>
          </div>
        </div>

        {/* Content */}
        <div className="win95-dialog-content" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Icon */}
            <div style={{
              fontSize: '48px',
              display: 'flex',
              alignItems: 'flex-start',
            }}>
              🔐
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 'bold',
                marginBottom: '12px',
              }}>
                Authentication Required
              </div>
              
              <div style={{ 
                fontSize: '11px',
                lineHeight: '1.5',
                marginBottom: '16px',
              }}>
                To use Retro Spotify Player, you need to connect your Spotify account. 
                This application requires a Spotify Premium subscription for playback.
              </div>

              <div style={{
                backgroundColor: '#ffffcc',
                border: '1px solid #cccc00',
                padding: '8px',
                fontSize: '10px',
                marginBottom: '16px',
              }}>
                <strong>Note:</strong> You will be redirected to Spotify to authorize this application.
              </div>

              <div style={{
                fontSize: '10px',
                color: '#666',
                marginTop: '8px',
              }}>
                Required permissions:
                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                  <li>Stream music</li>
                  <li>Read your playlists</li>
                  <li>Control playback</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="win95-dialog-buttons">
          <button className="win95-button" onClick={login}>
            Connect to Spotify
          </button>
          <button 
            className="win95-button" 
            onClick={() => window.open('https://www.spotify.com/premium/', '_blank')}
          >
            Get Premium
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginDialog;

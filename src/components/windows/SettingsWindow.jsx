import React, { useState, useEffect } from 'react';

function SettingsWindow() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualizerEnabled, setVisualizerEnabled] = useState(false);
  const [theme, setTheme] = useState('classic');

  useEffect(() => {
    // Load settings from localStorage
    const savedSound = localStorage.getItem('retro_player_sound_enabled');
    const savedVisualizer = localStorage.getItem('retro_player_visualizer_enabled');
    const savedTheme = localStorage.getItem('retro_player_theme');
    
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    if (savedVisualizer !== null) setVisualizerEnabled(savedVisualizer === 'true');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('retro_player_sound_enabled', soundEnabled);
    localStorage.setItem('retro_player_visualizer_enabled', visualizerEnabled);
    localStorage.setItem('retro_player_theme', theme);
    
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', theme);
    
    // Show a simple alert (in retro style)
    alert('Settings saved!');
  };

  return (
    <div style={{ 
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: '100%',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
        Audio Settings
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
      }}>
        <input
          type="checkbox"
          className="win95-checkbox"
          id="soundEnabled"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
        />
        <label htmlFor="soundEnabled" style={{ cursor: 'pointer' }}>
          Enable UI sounds
        </label>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
      }}>
        <input
          type="checkbox"
          className="win95-checkbox"
          id="visualizerEnabled"
          checked={visualizerEnabled}
          onChange={(e) => setVisualizerEnabled(e.target.checked)}
        />
        <label htmlFor="visualizerEnabled" style={{ cursor: 'pointer' }}>
          Show visualizer window
        </label>
      </div>

      <div style={{ 
        borderTop: '1px solid #808080',
        borderBottom: '1px solid #ffffff',
        margin: '8px 0',
      }} />

      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
        Appearance
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px' }}>Theme:</label>
        <select 
          className="win95-input"
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value);
            document.documentElement.setAttribute('data-theme', e.target.value);
          }}
          style={{ width: '150px' }}
        >
          <option value="classic">Windows 95/98</option>
          <option value="matrix">The Matrix</option>
          <option value="vaporwave">Vaporwave</option>
          <option value="hotdog">Hot Dog Stand</option>
        </select>
      </div>

      <div style={{ 
        borderTop: '1px solid #808080',
        borderBottom: '1px solid #ffffff',
        margin: '8px 0',
      }} />

      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
        Keyboard Shortcuts
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        gap: '8px',
        fontSize: '11px',
      }}>
        <span style={{ fontWeight: 'bold' }}>Space</span>
        <span>Play / Pause</span>
        <span style={{ fontWeight: 'bold' }}>→</span>
        <span>Next track</span>
        <span style={{ fontWeight: 'bold' }}>←</span>
        <span>Previous track</span>
        <span style={{ fontWeight: 'bold' }}>↑</span>
        <span>Volume up</span>
        <span style={{ fontWeight: 'bold' }}>↓</span>
        <span>Volume down</span>
      </div>

      <div style={{ marginTop: 'auto', textAlign: 'right' }}>
        <button className="win95-button" onClick={saveSettings}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default SettingsWindow;

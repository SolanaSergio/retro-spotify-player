import React, { useState, useEffect } from 'react';

function BootScreen() {
  const [bootText, setBootText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const bootMessages = [
    'Retro Spotify Player [Version 1.0.0]',
    '(C) Copyright 2026 Retro Player Corp.',
    '',
    'BIOS Date: 01/06/26 14:22:51 Ver 1.0.0',
    'CPU: React Virtual CPU at 3000MHz',
    'Memory Test: 640K OK',
    '',
    'Detecting Spotify Web Playback SDK...',
    'Initializing audio subsystem...',
    'Loading user preferences...',
    'Starting Windows...',
    '',
    'Starting Retro Spotify Player...',
  ];

  useEffect(() => {
    let currentLine = 0;
    let currentChar = 0;
    let text = '';

    const typeInterval = setInterval(() => {
      if (currentLine < bootMessages.length) {
        const line = bootMessages[currentLine];
        
        if (currentChar < line.length) {
          text += line[currentChar];
          currentChar++;
        } else {
          text += '\n';
          currentLine++;
          currentChar = 0;
        }
        
        setBootText(text);
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    // Blink cursor
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div className="win95-boot-screen">
      <div className="win95-boot-text">
        {bootText}
        {showCursor && <span className="win95-cursor" />}
      </div>
    </div>
  );
}

export default BootScreen;

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useWindows } from '../contexts/WindowContext';

function Window({ 
  id, 
  title, 
  icon, 
  children, 
  width = 400, 
  height = 300, 
  x = 50, 
  y = 50,
  minWidth = 200,
  minHeight = 150,
  resizable = true,
  showMenuBar = false,
  menuItems = [],
  zIndex,
  isActive,
  isMinimized,
  onFocus,
  onClose,
  onMinimize,
  onUpdatePosition,
  onUpdateSize,
}) {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [resizeStart, setResizeStart] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setCurrentWidth(width);
    setCurrentHeight(height);
  }, [width, height]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    onFocus();
  }, [onFocus]);

  const handleDragStop = useCallback((e, data) => {
    setIsDragging(false);
    onUpdatePosition(data.x, data.y);
  }, [onUpdatePosition]);

  const handleMouseDown = useCallback(() => {
    if (!isActive) {
      onFocus();
    }
  }, [isActive, onFocus]);

  // Resize handlers
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: currentWidth,
      height: currentHeight,
    });
    onFocus();
  }, [currentWidth, currentHeight, onFocus]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizeStart) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(minWidth, resizeStart.width + deltaX);
    const newHeight = Math.max(minHeight, resizeStart.height + deltaY);
    
    setCurrentWidth(newWidth);
    setCurrentHeight(newHeight);
  }, [isResizing, resizeStart, minWidth, minHeight]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      onUpdateSize(currentWidth, currentHeight);
    }
  }, [isResizing, currentWidth, currentHeight, onUpdateSize]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Handle menu clicks
  const handleMenuClick = (action) => {
    setShowMenu(false);
    if (action) action();
  };

  if (isMinimized) return null;

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".win95-title-bar"
      defaultPosition={{ x, y }}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={isResizing}
    >
      <div
        ref={nodeRef}
        className={`win95-window ${isActive ? '' : 'inactive'}`}
        style={{
          width: currentWidth,
          height: currentHeight,
          zIndex,
          cursor: isResizing ? 'se-resize' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Title Bar */}
        <div className="win95-title-bar">
          <div className="win95-title-text">
            {icon && <span className="win95-title-icon">{icon}</span>}
            <span>{title}</span>
          </div>
          <div className="win95-window-controls">
            <button 
              className="win95-window-btn" 
              onClick={onMinimize}
              title="Minimize"
            >
              _
            </button>
            <button 
              className="win95-window-btn" 
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Menu Bar */}
        {showMenuBar && menuItems.length > 0 && (
          <div className="win95-menu-bar">
            {menuItems.map((item, index) => (
              <div 
                key={index}
                className="win95-menu-item"
                onClick={() => handleMenuClick(item.action)}
                style={{ position: 'relative' }}
              >
                <span style={{ textDecoration: 'underline' }}>{item.label[0]}</span>
                {item.label.slice(1)}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div 
          className="win95-sunken"
          style={{
            flex: 1,
            margin: '2px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>

        {/* Resize Handle */}
        {resizable && (
          <div
            className="win95-resize-handle"
            onMouseDown={handleResizeStart}
            style={{ cursor: 'se-resize' }}
          />
        )}
      </div>
    </Draggable>
  );
}

export default Window;

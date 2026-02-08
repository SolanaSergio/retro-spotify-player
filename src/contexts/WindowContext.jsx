import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Window types
export const WINDOW_TYPES = {
  PLAYER: 'player',
  PLAYLIST: 'playlist',
  SETTINGS: 'settings',
  ABOUT: 'about',
  VISUALIZER: 'visualizer',
};

// Initial state
const initialState = {
  windows: [],
  activeWindowId: null,
  nextZIndex: 100,
  minimizedWindows: [],
};

// Action types
const ACTIONS = {
  CREATE_WINDOW: 'CREATE_WINDOW',
  CLOSE_WINDOW: 'CLOSE_WINDOW',
  FOCUS_WINDOW: 'FOCUS_WINDOW',
  MINIMIZE_WINDOW: 'MINIMIZE_WINDOW',
  RESTORE_WINDOW: 'RESTORE_WINDOW',
  UPDATE_WINDOW_POSITION: 'UPDATE_WINDOW_POSITION',
  UPDATE_WINDOW_SIZE: 'UPDATE_WINDOW_SIZE',
  MINIMIZE_ALL: 'MINIMIZE_ALL',
};

// Reducer
function windowReducer(state, action) {
  switch (action.type) {
    case ACTIONS.CREATE_WINDOW: {
      const newWindow = {
        id: action.payload.id || `window-${Date.now()}`,
        type: action.payload.type,
        title: action.payload.title,
        x: action.payload.x || 50,
        y: action.payload.y || 50,
        width: action.payload.width || 400,
        height: action.payload.height || 300,
        zIndex: state.nextZIndex,
        minimized: false,
        maximized: false,
        data: action.payload.data || null,
      };
      
      return {
        ...state,
        windows: [...state.windows, newWindow],
        activeWindowId: newWindow.id,
        nextZIndex: state.nextZIndex + 1,
      };
    }
    
    case ACTIONS.CLOSE_WINDOW:
      return {
        ...state,
        windows: state.windows.filter(w => w.id !== action.payload.id),
        activeWindowId: state.activeWindowId === action.payload.id 
          ? state.windows.filter(w => w.id !== action.payload.id).slice(-1)[0]?.id || null
          : state.activeWindowId,
      };
    
    case ACTIONS.FOCUS_WINDOW:
      if (state.activeWindowId === action.payload.id) return state;
      
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload.id
            ? { ...w, zIndex: state.nextZIndex, minimized: false }
            : w
        ),
        activeWindowId: action.payload.id,
        nextZIndex: state.nextZIndex + 1,
      };
    
    case ACTIONS.MINIMIZE_WINDOW:
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload.id
            ? { ...w, minimized: true }
            : w
        ),
        activeWindowId: state.activeWindowId === action.payload.id
          ? state.windows.find(w => w.id !== action.payload.id && !w.minimized)?.id || null
          : state.activeWindowId,
      };
    
    case ACTIONS.RESTORE_WINDOW:
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload.id
            ? { ...w, minimized: false, zIndex: state.nextZIndex }
            : w
        ),
        activeWindowId: action.payload.id,
        nextZIndex: state.nextZIndex + 1,
      };
    
    case ACTIONS.UPDATE_WINDOW_POSITION:
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload.id
            ? { ...w, x: action.payload.x, y: action.payload.y }
            : w
        ),
      };
    
    case ACTIONS.UPDATE_WINDOW_SIZE:
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload.id
            ? { ...w, width: action.payload.width, height: action.payload.height }
            : w
        ),
      };

    case ACTIONS.MINIMIZE_ALL:
      return {
        ...state,
        windows: state.windows.map(w => ({ ...w, minimized: true })),
        activeWindowId: null,
      };
    
    default:
      return state;
  }
}

// Context
const WindowContext = createContext();

// Provider
export function WindowProvider({ children }) {
  const [state, dispatch] = useReducer(windowReducer, initialState);
  
  const createWindow = useCallback((config) => {
    dispatch({ type: ACTIONS.CREATE_WINDOW, payload: config });
  }, []);
  
  const closeWindow = useCallback((id) => {
    dispatch({ type: ACTIONS.CLOSE_WINDOW, payload: { id } });
  }, []);
  
  const focusWindow = useCallback((id) => {
    dispatch({ type: ACTIONS.FOCUS_WINDOW, payload: { id } });
  }, []);
  
  const minimizeWindow = useCallback((id) => {
    dispatch({ type: ACTIONS.MINIMIZE_WINDOW, payload: { id } });
  }, []);
  
  const restoreWindow = useCallback((id) => {
    dispatch({ type: ACTIONS.RESTORE_WINDOW, payload: { id } });
  }, []);
  
  const updateWindowPosition = useCallback((id, x, y) => {
    dispatch({ type: ACTIONS.UPDATE_WINDOW_POSITION, payload: { id, x, y } });
  }, []);
  
  const updateWindowSize = useCallback((id, width, height) => {
    dispatch({ type: ACTIONS.UPDATE_WINDOW_SIZE, payload: { id, width, height } });
  }, []);

  const minimizeAll = useCallback(() => {
    dispatch({ type: ACTIONS.MINIMIZE_ALL });
  }, []);
  
  const value = {
    windows: state.windows,
    activeWindowId: state.activeWindowId,
    createWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    updateWindowPosition,
    updateWindowSize,
    minimizeAll,
  };
  
  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
}

// Hook
export function useWindows() {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindows must be used within a WindowProvider');
  }
  return context;
}

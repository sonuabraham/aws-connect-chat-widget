import { useState, useCallback, useEffect, useRef } from 'react';
import type { WidgetConfig, WidgetState } from '../types/widget';
import type { VisitorInfo } from '../types/chat';
import { ChatStorage } from '../utils/storage';

/**
 * Widget position type
 */
export type WidgetPosition = {
  bottom: string;
  right?: string;
  left?: string;
};

/**
 * Widget preferences stored locally
 */
export interface WidgetPreferences {
  position: WidgetPosition;
  theme: string;
  minimized: boolean;
  soundEnabled: boolean;
}

/**
 * useWidget hook return type
 */
export interface UseWidgetReturn {
  // Widget state
  isOpen: boolean;
  isMinimized: boolean;
  widgetState: WidgetState;
  position: WidgetPosition;
  
  // Visitor management
  visitorInfo: VisitorInfo | null;
  hasVisitorInfo: boolean;
  
  // Widget actions
  openWidget: () => void;
  closeWidget: () => void;
  minimizeWidget: () => void;
  toggleWidget: () => void;
  
  // Visitor actions
  setVisitorInfo: (info: Omit<VisitorInfo, 'sessionId'>) => void;
  updateVisitorInfo: (updates: Partial<VisitorInfo>) => void;
  clearVisitorInfo: () => void;
  
  // Configuration
  updatePosition: (position: Partial<WidgetPosition>) => void;
  updatePreferences: (preferences: Partial<WidgetPreferences>) => void;
  
  // Session management
  sessionId: string | null;
  generateNewSession: () => string;
  
  // Persistence
  saveState: () => void;
  restoreState: () => void;
  clearAllData: () => void;
}

/**
 * Default widget preferences
 */
const defaultPreferences: WidgetPreferences = {
  position: {
    bottom: '20px',
    right: '20px',
  },
  theme: 'default',
  minimized: false,
  soundEnabled: true,
};

/**
 * Widget state management hook
 * Manages widget open/closed state, positioning, visitor information, and session management
 * Supports requirements 1.1, 1.2, 1.3, 2.1
 */
export const useWidget = (config?: WidgetConfig): UseWidgetReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [widgetState, setWidgetState] = useState<WidgetState>('closed');
  const [position, setPosition] = useState<WidgetPosition>(defaultPreferences.position);
  const [visitorInfo, setVisitorInfoState] = useState<VisitorInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<WidgetPreferences>(defaultPreferences);
  
  // Track if visitor has provided required information
  const hasVisitorInfo = Boolean(visitorInfo?.name);
  
  // Use ref to track initialization
  const initializedRef = useRef(false);

  /**
   * Open widget
   * Requirement 1.1: Display chat button and expand interface
   */
  const openWidget = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setWidgetState('initializing');
    
    // Save state
    const newPreferences = { ...preferences, minimized: false };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences]);

  /**
   * Close widget
   * Requirement 1.2: Close chat interface
   */
  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setWidgetState('closed');
    
    // Save state
    const newPreferences = { ...preferences, minimized: false };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences]);

  /**
   * Minimize widget
   * Requirement 1.4: Minimize widget while maintaining session
   */
  const minimizeWidget = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
    
    // Save state
    const newPreferences = { ...preferences, minimized: true };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences]);

  /**
   * Toggle widget open/closed state
   */
  const toggleWidget = useCallback(() => {
    if (isOpen || isMinimized) {
      closeWidget();
    } else {
      openWidget();
    }
  }, [isOpen, isMinimized, openWidget, closeWidget]);

  /**
   * Set visitor information
   * Requirement 2.1: Collect and manage visitor information
   */
  const setVisitorInfo = useCallback((info: Omit<VisitorInfo, 'sessionId'>) => {
    // Generate session ID if not exists
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = ChatStorage.generateSessionId();
      setSessionId(currentSessionId);
    }

    const fullVisitorInfo: VisitorInfo = {
      ...info,
      sessionId: currentSessionId,
    };

    setVisitorInfoState(fullVisitorInfo);
    ChatStorage.saveVisitorInfo(fullVisitorInfo);
  }, [sessionId]);

  /**
   * Update visitor information
   * Requirement 1.3: Update visitor preferences and information
   */
  const updateVisitorInfo = useCallback((updates: Partial<VisitorInfo>) => {
    if (!visitorInfo) {
      return;
    }

    const updatedInfo = { ...visitorInfo, ...updates };
    setVisitorInfoState(updatedInfo);
    ChatStorage.saveVisitorInfo(updatedInfo);
  }, [visitorInfo]);

  /**
   * Clear visitor information
   */
  const clearVisitorInfo = useCallback(() => {
    setVisitorInfoState(null);
    ChatStorage.clearVisitorInfo();
  }, []);

  /**
   * Update widget position
   * Requirement 6.1: Customizable positioning
   */
  const updatePosition = useCallback((newPosition: Partial<WidgetPosition>) => {
    const updatedPosition = { ...position, ...newPosition };
    setPosition(updatedPosition);
    
    const newPreferences = { ...preferences, position: updatedPosition };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [position, preferences]);

  /**
   * Update widget preferences
   */
  const updatePreferences = useCallback((newPreferences: Partial<WidgetPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
    
    // Update position if it changed
    if (newPreferences.position) {
      setPosition(newPreferences.position);
    }
    
    // Update minimized state if it changed
    if (newPreferences.minimized !== undefined) {
      setIsMinimized(newPreferences.minimized);
      if (newPreferences.minimized) {
        setIsOpen(false);
      }
    }
  }, [preferences]);

  /**
   * Generate new session ID
   * Requirement 2.1: Session ID generation and management
   */
  const generateNewSession = useCallback((): string => {
    const newSessionId = ChatStorage.generateSessionId();
    setSessionId(newSessionId);
    
    // Update visitor info with new session ID if exists
    if (visitorInfo) {
      const updatedVisitor = { ...visitorInfo, sessionId: newSessionId };
      setVisitorInfoState(updatedVisitor);
      ChatStorage.saveVisitorInfo(updatedVisitor);
    }
    
    return newSessionId;
  }, [visitorInfo]);

  /**
   * Save current state to localStorage
   */
  const saveState = useCallback(() => {
    savePreferences(preferences);
    if (visitorInfo) {
      ChatStorage.saveVisitorInfo(visitorInfo);
    }
  }, [preferences, visitorInfo]);

  /**
   * Restore state from localStorage
   * Requirement: Local storage for visitor preferences and chat history
   */
  const restoreState = useCallback(() => {
    // Restore preferences
    const savedPreferences = loadPreferences();
    if (savedPreferences) {
      setPreferences(savedPreferences);
      setPosition(savedPreferences.position);
      setIsMinimized(savedPreferences.minimized);
      
      // If was minimized, don't open but keep session
      if (savedPreferences.minimized) {
        setIsOpen(false);
        setIsMinimized(true);
      }
    }

    // Restore visitor info
    const savedVisitor = ChatStorage.loadVisitorInfo();
    if (savedVisitor) {
      setVisitorInfoState(savedVisitor);
      setSessionId(savedVisitor.sessionId);
    }

    // Restore session ID if no visitor info
    if (!savedVisitor) {
      const savedSessionId = ChatStorage.loadSessionId();
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    }

    // Check if there's an active chat session
    if (ChatStorage.hasActiveSession()) {
      setWidgetState('connected');
      // Don't auto-open, but show as available
    }
  }, []);

  /**
   * Clear all widget data
   */
  const clearAllData = useCallback(() => {
    ChatStorage.clearAll();
    clearPreferences();
    
    setVisitorInfoState(null);
    setSessionId(null);
    setPreferences(defaultPreferences);
    setPosition(defaultPreferences.position);
    setIsOpen(false);
    setIsMinimized(false);
    setWidgetState('closed');
  }, []);

  /**
   * Initialize widget state on mount
   */
  useEffect(() => {
    if (!initializedRef.current) {
      restoreState();
      initializedRef.current = true;
    }
  }, [restoreState]);

  /**
   * Update widget state based on open/minimized state
   */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (widgetState === 'closed') {
        setWidgetState('initializing');
      }
    } else if (isMinimized) {
      // Keep current state when minimized
    } else {
      setWidgetState('closed');
    }
  }, [isOpen, isMinimized, widgetState]);

  /**
   * Handle page unload to save state
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveState]);

  /**
   * Apply configuration changes
   */
  useEffect(() => {
    if (config?.ui?.position) {
      updatePosition(config.ui.position);
    }
  }, [config, updatePosition]);

  return {
    // Widget state
    isOpen,
    isMinimized,
    widgetState,
    position,
    
    // Visitor management
    visitorInfo,
    hasVisitorInfo,
    
    // Widget actions
    openWidget,
    closeWidget,
    minimizeWidget,
    toggleWidget,
    
    // Visitor actions
    setVisitorInfo,
    updateVisitorInfo,
    clearVisitorInfo,
    
    // Configuration
    updatePosition,
    updatePreferences,
    
    // Session management
    sessionId,
    generateNewSession,
    
    // Persistence
    saveState,
    restoreState,
    clearAllData,
  };
};

/**
 * Helper functions for preferences persistence
 */
const PREFERENCES_KEY = 'aws-connect-widget-preferences';

function savePreferences(preferences: WidgetPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save widget preferences:', error);
  }
}

function loadPreferences(): WidgetPreferences | null {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load widget preferences:', error);
    return null;
  }
}

function clearPreferences(): void {
  try {
    localStorage.removeItem(PREFERENCES_KEY);
  } catch (error) {
    console.warn('Failed to clear widget preferences:', error);
  }
}

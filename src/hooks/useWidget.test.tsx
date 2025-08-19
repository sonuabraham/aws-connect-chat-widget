import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWidget } from './useWidget';
import { ChatStorage } from '../utils/storage';

// Mock dependencies
vi.mock('../utils/storage');

describe('useWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Mock ChatStorage methods
    (ChatStorage.loadVisitorInfo as any).mockReturnValue(null);
    (ChatStorage.loadSessionId as any).mockReturnValue(null);
    (ChatStorage.hasActiveSession as any).mockReturnValue(false);
    (ChatStorage.generateSessionId as any).mockReturnValue('session-123');
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWidget());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isMinimized).toBe(false);
    expect(result.current.widgetState).toBe('closed');
    expect(result.current.visitorInfo).toBeNull();
    expect(result.current.hasVisitorInfo).toBe(false);
    expect(result.current.sessionId).toBeNull();
  });

  it('should open widget', () => {
    const { result } = renderHook(() => useWidget());

    act(() => {
      result.current.openWidget();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isMinimized).toBe(false);
    expect(result.current.widgetState).toBe('initializing');
  });

  it('should close widget', () => {
    const { result } = renderHook(() => useWidget());

    // Open first
    act(() => {
      result.current.openWidget();
    });

    // Then close
    act(() => {
      result.current.closeWidget();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isMinimized).toBe(false);
    expect(result.current.widgetState).toBe('closed');
  });

  it('should minimize widget', () => {
    const { result } = renderHook(() => useWidget());

    // Open first
    act(() => {
      result.current.openWidget();
    });

    // Then minimize
    act(() => {
      result.current.minimizeWidget();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isMinimized).toBe(true);
  });

  it('should toggle widget state', () => {
    const { result } = renderHook(() => useWidget());

    // Toggle to open
    act(() => {
      result.current.toggleWidget();
    });

    expect(result.current.isOpen).toBe(true);

    // Toggle to close
    act(() => {
      result.current.toggleWidget();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should set visitor information', () => {
    const { result } = renderHook(() => useWidget());

    act(() => {
      result.current.setVisitorInfo({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    expect(result.current.visitorInfo?.name).toBe('John Doe');
    expect(result.current.visitorInfo?.email).toBe('john@example.com');
    expect(result.current.visitorInfo?.sessionId).toBe('session-123');
    expect(result.current.hasVisitorInfo).toBe(true);
    expect(ChatStorage.saveVisitorInfo).toHaveBeenCalled();
  });

  it('should update visitor information', () => {
    const { result } = renderHook(() => useWidget());

    // Set initial visitor info
    act(() => {
      result.current.setVisitorInfo({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    // Update visitor info
    act(() => {
      result.current.updateVisitorInfo({
        email: 'john.doe@example.com',
      });
    });

    expect(result.current.visitorInfo?.name).toBe('John Doe');
    expect(result.current.visitorInfo?.email).toBe('john.doe@example.com');
  });

  it('should clear visitor information', () => {
    const { result } = renderHook(() => useWidget());

    // Set visitor info first
    act(() => {
      result.current.setVisitorInfo({
        name: 'John Doe',
      });
    });

    // Clear visitor info
    act(() => {
      result.current.clearVisitorInfo();
    });

    expect(result.current.visitorInfo).toBeNull();
    expect(result.current.hasVisitorInfo).toBe(false);
    expect(ChatStorage.clearVisitorInfo).toHaveBeenCalled();
  });

  it('should update position', () => {
    const { result } = renderHook(() => useWidget());

    act(() => {
      result.current.updatePosition({
        bottom: '30px',
        left: '30px',
      });
    });

    expect(result.current.position.bottom).toBe('30px');
    expect(result.current.position.left).toBe('30px');
  });

  it('should generate new session', () => {
    const { result } = renderHook(() => useWidget());

    let newSessionId: string;
    act(() => {
      newSessionId = result.current.generateNewSession();
    });

    expect(newSessionId).toBe('session-123');
    expect(result.current.sessionId).toBe('session-123');
    expect(ChatStorage.generateSessionId).toHaveBeenCalled();
  });

  it('should restore state from storage', () => {
    const savedVisitor = {
      name: 'Saved User',
      sessionId: 'saved-session',
    };

    (ChatStorage.loadVisitorInfo as any).mockReturnValue(savedVisitor);
    (ChatStorage.hasActiveSession as any).mockReturnValue(true);

    const { result } = renderHook(() => useWidget());

    act(() => {
      result.current.restoreState();
    });

    expect(result.current.visitorInfo?.name).toBe('Saved User');
    expect(result.current.sessionId).toBe('saved-session');
    // Widget state changes are handled by useEffect, so we just check that visitor info is restored
    expect(result.current.visitorInfo).toBeDefined();
  });

  it('should clear all data', () => {
    const { result } = renderHook(() => useWidget());

    // Set some data first
    act(() => {
      result.current.setVisitorInfo({ name: 'Test User' });
      result.current.openWidget();
    });

    // Clear all data
    act(() => {
      result.current.clearAllData();
    });

    expect(result.current.visitorInfo).toBeNull();
    expect(result.current.sessionId).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.widgetState).toBe('closed');
    expect(ChatStorage.clearAll).toHaveBeenCalled();
  });
});
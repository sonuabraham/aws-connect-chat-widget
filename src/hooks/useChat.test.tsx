import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChat } from './useChat';
import { ConnectService } from '../services/ConnectService';
import { ChatStorage } from '../utils/storage';

// Mock dependencies
vi.mock('../services/ConnectService');
vi.mock('../utils/storage');

const mockConnectService = {
  initializeChat: vi.fn(),
  sendMessage: vi.fn(),
  endChat: vi.fn(),
  onMessageReceived: vi.fn(),
  onAgentStatusChange: vi.fn(),
  onConnectionStatusChange: vi.fn(),
  handleUserTyping: vi.fn(),
  stopUserTyping: vi.fn(),
} as unknown as ConnectService;

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ChatStorage.loadChatState as any).mockReturnValue(null);
    (ChatStorage.loadVisitorInfo as any).mockReturnValue(null);
    (ChatStorage.hasActiveSession as any).mockReturnValue(false);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChat(mockConnectService));

    expect(result.current.chatState.status).toBe('closed');
    expect(result.current.chatState.messages).toEqual([]);
    expect(result.current.chatState.unreadCount).toBe(0);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should initialize chat successfully', async () => {
    const mockSession = {
      connectionToken: 'token',
      participantId: 'participant',
      participantToken: 'participant-token',
      websocketUrl: 'ws://test',
      startTime: new Date(),
    };

    (mockConnectService.initializeChat as any).mockResolvedValue(mockSession);
    (ChatStorage.generateSessionId as any).mockReturnValue('session-123');

    const { result } = renderHook(() => useChat(mockConnectService));

    await act(async () => {
      await result.current.initializeChat({ name: 'Test User', email: 'test@example.com' });
    });

    expect(result.current.chatState.status).toBe('connected');
    expect(result.current.chatState.session).toEqual(mockSession);
    expect(result.current.chatState.visitor.name).toBe('Test User');
    expect(result.current.isConnected).toBe(true);
  });

  it('should handle initialization error', async () => {
    const error = new Error('Connection failed');
    (mockConnectService.initializeChat as any).mockRejectedValue(error);

    const { result } = renderHook(() => useChat(mockConnectService));

    await act(async () => {
      try {
        await result.current.initializeChat({ name: 'Test User' });
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.chatState.status).toBe('ended');
    expect(result.current.chatState.error).toBeDefined();
  });

  it('should send message successfully', async () => {
    // Setup connected state
    const mockSession = {
      connectionToken: 'token',
      participantId: 'participant',
      participantToken: 'participant-token',
      websocketUrl: 'ws://test',
      startTime: new Date(),
    };

    (mockConnectService.initializeChat as any).mockResolvedValue(mockSession);
    (mockConnectService.sendMessage as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat(mockConnectService));

    // Initialize chat first
    await act(async () => {
      await result.current.initializeChat({ name: 'Test User' });
    });

    // Verify connected state
    expect(result.current.isConnected).toBe(true);

    // Send message
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(mockConnectService.sendMessage).toHaveBeenCalledWith('Hello');
    // Note: The message state update is optimistic and happens immediately
    expect(result.current.chatState.messages.length).toBeGreaterThan(0);
  });

  it('should mark messages as read', () => {
    const { result } = renderHook(() => useChat(mockConnectService));

    // Set unread count
    act(() => {
      result.current.chatState.unreadCount = 5;
    });

    act(() => {
      result.current.markMessagesAsRead();
    });

    expect(result.current.chatState.unreadCount).toBe(0);
  });

  it('should restore state from storage', () => {
    const savedState = {
      status: 'connected' as const,
      messages: [],
      unreadCount: 2,
      isTyping: false,
    };

    const savedVisitor = {
      name: 'Saved User',
      sessionId: 'saved-session',
    };

    (ChatStorage.loadChatState as any).mockReturnValue(savedState);
    (ChatStorage.loadVisitorInfo as any).mockReturnValue(savedVisitor);
    (ChatStorage.hasActiveSession as any).mockReturnValue(true);

    const { result } = renderHook(() => useChat(mockConnectService));

    expect(result.current.chatState.visitor.name).toBe('Saved User');
    expect(result.current.chatState.unreadCount).toBe(2);
  });
});
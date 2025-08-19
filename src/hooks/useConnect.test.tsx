import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConnect } from './useConnect';
import { ConnectService } from '../services/ConnectService';

// Mock ConnectService
vi.mock('../services/ConnectService');

const mockConfig = {
  region: 'us-east-1',
  instanceId: 'test-instance',
  contactFlowId: 'test-flow',
};

describe('useConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ConnectService as any).mockImplementation(() => ({
      onConnectionStatusChange: vi.fn(),
      endChat: vi.fn().mockResolvedValue(undefined),
      refreshConnectionToken: vi.fn().mockResolvedValue(undefined),
    }));
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useConnect());

    expect(result.current.connectService).toBeNull();
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('should initialize ConnectService successfully', async () => {
    const { result } = renderHook(() => useConnect());

    await act(async () => {
      await result.current.initialize(mockConfig);
    });

    expect(result.current.connectService).toBeDefined();
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(ConnectService).toHaveBeenCalledWith('us-east-1');
  });

  it('should handle initialization error', async () => {
    (ConnectService as any).mockImplementation(() => {
      throw new Error('Service creation failed');
    });

    const { result } = renderHook(() => useConnect());

    await act(async () => {
      try {
        await result.current.initialize(mockConfig);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.lastError).toBeDefined();
    expect(result.current.connectionStatus).toBe('failed');
    expect(result.current.isInitialized).toBe(false);
  });

  it('should reconnect successfully', async () => {
    const mockService = {
      onConnectionStatusChange: vi.fn(),
      endChat: vi.fn().mockResolvedValue(undefined),
      refreshConnectionToken: vi.fn().mockResolvedValue(undefined),
    };

    (ConnectService as any).mockImplementation(() => mockService);

    const { result } = renderHook(() => useConnect());

    // Initialize first
    await act(async () => {
      await result.current.initialize(mockConfig);
    });

    // Reconnect
    await act(async () => {
      await result.current.reconnect();
    });

    expect(mockService.refreshConnectionToken).toHaveBeenCalled();
    expect(result.current.connectionStatus).toBe('connected');
  });

  it('should disconnect successfully', async () => {
    const mockService = {
      onConnectionStatusChange: vi.fn(),
      endChat: vi.fn().mockResolvedValue(undefined),
      refreshConnectionToken: vi.fn().mockResolvedValue(undefined),
    };

    (ConnectService as any).mockImplementation(() => mockService);

    const { result } = renderHook(() => useConnect());

    // Initialize first
    await act(async () => {
      await result.current.initialize(mockConfig);
    });

    // Disconnect
    await act(async () => {
      await result.current.disconnect();
    });

    expect(mockService.endChat).toHaveBeenCalled();
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('should clear error', async () => {
    const { result } = renderHook(() => useConnect());

    // First cause an error by trying to initialize with invalid config
    (ConnectService as any).mockImplementation(() => {
      throw new Error('Test error');
    });

    await act(async () => {
      try {
        await result.current.initialize(mockConfig);
      } catch (error) {
        // Expected to throw
      }
    });

    // Verify error exists
    expect(result.current.lastError).toBeDefined();

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.lastError).toBeNull();
  });

  it('should return service instance', async () => {
    const { result } = renderHook(() => useConnect());

    await act(async () => {
      await result.current.initialize(mockConfig);
    });

    const service = result.current.getService();
    expect(service).toBeDefined();
    expect(service).toBe(result.current.connectService);
  });
});

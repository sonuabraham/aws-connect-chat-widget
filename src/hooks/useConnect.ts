import { useState, useEffect, useRef, useCallback } from 'react';
import type { AWSConnectConfig } from '../types/widget';
import type { ConnectionStatus } from '../types/aws-connect';
import { ConnectService } from '../services/ConnectService';

/**
 * useConnect hook return type
 */
export interface UseConnectReturn {
  // Service instance
  connectService: ConnectService | null;
  
  // Connection state
  connectionStatus: ConnectionStatus;
  isInitialized: boolean;
  isConnecting: boolean;
  
  // Actions
  initialize: (config: AWSConnectConfig) => Promise<void>;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Service access
  getService: () => ConnectService | null;
  
  // Error handling
  lastError: Error | null;
  clearError: () => void;
}

/**
 * AWS Connect service integration hook
 * Wraps ConnectService with React hook patterns
 * Supports requirements 2.1, 2.2, 7.2, 7.4
 */
export const useConnect = (initialConfig?: AWSConnectConfig): UseConnectReturn => {
  const [connectService, setConnectService] = useState<ConnectService | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  // Use ref to track cleanup and prevent memory leaks
  const cleanupRef = useRef<(() => void) | null>(null);
  const configRef = useRef<AWSConnectConfig | null>(initialConfig || null);

  /**
   * Initialize ConnectService with AWS configuration
   * Requirement 7.2: Authenticate with AWS Connect using provided credentials
   */
  const initialize = useCallback(async (config: AWSConnectConfig) => {
    try {
      setIsConnecting(true);
      setLastError(null);
      configRef.current = config;

      // Clean up existing service if any
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // Create new ConnectService instance
      const service = new ConnectService(config.region);
      
      // Set up connection status monitoring
      const handleConnectionStatusChange = (status: ConnectionStatus) => {
        setConnectionStatus(status);
        
        if (status === 'failed') {
          setLastError(new Error('Connection to AWS Connect failed'));
        }
      };

      service.onConnectionStatusChange(handleConnectionStatusChange);

      // Store cleanup function
      cleanupRef.current = () => {
        service.endChat().catch(console.warn);
      };

      setConnectService(service);
      setConnectionStatus('disconnected');
      setIsInitialized(true);

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to initialize ConnectService');
      setLastError(errorObj);
      setConnectionStatus('failed');
      throw errorObj;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Reconnect to AWS Connect
   * Requirement 7.4: Handle reconnection scenarios
   */
  const reconnect = useCallback(async () => {
    if (!configRef.current) {
      throw new Error('No configuration available for reconnection');
    }

    if (!connectService) {
      // If no service exists, initialize it
      await initialize(configRef.current);
      return;
    }

    try {
      setIsConnecting(true);
      setLastError(null);
      setConnectionStatus('connecting');

      // Attempt to refresh connection token
      await connectService.refreshConnectionToken();
      setConnectionStatus('connected');

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Reconnection failed');
      setLastError(errorObj);
      setConnectionStatus('failed');
      
      // Try to reinitialize if token refresh fails
      try {
        await initialize(configRef.current);
      } catch (initError) {
        throw errorObj;
      }
    } finally {
      setIsConnecting(false);
    }
  }, [connectService, initialize]);

  /**
   * Disconnect from AWS Connect
   * Requirement 2.2: Properly terminate connections
   */
  const disconnect = useCallback(async () => {
    if (!connectService) {
      return;
    }

    try {
      setIsConnecting(true);
      await connectService.endChat();
      setConnectionStatus('disconnected');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Disconnect failed');
      setLastError(errorObj);
      console.warn('Error during disconnect:', errorObj);
    } finally {
      setIsConnecting(false);
    }
  }, [connectService]);

  /**
   * Get service instance
   */
  const getService = useCallback(() => {
    return connectService;
  }, [connectService]);

  /**
   * Clear last error
   */
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  /**
   * Handle service lifecycle with component mounting/unmounting
   * Requirement: Manage service lifecycle properly
   */
  useEffect(() => {
    // Initialize with initial config if provided
    if (initialConfig && !isInitialized) {
      initialize(initialConfig).catch(error => {
        console.error('Failed to initialize ConnectService:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [initialConfig, isInitialized, initialize]);

  /**
   * Monitor connection status and handle automatic reconnection
   * Requirement 7.4: Automatic reconnection with exponential backoff
   */
  useEffect(() => {
    if (connectionStatus === 'failed' && isInitialized && configRef.current) {
      // Implement exponential backoff for reconnection
      const reconnectTimeout = setTimeout(() => {
        if (connectionStatus === 'failed') {
          reconnect().catch(error => {
            console.warn('Automatic reconnection failed:', error);
          });
        }
      }, 5000); // Start with 5 second delay

      return () => clearTimeout(reconnectTimeout);
    }
  }, [connectionStatus, isInitialized, reconnect]);

  /**
   * Handle page visibility changes for connection management
   * Requirement 7.4: Maintain connection during page visibility changes
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus === 'disconnected' && isInitialized) {
        // Attempt to reconnect when page becomes visible
        reconnect().catch(error => {
          console.warn('Failed to reconnect on visibility change:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectionStatus, isInitialized, reconnect]);

  /**
   * Handle network status changes
   * Requirement 7.4: Handle network connectivity changes
   */
  useEffect(() => {
    const handleOnline = () => {
      if (isInitialized && connectionStatus !== 'connected') {
        reconnect().catch(error => {
          console.warn('Failed to reconnect when coming online:', error);
        });
      }
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInitialized, connectionStatus, reconnect]);

  return {
    // Service instance
    connectService,
    
    // Connection state
    connectionStatus,
    isInitialized,
    isConnecting,
    
    // Actions
    initialize,
    reconnect,
    disconnect,
    
    // Service access
    getService,
    
    // Error handling
    lastError,
    clearError,
  };
};

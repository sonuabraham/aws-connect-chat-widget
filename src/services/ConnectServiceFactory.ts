import { ConnectService } from './ConnectService';
import type { ConnectService as IConnectService } from '../types/aws-connect';

/**
 * Configuration for AWS Connect service
 */
export interface ConnectServiceConfig {
  region: string;
  instanceId: string;
  contactFlowId: string;
  apiGatewayEndpoint?: string; // For backend integration
}

/**
 * Factory for creating ConnectService instances
 * Supports requirement 7.1: Provide configuration options for AWS Connect
 */
export class ConnectServiceFactory {
  /**
   * Create a new ConnectService instance with the provided configuration
   */
  static create(config: ConnectServiceConfig): IConnectService {
    return new ConnectService(config.region);
  }

  /**
   * Validate the provided configuration
   */
  static validateConfig(config: ConnectServiceConfig): void {
    if (!config.region) {
      throw new Error('AWS region is required');
    }

    if (!config.instanceId) {
      throw new Error('AWS Connect instance ID is required');
    }

    if (!config.contactFlowId) {
      throw new Error('AWS Connect contact flow ID is required');
    }

    // Validate region format
    const regionPattern = /^[a-z0-9-]+$/;
    if (!regionPattern.test(config.region)) {
      throw new Error('Invalid AWS region format');
    }

    // Validate instance ID format (UUID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(config.instanceId)) {
      throw new Error('Invalid AWS Connect instance ID format');
    }

    // Validate contact flow ID format (UUID)
    if (!uuidPattern.test(config.contactFlowId)) {
      throw new Error('Invalid AWS Connect contact flow ID format');
    }
  }
}
import { describe, it, expect, vi } from 'vitest';
import { ConnectServiceFactory, type ConnectServiceConfig } from './ConnectServiceFactory';
import { ConnectService } from './ConnectService';

vi.mock('./ConnectService');

describe('ConnectServiceFactory', () => {
  const validConfig: ConnectServiceConfig = {
    region: 'us-east-1',
    instanceId: '12345678-1234-1234-1234-123456789012',
    contactFlowId: '87654321-4321-4321-4321-210987654321',
    apiGatewayEndpoint: 'https://api.example.com',
  };

  describe('create', () => {
    it('should create ConnectService instance', () => {
      const service = ConnectServiceFactory.create(validConfig);
      
      expect(ConnectService).toHaveBeenCalledWith(validConfig.region);
      expect(service).toBeDefined();
    });
  });

  describe('validateConfig', () => {
    it('should validate valid configuration', () => {
      expect(() => ConnectServiceFactory.validateConfig(validConfig)).not.toThrow();
    });

    it('should throw error for missing region', () => {
      const config = { ...validConfig, region: '' };
      
      expect(() => ConnectServiceFactory.validateConfig(config))
        .toThrow('AWS region is required');
    });

    it('should throw error for missing instanceId', () => {
      const config = { ...validConfig, instanceId: '' };
      
      expect(() => ConnectServiceFactory.validateConfig(config))
        .toThrow('AWS Connect instance ID is required');
    });

    it('should throw error for missing contactFlowId', () => {
      const config = { ...validConfig, contactFlowId: '' };
      
      expect(() => ConnectServiceFactory.validateConfig(config))
        .toThrow('AWS Connect contact flow ID is required');
    });

    it('should throw error for invalid region format', () => {
      const config = { ...validConfig, region: 'INVALID_REGION!' };
      
      expect(() => ConnectServiceFactory.validateConfig(config))
        .toThrow('Invalid AWS region format');
    });

    it('should throw error for invalid instanceId format', () => {
      const config = { ...validConfig, instanceId: 'invalid-uuid' };
      
      expect(() => ConnectServiceFactory.validateConfig(config))
        .toThrow('Invalid AWS Connect instance ID format');
    });

    it('should throw error for invalid contactFlowId format', () => {
      const config = { ...validConfig, contactFlowId: 'invalid-uuid' };
      
      expect(() => ConnectServiceFactory.validateConfig(config))
        .toThrow('Invalid AWS Connect contact flow ID format');
    });

    it('should accept valid region formats', () => {
      const validRegions = ['us-east-1', 'eu-west-1', 'ap-southeast-2'];
      
      validRegions.forEach(region => {
        const config = { ...validConfig, region };
        expect(() => ConnectServiceFactory.validateConfig(config)).not.toThrow();
      });
    });

    it('should accept valid UUID formats', () => {
      const validUUIDs = [
        '12345678-1234-1234-1234-123456789012',
        'abcdef12-3456-7890-abcd-ef1234567890',
        'ABCDEF12-3456-7890-ABCD-EF1234567890',
      ];
      
      validUUIDs.forEach(uuid => {
        const config = { ...validConfig, instanceId: uuid, contactFlowId: uuid };
        expect(() => ConnectServiceFactory.validateConfig(config)).not.toThrow();
      });
    });
  });
});
/**
 * UMD Entry Point for AWS Connect Chat Widget
 * This file is specifically designed for UMD builds to ensure proper global assignment
 */

import { initializeWidget, type WidgetConfig } from './widget-simple';

// Create the global API object
const AWSConnectChatWidget = {
  init: initializeWidget,
  version: '1.0.0',
};

// Assign to window for browser environments
if (typeof window !== 'undefined') {
  (window as any).AWSConnectChatWidget = AWSConnectChatWidget;
}

// Export for UMD
export default AWSConnectChatWidget;
export { initializeWidget as init };
export const version = '1.0.0';
export type { WidgetConfig };
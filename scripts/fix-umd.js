#!/usr/bin/env node

/**
 * Post-build script to fix UMD export issues
 * This script modifies the generated UMD file to ensure proper global assignment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UMD_FILE = path.join(__dirname, '../dist/widget/aws-connect-chat-widget.umd.js');

console.log('🔧 Fixing UMD export...');

try {
    // Read the UMD file
    let umdContent = fs.readFileSync(UMD_FILE, 'utf8');

    console.log(`📁 UMD file size: ${(umdContent.length / 1024).toFixed(1)}KB`);

    // Check if it already has the fix
    if (umdContent.includes('window.AWSConnectChatWidget={init:')) {
        console.log('✅ UMD file already has the correct export');
        process.exit(0);
    }

    // Find the end of the UMD wrapper (before the closing })(this,function...)
    const umdWrapperEnd = umdContent.lastIndexOf('});');

    if (umdWrapperEnd === -1) {
        throw new Error('Could not find UMD wrapper end');
    }

    // Insert our global assignment before the wrapper closes
    const globalAssignment = `
// Global assignment for browser environments - Enhanced Debug Version
if (typeof window !== 'undefined') {
  console.log('🔧 UMD Fix: Window detected, checking for AWSConnectChatWidget...');
  console.log('🔧 UMD Fix: window.AWSConnectChatWidget exists:', !!window.AWSConnectChatWidget);
  console.log('🔧 UMD Fix: Exports object e:', typeof e, Object.keys(e || {}));
  
  if (window.AWSConnectChatWidget) {
    // Try multiple ways to find the init function
    const initFn = e.initializeWidget || e.init || e.default?.init || e.default?.initializeWidget;
    const versionStr = e.version || e.default?.version || '1.0.0';
    
    console.log('🔧 UMD Fix: Found initFn:', typeof initFn);
    console.log('🔧 UMD Fix: Found version:', versionStr);
    
    if (initFn && typeof initFn === 'function') {
      window.AWSConnectChatWidget.init = initFn;
      window.AWSConnectChatWidget.version = versionStr;
      console.log('✅ AWS Connect Chat Widget initialized from UMD fix');
    } else {
      console.log('❌ UMD Fix: Could not find init function');
      // Try to find any function in exports
      const allFunctions = Object.keys(e || {}).filter(key => typeof e[key] === 'function');
      console.log('🔧 UMD Fix: Available functions:', allFunctions);
    }
  } else {
    console.log('❌ UMD Fix: window.AWSConnectChatWidget not found');
  }
}
`;

    // Insert the assignment
    const fixedContent = umdContent.slice(0, umdWrapperEnd) + globalAssignment + umdContent.slice(umdWrapperEnd);

    // Write the fixed file
    fs.writeFileSync(UMD_FILE, fixedContent);

    console.log('✅ UMD file fixed successfully');
    console.log(`📁 New file size: ${(fixedContent.length / 1024).toFixed(1)}KB`);

} catch (error) {
    console.error('❌ Failed to fix UMD file:', error.message);
    process.exit(1);
}
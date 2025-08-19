#!/usr/bin/env node

/**
 * Build script for creating embeddable widget bundle
 * Generates production-ready files for CDN distribution
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const WIDGET_DIR = path.join(DIST_DIR, 'widget');

console.log('🚀 Building AWS Connect Chat Widget...\n');

try {
    // Build library bundle
    console.log('📦 Building library bundle...');
    execSync('npm run build:lib', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // Clean and create widget directory after build
    console.log('📁 Creating widget directory...');
    if (fs.existsSync(WIDGET_DIR)) {
        fs.rmSync(WIDGET_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(WIDGET_DIR, { recursive: true });
    console.log(`📁 Widget directory created: ${WIDGET_DIR}`);

    // Copy built files to widget directory
    console.log('📋 Copying built files...');
    console.log(`📁 Source directory: ${DIST_DIR}`);
    console.log(`📁 Target directory: ${WIDGET_DIR}`);
    console.log(`📁 Widget directory exists: ${fs.existsSync(WIDGET_DIR)}`);
    const distFiles = fs.readdirSync(DIST_DIR);
    console.log(`📁 Files in dist: ${distFiles.join(', ')}`);

    distFiles.forEach(file => {
        if (file.startsWith('aws-connect-chat-widget.') && !fs.statSync(path.join(DIST_DIR, file)).isDirectory()) {
            const srcPath = path.join(DIST_DIR, file);
            const destPath = path.join(WIDGET_DIR, file);
            try {
                fs.copyFileSync(srcPath, destPath);
                console.log(`  ✓ ${file}`);
            } catch (error) {
                console.error(`  ❌ Failed to copy ${file}:`, error.message);
            }
        }
    });

    // Copy integration script
    const integrationSrc = path.join(__dirname, '../public/integration.js');
    const integrationDest = path.join(WIDGET_DIR, 'integration.js');
    fs.copyFileSync(integrationSrc, integrationDest);
    console.log('  ✓ integration.js');

    // Copy example HTML
    const exampleSrc = path.join(__dirname, '../public/integration-example.html');
    const exampleDest = path.join(WIDGET_DIR, 'example.html');
    fs.copyFileSync(exampleSrc, exampleDest);
    console.log('  ✓ example.html');

    // Generate package info
    const packageInfo = {
        name: 'aws-connect-chat-widget',
        version: '1.0.0',
        description: 'Embeddable chat widget for AWS Connect',
        files: {
            'aws-connect-chat-widget.umd.js': 'UMD bundle for browser usage',
            'aws-connect-chat-widget.es.js': 'ES module bundle',
            'aws-connect-chat-widget.css': 'Widget styles',
            'integration.js': 'Simple integration script',
            'example.html': 'Integration example'
        },
        usage: {
            simple: '<script src="integration.js"></script>',
            advanced: 'See example.html for advanced usage'
        },
        cdn: {
            js: 'https://cdn.example.com/aws-connect-chat-widget.umd.js',
            css: 'https://cdn.example.com/aws-connect-chat-widget.css',
            integration: 'https://cdn.example.com/integration.js'
        }
    };

    fs.writeFileSync(
        path.join(WIDGET_DIR, 'package.json'),
        JSON.stringify(packageInfo, null, 2)
    );
    console.log('  ✓ package.json');

    // Generate README
    const readme = `# AWS Connect Chat Widget

Embeddable chat widget for AWS Connect contact centers.

## Quick Start

### Simple Integration
\`\`\`html
<script src="https://cdn.example.com/integration.js"></script>
\`\`\`

### Custom Configuration
\`\`\`html
<script>
window.AWSConnectChatWidgetAPI.init({
  aws: {
    region: 'us-east-1',
    instanceId: 'your-instance-id',
    contactFlowId: 'your-contact-flow-id',
    apiGatewayEndpoint: 'your-api-gateway-endpoint'
  },
  ui: {
    theme: {
      primaryColor: '#007bff'
    }
  }
});
</script>
\`\`\`

## Files

- \`aws-connect-chat-widget.umd.js\` - UMD bundle for browser usage
- \`aws-connect-chat-widget.es.js\` - ES module bundle  
- \`aws-connect-chat-widget.css\` - Widget styles
- \`integration.js\` - Simple integration script
- \`example.html\` - Complete integration example

## API

### AWSConnectChatWidgetAPI.init(config)
Initialize the widget with configuration.

### AWSConnectChatWidgetAPI.updateConfig(config)
Update widget configuration.

### AWSConnectChatWidgetAPI.getState()
Get current widget state.

### AWSConnectChatWidgetAPI.destroy()
Destroy the widget instance.

## Requirements

- Modern browser with ES6 support
- React 18+ (loaded automatically)
- Valid AWS Connect configuration

## Support

For issues and questions, please contact support.
`;

    fs.writeFileSync(path.join(WIDGET_DIR, 'README.md'), readme);
    console.log('  ✓ README.md');

    // Calculate file sizes
    console.log('\n📊 Bundle sizes:');
    const files = fs.readdirSync(WIDGET_DIR);
    files.forEach(file => {
        const filePath = path.join(WIDGET_DIR, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`  ${file}: ${sizeKB} KB`);
    });

    console.log('\n✅ Widget build completed successfully!');
    console.log(`📁 Output directory: ${WIDGET_DIR}`);
    console.log('🌐 Open example.html to test the integration');

} catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
}
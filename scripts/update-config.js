#!/usr/bin/env node

/**
 * Update widget configuration with deployment values
 * This script reads the deployment outputs and updates the widget configuration
 */

const fs = require('fs');
const path = require('path');

// Read deployment configuration from infrastructure
function readDeploymentConfig() {
    const configPath = path.join(__dirname, '../../aws-infrastructure/deployment-config.json');

    if (!fs.existsSync(configPath)) {
        console.error('❌ Deployment configuration not found at:', configPath);
        console.error('Please run the infrastructure deployment first.');
        process.exit(1);
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Update integration.js with actual values
function updateIntegrationScript(config) {
    const integrationPath = path.join(__dirname, '../src/integration.js');
    let content = fs.readFileSync(integrationPath, 'utf8');

    // Extract values from deployment config
    const apiEndpoint = config.outputs?.['ConnectChatWidget-development-ApiGateway']?.ApiEndpoint || 'YOUR_API_GATEWAY_URL';
    const cdnDomain = config.outputs?.['ConnectChatWidget-development-CDN']?.DistributionDomainName || 'YOUR_CDN_URL';
    const cdnUrl = `https://${cdnDomain}`;

    // Replace placeholders
    content = content.replace('YOUR_API_GATEWAY_URL', apiEndpoint);
    content = content.replace('YOUR_CDN_URL', cdnUrl);

    fs.writeFileSync(integrationPath, content);
    console.log('✅ Updated integration.js with deployment values');
}

// Create production configuration
function createProductionConfig(config) {
    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    const productionConfig = {
        apiEndpoint: config.outputs?.['ConnectChatWidget-development-ApiGateway']?.ApiEndpoint || '',
        region: config.region || 'ap-southeast-2',
        connectInstanceId: config.outputs?.['ConnectChatWidget-development-Connect']?.ConnectInstanceId || '',
        contactFlowId: config.outputs?.['ConnectChatWidget-development-Connect']?.ContactFlowId || '',
        cdnUrl: `https://${config.outputs?.['ConnectChatWidget-development-CDN']?.DistributionDomainName || ''}`,
        environment: 'production',
        bucketName: config.outputs?.['ConnectChatWidget-development-CDN']?.BucketName || '',
        distributionId: config.outputs?.['ConnectChatWidget-development-CDN']?.DistributionId || ''
    };

    const configPath = path.join(configDir, 'production.json');
    fs.writeFileSync(configPath, JSON.stringify(productionConfig, null, 2));
    console.log('✅ Created production.json configuration');
}

// Update GitHub repository variables
function generateGitHubVariables(config) {
    const variables = {
        AWS_REGION: config.region || 'ap-southeast-2',
        STAGING_S3_BUCKET: config.outputs?.['ConnectChatWidget-development-CDN']?.BucketName || '',
        STAGING_CLOUDFRONT_DISTRIBUTION_ID: config.outputs?.['ConnectChatWidget-development-CDN']?.DistributionId || '',
        STAGING_DOMAIN: config.outputs?.['ConnectChatWidget-development-CDN']?.DistributionDomainName || '',
        PRODUCTION_S3_BUCKET: config.outputs?.['ConnectChatWidget-development-CDN']?.BucketName || '',
        PRODUCTION_CLOUDFRONT_DISTRIBUTION_ID: config.outputs?.['ConnectChatWidget-development-CDN']?.DistributionId || '',
        PRODUCTION_DOMAIN: config.outputs?.['ConnectChatWidget-development-CDN']?.DistributionDomainName || ''
    };

    const variablesPath = path.join(__dirname, '../github-variables.json');
    fs.writeFileSync(variablesPath, JSON.stringify(variables, null, 2));

    console.log('✅ Generated GitHub repository variables');
    console.log('📋 Add these variables to your GitHub repository settings:');
    console.log('   Repository → Settings → Secrets and variables → Actions → Variables');
    console.log('');
    Object.entries(variables).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
    });
}

// Main execution
function main() {
    console.log('🔧 Updating widget configuration with deployment values...');

    try {
        const deploymentConfig = readDeploymentConfig();

        updateIntegrationScript(deploymentConfig);
        createProductionConfig(deploymentConfig);
        generateGitHubVariables(deploymentConfig);

        console.log('');
        console.log('🎉 Configuration update completed!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Update GitHub repository variables (see output above)');
        console.log('2. Build and deploy the widget: npm run build:all');
        console.log('3. Test the widget with the sample website');
        console.log('');

    } catch (error) {
        console.error('❌ Failed to update configuration:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { readDeploymentConfig, updateIntegrationScript, createProductionConfig };
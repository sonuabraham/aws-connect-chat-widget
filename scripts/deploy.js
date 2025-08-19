#!/usr/bin/env node

/**
 * Deployment script for AWS Connect Chat Widget
 * Handles CDN deployment with versioning and monitoring
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    environments: {
        staging: {
            s3Bucket: process.env.STAGING_S3_BUCKET || 'aws-connect-widget-staging',
            cloudFrontDistributionId: process.env.STAGING_CLOUDFRONT_DISTRIBUTION_ID,
            domain: process.env.STAGING_DOMAIN || 'staging-cdn.example.com',
            cacheControl: 'public, max-age=300' // 5 minutes
        },
        production: {
            s3Bucket: process.env.PRODUCTION_S3_BUCKET || 'aws-connect-widget-production',
            cloudFrontDistributionId: process.env.PRODUCTION_CLOUDFRONT_DISTRIBUTION_ID,
            domain: process.env.PRODUCTION_DOMAIN || 'cdn.example.com',
            cacheControl: 'public, max-age=31536000, immutable' // 1 year for versioned files
        }
    },
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        profile: process.env.AWS_PROFILE
    }
};

class Deployer {
    constructor(environment, version) {
        this.environment = environment;
        this.version = version;
        this.config = CONFIG.environments[environment];

        if (!this.config) {
            throw new Error(`Unknown environment: ${environment}`);
        }

        this.distDir = path.join(__dirname, '../dist/widget');
        this.deployDir = path.join(__dirname, '../deploy');
    }

    async deploy() {
        console.log(`🚀 Deploying AWS Connect Chat Widget to ${this.environment}...`);
        console.log(`📦 Version: ${this.version}`);
        console.log(`🌐 Domain: ${this.config.domain}`);
        console.log('');

        try {
            await this.validatePrerequisites();
            await this.prepareDeployment();
            await this.uploadToS3();
            await this.invalidateCloudFront();
            await this.runSmokeTests();
            await this.updateMonitoring();

            console.log('✅ Deployment completed successfully!');
            this.printDeploymentInfo();

        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }

    async validatePrerequisites() {
        console.log('🔍 Validating prerequisites...');

        // Check if AWS CLI is installed
        try {
            execSync('aws --version', { stdio: 'pipe' });
        } catch (error) {
            throw new Error('AWS CLI is not installed or not in PATH');
        }

        // Check if dist directory exists
        if (!fs.existsSync(this.distDir)) {
            throw new Error(`Distribution directory not found: ${this.distDir}`);
        }

        // Check required files
        const requiredFiles = [
            'aws-connect-chat-widget.umd.js',
            'aws-connect-chat-widget.css',
            'integration.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.distDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file not found: ${file}`);
            }
        }

        // Validate AWS credentials
        try {
            const awsCommand = CONFIG.aws.profile
                ? `aws --profile ${CONFIG.aws.profile} sts get-caller-identity`
                : 'aws sts get-caller-identity';
            execSync(awsCommand, { stdio: 'pipe' });
        } catch (error) {
            throw new Error('AWS credentials not configured or invalid');
        }

        console.log('  ✓ Prerequisites validated');
    }

    async prepareDeployment() {
        console.log('📋 Preparing deployment package...');

        // Clean and create deploy directory
        if (fs.existsSync(this.deployDir)) {
            fs.rmSync(this.deployDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.deployDir, { recursive: true });

        // Copy widget files
        const files = fs.readdirSync(this.distDir);
        files.forEach(file => {
            const srcPath = path.join(this.distDir, file);
            const destPath = path.join(this.deployDir, file);
            fs.copyFileSync(srcPath, destPath);
        });

        // Create version info
        const versionInfo = {
            version: this.version,
            environment: this.environment,
            buildDate: new Date().toISOString(),
            commit: process.env.GITHUB_SHA || 'unknown',
            branch: process.env.GITHUB_REF_NAME || 'unknown',
            buildNumber: process.env.GITHUB_RUN_NUMBER || 'unknown'
        };

        fs.writeFileSync(
            path.join(this.deployDir, 'version.json'),
            JSON.stringify(versionInfo, null, 2)
        );

        // Create health check endpoint
        const healthCheck = {
            status: 'healthy',
            version: this.version,
            environment: this.environment,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(this.deployDir, 'health.json'),
            JSON.stringify(healthCheck, null, 2)
        );

        // Update integration script with version info
        this.updateIntegrationScript();

        console.log('  ✓ Deployment package prepared');
    }

    updateIntegrationScript() {
        const integrationPath = path.join(this.deployDir, 'integration.js');
        let content = fs.readFileSync(integrationPath, 'utf8');

        // Add version info to the script
        const versionComment = `/**
 * AWS Connect Chat Widget Integration Script
 * Version: ${this.version}
 * Environment: ${this.environment}
 * Build Date: ${new Date().toISOString()}
 */\n\n`;

        content = versionComment + content;

        // Update CDN URLs if in production
        if (this.environment === 'production') {
            content = content.replace(
                /https:\/\/cdn\.example\.com/g,
                `https://${this.config.domain}`
            );
        }

        fs.writeFileSync(integrationPath, content);
    }

    async uploadToS3() {
        console.log('☁️  Uploading to S3...');

        const s3Bucket = this.config.s3Bucket;
        const awsProfile = CONFIG.aws.profile ? `--profile ${CONFIG.aws.profile}` : '';

        if (this.environment === 'production') {
            // Upload versioned files (immutable)
            console.log(`  📦 Uploading versioned files to s3://${s3Bucket}/widget/v${this.version}/`);
            execSync(`aws s3 sync ${this.deployDir}/ s3://${s3Bucket}/widget/v${this.version}/ \
                --cache-control "${this.config.cacheControl}" \
                --metadata version=${this.version},environment=${this.environment} \
                ${awsProfile}`, { stdio: 'inherit' });

            // Upload latest files (shorter cache)
            console.log(`  📦 Uploading latest files to s3://${s3Bucket}/widget/latest/`);
            execSync(`aws s3 sync ${this.deployDir}/ s3://${s3Bucket}/widget/latest/ \
                --delete \
                --cache-control "public, max-age=3600" \
                --metadata version=${this.version},environment=${this.environment} \
                ${awsProfile}`, { stdio: 'inherit' });
        } else {
            // Staging: just upload to widget/ path
            console.log(`  📦 Uploading to s3://${s3Bucket}/widget/`);
            execSync(`aws s3 sync ${this.deployDir}/ s3://${s3Bucket}/widget/ \
                --delete \
                --cache-control "${this.config.cacheControl}" \
                --metadata version=${this.version},environment=${this.environment} \
                ${awsProfile}`, { stdio: 'inherit' });
        }

        console.log('  ✓ Upload completed');
    }

    async invalidateCloudFront() {
        if (!this.config.cloudFrontDistributionId) {
            console.log('⚠️  CloudFront distribution ID not configured, skipping cache invalidation');
            return;
        }

        console.log('🔄 Invalidating CloudFront cache...');

        const awsProfile = CONFIG.aws.profile ? `--profile ${CONFIG.aws.profile}` : '';
        const paths = this.environment === 'production'
            ? '/widget/latest/*'
            : '/widget/*';

        try {
            const result = execSync(`aws cloudfront create-invalidation \
                --distribution-id ${this.config.cloudFrontDistributionId} \
                --paths "${paths}" \
                ${awsProfile}`, { encoding: 'utf8' });

            const invalidation = JSON.parse(result);
            console.log(`  ✓ Invalidation created: ${invalidation.Invalidation.Id}`);
        } catch (error) {
            console.warn('  ⚠️  CloudFront invalidation failed:', error.message);
        }
    }

    async runSmokeTests() {
        console.log('🧪 Running smoke tests...');

        // Wait for deployment to propagate
        console.log('  ⏳ Waiting for deployment to propagate...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        const baseUrl = `https://${this.config.domain}/widget`;
        const testUrls = this.environment === 'production'
            ? [
                `${baseUrl}/latest/integration.js`,
                `${baseUrl}/latest/aws-connect-chat-widget.umd.js`,
                `${baseUrl}/latest/aws-connect-chat-widget.css`,
                `${baseUrl}/latest/health.json`,
                `${baseUrl}/v${this.version}/integration.js`,
                `${baseUrl}/v${this.version}/aws-connect-chat-widget.umd.js`,
                `${baseUrl}/v${this.version}/aws-connect-chat-widget.css`
            ]
            : [
                `${baseUrl}/integration.js`,
                `${baseUrl}/aws-connect-chat-widget.umd.js`,
                `${baseUrl}/aws-connect-chat-widget.css`,
                `${baseUrl}/health.json`
            ];

        for (const url of testUrls) {
            try {
                execSync(`curl -f -s "${url}" > /dev/null`, { stdio: 'pipe' });
                console.log(`  ✓ ${url}`);
            } catch (error) {
                throw new Error(`Smoke test failed for ${url}`);
            }
        }

        console.log('  ✓ All smoke tests passed');
    }

    async updateMonitoring() {
        console.log('📊 Updating monitoring...');

        // Create deployment event for monitoring
        const deploymentEvent = {
            timestamp: new Date().toISOString(),
            version: this.version,
            environment: this.environment,
            status: 'deployed',
            urls: this.getDeploymentUrls()
        };

        // Save deployment event (could be sent to monitoring service)
        fs.writeFileSync(
            path.join(this.deployDir, 'deployment-event.json'),
            JSON.stringify(deploymentEvent, null, 2)
        );

        console.log('  ✓ Monitoring updated');
    }

    getDeploymentUrls() {
        const baseUrl = `https://${this.config.domain}/widget`;

        if (this.environment === 'production') {
            return {
                latest: {
                    integration: `${baseUrl}/latest/integration.js`,
                    bundle: `${baseUrl}/latest/aws-connect-chat-widget.umd.js`,
                    styles: `${baseUrl}/latest/aws-connect-chat-widget.css`
                },
                versioned: {
                    integration: `${baseUrl}/v${this.version}/integration.js`,
                    bundle: `${baseUrl}/v${this.version}/aws-connect-chat-widget.umd.js`,
                    styles: `${baseUrl}/v${this.version}/aws-connect-chat-widget.css`
                }
            };
        } else {
            return {
                integration: `${baseUrl}/integration.js`,
                bundle: `${baseUrl}/aws-connect-chat-widget.umd.js`,
                styles: `${baseUrl}/aws-connect-chat-widget.css`
            };
        }
    }

    printDeploymentInfo() {
        console.log('\n📋 Deployment Information:');
        console.log(`Environment: ${this.environment}`);
        console.log(`Version: ${this.version}`);
        console.log(`Domain: ${this.config.domain}`);
        console.log('');

        const urls = this.getDeploymentUrls();

        if (this.environment === 'production') {
            console.log('🔗 Latest URLs (recommended for production):');
            console.log(`  Integration: ${urls.latest.integration}`);
            console.log(`  Bundle: ${urls.latest.bundle}`);
            console.log(`  Styles: ${urls.latest.styles}`);
            console.log('');
            console.log('🔗 Versioned URLs (immutable):');
            console.log(`  Integration: ${urls.versioned.integration}`);
            console.log(`  Bundle: ${urls.versioned.bundle}`);
            console.log(`  Styles: ${urls.versioned.styles}`);
        } else {
            console.log('🔗 URLs:');
            console.log(`  Integration: ${urls.integration}`);
            console.log(`  Bundle: ${urls.bundle}`);
            console.log(`  Styles: ${urls.styles}`);
        }

        console.log('');
        console.log('📖 Usage:');
        console.log('```html');
        if (this.environment === 'production') {
            console.log(`<script src="${urls.latest.integration}"></script>`);
        } else {
            console.log(`<script src="${urls.integration}"></script>`);
        }
        console.log('```');
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const environment = args[0];
    const version = args[1] || `${new Date().toISOString().split('T')[0]}-${Date.now()}`;

    if (!environment || !['staging', 'production'].includes(environment)) {
        console.error('Usage: node deploy.js <staging|production> [version]');
        console.error('');
        console.error('Examples:');
        console.error('  node deploy.js staging');
        console.error('  node deploy.js production 1.2.3');
        process.exit(1);
    }

    const deployer = new Deployer(environment, version);
    await deployer.deploy();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });
}

export { Deployer };
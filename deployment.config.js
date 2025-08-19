/**
 * Deployment Configuration for AWS Connect Chat Widget
 * Centralized configuration for all deployment environments
 */

export const deploymentConfig = {
    // Version configuration
    version: {
        strategy: 'semantic', // 'semantic' | 'timestamp' | 'build'
        prefix: 'v',
        format: 'MAJOR.MINOR.PATCH'
    },

    // Environment configurations
    environments: {
        development: {
            name: 'development',
            domain: 'localhost:5173',
            s3Bucket: null,
            cloudFrontDistributionId: null,
            cacheControl: 'no-cache',
            monitoring: {
                enabled: false
            }
        },

        staging: {
            name: 'staging',
            domain: process.env.STAGING_DOMAIN || 'staging-cdn.example.com',
            s3Bucket: process.env.STAGING_S3_BUCKET || 'aws-connect-widget-staging',
            cloudFrontDistributionId: process.env.STAGING_CLOUDFRONT_DISTRIBUTION_ID,
            cacheControl: 'public, max-age=300', // 5 minutes
            monitoring: {
                enabled: true,
                sentry: {
                    dsn: process.env.STAGING_SENTRY_DSN,
                    environment: 'staging'
                },
                analytics: {
                    googleAnalytics: process.env.STAGING_GA_TRACKING_ID,
                    customEndpoint: process.env.STAGING_ANALYTICS_ENDPOINT
                }
            },
            features: {
                debugMode: true,
                performanceMonitoring: true,
                errorReporting: true
            }
        },

        production: {
            name: 'production',
            domain: process.env.PRODUCTION_DOMAIN || 'cdn.example.com',
            s3Bucket: process.env.PRODUCTION_S3_BUCKET || 'aws-connect-widget-production',
            cloudFrontDistributionId: process.env.PRODUCTION_CLOUDFRONT_DISTRIBUTION_ID,
            cacheControl: 'public, max-age=31536000, immutable', // 1 year
            monitoring: {
                enabled: true,
                sentry: {
                    dsn: process.env.PRODUCTION_SENTRY_DSN,
                    environment: 'production'
                },
                analytics: {
                    googleAnalytics: process.env.PRODUCTION_GA_TRACKING_ID,
                    customEndpoint: process.env.PRODUCTION_ANALYTICS_ENDPOINT
                }
            },
            features: {
                debugMode: false,
                performanceMonitoring: true,
                errorReporting: true
            },
            versioning: {
                strategy: 'immutable', // Keep all versions
                retention: '1 year'
            }
        }
    },

    // AWS configuration
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        profile: process.env.AWS_PROFILE,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    },

    // Build configuration
    build: {
        outputDir: 'dist',
        widgetDir: 'dist/widget',
        deployDir: 'deploy',

        // Files to include in deployment
        files: [
            'aws-connect-chat-widget.umd.js',
            'aws-connect-chat-widget.es.js',
            'aws-connect-chat-widget.css',
            'integration.js',
            'example.html',
            'README.md',
            'package.json'
        ],

        // Code splitting configuration
        codeSplitting: {
            enabled: true,
            chunks: {
                vendor: ['react', 'react-dom'],
                aws: ['@aws-sdk/client-connectparticipant']
            }
        },

        // Optimization settings
        optimization: {
            minify: true,
            sourceMaps: true,
            treeshaking: true,
            compression: 'gzip'
        }
    },

    // CDN configuration
    cdn: {
        paths: {
            latest: '/widget/latest/',
            versioned: '/widget/v{version}/',
            health: '/widget/health.json'
        },

        headers: {
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },

        compression: {
            enabled: true,
            types: ['text/javascript', 'text/css', 'application/json']
        }
    },

    // Monitoring and alerting
    monitoring: {
        healthCheck: {
            enabled: true,
            interval: '5m',
            timeout: '10s',
            endpoints: [
                '/widget/latest/integration.js',
                '/widget/latest/health.json'
            ]
        },

        alerts: {
            errorRate: {
                threshold: 5, // 5%
                period: '5m'
            },
            responseTime: {
                threshold: 2000, // 2 seconds
                period: '5m'
            },
            availability: {
                threshold: 99.9, // 99.9%
                period: '5m'
            }
        },

        metrics: {
            retention: '30d',
            aggregation: '1m'
        }
    },

    // Security configuration
    security: {
        contentSecurityPolicy: {
            'script-src': [
                "'self'",
                'https://unpkg.com',
                'https://cdn.example.com'
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'",
                'https://cdn.example.com'
            ],
            'connect-src': [
                "'self'",
                'wss://*.amazonaws.com',
                'https://*.amazonaws.com'
            ]
        },

        cors: {
            allowedOrigins: ['*'],
            allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }
    },

    // Rollback configuration
    rollback: {
        enabled: true,
        strategy: 'immediate', // 'immediate' | 'gradual'
        healthCheckRequired: true,
        maxRollbackVersions: 5
    },

    // Notification configuration
    notifications: {
        slack: {
            enabled: !!process.env.SLACK_WEBHOOK_URL,
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            channels: {
                deployments: '#deployments',
                alerts: '#alerts'
            }
        },

        email: {
            enabled: !!process.env.NOTIFICATION_EMAIL,
            recipients: process.env.NOTIFICATION_EMAIL?.split(',') || [],
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            }
        }
    }
};

// Helper functions
export function getEnvironmentConfig(environment) {
    const config = deploymentConfig.environments[environment];
    if (!config) {
        throw new Error(`Unknown environment: ${environment}`);
    }
    return config;
}

export function getCDNUrls(environment, version) {
    const config = getEnvironmentConfig(environment);
    const baseUrl = `https://${config.domain}`;

    if (environment === 'production') {
        return {
            latest: {
                integration: `${baseUrl}/widget/latest/integration.js`,
                bundle: `${baseUrl}/widget/latest/aws-connect-chat-widget.umd.js`,
                styles: `${baseUrl}/widget/latest/aws-connect-chat-widget.css`
            },
            versioned: {
                integration: `${baseUrl}/widget/v${version}/integration.js`,
                bundle: `${baseUrl}/widget/v${version}/aws-connect-chat-widget.umd.js`,
                styles: `${baseUrl}/widget/v${version}/aws-connect-chat-widget.css`
            }
        };
    } else {
        return {
            integration: `${baseUrl}/widget/integration.js`,
            bundle: `${baseUrl}/widget/aws-connect-chat-widget.umd.js`,
            styles: `${baseUrl}/widget/aws-connect-chat-widget.css`
        };
    }
}

export function validateEnvironment(environment) {
    const config = getEnvironmentConfig(environment);
    const errors = [];

    if (!config.s3Bucket) {
        errors.push(`S3 bucket not configured for ${environment}`);
    }

    if (environment === 'production' && !config.cloudFrontDistributionId) {
        errors.push(`CloudFront distribution ID not configured for ${environment}`);
    }

    if (config.monitoring.enabled) {
        if (!config.monitoring.sentry?.dsn) {
            errors.push(`Sentry DSN not configured for ${environment}`);
        }
    }

    return errors;
}

export default deploymentConfig;
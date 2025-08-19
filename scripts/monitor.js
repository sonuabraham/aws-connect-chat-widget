#!/usr/bin/env node

/**
 * Monitoring and error tracking setup for AWS Connect Chat Widget
 * Handles performance monitoring, error tracking, and analytics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringSetup {
    constructor() {
        this.configDir = path.join(__dirname, '../monitoring');
        this.templatesDir = path.join(__dirname, '../monitoring/templates');
    }

    async setup() {
        console.log('📊 Setting up monitoring and error tracking...\n');

        try {
            await this.createDirectories();
            await this.createCloudWatchDashboard();
            await this.createAlarmTemplates();
            await this.createSentryConfig();
            await this.createAnalyticsConfig();
            await this.createHealthCheckScript();
            await this.createPerformanceMonitoring();

            console.log('✅ Monitoring setup completed successfully!');
            this.printSetupInfo();

        } catch (error) {
            console.error('❌ Monitoring setup failed:', error.message);
            process.exit(1);
        }
    }

    async createDirectories() {
        console.log('📁 Creating monitoring directories...');

        const dirs = [
            this.configDir,
            this.templatesDir,
            path.join(this.configDir, 'dashboards'),
            path.join(this.configDir, 'alarms'),
            path.join(this.configDir, 'scripts')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        console.log('  ✓ Directories created');
    }

    async createCloudWatchDashboard() {
        console.log('📈 Creating CloudWatch dashboard...');

        const dashboard = {
            widgets: [
                {
                    type: "metric",
                    x: 0,
                    y: 0,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [
                            ["AWS/CloudFront", "Requests", "DistributionId", "${CLOUDFRONT_DISTRIBUTION_ID}"],
                            [".", "BytesDownloaded", ".", "."],
                            [".", "4xxErrorRate", ".", "."],
                            [".", "5xxErrorRate", ".", "."]
                        ],
                        view: "timeSeries",
                        stacked: false,
                        region: "us-east-1",
                        title: "Widget CDN Metrics",
                        period: 300
                    }
                },
                {
                    type: "metric",
                    x: 12,
                    y: 0,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [
                            ["AWS/ApiGateway", "Count", "ApiName", "aws-connect-chat-widget"],
                            [".", "Latency", ".", "."],
                            [".", "4XXError", ".", "."],
                            [".", "5XXError", ".", "."]
                        ],
                        view: "timeSeries",
                        stacked: false,
                        region: "us-east-1",
                        title: "API Gateway Metrics",
                        period: 300
                    }
                },
                {
                    type: "metric",
                    x: 0,
                    y: 6,
                    width: 24,
                    height: 6,
                    properties: {
                        metrics: [
                            ["AWS/Lambda", "Duration", "FunctionName", "aws-connect-chat-initiate"],
                            [".", "Errors", ".", "."],
                            [".", "Throttles", ".", "."],
                            [".", "Invocations", ".", "."]
                        ],
                        view: "timeSeries",
                        stacked: false,
                        region: "us-east-1",
                        title: "Lambda Function Metrics",
                        period: 300
                    }
                },
                {
                    type: "log",
                    x: 0,
                    y: 12,
                    width: 24,
                    height: 6,
                    properties: {
                        query: "SOURCE '/aws/lambda/aws-connect-chat-initiate'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 100",
                        region: "us-east-1",
                        title: "Recent Errors",
                        view: "table"
                    }
                }
            ]
        };

        fs.writeFileSync(
            path.join(this.configDir, 'dashboards/widget-dashboard.json'),
            JSON.stringify(dashboard, null, 2)
        );

        console.log('  ✓ CloudWatch dashboard template created');
    }

    async createAlarmTemplates() {
        console.log('🚨 Creating alarm templates...');

        const alarms = [
            {
                name: "WidgetHighErrorRate",
                description: "Widget API error rate is too high",
                metric: {
                    namespace: "AWS/ApiGateway",
                    metricName: "4XXError",
                    dimensions: [
                        {
                            name: "ApiName",
                            value: "aws-connect-chat-widget"
                        }
                    ]
                },
                threshold: 10,
                comparisonOperator: "GreaterThanThreshold",
                evaluationPeriods: 2,
                period: 300,
                statistic: "Sum",
                treatMissingData: "notBreaching"
            },
            {
                name: "WidgetHighLatency",
                description: "Widget API latency is too high",
                metric: {
                    namespace: "AWS/ApiGateway",
                    metricName: "Latency",
                    dimensions: [
                        {
                            name: "ApiName",
                            value: "aws-connect-chat-widget"
                        }
                    ]
                },
                threshold: 5000,
                comparisonOperator: "GreaterThanThreshold",
                evaluationPeriods: 3,
                period: 300,
                statistic: "Average",
                treatMissingData: "notBreaching"
            },
            {
                name: "WidgetLowAvailability",
                description: "Widget CDN availability is low",
                metric: {
                    namespace: "AWS/CloudFront",
                    metricName: "4xxErrorRate",
                    dimensions: [
                        {
                            name: "DistributionId",
                            value: "${CLOUDFRONT_DISTRIBUTION_ID}"
                        }
                    ]
                },
                threshold: 5,
                comparisonOperator: "GreaterThanThreshold",
                evaluationPeriods: 2,
                period: 300,
                statistic: "Average",
                treatMissingData: "notBreaching"
            }
        ];

        alarms.forEach(alarm => {
            fs.writeFileSync(
                path.join(this.configDir, `alarms/${alarm.name}.json`),
                JSON.stringify(alarm, null, 2)
            );
        });

        console.log('  ✓ Alarm templates created');
    }

    async createSentryConfig() {
        console.log('🐛 Creating Sentry error tracking config...');

        const sentryConfig = {
            dsn: "${SENTRY_DSN}",
            environment: "${ENVIRONMENT}",
            release: "${VERSION}",
            integrations: [
                {
                    name: "BrowserTracing",
                    options: {
                        tracingOrigins: ["localhost", /^\//]
                    }
                }
            ],
            tracesSampleRate: 0.1,
            beforeSend: `function(event, hint) {
                // Filter out known non-critical errors
                if (event.exception) {
                    const error = event.exception.values[0];
                    if (error && error.type === 'ChunkLoadError') {
                        return null; // Don't send chunk load errors
                    }
                }
                return event;
            }`,
            beforeBreadcrumb: `function(breadcrumb, hint) {
                // Filter sensitive data from breadcrumbs
                if (breadcrumb.category === 'console' && breadcrumb.level === 'error') {
                    return breadcrumb;
                }
                if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
                    // Remove sensitive headers and data
                    if (breadcrumb.data) {
                        delete breadcrumb.data.headers;
                        delete breadcrumb.data.body;
                    }
                }
                return breadcrumb;
            }`
        };

        fs.writeFileSync(
            path.join(this.configDir, 'sentry-config.json'),
            JSON.stringify(sentryConfig, null, 2)
        );

        // Create Sentry integration script
        const sentryIntegration = `
/**
 * Sentry Error Tracking Integration
 * Automatically tracks errors and performance for the AWS Connect Chat Widget
 */

(function() {
    'use strict';
    
    // Load Sentry SDK
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/7.x.x/bundle.tracing.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = function() {
        if (window.Sentry) {
            window.Sentry.init({
                dsn: '${SENTRY_DSN}',
                environment: '${ENVIRONMENT}',
                release: '${VERSION}',
                integrations: [
                    new window.Sentry.BrowserTracing()
                ],
                tracesSampleRate: 0.1,
                beforeSend: function(event, hint) {
                    // Add widget-specific context
                    event.tags = event.tags || {};
                    event.tags.component = 'aws-connect-chat-widget';
                    
                    // Add user context if available
                    if (window.AWSConnectChatWidgetAPI) {
                        const state = window.AWSConnectChatWidgetAPI.getState();
                        if (state) {
                            event.contexts = event.contexts || {};
                            event.contexts.widget = {
                                isOpen: state.isOpen,
                                isConnected: state.isConnected,
                                chatStatus: state.chatStatus
                            };
                        }
                    }
                    
                    return event;
                }
            });
            
            // Track widget initialization
            window.Sentry.addBreadcrumb({
                message: 'Widget error tracking initialized',
                category: 'widget',
                level: 'info'
            });
        }
    };
    document.head.appendChild(script);
})();
`;

        fs.writeFileSync(
            path.join(this.configDir, 'sentry-integration.js'),
            sentryIntegration
        );

        console.log('  ✓ Sentry configuration created');
    }

    async createAnalyticsConfig() {
        console.log('📊 Creating analytics configuration...');

        const analyticsConfig = {
            providers: {
                googleAnalytics: {
                    trackingId: "${GA_TRACKING_ID}",
                    config: {
                        send_page_view: false,
                        custom_map: {
                            custom_parameter_1: "widget_version",
                            custom_parameter_2: "chat_status"
                        }
                    },
                    events: {
                        widget_loaded: {
                            event_category: "widget",
                            event_label: "initialization"
                        },
                        chat_started: {
                            event_category: "engagement",
                            event_label: "chat_initiation"
                        },
                        chat_ended: {
                            event_category: "engagement",
                            event_label: "chat_completion"
                        },
                        message_sent: {
                            event_category: "interaction",
                            event_label: "user_message"
                        },
                        error_occurred: {
                            event_category: "error",
                            event_label: "widget_error"
                        }
                    }
                },
                customAnalytics: {
                    endpoint: "${ANALYTICS_ENDPOINT}",
                    apiKey: "${ANALYTICS_API_KEY}",
                    batchSize: 10,
                    flushInterval: 30000
                }
            }
        };

        fs.writeFileSync(
            path.join(this.configDir, 'analytics-config.json'),
            JSON.stringify(analyticsConfig, null, 2)
        );

        // Create analytics integration script
        const analyticsIntegration = `
/**
 * Analytics Integration for AWS Connect Chat Widget
 * Tracks user interactions and widget performance
 */

class WidgetAnalytics {
    constructor(config) {
        this.config = config;
        this.eventQueue = [];
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        // Initialize Google Analytics
        if (this.config.providers.googleAnalytics.trackingId) {
            this.initGoogleAnalytics();
        }
        
        // Initialize custom analytics
        if (this.config.providers.customAnalytics.endpoint) {
            this.initCustomAnalytics();
        }
        
        this.isInitialized = true;
        this.flushQueue();
    }
    
    initGoogleAnalytics() {
        const trackingId = this.config.providers.googleAnalytics.trackingId;
        
        // Load gtag
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
                document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', trackingId, this.config.providers.googleAnalytics.config);

        window.gtag = gtag;
    }

    initCustomAnalytics() {
        // Set up batch sending for custom analytics
        setInterval(() => {
            this.sendBatch();
        }, this.config.providers.customAnalytics.flushInterval);
    }

    track(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                widget_version: '${VERSION}'
            }
        };

        if (this.isInitialized) {
            this.sendEvent(event);
        } else {
            this.eventQueue.push(event);
        }
    }

    sendEvent(event) {
        // Send to Google Analytics
        if (window.gtag && this.config.providers.googleAnalytics.events[event.name]) {
            const gaEvent = this.config.providers.googleAnalytics.events[event.name];
            window.gtag('event', event.name, {
                ...gaEvent,
                ...event.properties
            });
        }

        // Add to custom analytics queue
        if (this.config.providers.customAnalytics.endpoint) {
            this.eventQueue.push(event);

            if (this.eventQueue.length >= this.config.providers.customAnalytics.batchSize) {
                this.sendBatch();
            }
        }
    }

    sendBatch() {
        if (this.eventQueue.length === 0) return;

        const batch = this.eventQueue.splice(0, this.config.providers.customAnalytics.batchSize);

        fetch(this.config.providers.customAnalytics.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.providers.customAnalytics.apiKey}`
            },
            body: JSON.stringify({ events: batch })
        }).catch(error => {
            console.warn('Failed to send analytics batch:', error);
            // Re-queue events for retry
            this.eventQueue.unshift(...batch);
        });
    }

    flushQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.sendEvent(event);
        }
    }
}

// Export for use in widget
window.WidgetAnalytics = WidgetAnalytics;
`;

            fs.writeFileSync(
                path.join(this.configDir, 'analytics-integration.js'),
                analyticsIntegration
            );

            console.log('  ✓ Analytics configuration created');
        }

    async createHealthCheckScript() {
            console.log('🏥 Creating health check script...');

            const healthCheck = `#!/usr/bin / env node

/**
 * Health check script for AWS Connect Chat Widget
 * Monitors widget availability and performance
 */

import https from 'https';
import { performance } from 'perf_hooks';

const CONFIG = {
    environments: {
        staging: {
            domain: 'staging-cdn.example.com',
            paths: ['/widget/integration.js', '/widget/health.json']
        },
        production: {
            domain: 'cdn.example.com',
            paths: ['/widget/latest/integration.js', '/widget/latest/health.json']
        }
    },
    thresholds: {
        responseTime: 2000, // 2 seconds
        availability: 99.9   // 99.9%
    }
};

class HealthChecker {
    constructor(environment) {
        this.environment = environment;
        this.config = CONFIG.environments[environment];
        this.results = [];
    }

    async check() {
        console.log(`🏥 Running health check for ${this.environment}...`);

        for (const path of this.config.paths) {
            const result = await this.checkEndpoint(path);
            this.results.push(result);
        }

        this.printResults();
        return this.isHealthy();
    }

    async checkEndpoint(path) {
        const url = `https://${this.config.domain}${path}`;
        const startTime = performance.now();

        return new Promise((resolve) => {
            const req = https.get(url, (res) => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        url,
                        status: res.statusCode,
                        responseTime: Math.round(responseTime),
                        contentLength: data.length,
                        healthy: res.statusCode === 200 && responseTime < CONFIG.thresholds.responseTime
                    });
                });
            });

            req.on('error', (error) => {
                const endTime = performance.now();
                resolve({
                    url,
                    status: 0,
                    responseTime: Math.round(endTime - startTime),
                    error: error.message,
                    healthy: false
                });
            });

            req.setTimeout(5000, () => {
                req.destroy();
                resolve({
                    url,
                    status: 0,
                    responseTime: 5000,
                    error: 'Timeout',
                    healthy: false
                });
            });
        });
    }

    printResults() {
        console.log(`\n📊 Health Check Results for ${this.environment}:`);
        console.log('━'.repeat(80));

        this.results.forEach(result => {
            const status = result.healthy ? '✅' : '❌';
            const statusText = result.status || 'ERROR';
            const responseTime = `${result.responseTime}ms`;

            console.log(`${status} ${result.url}`);
            console.log(`   Status: ${statusText} | Response Time: ${responseTime}`);

            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }

            if (result.contentLength) {
                console.log(`   Content Length: ${result.contentLength} bytes`);
            }

            console.log('');
        });
    }

    isHealthy() {
        const healthyCount = this.results.filter(r => r.healthy).length;
        const totalCount = this.results.length;
        const availability = (healthyCount / totalCount) * 100;

        console.log(`📈 Overall Health: ${availability.toFixed(1)}%`);

        if (availability >= CONFIG.thresholds.availability) {
            console.log('✅ System is healthy');
            return true;
        } else {
            console.log('❌ System is unhealthy');
            return false;
        }
    }
}

// CLI interface
async function main() {
    const environment = process.argv[2];

    if (!environment || !['staging', 'production'].includes(environment)) {
        console.error('Usage: node health-check.js <staging|production>');
        process.exit(1);
    }

    const checker = new HealthChecker(environment);
    const isHealthy = await checker.check();

    process.exit(isHealthy ? 0 : 1);
}

if (import.meta.url === 'file://' + process.argv[1]) {
    main().catch(error => {
        console.error('Health check failed:', error);
        process.exit(1);
    });
}

export { HealthChecker };
`;

        fs.writeFileSync(
            path.join(this.configDir, 'scripts/health-check.js'),
            healthCheck
        );

        console.log('  ✓ Health check script created');
    }

    async createPerformanceMonitoring() {
        console.log('⚡ Creating performance monitoring...');

        const performanceMonitor = `
/**
 * Performance Monitoring for AWS Connect Chat Widget
 * Tracks Core Web Vitals and widget-specific metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
        this.init();
    }

    init() {
        // Monitor Core Web Vitals
        this.observeCoreWebVitals();

        // Monitor widget-specific metrics
        this.observeWidgetMetrics();

        // Monitor resource loading
        this.observeResourceTiming();

        // Send metrics periodically
        setInterval(() => this.sendMetrics(), 30000);
    }

    observeCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(lcpObserver);

            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.push(fidObserver);

            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.metrics.cls = clsValue;
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(clsObserver);
        }
    }

    observeWidgetMetrics() {
        // Widget load time
        const widgetLoadStart = performance.now();

        // Monitor when widget becomes interactive
        const checkWidgetReady = () => {
            if (window.AWSConnectChatWidgetAPI) {
                this.metrics.widgetLoadTime = performance.now() - widgetLoadStart;
                return;
            }
            setTimeout(checkWidgetReady, 100);
        };
        checkWidgetReady();

        // Monitor chat connection time
        if (window.AWSConnectChatWidgetAPI) {
            const originalInit = window.AWSConnectChatWidgetAPI.init;
            window.AWSConnectChatWidgetAPI.init = (...args) => {
                const connectStart = performance.now();
                const result = originalInit.apply(this, args);

                // Monitor connection establishment
                const checkConnection = () => {
                    const state = window.AWSConnectChatWidgetAPI.getState();
                    if (state && state.isConnected) {
                        this.metrics.connectionTime = performance.now() - connectStart;
                        return;
                    }
                    setTimeout(checkConnection, 100);
                };
                checkConnection();

                return result;
            };
        }
    }

    observeResourceTiming() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.name.includes('aws-connect-chat-widget')) {
                        this.metrics.resourceTiming = this.metrics.resourceTiming || {};
                        this.metrics.resourceTiming[entry.name] = {
                            duration: entry.duration,
                            transferSize: entry.transferSize,
                            encodedBodySize: entry.encodedBodySize
                        };
                    }
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.push(resourceObserver);
        }
    }

    sendMetrics() {
        if (Object.keys(this.metrics).length === 0) return;

        const payload = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: this.metrics,
            connection: this.getConnectionInfo()
        };

        // Send to analytics endpoint
        if (window.WidgetAnalytics) {
            window.WidgetAnalytics.track('performance_metrics', payload);
        }

        // Send to custom monitoring endpoint
        this.sendToMonitoringEndpoint(payload);

        // Reset metrics after sending
        this.metrics = {};
    }

    getConnectionInfo() {
        if ('connection' in navigator) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }

    sendToMonitoringEndpoint(payload) {
        const endpoint = '${MONITORING_ENDPOINT}';
        if (!endpoint) return;

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.warn('Failed to send performance metrics:', error);
        });
    }

    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Auto-initialize performance monitoring
if (typeof window !== 'undefined') {
    window.WidgetPerformanceMonitor = new PerformanceMonitor();
}
`;

        fs.writeFileSync(
            path.join(this.configDir, 'performance-monitor.js'),
            performanceMonitor
        );

        console.log('  ✓ Performance monitoring created');
    }

    printSetupInfo() {
        console.log('\n📋 Monitoring Setup Complete:');
        console.log('');
        console.log('📊 CloudWatch Dashboard:');
        console.log('  - Template: monitoring/dashboards/widget-dashboard.json');
        console.log('  - Deploy with AWS CLI or CloudFormation');
        console.log('');
        console.log('🚨 CloudWatch Alarms:');
        console.log('  - Templates: monitoring/alarms/*.json');
        console.log('  - Configure thresholds for your environment');
        console.log('');
        console.log('🐛 Error Tracking:');
        console.log('  - Sentry configuration: monitoring/sentry-config.json');
        console.log('  - Integration script: monitoring/sentry-integration.js');
        console.log('');
        console.log('📈 Analytics:');
        console.log('  - Configuration: monitoring/analytics-config.json');
        console.log('  - Integration script: monitoring/analytics-integration.js');
        console.log('');
        console.log('🏥 Health Monitoring:');
        console.log('  - Health check script: monitoring/scripts/health-check.js');
        console.log('  - Run: node monitoring/scripts/health-check.js production');
        console.log('');
        console.log('⚡ Performance Monitoring:');
        console.log('  - Performance monitor: monitoring/performance-monitor.js');
        console.log('  - Tracks Core Web Vitals and widget metrics');
        console.log('');
        console.log('🔧 Next Steps:');
        console.log('  1. Configure environment variables in your deployment');
        console.log('  2. Set up CloudWatch dashboard and alarms');
        console.log('  3. Configure Sentry DSN and analytics tracking IDs');
        console.log('  4. Set up monitoring endpoints and webhooks');
        console.log('  5. Test health checks and performance monitoring');
    }
}

// CLI interface
async function main() {
    const monitor = new MonitoringSetup();
    await monitor.setup();
}

if (import.meta.url === 'file://' + process.argv[1]) {
    main().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

export { MonitoringSetup };
`;

fs.writeFileSync(
    path.join(this.configDir, 'scripts/monitor.js'),
    monitor
);

console.log('  ✓ Monitoring setup script created');
    }
}

// CLI interface
async function main() {
    const setup = new MonitoringSetup();
    await setup.setup();
}

if (import.meta.url === 'file://' + process.argv[1]) {
    main().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

export { MonitoringSetup };
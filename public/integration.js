/**
 * AWS Connect Chat Widget Integration Script
 * Simple JavaScript integration for websites
 * 
 * Usage:
 * 1. Include this script in your HTML
 * 2. Configure the widget with your AWS Connect settings
 * 3. The widget will automatically initialize
 */

(function () {
    'use strict';

    // Configuration - Replace with your actual AWS Connect settings
    var WIDGET_CONFIG = {
        aws: {
            region: 'us-east-1',
            instanceId: 'YOUR_INSTANCE_ID', // Replace with your AWS Connect instance ID
            contactFlowId: 'YOUR_CONTACT_FLOW_ID', // Replace with your contact flow ID
            apiGatewayEndpoint: 'YOUR_API_GATEWAY_ENDPOINT', // Replace with your API Gateway endpoint
        },
        ui: {
            theme: {
                primaryColor: '#007bff',
                secondaryColor: '#6c757d',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: '8px',
            },
            position: {
                bottom: '20px',
                right: '20px',
            },
            messages: {
                welcomeMessage: 'Hello! How can we help you today?',
                offlineMessage: 'We are currently offline. Please leave a message.',
                waitingMessage: 'Connecting you to an agent...',
            },
        },
        features: {
            fileUpload: false,
            emojiPicker: false,
            chatRatings: true,
            chatTranscript: true,
        },
    };

    // CDN URLs for the widget assets
    var WIDGET_CSS_URL = 'https://cdn.example.com/aws-connect-chat-widget.css';
    var WIDGET_JS_URL = 'https://cdn.example.com/aws-connect-chat-widget.umd.js';
    var REACT_URL = 'https://unpkg.com/react@18/umd/react.production.min.js';
    var REACT_DOM_URL = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';

    // Global widget instance
    var widgetInstance = null;

    /**
     * Load external script
     */
    function loadScript(src, callback) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = function () {
            console.error('Failed to load script:', src);
        };
        document.head.appendChild(script);
    }

    /**
     * Load external CSS
     */
    function loadCSS(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onerror = function () {
            console.error('Failed to load CSS:', href);
        };
        document.head.appendChild(link);
    }

    /**
     * Initialize the widget
     */
    function initializeWidget() {
        try {
            if (!window.AWSConnectChatWidget) {
                console.error('AWS Connect Chat Widget library not loaded');
                return;
            }

            // Validate configuration
            if (!WIDGET_CONFIG.aws.instanceId || WIDGET_CONFIG.aws.instanceId === 'YOUR_INSTANCE_ID') {
                console.error('AWS Connect Chat Widget: Please configure your instanceId');
                return;
            }

            if (!WIDGET_CONFIG.aws.contactFlowId || WIDGET_CONFIG.aws.contactFlowId === 'YOUR_CONTACT_FLOW_ID') {
                console.error('AWS Connect Chat Widget: Please configure your contactFlowId');
                return;
            }

            // Initialize widget
            widgetInstance = window.AWSConnectChatWidget.init(WIDGET_CONFIG);

            console.log('AWS Connect Chat Widget initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AWS Connect Chat Widget:', error);

            // Show fallback message
            showFallbackMessage();
        }
    }

    /**
     * Show fallback message when widget fails to load
     */
    function showFallbackMessage() {
        var fallback = document.createElement('div');
        fallback.id = 'aws-connect-chat-fallback';
        fallback.innerHTML = [
            '<div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">',
            '  <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; max-width: 300px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">',
            '    <div style="font-weight: bold; margin-bottom: 4px; color: #495057;">Chat Unavailable</div>',
            '    <div style="font-size: 14px; color: #6c757d; margin-bottom: 8px;">Our chat service is temporarily unavailable.</div>',
            '    <div style="font-size: 12px; color: #6c757d;">Please contact us at: <a href="mailto:support@example.com" style="color: #007bff;">support@example.com</a></div>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(fallback);

        // Auto-hide after 10 seconds
        setTimeout(function () {
            if (fallback.parentNode) {
                fallback.parentNode.removeChild(fallback);
            }
        }, 10000);
    }

    /**
     * Load dependencies and initialize
     */
    function loadDependencies() {
        // Load CSS first
        loadCSS(WIDGET_CSS_URL);

        // Load React dependencies
        loadScript(REACT_URL, function () {
            loadScript(REACT_DOM_URL, function () {
                // Load widget script
                loadScript(WIDGET_JS_URL, function () {
                    initializeWidget();
                });
            });
        });
    }

    /**
     * Public API for external control
     */
    window.AWSConnectChatWidgetAPI = {
        /**
         * Initialize widget with custom configuration
         */
        init: function (customConfig) {
            // Cleanup existing instance first
            if (widgetInstance) {
                widgetInstance.destroy();
                widgetInstance = null;
            }

            if (customConfig) {
                // Merge custom config with defaults
                WIDGET_CONFIG = Object.assign({}, WIDGET_CONFIG, customConfig);
            }
            loadDependencies();
        },

        /**
         * Update widget configuration
         */
        updateConfig: function (config) {
            if (widgetInstance && !widgetInstance.isDestroyed()) {
                widgetInstance.updateConfig(config);
            } else {
                console.warn('Widget not initialized or already destroyed');
            }
        },

        /**
         * Get widget state
         */
        getState: function () {
            return widgetInstance ? widgetInstance.getState() : null;
        },

        /**
         * Destroy widget
         */
        destroy: function () {
            if (widgetInstance) {
                widgetInstance.destroy();
                widgetInstance = null;
                console.log('Widget destroyed via API');
            }
        },

        /**
         * Check if widget is active
         */
        isActive: function () {
            return widgetInstance && !widgetInstance.isDestroyed();
        },

        /**
         * Reinitialize widget
         */
        reinit: function (customConfig) {
            this.destroy();
            setTimeout(function () {
                window.AWSConnectChatWidgetAPI.init(customConfig);
            }, 100); // Small delay to ensure cleanup is complete
        }
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', function () {
        if (widgetInstance) {
            widgetInstance.destroy();
        }
    });

    window.addEventListener('pagehide', function () {
        if (widgetInstance) {
            widgetInstance.destroy();
        }
    });

    // Handle page visibility changes for memory management
    document.addEventListener('visibilitychange', function () {
        if (document.hidden && widgetInstance) {
            // Page is hidden, could pause some operations
            console.log('Page hidden, widget operations paused');
        } else if (!document.hidden && widgetInstance) {
            // Page is visible again
            console.log('Page visible, widget operations resumed');
        }
    });

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.AWSConnectChatWidgetAPI.init();
        });
    } else {
        window.AWSConnectChatWidgetAPI.init();
    }

})();
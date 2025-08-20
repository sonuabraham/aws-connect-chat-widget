/**
 * Standalone AWS Connect Chat Widget
 * This is a simplified version that works reliably in UMD format
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.AWSConnectChatWidget = {}));
}(this, (function (exports) {
    'use strict';

    // Simple widget implementation
    function createWidget(config) {
        console.log('🎯 Creating AWS Connect Chat Widget with config:', config);

        // Validate required config
        if (!config || !config.aws) {
            throw new Error('AWS configuration is required');
        }

        if (!config.aws.instanceId || !config.aws.contactFlowId) {
            throw new Error('AWS instanceId and contactFlowId are required');
        }

        // Create widget instance
        const widget = {
            config: config,
            mounted: false,
            destroyed: false,

            mount: function (containerId) {
                if (this.destroyed) {
                    throw new Error('Cannot mount destroyed widget');
                }

                console.log('📦 Mounting widget to container:', containerId || 'auto-created');

                // Create container if not provided
                let container;
                if (containerId) {
                    container = document.getElementById(containerId);
                    if (!container) {
                        throw new Error(`Container ${containerId} not found`);
                    }
                } else {
                    container = document.createElement('div');
                    container.id = 'aws-connect-chat-widget-' + Date.now();
                    container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          `;
                    document.body.appendChild(container);
                }

                // Create simple chat button
                container.innerHTML = `
          <div style="
            background: ${config.ui?.theme?.primaryColor || '#007bff'};
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            💬
          </div>
        `;

                // Add click handler
                container.onclick = () => {
                    alert(`AWS Connect Chat Widget\\n\\nRegion: ${config.aws.region}\\nInstance: ${config.aws.instanceId}\\n\\nThis is a demo - integrate with AWS Connect for full functionality!`);
                };

                this.container = container;
                this.mounted = true;

                console.log('✅ Widget mounted successfully');
                return this;
            },

            unmount: function () {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.mounted = false;
                console.log('📤 Widget unmounted');
                return this;
            },

            destroy: function () {
                this.unmount();
                this.destroyed = true;
                console.log('🗑️ Widget destroyed');
                return this;
            },

            updateConfig: function (newConfig) {
                if (this.destroyed) {
                    throw new Error('Cannot update destroyed widget');
                }
                this.config = { ...this.config, ...newConfig };
                console.log('🔄 Widget config updated');
                return this;
            },

            getState: function () {
                return {
                    mounted: this.mounted,
                    destroyed: this.destroyed,
                    config: this.config
                };
            },

            isDestroyed: function () {
                return this.destroyed;
            }
        };

        // Auto-mount if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => widget.mount());
        } else {
            setTimeout(() => widget.mount(), 100);
        }

        return widget;
    }

    // Main initialization function
    function initializeWidget(config) {
        console.log('🚀 Initializing AWS Connect Chat Widget...');

        try {
            const widget = createWidget(config);
            console.log('✅ AWS Connect Chat Widget initialized successfully');
            return widget;
        } catch (error) {
            console.error('❌ Failed to initialize widget:', error);
            throw error;
        }
    }

    // Export the API
    exports.init = initializeWidget;
    exports.version = '1.0.0';
    exports.createWidget = createWidget;

    // Also assign to window for direct access
    if (typeof window !== 'undefined') {
        window.AWSConnectChatWidget = {
            init: initializeWidget,
            version: '1.0.0',
            createWidget: createWidget
        };
        console.log('🌐 AWSConnectChatWidget available globally');
    }

})));
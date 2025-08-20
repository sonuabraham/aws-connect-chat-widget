/**
 * AWS Connect Chat Widget Integration Script
 * This script loads the chat widget and provides a simple API for websites
 */

(function (window, document) {
    'use strict';

    // Configuration - will be replaced during build/deployment
    const CONFIG = {
        apiEndpoint: 'YOUR_API_GATEWAY_URL', // Will be replaced with actual URL
        region: 'ap-southeast-2',
        cdnUrl: 'YOUR_CDN_URL', // Will be replaced with actual CDN URL
        widgetVersion: 'latest'
    };

    // Widget state
    let widgetLoaded = false;
    let widgetInstance = null;

    /**
     * Load the chat widget bundle
     */
    function loadWidget() {
        return new Promise((resolve, reject) => {
            if (widgetLoaded) {
                resolve();
                return;
            }

            // Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${CONFIG.cdnUrl}/widget/aws-connect-chat-widget.css`;
            document.head.appendChild(cssLink);

            // Load JavaScript
            const script = document.createElement('script');
            script.src = `${CONFIG.cdnUrl}/widget/aws-connect-chat-widget.umd.js`;
            script.onload = () => {
                widgetLoaded = true;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load chat widget'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize the chat widget
     */
    async function initializeWidget(options = {}) {
        try {
            await loadWidget();

            if (!window.AWSConnectChatWidget) {
                throw new Error('Chat widget not loaded');
            }

            const config = {
                apiEndpoint: CONFIG.apiEndpoint,
                region: CONFIG.region,
                ...options
            };

            widgetInstance = new window.AWSConnectChatWidget(config);
            return widgetInstance;
        } catch (error) {
            console.error('Failed to initialize chat widget:', error);
            throw error;
        }
    }

    /**
     * Show the chat widget
     */
    function showChat(participantDetails = {}) {
        if (!widgetInstance) {
            console.error('Chat widget not initialized. Call AWSConnect.init() first.');
            return;
        }

        return widgetInstance.startChat(participantDetails);
    }

    /**
     * Hide the chat widget
     */
    function hideChat() {
        if (widgetInstance) {
            widgetInstance.hideWidget();
        }
    }

    /**
     * Check if chat is available
     */
    async function checkAvailability() {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}health`);
            const data = await response.json();
            return data.status === 'healthy';
        } catch (error) {
            console.error('Failed to check chat availability:', error);
            return false;
        }
    }

    // Public API
    window.AWSConnect = {
        init: initializeWidget,
        show: showChat,
        hide: hideChat,
        checkAvailability: checkAvailability,
        version: CONFIG.widgetVersion
    };

    // Auto-initialize if data attributes are present
    document.addEventListener('DOMContentLoaded', () => {
        const autoInit = document.querySelector('[data-aws-connect-auto-init]');
        if (autoInit) {
            const options = {};

            // Read configuration from data attributes
            if (autoInit.dataset.awsConnectApiEndpoint) {
                options.apiEndpoint = autoInit.dataset.awsConnectApiEndpoint;
            }
            if (autoInit.dataset.awsConnectRegion) {
                options.region = autoInit.dataset.awsConnectRegion;
            }

            initializeWidget(options).catch(error => {
                console.error('Auto-initialization failed:', error);
            });
        }
    });

})(window, document);
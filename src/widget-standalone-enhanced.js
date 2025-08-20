/**
 * Enhanced Standalone AWS Connect Chat Widget
 * Complete chat interface with proper UI
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.AWSConnectChatWidget = {}));
}(this, (function (exports) {
    'use strict';

    // Enhanced widget implementation with full chat interface
    function createWidget(config) {
        console.log('🎯 Creating Enhanced AWS Connect Chat Widget with config:', config);

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
            chatOpen: false,
            messages: [],

            mount: function (containerId) {
                if (this.destroyed) {
                    throw new Error('Cannot mount destroyed widget');
                }

                console.log('📦 Mounting enhanced widget to container:', containerId || 'auto-created');

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

                // Create enhanced chat interface
                this.createChatInterface(container, config);
                this.container = container;
                this.mounted = true;

                console.log('✅ Enhanced widget mounted successfully');
                return this;
            },

            createChatInterface: function (container, config) {
                const primaryColor = config.ui?.theme?.primaryColor || '#007bff';
                const secondaryColor = config.ui?.theme?.secondaryColor || '#6c757d';

                container.innerHTML = `
          <!-- Chat Button -->
          <div id="chat-button" style="
            background: ${primaryColor};
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            position: relative;
          ">
            <span id="chat-icon">💬</span>
            <span id="close-icon" style="display: none; font-size: 18px;">✕</span>
          </div>
          
          <!-- Chat Window -->
          <div id="chat-window" style="
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e1e5e9;
          ">
            <!-- Header -->
            <div style="
              background: ${primaryColor};
              color: white;
              padding: 16px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <div>
                <div style="font-weight: 600; font-size: 16px;">Live Chat</div>
                <div style="font-size: 12px; opacity: 0.9;">We're here to help</div>
              </div>
              <div style="
                width: 8px;
                height: 8px;
                background: #28a745;
                border-radius: 50%;
                margin-left: 8px;
              "></div>
            </div>
            
            <!-- Messages Area -->
            <div id="messages-area" style="
              flex: 1;
              padding: 20px;
              overflow-y: auto;
              background: #f8f9fa;
            ">
              <!-- Welcome Message -->
              <div style="
                background: white;
                padding: 12px 16px;
                border-radius: 18px 18px 18px 4px;
                margin-bottom: 16px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                max-width: 80%;
              ">
                <div style="font-size: 14px; color: #333;">
                  ${config.ui?.messages?.welcomeMessage || 'Hello! How can we help you today?'}
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 4px;">
                  ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            <!-- Input Area -->
            <div style="
              padding: 16px 20px;
              border-top: 1px solid #e1e5e9;
              background: white;
            ">
              <div style="
                display: flex;
                align-items: center;
                background: #f8f9fa;
                border-radius: 24px;
                padding: 8px 16px;
                border: 1px solid #e1e5e9;
              ">
                <input 
                  id="message-input" 
                  type="text" 
                  placeholder="Type your message..."
                  style="
                    flex: 1;
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 14px;
                    padding: 8px 0;
                  "
                />
                <button id="send-button" style="
                  background: ${primaryColor};
                  color: white;
                  border: none;
                  border-radius: 50%;
                  width: 32px;
                  height: 32px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  margin-left: 8px;
                  transition: background 0.2s ease;
                ">
                  <span style="font-size: 14px;">→</span>
                </button>
              </div>
              
              <!-- Status -->
              <div style="
                font-size: 11px;
                color: #888;
                text-align: center;
                margin-top: 8px;
              ">
                Connected to AWS Connect (${config.aws.region})
              </div>
            </div>
          </div>
        `;

                // Add event listeners
                this.setupEventListeners(container, config);
            },

            setupEventListeners: function (container, config) {
                const chatButton = container.querySelector('#chat-button');
                const chatWindow = container.querySelector('#chat-window');
                const chatIcon = container.querySelector('#chat-icon');
                const closeIcon = container.querySelector('#close-icon');
                const messageInput = container.querySelector('#message-input');
                const sendButton = container.querySelector('#send-button');
                const messagesArea = container.querySelector('#messages-area');

                // Toggle chat window
                chatButton.addEventListener('click', () => {
                    this.chatOpen = !this.chatOpen;

                    if (this.chatOpen) {
                        chatWindow.style.display = 'flex';
                        chatIcon.style.display = 'none';
                        closeIcon.style.display = 'block';
                        chatButton.style.transform = 'rotate(180deg)';
                        messageInput.focus();
                    } else {
                        chatWindow.style.display = 'none';
                        chatIcon.style.display = 'block';
                        closeIcon.style.display = 'none';
                        chatButton.style.transform = 'rotate(0deg)';
                    }
                });

                // Send message function
                const sendMessage = () => {
                    const message = messageInput.value.trim();
                    if (!message) return;

                    // Add user message
                    this.addMessage(messagesArea, message, 'user');
                    messageInput.value = '';

                    // Simulate agent response
                    setTimeout(() => {
                        const responses = [
                            "Thank you for contacting us! I'm connecting you with our support team.",
                            "I understand your inquiry. Let me help you with that.",
                            "That's a great question! Let me look into that for you.",
                            "I'm here to assist you. Could you provide more details?",
                            "Thanks for reaching out! Our team will get back to you shortly."
                        ];
                        const response = responses[Math.floor(Math.random() * responses.length)];
                        this.addMessage(messagesArea, response, 'agent');
                    }, 1000 + Math.random() * 2000);
                };

                // Send button click
                sendButton.addEventListener('click', sendMessage);

                // Enter key to send
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });

                // Hover effects
                chatButton.addEventListener('mouseenter', () => {
                    if (!this.chatOpen) {
                        chatButton.style.transform = 'scale(1.1)';
                    }
                });

                chatButton.addEventListener('mouseleave', () => {
                    if (!this.chatOpen) {
                        chatButton.style.transform = 'scale(1)';
                    }
                });
            },

            addMessage: function (messagesArea, text, sender) {
                const isUser = sender === 'user';
                const messageDiv = document.createElement('div');

                messageDiv.style.cssText = `
          display: flex;
          justify-content: ${isUser ? 'flex-end' : 'flex-start'};
          margin-bottom: 16px;
        `;

                messageDiv.innerHTML = `
          <div style="
            background: ${isUser ? this.config.ui?.theme?.primaryColor || '#007bff' : 'white'};
            color: ${isUser ? 'white' : '#333'};
            padding: 12px 16px;
            border-radius: ${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
            max-width: 80%;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            word-wrap: break-word;
          ">
            <div style="font-size: 14px;">${text}</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
              ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `;

                messagesArea.appendChild(messageDiv);
                messagesArea.scrollTop = messagesArea.scrollHeight;

                this.messages.push({ text, sender, timestamp: new Date() });
            },

            unmount: function () {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.mounted = false;
                this.chatOpen = false;
                console.log('📤 Enhanced widget unmounted');
                return this;
            },

            destroy: function () {
                this.unmount();
                this.destroyed = true;
                console.log('🗑️ Enhanced widget destroyed');
                return this;
            },

            updateConfig: function (newConfig) {
                if (this.destroyed) {
                    throw new Error('Cannot update destroyed widget');
                }
                this.config = { ...this.config, ...newConfig };
                console.log('🔄 Enhanced widget config updated');
                return this;
            },

            getState: function () {
                return {
                    mounted: this.mounted,
                    destroyed: this.destroyed,
                    chatOpen: this.chatOpen,
                    messageCount: this.messages.length,
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
        console.log('🚀 Initializing Enhanced AWS Connect Chat Widget...');

        try {
            const widget = createWidget(config);
            console.log('✅ Enhanced AWS Connect Chat Widget initialized successfully');
            return widget;
        } catch (error) {
            console.error('❌ Failed to initialize enhanced widget:', error);
            throw error;
        }
    }

    // Export the API
    exports.init = initializeWidget;
    exports.version = '1.1.0';
    exports.createWidget = createWidget;

    // Also assign to window for direct access
    if (typeof window !== 'undefined') {
        window.AWSConnectChatWidget = {
            init: initializeWidget,
            version: '1.1.0',
            createWidget: createWidget
        };
        console.log('🌐 Enhanced AWSConnectChatWidget available globally');
    }

})));
# Customization Guide

This guide shows you how to customize the AWS Connect Chat Widget to match your brand and requirements.

## Theme Customization

### Basic Theme Configuration

```javascript
{
    ui: {
        theme: {
            primaryColor: '#007bff',      // Main brand color
            secondaryColor: '#6c757d',    // Secondary/muted color
            fontFamily: 'Arial, sans-serif', // Font family
            borderRadius: '8px'           // Border radius for elements
        }
    }
}
```

### Advanced Theme Options

```javascript
{
    ui: {
        theme: {
            // Colors
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            borderColor: '#dee2e6',
            
            // Typography
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            fontWeight: '400',
            
            // Layout
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            
            // Chat-specific colors
            visitorMessageColor: '#007bff',
            agentMessageColor: '#f8f9fa',
            systemMessageColor: '#e9ecef',
            
            // Button styles
            buttonPrimaryColor: '#007bff',
            buttonPrimaryHoverColor: '#0056b3',
            buttonSecondaryColor: '#6c757d',
            
            // Status colors
            onlineColor: '#28a745',
            offlineColor: '#dc3545',
            typingColor: '#ffc107'
        }
    }
}
```

### Pre-built Themes

#### Professional Blue
```javascript
{
    ui: {
        theme: {
            primaryColor: '#0066cc',
            secondaryColor: '#4d94ff',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            borderRadius: '6px',
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
        }
    }
}
```

#### Modern Dark
```javascript
{
    ui: {
        theme: {
            primaryColor: '#00d4aa',
            secondaryColor: '#1a1a1a',
            backgroundColor: '#2d2d2d',
            textColor: '#ffffff',
            borderColor: '#404040',
            borderRadius: '12px',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
        }
    }
}
```

#### Warm Orange
```javascript
{
    ui: {
        theme: {
            primaryColor: '#ff6b35',
            secondaryColor: '#ff8c42',
            backgroundColor: '#fff8f5',
            textColor: '#2d2d2d',
            borderRadius: '8px',
            fontFamily: '"Poppins", sans-serif'
        }
    }
}
```

## Widget Positioning

### Basic Positioning

```javascript
{
    ui: {
        position: {
            bottom: '20px',
            right: '20px'    // or left: '20px'
        }
    }
}
```

### Advanced Positioning

```javascript
{
    ui: {
        position: {
            bottom: '20px',
            right: '20px',
            zIndex: 1000,           // Custom z-index
            maxWidth: '400px',      // Maximum widget width
            maxHeight: '600px'      // Maximum widget height
        }
    }
}
```

### Responsive Positioning

```javascript
{
    ui: {
        position: {
            // Desktop
            bottom: '20px',
            right: '20px',
            
            // Mobile (automatically applied on small screens)
            mobile: {
                bottom: '10px',
                right: '10px',
                left: '10px',    // Full width on mobile
                maxHeight: '70vh'
            }
        }
    }
}
```

## Message Customization

### Welcome Messages

```javascript
{
    ui: {
        messages: {
            welcomeMessage: 'Hello! How can we help you today?',
            offlineMessage: 'We are currently offline. Please leave a message and we\'ll get back to you.',
            waitingMessage: 'Connecting you to an agent...',
            agentConnectedMessage: 'Agent {agentName} has joined the chat',
            agentDisconnectedMessage: 'Agent has left the chat',
            chatEndedMessage: 'This chat session has ended. Thank you!',
            typingIndicatorMessage: '{agentName} is typing...',
            reconnectingMessage: 'Reconnecting...',
            connectionErrorMessage: 'Connection lost. Trying to reconnect...'
        }
    }
}
```

### Multilingual Support

```javascript
// English (default)
const englishMessages = {
    welcomeMessage: 'Hello! How can we help you today?',
    offlineMessage: 'We are currently offline.',
    waitingMessage: 'Connecting you to an agent...',
    // ... other messages
};

// Spanish
const spanishMessages = {
    welcomeMessage: '¡Hola! ¿Cómo podemos ayudarte hoy?',
    offlineMessage: 'Actualmente estamos desconectados.',
    waitingMessage: 'Conectándote con un agente...',
    // ... other messages
};

// Detect user language
const userLanguage = navigator.language.startsWith('es') ? 'es' : 'en';
const messages = userLanguage === 'es' ? spanishMessages : englishMessages;

// Apply to widget
{
    ui: {
        messages: messages
    }
}
```

## Feature Configuration

### Enable/Disable Features

```javascript
{
    features: {
        fileUpload: true,           // Allow file uploads
        emojiPicker: false,         // Show emoji picker
        chatRatings: true,          // Post-chat ratings
        chatTranscript: true,       // Download transcripts
        typing: true,               // Typing indicators
        readReceipts: false,        // Message read status
        soundNotifications: true,   // Sound alerts
        desktopNotifications: false // Browser notifications
    }
}
```

### File Upload Configuration

```javascript
{
    features: {
        fileUpload: {
            enabled: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx'],
            maxFiles: 5
        }
    }
}
```

### Chat Ratings Configuration

```javascript
{
    features: {
        chatRatings: {
            enabled: true,
            scale: 5,                    // 1-5 star rating
            requireComment: false,       // Require written feedback
            customQuestions: [
                'How satisfied were you with the response time?',
                'Did the agent resolve your issue?',
                'Would you recommend our support to others?'
            ]
        }
    }
}
```

## Custom CSS Styling

### CSS Custom Properties

The widget exposes CSS custom properties for advanced styling:

```css
:root {
    /* Colors */
    --aws-chat-primary-color: #007bff;
    --aws-chat-secondary-color: #6c757d;
    --aws-chat-background-color: #ffffff;
    --aws-chat-text-color: #333333;
    --aws-chat-border-color: #dee2e6;
    
    /* Typography */
    --aws-chat-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --aws-chat-font-size: 14px;
    --aws-chat-font-weight: 400;
    
    /* Layout */
    --aws-chat-border-radius: 8px;
    --aws-chat-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    /* Animation */
    --aws-chat-transition-duration: 0.3s;
    --aws-chat-animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Component-Specific Styling

```css
/* Chat button customization */
.aws-chat-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.aws-chat-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

/* Chat window customization */
.aws-chat-window {
    border-radius: 16px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
}

/* Message bubbles */
.aws-chat-message.visitor {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 18px 18px 4px 18px;
}

.aws-chat-message.agent {
    background: #f8f9fa;
    color: #333;
    border-radius: 18px 18px 18px 4px;
}

/* Typing indicator */
.aws-chat-typing-indicator {
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}
```

### Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
    :root {
        --aws-chat-background-color: #2d2d2d;
        --aws-chat-text-color: #ffffff;
        --aws-chat-border-color: #404040;
        --aws-chat-secondary-color: #666666;
    }
    
    .aws-chat-message.agent {
        background: #404040;
        color: #ffffff;
    }
}
```

## Advanced Customization

### Custom Event Handlers

```javascript
{
    events: {
        onChatStart: (data) => {
            console.log('Chat started:', data);
            // Track analytics
            gtag('event', 'chat_started', {
                'event_category': 'engagement',
                'event_label': 'customer_support'
            });
        },
        
        onChatEnd: (data) => {
            console.log('Chat ended:', data);
            // Show feedback form
            showFeedbackModal(data.chatId);
        },
        
        onMessageSent: (message) => {
            console.log('Message sent:', message);
        },
        
        onMessageReceived: (message) => {
            console.log('Message received:', message);
            // Play notification sound
            playNotificationSound();
        },
        
        onAgentConnect: (agent) => {
            console.log('Agent connected:', agent);
            // Show agent info
            showAgentWelcome(agent.name);
        },
        
        onError: (error) => {
            console.error('Widget error:', error);
            // Send to error tracking
            Sentry.captureException(error);
        }
    }
}
```

### Custom Components

Replace default components with your own:

```javascript
{
    customComponents: {
        ChatButton: MyCustomChatButton,
        MessageBubble: MyCustomMessageBubble,
        TypingIndicator: MyCustomTypingIndicator,
        FileUpload: MyCustomFileUpload
    }
}
```

### Integration with Analytics

```javascript
{
    analytics: {
        provider: 'google', // 'google', 'adobe', 'custom'
        trackingId: 'GA_TRACKING_ID',
        events: {
            chatStart: 'chat_started',
            chatEnd: 'chat_ended',
            messagesSent: 'messages_sent',
            fileUploads: 'file_uploaded',
            ratings: 'chat_rated'
        }
    }
}
```

## Accessibility Customization

### Screen Reader Support

```javascript
{
    accessibility: {
        announcements: {
            chatOpened: 'Chat window opened',
            chatClosed: 'Chat window closed',
            messageReceived: 'New message from agent',
            agentConnected: 'Agent connected to chat',
            agentDisconnected: 'Agent disconnected from chat'
        },
        keyboardShortcuts: {
            openChat: 'Alt+C',
            closeChat: 'Escape',
            sendMessage: 'Enter',
            focusInput: 'Alt+I'
        }
    }
}
```

### High Contrast Mode

```javascript
{
    accessibility: {
        highContrast: {
            enabled: true,
            colors: {
                primaryColor: '#000000',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                borderColor: '#000000'
            }
        }
    }
}
```

## Testing Your Customizations

### Visual Testing Checklist

- [ ] Widget appears correctly on different screen sizes
- [ ] Colors and fonts match your brand guidelines
- [ ] Animations and transitions work smoothly
- [ ] Dark mode support (if applicable)
- [ ] High contrast mode compatibility
- [ ] Cross-browser consistency

### Functional Testing

- [ ] All custom event handlers work correctly
- [ ] Custom components render and function properly
- [ ] Analytics tracking is working
- [ ] Accessibility features are functional
- [ ] Performance impact is acceptable

## Best Practices

### Performance
- Use CSS transforms for animations instead of changing layout properties
- Minimize custom CSS to reduce bundle size
- Test on slower devices and connections

### Accessibility
- Maintain sufficient color contrast ratios (4.5:1 minimum)
- Ensure all interactive elements are keyboard accessible
- Provide meaningful ARIA labels and announcements

### Branding
- Keep customizations consistent with your overall brand
- Test readability in different lighting conditions
- Consider cultural preferences for colors and layouts

### Maintenance
- Document your customizations for future reference
- Test customizations when updating the widget
- Keep custom CSS organized and well-commented
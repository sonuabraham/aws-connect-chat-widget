# API Reference

Complete reference for the AWS Connect Chat Widget API.

## Global API

The widget exposes a global `AWSConnectChatWidgetAPI` object for programmatic control.

### AWSConnectChatWidgetAPI.init(config)

Initialize the widget with configuration.

**Parameters:**
- `config` (Object): Widget configuration object

**Returns:** Widget instance

**Example:**
```javascript
const widget = AWSConnectChatWidgetAPI.init({
    aws: {
        region: 'us-east-1',
        instanceId: 'your-instance-id',
        contactFlowId: 'your-contact-flow-id',
        apiGatewayEndpoint: 'https://api.example.com'
    }
});
```

### AWSConnectChatWidgetAPI.updateConfig(config)

Update widget configuration after initialization.

**Parameters:**
- `config` (Object): Partial configuration object to merge

**Example:**
```javascript
AWSConnectChatWidgetAPI.updateConfig({
    ui: {
        theme: {
            primaryColor: '#28a745'
        }
    }
});
```

### AWSConnectChatWidgetAPI.getState()

Get current widget state.

**Returns:** Object with current state

**Example:**
```javascript
const state = AWSConnectChatWidgetAPI.getState();
console.log(state);
// {
//     isOpen: false,
//     isConnected: false,
//     chatStatus: 'closed',
//     unreadCount: 0,
//     agentInfo: null
// }
```

### AWSConnectChatWidgetAPI.destroy()

Destroy the widget and clean up resources.

**Example:**
```javascript
AWSConnectChatWidgetAPI.destroy();
```

### AWSConnectChatWidgetAPI.isActive()

Check if widget is active and not destroyed.

**Returns:** Boolean

**Example:**
```javascript
const isActive = AWSConnectChatWidgetAPI.isActive();
```

### AWSConnectChatWidgetAPI.reinit(config)

Destroy and reinitialize the widget with new configuration.

**Parameters:**
- `config` (Object): New widget configuration

**Example:**
```javascript
AWSConnectChatWidgetAPI.reinit({
    aws: {
        region: 'us-west-2',
        instanceId: 'new-instance-id',
        contactFlowId: 'new-contact-flow-id',
        apiGatewayEndpoint: 'https://new-api.example.com'
    }
});
```

## Widget Instance Methods

When you initialize the widget, you get a widget instance with additional methods.

### widget.open()

Open the chat window.

**Example:**
```javascript
const widget = AWSConnectChatWidgetAPI.init(config);
widget.open();
```

### widget.close()

Close the chat window.

**Example:**
```javascript
widget.close();
```

### widget.minimize()

Minimize the chat window.

**Example:**
```javascript
widget.minimize();
```

### widget.sendMessage(message)

Send a message programmatically.

**Parameters:**
- `message` (String): Message content

**Example:**
```javascript
widget.sendMessage('Hello from the API!');
```

### widget.endChat()

End the current chat session.

**Example:**
```javascript
widget.endChat();
```

### widget.getMessages()

Get all messages from the current chat session.

**Returns:** Array of message objects

**Example:**
```javascript
const messages = widget.getMessages();
```

### widget.getChatTranscript()

Get formatted chat transcript.

**Returns:** String with formatted transcript

**Example:**
```javascript
const transcript = widget.getChatTranscript();
```

### widget.isDestroyed()

Check if widget instance has been destroyed.

**Returns:** Boolean

**Example:**
```javascript
const isDestroyed = widget.isDestroyed();
```

## Configuration Schema

### Complete Configuration Object

```typescript
interface WidgetConfiguration {
    aws: {
        region: string;
        instanceId: string;
        contactFlowId: string;
        apiGatewayEndpoint: string;
    };
    ui?: {
        theme?: {
            primaryColor?: string;
            secondaryColor?: string;
            backgroundColor?: string;
            textColor?: string;
            borderColor?: string;
            fontFamily?: string;
            fontSize?: string;
            fontWeight?: string;
            borderRadius?: string;
            boxShadow?: string;
            visitorMessageColor?: string;
            agentMessageColor?: string;
            systemMessageColor?: string;
            buttonPrimaryColor?: string;
            buttonPrimaryHoverColor?: string;
            buttonSecondaryColor?: string;
            onlineColor?: string;
            offlineColor?: string;
            typingColor?: string;
        };
        position?: {
            bottom?: string;
            right?: string;
            left?: string;
            zIndex?: number;
            maxWidth?: string;
            maxHeight?: string;
            mobile?: {
                bottom?: string;
                right?: string;
                left?: string;
                maxHeight?: string;
            };
        };
        messages?: {
            welcomeMessage?: string;
            offlineMessage?: string;
            waitingMessage?: string;
            agentConnectedMessage?: string;
            agentDisconnectedMessage?: string;
            chatEndedMessage?: string;
            typingIndicatorMessage?: string;
            reconnectingMessage?: string;
            connectionErrorMessage?: string;
        };
    };
    features?: {
        fileUpload?: boolean | {
            enabled: boolean;
            maxFileSize: number;
            allowedTypes: string[];
            maxFiles: number;
        };
        emojiPicker?: boolean;
        chatRatings?: boolean | {
            enabled: boolean;
            scale: number;
            requireComment: boolean;
            customQuestions: string[];
        };
        chatTranscript?: boolean;
        typing?: boolean;
        readReceipts?: boolean;
        soundNotifications?: boolean;
        desktopNotifications?: boolean;
    };
    events?: {
        onChatStart?: (data: ChatStartData) => void;
        onChatEnd?: (data: ChatEndData) => void;
        onMessageSent?: (message: Message) => void;
        onMessageReceived?: (message: Message) => void;
        onAgentConnect?: (agent: AgentInfo) => void;
        onAgentDisconnect?: (agent: AgentInfo) => void;
        onError?: (error: Error) => void;
        onStateChange?: (state: WidgetState) => void;
    };
    accessibility?: {
        announcements?: {
            chatOpened?: string;
            chatClosed?: string;
            messageReceived?: string;
            agentConnected?: string;
            agentDisconnected?: string;
        };
        keyboardShortcuts?: {
            openChat?: string;
            closeChat?: string;
            sendMessage?: string;
            focusInput?: string;
        };
        highContrast?: {
            enabled: boolean;
            colors: {
                primaryColor: string;
                backgroundColor: string;
                textColor: string;
                borderColor: string;
            };
        };
    };
    analytics?: {
        provider: 'google' | 'adobe' | 'custom';
        trackingId: string;
        events: {
            chatStart: string;
            chatEnd: string;
            messagesSent: string;
            fileUploads: string;
            ratings: string;
        };
    };
}
```

## Event Data Types

### ChatStartData

```typescript
interface ChatStartData {
    chatId: string;
    timestamp: Date;
    visitorInfo: {
        name: string;
        sessionId: string;
    };
}
```

### ChatEndData

```typescript
interface ChatEndData {
    chatId: string;
    timestamp: Date;
    duration: number; // in seconds
    messageCount: number;
    rating?: number;
    feedback?: string;
}
```

### Message

```typescript
interface Message {
    id: string;
    content: string;
    sender: 'visitor' | 'agent' | 'system';
    timestamp: Date;
    status: 'sending' | 'sent' | 'delivered' | 'failed';
    type: 'text' | 'file' | 'system';
    metadata?: {
        fileName?: string;
        fileSize?: number;
        fileType?: string;
        fileUrl?: string;
    };
}
```

### AgentInfo

```typescript
interface AgentInfo {
    id: string;
    name: string;
    profileImage?: string;
    status: 'online' | 'away' | 'busy';
    isTyping: boolean;
}
```

### WidgetState

```typescript
interface WidgetState {
    isOpen: boolean;
    isMinimized: boolean;
    isConnected: boolean;
    chatStatus: 'closed' | 'initializing' | 'waiting' | 'connected' | 'ended';
    unreadCount: number;
    agentInfo?: AgentInfo;
    lastActivity: Date;
    sessionId?: string;
    chatId?: string;
}
```

## Error Handling

### Error Types

The widget can emit various error types through the `onError` event:

```typescript
interface WidgetError extends Error {
    type: 'connection' | 'authentication' | 'configuration' | 'network' | 'unknown';
    code?: string;
    details?: any;
    recoverable: boolean;
}
```

### Common Error Codes

| Code | Type | Description | Recoverable |
|------|------|-------------|-------------|
| `INVALID_CONFIG` | configuration | Invalid configuration provided | No |
| `MISSING_INSTANCE_ID` | configuration | AWS Connect instance ID not provided | No |
| `MISSING_CONTACT_FLOW` | configuration | Contact flow ID not provided | No |
| `AUTH_FAILED` | authentication | Failed to authenticate with AWS Connect | No |
| `CONNECTION_FAILED` | connection | Failed to establish connection | Yes |
| `SESSION_EXPIRED` | authentication | Chat session has expired | Yes |
| `NETWORK_ERROR` | network | Network connectivity issues | Yes |
| `AGENT_UNAVAILABLE` | connection | No agents available | Yes |
| `MESSAGE_SEND_FAILED` | network | Failed to send message | Yes |
| `FILE_UPLOAD_FAILED` | network | Failed to upload file | Yes |

### Error Handling Example

```javascript
AWSConnectChatWidgetAPI.init({
    // ... configuration
    events: {
        onError: (error) => {
            console.error('Widget error:', error);
            
            switch (error.type) {
                case 'configuration':
                    // Show configuration error to admin
                    showConfigurationError(error.message);
                    break;
                    
                case 'connection':
                    if (error.recoverable) {
                        // Show retry option to user
                        showRetryDialog();
                    } else {
                        // Show offline message
                        showOfflineMessage();
                    }
                    break;
                    
                case 'network':
                    // Show network error message
                    showNetworkError();
                    break;
                    
                default:
                    // Generic error handling
                    showGenericError();
            }
        }
    }
});
```

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| iOS Safari | 14+ | Mobile optimized |
| Chrome Mobile | 90+ | Mobile optimized |

### Feature Detection

```javascript
// Check if browser supports required features
const isSupported = AWSConnectChatWidgetAPI.isSupported();

if (!isSupported) {
    console.warn('Browser not supported');
    // Show fallback message or alternative contact method
}
```

### Polyfills

The widget automatically includes polyfills for:
- Promise (IE11)
- fetch (IE11, older browsers)
- WebSocket (older browsers)
- CSS Custom Properties (IE11)

## Performance Considerations

### Bundle Size

- Core widget: ~45KB gzipped
- With all features: ~65KB gzipped
- CSS: ~8KB gzipped

### Memory Usage

- Idle widget: ~2MB
- Active chat: ~5-10MB
- Long chat sessions: Monitor for memory leaks

### Network Usage

- Initial load: ~70KB
- Per message: ~1-2KB
- File uploads: Variable based on file size
- WebSocket: Minimal overhead

### Optimization Tips

```javascript
// Lazy load the widget
const loadWidget = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.example.com/aws-connect-chat-widget/integration.js';
    document.head.appendChild(script);
};

// Load only when needed
document.getElementById('contact-button').addEventListener('click', loadWidget);

// Or load after page is fully loaded
window.addEventListener('load', loadWidget);
```

## Security

### Content Security Policy

Required CSP directives:

```
script-src 'self' https://cdn.example.com https://unpkg.com;
style-src 'self' 'unsafe-inline' https://cdn.example.com;
connect-src 'self' https://your-api-gateway-url wss://your-websocket-url;
img-src 'self' data: https:;
```

### Data Privacy

- All chat data is encrypted in transit
- No sensitive data is stored in localStorage
- Session tokens are automatically cleaned up
- File uploads are scanned for malware (if enabled)

### Best Practices

- Always use HTTPS
- Validate configuration on server-side
- Implement rate limiting on API endpoints
- Monitor for suspicious activity
- Keep widget updated to latest version
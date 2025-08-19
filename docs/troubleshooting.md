# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the AWS Connect Chat Widget.

## Common Issues

### Widget Not Appearing

**Symptoms:**
- Chat button doesn't show on the page
- No errors in console

**Possible Causes & Solutions:**

1. **Script not loaded**
   ```javascript
   // Check if script loaded
   console.log(window.AWSConnectChatWidgetAPI);
   // Should not be undefined
   ```

2. **Configuration errors**
   ```javascript
   // Verify configuration
   const config = {
       aws: {
           region: 'us-east-1',           // Check region
           instanceId: 'your-instance-id', // Must be valid
           contactFlowId: 'your-flow-id',  // Must exist and be published
           apiGatewayEndpoint: 'https://api.example.com' // Must be accessible
       }
   };
   ```

3. **CSS conflicts**
   ```css
   /* Check for CSS that might hide the widget */
   .aws-chat-widget {
       display: block !important;
       visibility: visible !important;
       z-index: 9999 !important;
   }
   ```

4. **Content Security Policy blocking**
   ```html
   <!-- Add to CSP header -->
   <meta http-equiv="Content-Security-Policy" 
         content="script-src 'self' https://cdn.example.com; 
                  style-src 'self' 'unsafe-inline';">
   ```

### Connection Issues

**Symptoms:**
- "Connecting..." message persists
- "Connection failed" error
- Chat button appears but clicking does nothing

**Diagnostic Steps:**

1. **Check AWS Connect configuration**
   ```bash
   # Test API Gateway endpoint
   curl -X POST https://your-api-gateway-url/chat \
     -H "Content-Type: application/json" \
     -d '{"instanceId":"your-instance-id","contactFlowId":"your-flow-id","participantDetails":{"displayName":"Test"}}'
   ```

2. **Verify contact flow**
   - Ensure contact flow is published
   - Check contact flow has proper queue configuration
   - Verify agents are available and online

3. **Check network connectivity**
   ```javascript
   // Test WebSocket connection
   const ws = new WebSocket('wss://your-websocket-url');
   ws.onopen = () => console.log('WebSocket connected');
   ws.onerror = (error) => console.error('WebSocket error:', error);
   ```

4. **CORS configuration**
   ```javascript
   // API Gateway must allow your domain
   {
       "Access-Control-Allow-Origin": "https://yourdomain.com",
       "Access-Control-Allow-Headers": "Content-Type",
       "Access-Control-Allow-Methods": "POST, OPTIONS"
   }
   ```

### Messages Not Sending/Receiving

**Symptoms:**
- Messages appear to send but agent doesn't receive them
- Agent messages don't appear in widget
- "Message failed to send" errors

**Solutions:**

1. **Check WebSocket connection**
   ```javascript
   // Monitor WebSocket in browser dev tools
   // Network tab → WS filter → Check connection status
   ```

2. **Verify participant token**
   ```javascript
   // Token might be expired
   // Widget should automatically refresh, but check for errors
   ```

3. **Message format validation**
   ```javascript
   // Ensure messages meet AWS Connect requirements
   // Max length: 1024 characters
   // No special characters that might break JSON
   ```

### Agent Not Receiving Chats

**Symptoms:**
- Widget connects successfully
- Visitor sees "waiting for agent"
- No chats appear in agent workspace

**Solutions:**

1. **Check agent status**
   - Agent must be logged in to Connect
   - Agent status must be "Available"
   - Agent must be assigned to the correct queue

2. **Verify queue configuration**
   - Contact flow routes to correct queue
   - Queue has agents assigned
   - Queue capacity settings allow new contacts

3. **Check contact flow routing**
   ```
   Start → Set Working Queue → Transfer to Queue
   ```

### Performance Issues

**Symptoms:**
- Slow widget loading
- High memory usage
- Page becomes unresponsive

**Solutions:**

1. **Optimize loading**
   ```javascript
   // Lazy load the widget
   const loadWidget = () => {
       if (!window.AWSConnectChatWidgetAPI) {
           const script = document.createElement('script');
           script.src = 'https://cdn.example.com/integration.js';
           document.head.appendChild(script);
       }
   };
   
   // Load on user interaction
   document.addEventListener('click', loadWidget, { once: true });
   ```

2. **Memory management**
   ```javascript
   // Properly destroy widget when not needed
   window.addEventListener('beforeunload', () => {
       if (window.AWSConnectChatWidgetAPI) {
           window.AWSConnectChatWidgetAPI.destroy();
       }
   });
   ```

3. **Reduce bundle size**
   ```javascript
   // Disable unused features
   {
       features: {
           fileUpload: false,
           emojiPicker: false,
           chatRatings: false
       }
   }
   ```

## Error Messages

### Configuration Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid instance ID" | Instance ID format incorrect | Use full instance ID from AWS Connect console |
| "Contact flow not found" | Contact flow ID incorrect or not published | Verify contact flow exists and is published |
| "Invalid region" | AWS region format incorrect | Use standard AWS region format (e.g., 'us-east-1') |
| "API Gateway endpoint unreachable" | Endpoint URL incorrect or blocked | Verify URL and check CORS configuration |

### Connection Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to start chat session" | API Gateway or Lambda error | Check CloudWatch logs for API Gateway and Lambda |
| "WebSocket connection failed" | Network or firewall blocking | Check firewall rules and network connectivity |
| "Authentication failed" | Invalid tokens or expired session | Refresh page or check AWS credentials |
| "Session timeout" | Chat session expired | Start new chat session |

### Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Message send failed" | Network error or invalid message | Check network and message content |
| "File upload failed" | File too large or invalid type | Check file size and type restrictions |
| "Agent disconnected" | Agent logged out or network issue | Wait for reconnection or start new chat |

## Debugging Tools

### Enable Debug Mode

```javascript
// Enable detailed logging
window.AWSConnectChatWidgetConfig = {
    debug: true,
    // ... other config
};
```

### Browser Developer Tools

1. **Console Tab**
   - Look for error messages
   - Check for failed network requests
   - Monitor WebSocket connections

2. **Network Tab**
   - Verify script loading
   - Check API calls to AWS Connect
   - Monitor WebSocket traffic

3. **Application Tab**
   - Check localStorage for widget data
   - Verify session storage

### Custom Error Handling

```javascript
{
    events: {
        onError: (error) => {
            // Log detailed error information
            console.group('Widget Error');
            console.error('Type:', error.type);
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Stack:', error.stack);
            console.groupEnd();
            
            // Send to error tracking service
            if (window.Sentry) {
                Sentry.captureException(error);
            }
        }
    }
}
```

## Testing Checklist

### Pre-deployment Testing

- [ ] Widget loads without errors
- [ ] Chat button appears in correct position
- [ ] Chat window opens and closes properly
- [ ] Messages send and receive correctly
- [ ] File uploads work (if enabled)
- [ ] Agent connection/disconnection handled properly
- [ ] Error states display appropriate messages
- [ ] Widget destroys cleanly on page unload

### Cross-browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Network Conditions Testing

- [ ] Fast 3G connection
- [ ] Slow 3G connection
- [ ] Offline/online transitions
- [ ] High latency connections

### Accessibility Testing

- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] High contrast mode
- [ ] Color blindness considerations

## Monitoring and Analytics

### Key Metrics to Monitor

1. **Widget Performance**
   - Load time
   - Memory usage
   - Error rate
   - User engagement

2. **Chat Metrics**
   - Connection success rate
   - Message delivery rate
   - Average response time
   - Chat completion rate

3. **Error Tracking**
   - Configuration errors
   - Connection failures
   - Message send failures
   - Browser compatibility issues

### Monitoring Setup

```javascript
// Google Analytics integration
{
    analytics: {
        provider: 'google',
        trackingId: 'GA_TRACKING_ID',
        events: {
            chatStart: 'chat_started',
            chatEnd: 'chat_ended',
            messagesSent: 'messages_sent',
            errors: 'widget_error'
        }
    },
    events: {
        onError: (error) => {
            gtag('event', 'widget_error', {
                'error_type': error.type,
                'error_code': error.code,
                'error_message': error.message
            });
        }
    }
}
```

## Getting Help

### Before Contacting Support

1. Check this troubleshooting guide
2. Review the [FAQ](./faq.md)
3. Test with minimal configuration
4. Gather error logs and browser information

### Information to Provide

When contacting support, include:

- Widget version
- Browser and version
- Operating system
- Complete error messages
- Network configuration details
- AWS Connect instance details (without sensitive info)
- Steps to reproduce the issue

### Support Channels

- Email: support@example.com
- Documentation: [docs.example.com](https://docs.example.com)
- GitHub Issues: [github.com/example/aws-connect-chat-widget](https://github.com/example/aws-connect-chat-widget)

## Advanced Troubleshooting

### Memory Leaks

```javascript
// Monitor memory usage
const checkMemory = () => {
    if (performance.memory) {
        console.log('Memory usage:', {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        });
    }
};

// Check memory every 30 seconds
setInterval(checkMemory, 30000);
```

### WebSocket Debugging

```javascript
// Monitor WebSocket events
const originalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
    const ws = new originalWebSocket(url, protocols);
    
    ws.addEventListener('open', (event) => {
        console.log('WebSocket opened:', url);
    });
    
    ws.addEventListener('close', (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
    });
    
    ws.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
    });
    
    ws.addEventListener('message', (event) => {
        console.log('WebSocket message:', event.data);
    });
    
    return ws;
};
```

### Network Request Debugging

```javascript
// Monitor fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch request:', args[0]);
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('Fetch response:', response.status, response.statusText);
            return response;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
};
```
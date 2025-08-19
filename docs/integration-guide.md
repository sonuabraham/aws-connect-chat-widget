# Widget Integration Guide

This guide shows you how to embed the AWS Connect Chat Widget on your website.

## Quick Integration

The simplest way to add the widget to your website:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <!-- Your website content -->
    
    <!-- AWS Connect Chat Widget -->
    <script>
        // Configure the widget before it loads
        window.AWSConnectChatWidgetConfig = {
            aws: {
                region: 'us-east-1',
                instanceId: 'your-instance-id',
                contactFlowId: 'your-contact-flow-id',
                apiGatewayEndpoint: 'https://your-api-gateway-url'
            }
        };
    </script>
    <script src="https://cdn.example.com/aws-connect-chat-widget/integration.js"></script>
</body>
</html>
```

## Integration Methods

### Method 1: CDN Integration (Recommended)

Use our hosted CDN for automatic updates and optimal performance:

```html
<script>
    window.AWSConnectChatWidgetConfig = {
        aws: {
            region: 'us-east-1',
            instanceId: 'your-instance-id',
            contactFlowId: 'your-contact-flow-id',
            apiGatewayEndpoint: 'https://your-api-gateway-url'
        },
        ui: {
            theme: {
                primaryColor: '#007bff'
            },
            position: {
                bottom: '20px',
                right: '20px'
            }
        }
    };
</script>
<script src="https://cdn.example.com/aws-connect-chat-widget/integration.js"></script>
```

### Method 2: Self-Hosted Integration

Download and host the widget files on your own server:

1. Download the widget bundle from our releases page
2. Extract the files to your web server
3. Include the files in your HTML:

```html
<link rel="stylesheet" href="/path/to/aws-connect-chat-widget.css">
<script src="/path/to/aws-connect-chat-widget.umd.js"></script>
<script>
    AWSConnectChatWidget.init({
        aws: {
            region: 'us-east-1',
            instanceId: 'your-instance-id',
            contactFlowId: 'your-contact-flow-id',
            apiGatewayEndpoint: 'https://your-api-gateway-url'
        }
    });
</script>
```

### Method 3: NPM Package (For React/Vue/Angular Apps)

Install via npm for modern web applications:

```bash
npm install aws-connect-chat-widget
```

```javascript
import { AWSConnectChatWidget } from 'aws-connect-chat-widget';
import 'aws-connect-chat-widget/dist/style.css';

// Initialize the widget
const widget = AWSConnectChatWidget.init({
    aws: {
        region: 'us-east-1',
        instanceId: 'your-instance-id',
        contactFlowId: 'your-contact-flow-id',
        apiGatewayEndpoint: 'https://your-api-gateway-url'
    }
});
```

## Configuration Options

### Required Configuration

```javascript
{
    aws: {
        region: 'us-east-1',                    // AWS region
        instanceId: 'your-instance-id',        // AWS Connect instance ID
        contactFlowId: 'your-contact-flow-id', // Contact flow ID
        apiGatewayEndpoint: 'https://api.example.com' // API Gateway endpoint
    }
}
```

### Complete Configuration Example

```javascript
{
    aws: {
        region: 'us-east-1',
        instanceId: 'your-instance-id',
        contactFlowId: 'your-contact-flow-id',
        apiGatewayEndpoint: 'https://api.example.com'
    },
    ui: {
        theme: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: '8px'
        },
        position: {
            bottom: '20px',
            right: '20px'  // or left: '20px'
        },
        messages: {
            welcomeMessage: 'Hello! How can we help you today?',
            offlineMessage: 'We are currently offline. Please leave a message.',
            waitingMessage: 'Connecting you to an agent...'
        }
    },
    features: {
        fileUpload: true,
        emojiPicker: false,
        chatRatings: true,
        chatTranscript: true
    }
}
```

## Advanced Integration

### Conditional Loading

Load the widget only under certain conditions:

```javascript
// Only load during business hours
const now = new Date();
const hour = now.getHours();
const isBusinessHours = hour >= 9 && hour <= 17;

if (isBusinessHours) {
    // Load widget
    const script = document.createElement('script');
    script.src = 'https://cdn.example.com/aws-connect-chat-widget/integration.js';
    document.head.appendChild(script);
}
```

### Dynamic Configuration

Update configuration based on user context:

```javascript
// Configure based on user type
const userType = getUserType(); // Your function to determine user type
const config = {
    aws: {
        region: 'us-east-1',
        instanceId: 'your-instance-id',
        contactFlowId: userType === 'premium' ? 'premium-flow-id' : 'standard-flow-id',
        apiGatewayEndpoint: 'https://api.example.com'
    },
    ui: {
        messages: {
            welcomeMessage: userType === 'premium' 
                ? 'Welcome back! Our premium support team is here to help.'
                : 'Hello! How can we help you today?'
        }
    }
};

window.AWSConnectChatWidgetConfig = config;
```

### Multiple Widgets

Run multiple widgets for different purposes:

```javascript
// Sales widget
const salesWidget = AWSConnectChatWidget.init({
    aws: {
        region: 'us-east-1',
        instanceId: 'your-instance-id',
        contactFlowId: 'sales-flow-id',
        apiGatewayEndpoint: 'https://api.example.com'
    },
    ui: {
        theme: { primaryColor: '#28a745' },
        position: { bottom: '20px', right: '20px' }
    }
});

// Support widget
const supportWidget = AWSConnectChatWidget.init({
    aws: {
        region: 'us-east-1',
        instanceId: 'your-instance-id',
        contactFlowId: 'support-flow-id',
        apiGatewayEndpoint: 'https://api.example.com'
    },
    ui: {
        theme: { primaryColor: '#dc3545' },
        position: { bottom: '20px', left: '20px' }
    }
});
```

## Content Security Policy (CSP)

If your site uses CSP, add these directives:

```
script-src 'self' https://cdn.example.com https://unpkg.com;
style-src 'self' 'unsafe-inline' https://cdn.example.com;
connect-src 'self' https://your-api-gateway-url wss://your-websocket-url;
img-src 'self' data: https:;
```

## Framework-Specific Integration

### React

```jsx
import React, { useEffect } from 'react';

function App() {
    useEffect(() => {
        // Load widget after component mounts
        const script = document.createElement('script');
        script.src = 'https://cdn.example.com/aws-connect-chat-widget/integration.js';
        script.onload = () => {
            window.AWSConnectChatWidgetAPI.init({
                aws: {
                    region: 'us-east-1',
                    instanceId: 'your-instance-id',
                    contactFlowId: 'your-contact-flow-id',
                    apiGatewayEndpoint: 'https://api.example.com'
                }
            });
        };
        document.head.appendChild(script);

        // Cleanup on unmount
        return () => {
            if (window.AWSConnectChatWidgetAPI) {
                window.AWSConnectChatWidgetAPI.destroy();
            }
        };
    }, []);

    return (
        <div className="App">
            {/* Your app content */}
        </div>
    );
}
```

### Vue.js

```vue
<template>
    <div id="app">
        <!-- Your app content -->
    </div>
</template>

<script>
export default {
    name: 'App',
    mounted() {
        this.loadChatWidget();
    },
    beforeDestroy() {
        if (window.AWSConnectChatWidgetAPI) {
            window.AWSConnectChatWidgetAPI.destroy();
        }
    },
    methods: {
        loadChatWidget() {
            const script = document.createElement('script');
            script.src = 'https://cdn.example.com/aws-connect-chat-widget/integration.js';
            script.onload = () => {
                window.AWSConnectChatWidgetAPI.init({
                    aws: {
                        region: 'us-east-1',
                        instanceId: 'your-instance-id',
                        contactFlowId: 'your-contact-flow-id',
                        apiGatewayEndpoint: 'https://api.example.com'
                    }
                });
            };
            document.head.appendChild(script);
        }
    }
};
</script>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
    
    ngOnInit() {
        this.loadChatWidget();
    }
    
    ngOnDestroy() {
        if ((window as any).AWSConnectChatWidgetAPI) {
            (window as any).AWSConnectChatWidgetAPI.destroy();
        }
    }
    
    private loadChatWidget() {
        const script = document.createElement('script');
        script.src = 'https://cdn.example.com/aws-connect-chat-widget/integration.js';
        script.onload = () => {
            (window as any).AWSConnectChatWidgetAPI.init({
                aws: {
                    region: 'us-east-1',
                    instanceId: 'your-instance-id',
                    contactFlowId: 'your-contact-flow-id',
                    apiGatewayEndpoint: 'https://api.example.com'
                }
            });
        };
        document.head.appendChild(script);
    }
}
```

## Testing Your Integration

### Basic Functionality Test

1. Load your website with the widget
2. Verify the chat button appears
3. Click the button to open the chat window
4. Enter a name and start a chat
5. Verify connection to AWS Connect

### Cross-Browser Testing

Test on these browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Testing

Monitor these metrics:
- Page load time impact
- Memory usage during chat sessions
- Network requests and data usage
- Mobile performance

## Deployment Checklist

- [ ] AWS Connect instance configured
- [ ] Contact flow created and published
- [ ] API Gateway endpoint deployed
- [ ] Widget configuration values updated
- [ ] CSP headers configured (if applicable)
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Performance impact assessed
- [ ] Error handling tested
- [ ] Agent training completed

## Next Steps

- [Customize the widget appearance](./customization-guide.md)
- [Review the API reference](./api-reference.md)
- [Set up monitoring and analytics](./monitoring-guide.md)
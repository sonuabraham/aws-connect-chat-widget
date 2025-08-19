# AWS Connect Setup Guide

This guide walks you through setting up AWS Connect and configuring the chat widget for your website.

## Prerequisites

- AWS Account with appropriate permissions
- AWS Connect instance (or ability to create one)
- Basic understanding of AWS services

## Step 1: Set Up AWS Connect Instance

### Create a New Instance (if needed)

1. Go to the [AWS Connect Console](https://console.aws.amazon.com/connect/)
2. Click "Add an instance"
3. Choose "Store users within Amazon Connect"
4. Provide an instance alias (e.g., "my-company-support")
5. Create an administrator user
6. Configure telephony options (can be skipped for chat-only)
7. Review and create the instance

### Note Your Instance Details

After creating your instance, note these important values:
- **Instance ID**: Found in the instance ARN (e.g., `arn:aws:connect:us-east-1:123456789012:instance/12345678-1234-1234-1234-123456789012`)
- **Instance Alias**: The friendly name you chose
- **Region**: The AWS region where your instance is located

## Step 2: Create a Contact Flow

### Basic Chat Contact Flow

1. In your Connect instance, go to "Routing" → "Contact flows"
2. Click "Create contact flow"
3. Choose "Contact flow (inbound)"
4. Add these blocks:
   - **Set working queue**: Choose your default queue
   - **Set customer queue flow**: Optional, for queue experience
   - **Transfer to queue**: Connect to your working queue
5. Connect the blocks: Start → Set working queue → Transfer to queue
6. Save and publish the contact flow
7. **Note the Contact Flow ID** from the URL or ARN

### Advanced Contact Flow (Optional)

For more sophisticated routing, you can add:
- Business hours checking
- Queue capacity checks
- Customer input collection
- Dynamic agent routing

## Step 3: Configure Chat Settings

### Enable Chat for Your Instance

1. Go to "Channels" → "Chat" in your Connect console
2. Enable chat if not already enabled
3. Configure chat settings:
   - **Chat duration**: How long chats remain active
   - **Chat transcript**: Enable if you want chat history
   - **File attachments**: Enable if you want file sharing

### Set Up API Gateway (Required)

The widget requires an API Gateway endpoint to initiate chat sessions:

1. Go to the [API Gateway Console](https://console.aws.amazon.com/apigateway/)
2. Create a new REST API
3. Create a resource `/chat`
4. Create a POST method on `/chat`
5. Set up Lambda integration (see Lambda function below)
6. Enable CORS for your domain
7. Deploy the API and note the endpoint URL

### Lambda Function for Chat Initiation

Create a Lambda function to handle chat session creation:

```javascript
const AWS = require('aws-sdk');
const connect = new AWS.Connect();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*', // Configure for your domain
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }
    
    try {
        const body = JSON.parse(event.body);
        const { participantDetails, contactFlowId, instanceId } = body;
        
        const params = {
            InstanceId: instanceId,
            ContactFlowId: contactFlowId,
            ParticipantDetails: {
                DisplayName: participantDetails.displayName || 'Website Visitor'
            },
            Attributes: {
                customerName: participantDetails.displayName || 'Anonymous',
                source: 'website-chat-widget'
            }
        };
        
        const result = await connect.startChatContact(params).promise();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                contactId: result.ContactId,
                participantId: result.ParticipantId,
                participantToken: result.ParticipantToken
            })
        };
    } catch (error) {
        console.error('Error starting chat:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to start chat session' })
        };
    }
};
```

### Required IAM Permissions

Your Lambda function needs these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "connect:StartChatContact"
            ],
            "Resource": "arn:aws:connect:*:*:instance/YOUR_INSTANCE_ID/*"
        }
    ]
}
```

## Step 4: Configure Agent Experience

### Set Up Agent Workspace

1. Go to "Users" → "User management"
2. Create or edit agent users
3. Assign appropriate security profiles
4. Ensure agents have "Chat" permissions

### Agent Training

Ensure your agents understand:
- How to accept chat contacts
- Chat-specific features (typing indicators, file sharing)
- How to transfer or escalate chats
- Best practices for chat communication

## Step 5: Test Your Configuration

### Test Contact Flow

1. Use the Connect test chat feature
2. Verify the contact flow routes correctly
3. Test with different scenarios (business hours, queue capacity)

### Test API Gateway

Use a tool like Postman to test your API:

```bash
curl -X POST https://your-api-gateway-url/chat \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "your-instance-id",
    "contactFlowId": "your-contact-flow-id",
    "participantDetails": {
      "displayName": "Test User"
    }
  }'
```

## Configuration Values Summary

After completing the setup, you'll have these values for the widget:

```javascript
{
  aws: {
    region: 'us-east-1',                    // Your AWS region
    instanceId: 'your-instance-id',        // From Step 1
    contactFlowId: 'your-contact-flow-id', // From Step 2
    apiGatewayEndpoint: 'https://your-api-gateway-url' // From Step 3
  }
}
```

## Security Considerations

### CORS Configuration

Configure CORS on your API Gateway to only allow your domain:

```json
{
  "Access-Control-Allow-Origin": "https://yourdomain.com",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}
```

### Rate Limiting

Consider implementing rate limiting to prevent abuse:
- API Gateway throttling
- Lambda concurrency limits
- Connect contact limits

### Data Privacy

- Configure appropriate data retention policies
- Ensure compliance with GDPR/CCPA if applicable
- Consider encrypting sensitive data in transit and at rest

## Next Steps

Once your AWS Connect is configured:
1. [Integrate the widget](./integration-guide.md) on your website
2. [Customize the appearance](./customization-guide.md) to match your brand
3. [Test thoroughly](./troubleshooting.md#testing-checklist) before going live

## Common Issues

- **Contact flow not found**: Verify the contact flow ID and ensure it's published
- **API Gateway errors**: Check CORS configuration and Lambda permissions
- **Chat not connecting**: Verify instance ID and region settings
- **Agents not receiving chats**: Check agent status and queue assignments
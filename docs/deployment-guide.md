# Deployment Guide

This guide covers the complete deployment pipeline for the AWS Connect Chat Widget, including build processes, CDN deployment, monitoring, and maintenance.

## Overview

The deployment pipeline supports multiple environments with automated builds, testing, and deployment through GitHub Actions. The widget is distributed via CDN with versioning support and comprehensive monitoring.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ • Local testing │───▶│ • Integration   │───▶│ • Live traffic  │
│ • Hot reload    │    │ • E2E testing   │    │ • Versioned     │
│ • Debug mode    │    │ • Performance   │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │    │   S3 Staging    │    │ S3 Production   │
│                 │    │                 │    │                 │
│ • Source code   │    │ • staging-cdn   │    │ • cdn.example   │
│ • CI/CD config  │    │ • Short cache   │    │ • Long cache    │
│ • Tests         │    │ • Debug enabled │    │ • Optimized     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Development Environment

- Node.js 20.7.0 or higher
- npm 10.x or higher
- Git
- AWS CLI (for deployment)

### AWS Resources

- **S3 Buckets**: For hosting widget files
- **CloudFront Distributions**: For CDN delivery
- **IAM Roles**: For deployment permissions
- **CloudWatch**: For monitoring and alerting

### Third-party Services (Optional)

- **Sentry**: Error tracking and monitoring
- **Google Analytics**: Usage analytics
- **Slack**: Deployment notifications

## Environment Setup

### 1. Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/aws-connect-chat-widget.git
cd aws-connect-chat-widget

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. AWS Infrastructure Setup

#### S3 Buckets

Create S3 buckets for each environment:

```bash
# Staging bucket
aws s3 mb s3://aws-connect-widget-staging --region us-east-1

# Production bucket
aws s3 mb s3://aws-connect-widget-production --region us-east-1
```

Configure bucket policies for public read access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::aws-connect-widget-production/*"
        }
    ]
}
```

#### CloudFront Distributions

Create CloudFront distributions for global CDN delivery:

```bash
# Create distribution (use AWS Console or CloudFormation)
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

Example CloudFront configuration:

```json
{
    "CallerReference": "aws-connect-widget-production-2024",
    "Comment": "AWS Connect Chat Widget CDN",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-aws-connect-widget-production",
                "DomainName": "aws-connect-widget-production.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-aws-connect-widget-production",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "Compress": true
    },
    "Enabled": true,
    "PriceClass": "PriceClass_All"
}
```

### 3. GitHub Actions Setup

Configure repository secrets and variables:

#### Secrets

```bash
# AWS credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
SLACK_WEBHOOK_URL=your-slack-webhook

# Analytics
GA_TRACKING_ID=your-google-analytics-id
```

#### Variables

```bash
# AWS configuration
AWS_REGION=us-east-1

# Staging environment
STAGING_S3_BUCKET=aws-connect-widget-staging
STAGING_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
STAGING_DOMAIN=staging-cdn.example.com

# Production environment
PRODUCTION_S3_BUCKET=aws-connect-widget-production
PRODUCTION_CLOUDFRONT_DISTRIBUTION_ID=E0987654321XYZ
PRODUCTION_DOMAIN=cdn.example.com
```

## Build Process

### 1. Local Build

```bash
# Build all variants
npm run build:all

# Individual builds
npm run build          # Regular app build
npm run build:lib      # Library build
npm run build:widget   # Widget bundle
```

### 2. Build Outputs

The build process generates several outputs:

```
dist/
├── index.html                           # Demo app
├── assets/                              # App assets
├── aws-connect-chat-widget.umd.js      # UMD bundle
├── aws-connect-chat-widget.es.js       # ES module
├── aws-connect-chat-widget.css         # Styles
└── widget/                             # Deployment package
    ├── aws-connect-chat-widget.umd.js
    ├── aws-connect-chat-widget.css
    ├── integration.js
    ├── example.html
    ├── README.md
    └── package.json
```

### 3. Build Optimization

The build process includes:

- **Code Splitting**: Separate vendor and application code
- **Tree Shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Source Maps**: For debugging
- **Asset Optimization**: Compress images and fonts

## Deployment Process

### 1. Automated Deployment (Recommended)

Deployments are triggered automatically:

- **Staging**: On push to `develop` branch
- **Production**: On tagged releases (`v*`)

```bash
# Create a release
git tag v1.2.3
git push origin v1.2.3
```

### 2. Manual Deployment

For manual deployments:

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production with version
npm run deploy:production 1.2.3
```

### 3. Deployment Steps

Each deployment includes:

1. **Build Validation**: Ensure all builds complete successfully
2. **Testing**: Run unit, integration, and E2E tests
3. **Security Scan**: Check for vulnerabilities
4. **Package Creation**: Generate deployment artifacts
5. **S3 Upload**: Deploy files to S3 bucket
6. **CloudFront Invalidation**: Clear CDN cache
7. **Health Checks**: Verify deployment success
8. **Monitoring Setup**: Update monitoring configuration
9. **Notifications**: Send deployment notifications

## Versioning Strategy

### 1. Semantic Versioning

We use semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### 2. Version Management

```bash
# Update version
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.1 → 1.1.0
npm version major   # 1.1.0 → 2.0.0
```

### 3. CDN Versioning

Production deployments create two sets of URLs:

**Latest URLs** (recommended):
```
https://cdn.example.com/widget/latest/integration.js
https://cdn.example.com/widget/latest/aws-connect-chat-widget.umd.js
https://cdn.example.com/widget/latest/aws-connect-chat-widget.css
```

**Versioned URLs** (immutable):
```
https://cdn.example.com/widget/v1.2.3/integration.js
https://cdn.example.com/widget/v1.2.3/aws-connect-chat-widget.umd.js
https://cdn.example.com/widget/v1.2.3/aws-connect-chat-widget.css
```

## Monitoring and Alerting

### 1. Health Checks

Automated health checks run every 5 minutes:

```bash
# Check staging
npm run health:staging

# Check production
npm run health:production
```

### 2. Metrics Tracked

- **Availability**: Uptime percentage
- **Response Time**: CDN response times
- **Error Rate**: 4xx/5xx error percentage
- **Traffic**: Request volume and bandwidth
- **Performance**: Core Web Vitals

### 3. Alerting

Alerts are configured for:

- **High Error Rate**: >5% errors in 5 minutes
- **High Latency**: >2 seconds average response time
- **Low Availability**: <99.9% uptime
- **Deployment Failures**: Failed deployments

### 4. Monitoring Setup

```bash
# Set up monitoring infrastructure
npm run setup:monitoring
```

This creates:
- CloudWatch dashboards
- CloudWatch alarms
- Sentry error tracking
- Performance monitoring
- Analytics integration

## Rollback Procedures

### 1. Automatic Rollback

Failed deployments trigger automatic rollback:

- Health checks fail after deployment
- Error rate exceeds threshold
- Critical alerts triggered

### 2. Manual Rollback

```bash
# Rollback to previous version
aws s3 sync s3://backup-bucket/v1.2.2/ s3://production-bucket/widget/latest/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E123456789 --paths "/widget/latest/*"
```

### 3. Emergency Procedures

For critical issues:

1. **Immediate**: Switch to maintenance mode
2. **Rollback**: Deploy previous stable version
3. **Investigate**: Analyze logs and metrics
4. **Fix**: Address root cause
5. **Deploy**: Release hotfix

## Security Considerations

### 1. Access Control

- **S3 Buckets**: Public read, restricted write
- **CloudFront**: HTTPS only, security headers
- **GitHub**: Protected branches, required reviews
- **AWS**: Least privilege IAM policies

### 2. Content Security Policy

```javascript
{
    "script-src": ["'self'", "https://cdn.example.com", "https://unpkg.com"],
    "style-src": ["'self'", "'unsafe-inline'", "https://cdn.example.com"],
    "connect-src": ["'self'", "wss://*.amazonaws.com"]
}
```

### 3. Vulnerability Management

- **Dependency Scanning**: Automated security scans
- **SAST**: Static application security testing
- **Container Scanning**: Docker image vulnerabilities
- **Regular Updates**: Keep dependencies current

## Performance Optimization

### 1. CDN Configuration

- **Global Distribution**: Edge locations worldwide
- **Compression**: Gzip/Brotli compression
- **Caching**: Optimized cache headers
- **HTTP/2**: Modern protocol support

### 2. Bundle Optimization

- **Code Splitting**: Separate vendor bundles
- **Tree Shaking**: Remove unused code
- **Minification**: Compress all assets
- **Lazy Loading**: Load components on demand

### 3. Monitoring

- **Core Web Vitals**: LCP, FID, CLS tracking
- **Resource Timing**: Load performance metrics
- **User Experience**: Real user monitoring

## Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check build logs
npm run build:all 2>&1 | tee build.log

# Verify AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://your-bucket-name
```

#### CDN Issues

```bash
# Check CloudFront status
aws cloudfront get-distribution --id E123456789

# Test CDN endpoints
curl -I https://cdn.example.com/widget/latest/integration.js

# Invalidate cache
aws cloudfront create-invalidation --distribution-id E123456789 --paths "/*"
```

#### Health Check Failures

```bash
# Run manual health check
npm run health:production

# Check specific endpoints
curl -f https://cdn.example.com/widget/latest/health.json

# Review CloudWatch logs
aws logs tail /aws/lambda/health-check --follow
```

### Debug Mode

Enable debug mode for troubleshooting:

```javascript
window.AWSConnectChatWidgetConfig = {
    debug: true,
    // ... other config
};
```

## Maintenance

### 1. Regular Tasks

- **Weekly**: Review monitoring dashboards
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Architecture review

### 2. Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit
```

### 3. Performance Reviews

- Monitor Core Web Vitals trends
- Review CDN performance metrics
- Analyze user experience data
- Optimize based on findings

## Best Practices

### 1. Development

- Use feature branches for development
- Write comprehensive tests
- Follow code review process
- Document changes thoroughly

### 2. Deployment

- Test in staging before production
- Use automated deployments
- Monitor deployments closely
- Have rollback plan ready

### 3. Monitoring

- Set up comprehensive alerting
- Review metrics regularly
- Investigate anomalies promptly
- Maintain monitoring infrastructure

### 4. Security

- Keep dependencies updated
- Follow security best practices
- Regular security audits
- Incident response procedures

## Support and Escalation

### 1. Support Levels

- **L1**: Basic troubleshooting and monitoring
- **L2**: Advanced debugging and configuration
- **L3**: Architecture and development issues

### 2. Escalation Procedures

1. **Check monitoring dashboards**
2. **Review recent deployments**
3. **Analyze error logs**
4. **Contact on-call engineer**
5. **Escalate to development team**

### 3. Contact Information

- **Development Team**: dev-team@example.com
- **DevOps Team**: devops@example.com
- **On-call**: +1-555-ON-CALL
- **Slack**: #aws-connect-widget
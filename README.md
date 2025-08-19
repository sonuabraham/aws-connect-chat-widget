# AWS Connect Chat Widget

A React TypeScript chat widget that integrates with AWS Connect to provide real-time customer support chat functionality for websites.

## Features

- Real-time chat with AWS Connect agents
- Customizable appearance and theming
- Mobile-responsive design
- Accessibility compliant
- Easy website integration

## Development

### Prerequisites

- Node.js 20.7.0 or higher
- npm

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Run tests:
```bash
npm test
```

4. Run linting:
```bash
npm run lint
```

5. Format code:
```bash
npm run format
```

### Project Structure

```
src/
├── components/     # React components
├── services/       # AWS Connect integration services
├── types/          # TypeScript type definitions
├── styles/         # CSS and theme files
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── constants/      # Application constants
└── test/           # Test setup and utilities
```

## Building

```bash
npm run build
```

## Testing

- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
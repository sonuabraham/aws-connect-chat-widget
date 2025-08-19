import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ThemeProvider } from './ThemeProvider';
import type { ChatState } from '../types/chat';
import type {
  ThemeConfiguration,
  PositionConfiguration,
  UIConfiguration,
} from '../types/widget';

describe('UI Components', () => {
  const mockTheme: ThemeConfiguration = {
    primaryColor: '#007bff',
    secondaryColor: '#0056b3',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '8px',
  };

  const mockPosition: PositionConfiguration = {
    bottom: '20px',
    right: '20px',
  };

  const mockUIConfig: UIConfiguration = {
    theme: mockTheme,
    position: mockPosition,
    messages: {
      welcomeMessage: 'Welcome!',
      offlineMessage: 'We are offline',
      waitingMessage: 'Please wait...',
      connectingMessage: 'Connecting...',
    },
  };

  const mockChatState: ChatState = {
    status: 'closed',
    messages: [],
    visitor: {
      name: 'Test User',
      sessionId: 'test-session',
    },
    unreadCount: 0,
    isTyping: false,
  };

  it('should render ChatButton without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <ChatButton
          isOpen={false}
          unreadCount={0}
          onClick={() => {}}
          config={mockTheme}
          position={mockPosition}
        />
      </ThemeProvider>
    );
    expect(container).toBeTruthy();
  });

  it('should render ChatWindow without crashing', () => {
    const { container } = render(
      <ChatWindow
        isOpen={true}
        onClose={() => {}}
        onMinimize={() => {}}
        chatState={mockChatState}
        config={mockUIConfig}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render MessageList without crashing', () => {
    const { container } = render(
      <MessageList messages={[]} isTyping={false} onScroll={() => {}} />
    );
    expect(container).toBeTruthy();
  });

  it('should render MessageInput without crashing', () => {
    const { container } = render(
      <MessageInput
        onSendMessage={() => {}}
        disabled={false}
        placeholder="Type a message..."
      />
    );
    expect(container).toBeTruthy();
  });
});

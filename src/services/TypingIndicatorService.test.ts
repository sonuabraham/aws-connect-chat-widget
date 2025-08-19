import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TypingIndicatorService } from './TypingIndicatorService';

describe('TypingIndicatorService', () => {
  let typingService: TypingIndicatorService;

  beforeEach(() => {
    vi.useFakeTimers();
    typingService = new TypingIndicatorService();
  });

  afterEach(() => {
    typingService.cleanup();
    vi.useRealTimers();
  });

  describe('typing indicator handling', () => {
    it('should handle new typing indicator', () => {
      const onTypingStart = vi.fn();
      typingService.on('onTypingStart', onTypingStart);

      typingService.handleTypingIndicator('agent-1');

      expect(onTypingStart).toHaveBeenCalledWith('agent-1');
      expect(typingService.isParticipantTyping('agent-1')).toBe(true);
      expect(typingService.getTypingParticipants()).toContain('agent-1');
    });

    it('should auto-stop typing after timeout', () => {
      const onTypingStart = vi.fn();
      const onTypingStop = vi.fn();
      typingService.on('onTypingStart', onTypingStart);
      typingService.on('onTypingStop', onTypingStop);

      typingService.handleTypingIndicator('agent-1');

      // Advance time past timeout
      vi.advanceTimersByTime(3000);

      expect(onTypingStop).toHaveBeenCalledWith('agent-1');
      expect(typingService.isParticipantTyping('agent-1')).toBe(false);
    });

    it('should extend typing timeout on repeated indicators', () => {
      const onTypingStart = vi.fn();
      const onTypingStop = vi.fn();
      typingService.on('onTypingStart', onTypingStart);
      typingService.on('onTypingStop', onTypingStop);

      typingService.handleTypingIndicator('agent-1');

      // Send another indicator before timeout
      vi.advanceTimersByTime(1500);
      typingService.handleTypingIndicator('agent-1');

      // Advance to original timeout
      vi.advanceTimersByTime(1500);
      expect(onTypingStop).not.toHaveBeenCalled();

      // Advance to extended timeout
      vi.advanceTimersByTime(1500);
      expect(onTypingStop).toHaveBeenCalledWith('agent-1');
    });

    it('should manually stop typing', () => {
      const onTypingStart = vi.fn();
      const onTypingStop = vi.fn();
      typingService.on('onTypingStart', onTypingStart);
      typingService.on('onTypingStop', onTypingStop);

      typingService.handleTypingIndicator('agent-1');
      typingService.stopTyping('agent-1');

      expect(onTypingStop).toHaveBeenCalledWith('agent-1');
      expect(typingService.isParticipantTyping('agent-1')).toBe(false);
    });
  });

  describe('user typing handling', () => {
    it('should debounce user typing', () => {
      const onSendTypingIndicator = vi.fn();
      typingService.on('onSendTypingIndicator', onSendTypingIndicator);

      typingService.handleUserTyping();
      typingService.handleUserTyping();
      typingService.handleUserTyping();

      // Should not send immediately
      expect(onSendTypingIndicator).not.toHaveBeenCalled();

      // Should send after delay
      vi.advanceTimersByTime(1000);
      expect(onSendTypingIndicator).toHaveBeenCalledTimes(1);
    });

    it('should cancel user typing', () => {
      const onSendTypingIndicator = vi.fn();
      typingService.on('onSendTypingIndicator', onSendTypingIndicator);

      typingService.handleUserTyping();
      typingService.stopUserTyping();

      vi.advanceTimersByTime(1000);
      expect(onSendTypingIndicator).not.toHaveBeenCalled();
    });
  });

  describe('multiple participants', () => {
    it('should handle multiple typing participants', () => {
      const onTypingStart = vi.fn();
      typingService.on('onTypingStart', onTypingStart);

      typingService.handleTypingIndicator('agent-1');
      typingService.handleTypingIndicator('agent-2');

      expect(typingService.getTypingParticipants()).toHaveLength(2);
      expect(typingService.isAnyoneTyping()).toBe(true);
    });

    it('should stop individual participants', () => {
      typingService.handleTypingIndicator('agent-1');
      typingService.handleTypingIndicator('agent-2');

      typingService.stopTyping('agent-1');

      expect(typingService.isParticipantTyping('agent-1')).toBe(false);
      expect(typingService.isParticipantTyping('agent-2')).toBe(true);
      expect(typingService.getTypingParticipants()).toHaveLength(1);
    });

    it('should clear all typing indicators', () => {
      const onTypingStop = vi.fn();
      typingService.on('onTypingStop', onTypingStop);

      typingService.handleTypingIndicator('agent-1');
      typingService.handleTypingIndicator('agent-2');

      typingService.clearAll();

      expect(onTypingStop).toHaveBeenCalledTimes(2);
      expect(typingService.getTypingParticipants()).toHaveLength(0);
      expect(typingService.isAnyoneTyping()).toBe(false);
    });
  });

  describe('typing status', () => {
    it('should provide typing status for all participants', () => {
      typingService.handleTypingIndicator('agent-1');
      typingService.handleTypingIndicator('agent-2');

      const status = typingService.getTypingStatus();

      expect(status).toHaveLength(2);
      expect(status[0]).toMatchObject({
        participantId: 'agent-1',
        lastActivity: expect.any(Date),
      });
    });

    it('should check if anyone is typing', () => {
      expect(typingService.isAnyoneTyping()).toBe(false);

      typingService.handleTypingIndicator('agent-1');
      expect(typingService.isAnyoneTyping()).toBe(true);

      typingService.stopTyping('agent-1');
      expect(typingService.isAnyoneTyping()).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow setting typing timeout', () => {
      const onTypingStop = vi.fn();
      typingService.on('onTypingStop', onTypingStop);
      typingService.setTypingTimeout(5000);

      typingService.handleTypingIndicator('agent-1');

      vi.advanceTimersByTime(3000);
      expect(onTypingStop).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);
      expect(onTypingStop).toHaveBeenCalled();
    });

    it('should allow setting user typing delay', () => {
      const onSendTypingIndicator = vi.fn();
      typingService.on('onSendTypingIndicator', onSendTypingIndicator);
      typingService.setUserTypingDelay(2000);

      typingService.handleUserTyping();

      vi.advanceTimersByTime(1000);
      expect(onSendTypingIndicator).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(onSendTypingIndicator).toHaveBeenCalled();
    });
  });

  describe('event management', () => {
    it('should remove event handlers', () => {
      const onTypingStart = vi.fn();
      typingService.on('onTypingStart', onTypingStart);
      typingService.off('onTypingStart');

      typingService.handleTypingIndicator('agent-1');

      expect(onTypingStart).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup all resources', () => {
      const onTypingStop = vi.fn();
      typingService.on('onTypingStop', onTypingStop);

      typingService.handleTypingIndicator('agent-1');
      typingService.handleUserTyping();

      typingService.cleanup();

      expect(onTypingStop).toHaveBeenCalledWith('agent-1');
      expect(typingService.getTypingParticipants()).toHaveLength(0);

      vi.advanceTimersByTime(1000);
      // Should not trigger any events after cleanup
    });
  });
});

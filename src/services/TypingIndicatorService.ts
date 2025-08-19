/**
 * Typing indicator events
 */
export interface TypingIndicatorEvents {
  onTypingStart: (participantId: string) => void;
  onTypingStop: (participantId: string) => void;
  onSendTypingIndicator: () => void;
}

/**
 * Typing participant information
 */
interface TypingParticipant {
  participantId: string;
  timeout: NodeJS.Timeout;
  lastActivity: Date;
}

/**
 * Typing indicator service for managing typing states
 * Supports requirement 3.4: Implement typing indicators and agent status updates
 */
export class TypingIndicatorService {
  private typingParticipants = new Map<string, TypingParticipant>();
  private userTypingTimeout: NodeJS.Timeout | null = null;
  private events: Partial<TypingIndicatorEvents> = {};
  private typingTimeoutDuration = 3000; // 3 seconds
  private userTypingDelay = 1000; // 1 second delay before sending typing indicator

  /**
   * Set event handlers
   */
  on<K extends keyof TypingIndicatorEvents>(
    event: K,
    handler: TypingIndicatorEvents[K]
  ): void {
    this.events[event] = handler;
  }

  /**
   * Remove event handler
   */
  off<K extends keyof TypingIndicatorEvents>(event: K): void {
    delete this.events[event];
  }

  /**
   * Handle incoming typing indicator from participant
   */
  handleTypingIndicator(participantId: string): void {
    const existing = this.typingParticipants.get(participantId);

    if (existing) {
      // Clear existing timeout and create new one
      clearTimeout(existing.timeout);
      existing.lastActivity = new Date();
    } else {
      // New typing participant
      this.events.onTypingStart?.(participantId);
    }

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      this.stopTyping(participantId);
    }, this.typingTimeoutDuration);

    this.typingParticipants.set(participantId, {
      participantId,
      timeout,
      lastActivity: new Date(),
    });
  }

  /**
   * Stop typing indicator for participant
   */
  stopTyping(participantId: string): void {
    const participant = this.typingParticipants.get(participantId);

    if (participant) {
      clearTimeout(participant.timeout);
      this.typingParticipants.delete(participantId);
      this.events.onTypingStop?.(participantId);
    }
  }

  /**
   * Handle user typing (debounced)
   */
  handleUserTyping(): void {
    // Clear existing timeout
    if (this.userTypingTimeout) {
      clearTimeout(this.userTypingTimeout);
    }

    // Set new timeout to send typing indicator
    this.userTypingTimeout = setTimeout(() => {
      this.events.onSendTypingIndicator?.();
    }, this.userTypingDelay);
  }

  /**
   * Stop user typing indicator
   */
  stopUserTyping(): void {
    if (this.userTypingTimeout) {
      clearTimeout(this.userTypingTimeout);
      this.userTypingTimeout = null;
    }
  }

  /**
   * Get list of participants currently typing
   */
  getTypingParticipants(): string[] {
    return Array.from(this.typingParticipants.keys());
  }

  /**
   * Check if specific participant is typing
   */
  isParticipantTyping(participantId: string): boolean {
    return this.typingParticipants.has(participantId);
  }

  /**
   * Check if any participant is typing
   */
  isAnyoneTyping(): boolean {
    return this.typingParticipants.size > 0;
  }

  /**
   * Get typing status for all participants
   */
  getTypingStatus(): { participantId: string; lastActivity: Date }[] {
    return Array.from(this.typingParticipants.values()).map(participant => ({
      participantId: participant.participantId,
      lastActivity: participant.lastActivity,
    }));
  }

  /**
   * Clear all typing indicators
   */
  clearAll(): void {
    // Clear all timeouts
    this.typingParticipants.forEach(participant => {
      clearTimeout(participant.timeout);
      this.events.onTypingStop?.(participant.participantId);
    });

    this.typingParticipants.clear();
    this.stopUserTyping();
  }

  /**
   * Set typing timeout duration
   */
  setTypingTimeout(duration: number): void {
    this.typingTimeoutDuration = duration;
  }

  /**
   * Set user typing delay
   */
  setUserTypingDelay(delay: number): void {
    this.userTypingDelay = delay;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearAll();
    this.events = {};
  }
}

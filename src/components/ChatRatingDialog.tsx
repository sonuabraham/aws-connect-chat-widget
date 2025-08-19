import React, { useState } from 'react';
import type { ChatRating } from '../types/chat';
import '../styles/ChatRatingDialog.css';

/**
 * Chat rating dialog component props
 */
export interface ChatRatingDialogProps {
  isOpen: boolean;
  onSubmit: (rating: ChatRating) => void;
  onSkip: () => void;
  agentName?: string;
}

/**
 * ChatRatingDialog component - Rating system for completed chats
 * Requirements: 4.4
 */
export const ChatRatingDialog: React.FC<ChatRatingDialogProps> = ({
  isOpen,
  onSubmit,
  onSkip,
  agentName,
}) => {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    
    setIsSubmitting(true);
    
    const rating: ChatRating = {
      score: selectedRating,
      comment: comment.trim() || undefined,
      timestamp: new Date(),
    };
    
    try {
      await onSubmit(rating);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setSelectedRating(0);
    setComment('');
    onSkip();
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Very Poor';
      case 2:
        return 'Poor';
      case 3:
        return 'Average';
      case 4:
        return 'Good';
      case 5:
        return 'Excellent';
      default:
        return 'Select a rating';
    }
  };

  const getCommentPlaceholder = (rating: number): string => {
    if (rating <= 2) {
      return 'Please let us know how we can improve...';
    } else if (rating === 3) {
      return 'Any additional feedback? (optional)';
    } else {
      return 'What did you like about this chat? (optional)';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="chat-rating-dialog-overlay" role="dialog" aria-modal="true">
      <div className="chat-rating-dialog">
        <div className="chat-rating-dialog__header">
          <h3 className="chat-rating-dialog__title">Rate Your Experience</h3>
          <button
            className="chat-rating-dialog__close"
            onClick={handleSkip}
            type="button"
            aria-label="Close rating dialog"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        
        <div className="chat-rating-dialog__content">
          <div className="chat-rating-dialog__message">
            <p className="chat-rating-dialog__primary-text">
              How was your chat experience{agentName ? ` with ${agentName}` : ''}?
            </p>
            <p className="chat-rating-dialog__secondary-text">
              Your feedback helps us improve our service.
            </p>
          </div>
          
          <div className="rating-section">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`rating-star ${
                    star <= (hoveredRating || selectedRating) ? 'rating-star--active' : ''
                  }`}
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  type="button"
                  aria-label={`Rate ${star} out of 5 stars`}
                >
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <path
                      d="M16 2L20.18 10.52L30 12L23 19.48L24.36 30L16 25.54L7.64 30L9 19.48L2 12L11.82 10.52L16 2Z"
                      fill={star <= (hoveredRating || selectedRating) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              ))}
            </div>
            
            <div className="rating-text">
              {getRatingText(hoveredRating || selectedRating)}
            </div>
          </div>
          
          {selectedRating > 0 && (
            <div className="comment-section">
              <label htmlFor="rating-comment" className="comment-label">
                Additional Comments
              </label>
              <textarea
                id="rating-comment"
                className="comment-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={getCommentPlaceholder(selectedRating)}
                rows={3}
                maxLength={500}
              />
              <div className="comment-counter">
                {comment.length}/500
              </div>
            </div>
          )}
        </div>
        
        <div className="chat-rating-dialog__actions">
          <button
            className="chat-rating-dialog__button chat-rating-dialog__button--secondary"
            onClick={handleSkip}
            type="button"
            disabled={isSubmitting}
          >
            Skip
          </button>
          <button
            className="chat-rating-dialog__button chat-rating-dialog__button--primary"
            onClick={handleSubmit}
            type="button"
            disabled={selectedRating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};
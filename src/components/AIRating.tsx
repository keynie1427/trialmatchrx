'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks';

interface AIRatingProps {
  responseId: string;
  context?: string;
}

export default function AIRating({ responseId, context }: AIRatingProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = async (value: 'up' | 'down') => {
    if (submitted) return;
    
    setRating(value);
    setSubmitted(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai_rating',
          rating: value,
          aiResponseId: responseId,
          message: context || '',
          page: window.location.pathname,
          userId: user?.uid || null,
        }),
      });
    } catch (error) {
      console.error('Failed to submit rating:', error);
      setSubmitted(false);
      setRating(null);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-surface-500">
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-surface-500">Was this helpful?</span>
      <button
        onClick={() => handleRating('up')}
        className={`p-1.5 rounded-lg transition-colors ${
          rating === 'up'
            ? 'bg-green-100 text-green-600'
            : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-green-600'
        }`}
        aria-label="Helpful"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        onClick={() => handleRating('down')}
        className={`p-1.5 rounded-lg transition-colors ${
          rating === 'down'
            ? 'bg-red-100 text-red-600'
            : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-red-600'
        }`}
        aria-label="Not helpful"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
    </div>
  );
}

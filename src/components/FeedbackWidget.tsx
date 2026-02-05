'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks';

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          email: email || user?.email || '',
          page: window.location.pathname,
          userId: user?.uid || null,
        }),
      });

      if (response.ok) {
        setSent(true);
        setMessage('');
        setTimeout(() => {
          setSent(false);
          setIsOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Send Feedback"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">Thank You!</h3>
                <p className="text-surface-600 dark:text-surface-400">Your feedback helps us improve.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Send Feedback</h2>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Help us improve MyTrialMatchRX</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Feedback Type
                    </label>
                    <div className="flex gap-2">
                      {(['general', 'bug', 'feature'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            type === t
                              ? 'bg-primary-500 text-white'
                              : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                          }`}
                        >
                          {t === 'bug' ? '🐛 Bug' : t === 'feature' ? '💡 Feature' : '💬 General'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      rows={4}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {!user && (
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 transition-all"
                  >
                    {sending ? 'Sending...' : 'Send Feedback'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay so it doesn't flash on initial render
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
    // Fire any analytics initialization here if needed
    window.dispatchEvent(new Event('cookie-consent-accepted'));
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
            <span className="text-xl">🍪</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-1">
              We use cookies
            </p>
            <p className="text-xs text-surface-400 leading-relaxed">
              We use cookies and similar technologies to improve your experience,
              analyze site usage, and support authentication. Your health data is
              never shared with third parties.{' '}
              <Link
                href="/legal/privacy"
                className="text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-none px-4 py-2 text-sm text-surface-400 hover:text-white border border-surface-600 hover:border-surface-400 rounded-lg transition-all"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-all"
            >
              Accept All
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
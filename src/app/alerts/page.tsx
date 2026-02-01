'use client';

import TrialAlertSetup from '@/components/TrialAlertSetup';
import Link from 'next/link';

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Link 
            href="/" 
            className="text-primary-500 hover:text-primary-600 text-sm flex items-center gap-1"
          >
            ← Back to Home
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
            Trial Alerts
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Get AI-powered email digests when new trials match your profile
          </p>
        </div>

        <TrialAlertSetup />

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📧 What you'll receive
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>• AI-summarized highlights of new matching trials</li>
            <li>• Plain-English explanations of what each trial offers</li>
            <li>• Personalized relevance notes based on your profile</li>
            <li>• Direct links to view full trial details</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

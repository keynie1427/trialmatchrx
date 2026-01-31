import Link from 'next/link';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">
                Trial<span className="text-primary-600 dark:text-primary-400">Match</span>RX
              </span>
            </Link>
            <p className="text-surface-600 dark:text-surface-400 text-sm max-w-md">
              AI-powered precision matching for cancer clinical trials. Find trials personalized 
              to your cancer type, stage, biomarkers, and treatment history.
            </p>
            <p className="text-surface-500 text-xs mt-4">
              Clinical trial data sourced from ClinicalTrials.gov. Proprietary analysis, 
              scoring logic, and summaries are the intellectual property of TrialMatchRX.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Search Trials
                </Link>
              </li>
              <li>
                <Link href="/saved" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Saved Trials
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/terms" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/disclaimer" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Medical Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/legal/hipaa" className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  HIPAA Notice
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} TrialMatchRX. All rights reserved.
          </p>
          <p className="text-sm text-surface-500 flex items-center gap-1">
            Powered by Chaisson, Brown & Mimi
            <Heart className="w-4 h-4 text-secondary-500 fill-secondary-500" />
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 rounded-xl bg-surface-100 dark:bg-surface-900 text-center">
          <p className="text-xs text-surface-500">
            <strong>Medical Disclaimer:</strong> TrialMatchRX does not provide medical advice. 
            Always consult a licensed healthcare professional before making decisions about 
            clinical trial participation. The information provided is for educational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}

'use client';

// src/app/trial-matcher/access-denied/page.tsx
//
// Shown when a logged-in user's email is not on the trial_matcher_users whitelist,
// or when an unauthenticated user tries to access /trial-matcher directly.

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldX, Mail, ArrowLeft, LogIn } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TrialMatcherAccessDenied() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-800/40">
            <ShieldX className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">
            Access Restricted
          </h1>
          <p className="text-surface-500 dark:text-surface-400 text-base leading-relaxed mb-8">
            The Trial Matcher is available to authorized clinical staff only —
            Clinical Research Coordinators and Physicians registered with the platform.
          </p>

          {/* Info card */}
          <div className="card p-5 text-left mb-8 border border-surface-200 dark:border-surface-700">
            <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
              To request access:
            </p>
            <ol className="space-y-2.5 text-sm text-surface-500 dark:text-surface-400">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Sign in with your institutional email address</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Contact your site administrator to have your email added to the authorized user list</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Once added, return to this page and sign in</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Link>
            <Link
              href="/"
              className="btn-secondary flex items-center justify-center gap-2 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>

          {/* Contact */}
          <p className="mt-8 text-xs text-surface-400 dark:text-surface-500 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Questions? Contact{' '}
            <a
              href="mailto:access@mytrialmatchrx.com"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              access@mytrialmatchrx.com
            </a>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

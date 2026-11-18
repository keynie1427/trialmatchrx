'use client';

// /account/security — two-step verification settings.
// ?required=1&next=/trial-matcher is used by the Trial Matcher gate.

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { Loader2, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TwoStepSetup from '@/components/TwoStepSetup';
import { auth } from '@/lib/firebase';
import { signedInWithSecondFactor } from '@/lib/mfa';

function safeNext(v: string | null) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : null;
}

function SecurityInner() {
  const router = useRouter();
  const params = useSearchParams();
  const required = params.get('required') === '1';
  const next = safeNext(params.get('next'));
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [done, setDone] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent('/account/security' + (typeof window !== 'undefined' ? window.location.search : ''))}`);
  }, [user, router]);

  async function afterEnroll() {
    // The current session started before the second factor existed. If the
    // refreshed token already carries it, continue; otherwise sign in again.
    if (await signedInWithSecondFactor(auth.currentUser, true)) {
      if (next) router.push(next);
      else setDone(true);
      return;
    }
    setDone(true);
  }

  async function signInAgain() {
    await signOut(auth);
    router.push(`/login?next=${encodeURIComponent(next || '/account/security')}`);
  }

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Account security</h1>
        <p className="text-surface-600 dark:text-surface-400">Signed in as {user.email}</p>
      </div>

      {required && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-sm">
          Trial Matcher handles information about research patients, so two-step verification is required for
          every Trial Matcher and admin account.
        </div>
      )}

      <TwoStepSetup user={user} required={required} onEnrolled={afterEnroll} />

      {done && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm">
            Two-step verification is on. To finish, sign in again with your password and a code from your app.
          </p>
          <button onClick={signInAgain} className="btn-primary whitespace-nowrap">
            Sign in again <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-xs text-surface-500">
        Lost access to your authenticator app? Email{' '}
        <a href="mailto:trialmatchrx@ijelany.com" className="underline">trialmatchrx@ijelany.com</a> from your account
        email and we&apos;ll verify your identity and reset it. <Link href="/profile" className="underline">Back to profile</Link>
      </p>
    </div>
  );
}

export default function AccountSecurityPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={null}>
          <SecurityInner />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

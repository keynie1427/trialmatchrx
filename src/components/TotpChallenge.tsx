'use client';

// Shown during sign-in when the account has two-step verification on.

import { useState } from 'react';
import type { MultiFactorResolver } from 'firebase/auth';
import { Loader2, ShieldCheck } from 'lucide-react';
import { resolveTotpSignIn, mfaErrorMessage } from '@/lib/mfa';

export default function TotpChallenge({
  resolver,
  onSuccess,
  onCancel,
}: {
  resolver: MultiFactorResolver;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await resolveTotpSignIn(resolver, code);
      onSuccess();
    } catch (err) {
      setError(mfaErrorMessage(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary-600" />
        <h2 className="font-semibold">Two-step verification</h2>
      </div>
      <p className="text-sm text-surface-600 dark:text-surface-400">
        Enter the 6-digit code from your authenticator app.
      </p>
      <input
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="input font-mono tracking-[0.5em] text-center text-lg"
        aria-label="6-digit code"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy || code.length !== 6} className="btn-primary w-full">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Verify
      </button>
      <button type="button" onClick={onCancel} className="btn-ghost w-full text-sm">
        Cancel
      </button>
      <p className="text-xs text-surface-500 text-center">
        Lost your phone? Email trialmatchrx@ijelany.com to reset two-step verification.
      </p>
    </form>
  );
}

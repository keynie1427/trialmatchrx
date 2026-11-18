'use client';

// Two-step verification setup card: QR code → confirm 6-digit code → enrolled.
// Also shows status and lets the user turn it off (unless `required`).

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { sendEmailVerification, type User } from 'firebase/auth';
import { ShieldCheck, ShieldAlert, Loader2, Smartphone, Copy, Check } from 'lucide-react';
import {
  isMfaEnrolled,
  startTotpEnrollment,
  finishTotpEnrollment,
  removeTotp,
  mfaErrorMessage,
  type PendingEnrollment,
} from '@/lib/mfa';

export default function TwoStepSetup({
  user,
  required = false,
  onEnrolled,
}: {
  user: User;
  required?: boolean;
  onEnrolled?: () => void;
}) {
  const [enrolled, setEnrolled] = useState(isMfaEnrolled(user));
  const [pending, setPending] = useState<PendingEnrollment | null>(null);
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => setEnrolled(isMfaEnrolled(user)), [user]);

  useEffect(() => {
    if (!pending) return setQr('');
    QRCode.toDataURL(pending.otpauthUrl, { width: 200, margin: 1 }).then(setQr).catch(() => setQr(''));
  }, [pending]);

  async function begin() {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await user.reload();
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setNotice(`First, confirm your email address. We sent a link to ${user.email}. Click it, then come back and press "Set up" again.`);
        return;
      }
      setPending(await startTotpEnrollment(user));
    } catch (e) {
      setError(mfaErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      await finishTotpEnrollment(user, pending, code);
      setPending(null);
      setCode('');
      setEnrolled(true);
      onEnrolled?.();
    } catch (err) {
      setError(mfaErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    if (!confirmOff()) return;
    setBusy(true);
    setError('');
    try {
      await removeTotp(user);
      setEnrolled(false);
    } catch (err) {
      setError(mfaErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function confirmOff() {
    return typeof window !== 'undefined' && window.confirm('Turn off two-step verification? Your account will be protected by your password only.');
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-4">
        {enrolled ? (
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
        )}
        <div>
          <h2 className="font-display text-lg font-semibold">Two-step verification</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            {enrolled
              ? 'On. You’ll enter a 6-digit code from your authenticator app each time you sign in.'
              : 'Add a second step to sign-in using an authenticator app such as Google Authenticator, Microsoft Authenticator, Authy or 1Password.'}
          </p>
          {required && !enrolled && (
            <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              Required for your account. Set it up to continue.
            </p>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
      {notice && <p className="mb-4 text-sm text-primary-700 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">{notice}</p>}

      {enrolled && !required && (
        <button onClick={turnOff} disabled={busy} className="btn-secondary text-sm">
          Turn off
        </button>
      )}

      {!enrolled && !pending && (
        <button onClick={begin} disabled={busy} className="btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
          Set up
        </button>
      )}

      {pending && (
        <form onSubmit={confirm} className="space-y-4">
          <ol className="list-decimal pl-5 text-sm space-y-1 text-surface-700 dark:text-surface-300">
            <li>Open your authenticator app and add a new account.</li>
            <li>Scan this QR code, or type the key below.</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code for your authenticator app" width={200} height={200} className="rounded-lg border border-surface-200 bg-white p-1" />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            )}
            <div className="text-sm">
              <p className="text-surface-500 mb-1">Can’t scan? Enter this key:</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs break-all bg-surface-100 dark:bg-surface-800 rounded px-2 py-1">{pending.secretKey}</code>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(pending.secretKey); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="btn-ghost p-1"
                  aria-label="Copy key"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="totp-code" className="block text-sm font-medium mb-2">6-digit code</label>
            <input
              id="totp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input w-40 font-mono tracking-widest text-center"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6} className="btn-primary">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Turn on
            </button>
            <button type="button" onClick={() => { setPending(null); setCode(''); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

'use client';

// src/lib/mfa.ts
//
// Two-step verification (TOTP authenticator apps) on Firebase Auth.
// Requires the Firebase project to be on Identity Platform with the TOTP
// provider enabled (see docs/MFA.md).
//
//   enrollment:  startTotpEnrollment() → show QR → finishTotpEnrollment(code)
//   sign-in:     catch 'auth/multi-factor-auth-required' → isMfaRequiredError()
//                → resolveTotpSignIn(error, code)
//   checks:      isMfaEnrolled(user), signedInWithSecondFactor(user)

import {
  multiFactor,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type TotpSecret,
  type User,
  type MultiFactorError,
  type MultiFactorResolver,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const MFA_ISSUER = 'TrialMatchRX';

export function isMfaEnrolled(user: User | null | undefined): boolean {
  if (!user) return false;
  return multiFactor(user).enrolledFactors.some((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}

/** True when the CURRENT session was signed in with a second factor. */
export async function signedInWithSecondFactor(user: User | null | undefined, forceRefresh = false): Promise<boolean> {
  if (!user) return false;
  const res = await user.getIdTokenResult(forceRefresh);
  const fb = (res.claims as any)?.firebase;
  return !!fb?.sign_in_second_factor;
}

export interface PendingEnrollment {
  secret: TotpSecret;
  otpauthUrl: string;
  secretKey: string; // for manual entry
}

export async function startTotpEnrollment(user: User): Promise<PendingEnrollment> {
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const otpauthUrl = secret.generateQrCodeUrl(user.email || 'account', MFA_ISSUER);
  return { secret, otpauthUrl, secretKey: secret.secretKey };
}

export async function finishTotpEnrollment(user: User, pending: PendingEnrollment, code: string, label = 'Authenticator app') {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(pending.secret, code.trim());
  await multiFactor(user).enroll(assertion, label);
}

export async function removeTotp(user: User) {
  const factor = multiFactor(user).enrolledFactors.find((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (factor) await multiFactor(user).unenroll(factor);
}

export function isMfaRequiredError(err: unknown): err is MultiFactorError {
  return (err as any)?.code === 'auth/multi-factor-auth-required';
}

export function getResolver(err: MultiFactorError): MultiFactorResolver {
  return getMultiFactorResolver(auth, err);
}

export async function resolveTotpSignIn(resolver: MultiFactorResolver, code: string) {
  const hint = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (!hint) throw new Error('No authenticator app is set up for this account.');
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
  return resolver.resolveSignIn(assertion);
}

/** Human-friendly message for Firebase MFA errors. */
export function mfaErrorMessage(err: any): string {
  switch (err?.code) {
    case 'auth/invalid-verification-code':
    case 'auth/missing-code':
      return 'That code didn’t match. Check the 6-digit code in your authenticator app and try again.';
    case 'auth/requires-recent-login':
      return 'For your security, please sign out and sign back in, then set up two-step verification.';
    case 'auth/totp-challenge-timeout':
    case 'auth/code-expired':
      return 'The code expired. Enter the newest code from your authenticator app.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Two-step verification isn’t enabled for this site yet. Please contact support.';
    case 'auth/unverified-email':
      return 'Please verify your email address before setting up two-step verification.';
    default:
      return err?.message || 'Something went wrong. Please try again.';
  }
}

/**
 * Gate for pages that require two-step verification (Trial Matcher, admin).
 * Returns true when the current session used a second factor. Otherwise it
 * redirects — to setup if the user hasn't enrolled, or to sign-in if they
 * enrolled but this session predates it — and returns false.
 * Set NEXT_PUBLIC_TRIAL_MATCHER_MFA=off in Vercel to disable (emergency only).
 */
export async function requireSecondFactor(nextPath: string): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_TRIAL_MATCHER_MFA === 'off') return true;
  const user = auth.currentUser;
  if (!user) return false;
  if (await signedInWithSecondFactor(user)) return true;
  const next = encodeURIComponent(nextPath);
  if (isMfaEnrolled(user)) {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    window.location.href = `/login?next=${next}`;
  } else {
    window.location.href = `/account/security?required=1&next=${next}`;
  }
  return false;
}

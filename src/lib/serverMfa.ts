// src/lib/serverMfa.ts — server only.
// Two-step verification check for decoded Firebase ID tokens. Firebase adds
// `firebase.sign_in_second_factor` (e.g. "totp") when the session was signed
// in with a second factor. Set TRIAL_MATCHER_MFA=off in Vercel to disable
// enforcement in an emergency (also set NEXT_PUBLIC_TRIAL_MATCHER_MFA=off).

export function hasSecondFactor(decoded: any): boolean {
  if (process.env.TRIAL_MATCHER_MFA === 'off') return true;
  return !!decoded?.firebase?.sign_in_second_factor;
}

export function assertSecondFactor(decoded: any): void {
  if (!hasSecondFactor(decoded)) throw new Error('mfa_required');
}

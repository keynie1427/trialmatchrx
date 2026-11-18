// src/lib/unsubscribe.ts
// Signed one-click unsubscribe links for alert emails (CAN-SPAM requires an
// opt-out that works without signing in). The token is an HMAC of the
// alertPreferences document id, keyed with CRON_SECRET (or UNSUBSCRIBE_SECRET).

import { createHmac, timingSafeEqual } from 'crypto';

function secret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || '';
}

export function unsubscribeToken(prefId: string): string {
  return createHmac('sha256', secret()).update(`alerts:${prefId}`).digest('hex').slice(0, 32);
}

export function verifyUnsubscribeToken(prefId: string, token: string): boolean {
  if (!secret() || !prefId || !token) return false;
  const expected = Buffer.from(unsubscribeToken(prefId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(baseUrl: string, prefId: string): string {
  return `${baseUrl}/api/alerts/unsubscribe?id=${encodeURIComponent(prefId)}&token=${unsubscribeToken(prefId)}`;
}

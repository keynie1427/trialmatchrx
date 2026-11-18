#!/usr/bin/env node
// scripts/enable-totp.mjs
//
// Turns on authenticator-app (TOTP) two-step verification for this Firebase
// project. Firebase has no console switch for TOTP, so it's enabled through
// the Identity Platform admin API. The project must already be upgraded to
// Identity Platform (Firebase console → Authentication → Settings → Upgrade).
//
// Usage (from the project folder):
//   node scripts/enable-totp.mjs                       # uses ./service-account.json or FIREBASE_SERVICE_ACCOUNT_BASE64 in .env.local
//   node scripts/enable-totp.mjs path/to/key.json      # any Firebase Admin SDK service-account key
//
// Prints only the project id and the resulting MFA settings — never the key.

import { readFileSync, existsSync } from 'node:fs';
import { cert } from 'firebase-admin/app';

function loadServiceAccount() {
  const arg = process.argv[2];
  if (arg) return JSON.parse(readFileSync(arg, 'utf8'));
  if (existsSync('service-account.json')) return JSON.parse(readFileSync('service-account.json', 'utf8'));
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, 'utf8').match(/^FIREBASE_SERVICE_ACCOUNT_BASE64=["']?([A-Za-z0-9+/=]+)/m);
    if (m) return JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  }
  throw new Error('No service-account key found. Pass the path to one: node scripts/enable-totp.mjs key.json');
}

const sa = loadServiceAccount();
const projectId = sa.project_id;
console.log(`Firebase project: ${projectId}`);

const { access_token } = await cert(sa).getAccessToken();
const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

const current = await fetch(base, { headers });
if (!current.ok) {
  const t = await current.text();
  console.error(`Could not read the Auth config (${current.status}).`);
  if (current.status === 403 || /IDENTITY_PLATFORM|not enabled|billing/i.test(t)) {
    console.error('→ Make sure this project is upgraded to Identity Platform (Firebase console → Authentication → Settings).');
  }
  console.error(t.slice(0, 400));
  process.exit(1);
}
const cfg = await current.json();
const others = (cfg.mfa?.providerConfigs || []).filter((p) => !p.totpProviderConfig);
const providerConfigs = [...others, { state: 'ENABLED', totpProviderConfig: { adjacentIntervals: 5 } }];

const res = await fetch(`${base}?updateMask=mfa.providerConfigs`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ mfa: { providerConfigs } }),
});
const out = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Failed (${res.status}):`, JSON.stringify(out).slice(0, 400));
  process.exit(1);
}
const totp = (out.mfa?.providerConfigs || []).find((p) => p.totpProviderConfig);
console.log(totp?.state === 'ENABLED'
  ? `✅ Authenticator-app two-step verification is ENABLED for ${projectId}.`
  : `⚠️ Unexpected result: ${JSON.stringify(out.mfa || {})}`);

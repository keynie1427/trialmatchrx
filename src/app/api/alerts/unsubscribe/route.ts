// GET/POST /api/alerts/unsubscribe?id=<alertPreferences doc id>&token=<hmac>
// One-click opt-out from trial alert emails. GET shows a confirmation page;
// POST (sent by email clients via the List-Unsubscribe-Post header) unsubscribes silently.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';

async function disable(id: string) {
  const db = getAdminDb();
  await db.collection('alertPreferences').doc(id).set(
    { enabled: false, unsubscribedAt: new Date() },
    { merge: true }
  );
}

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | TrialMatchRX</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:48px 16px;color:#111827">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;text-align:center">
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1><p style="color:#4b5563;line-height:1.6">${body}</p>
<p style="margin-top:24px"><a href="/" style="color:#0d9488">Back to TrialMatchRX</a></p></div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || '';
  const token = req.nextUrl.searchParams.get('token') || '';
  if (!verifyUnsubscribeToken(id, token)) {
    return page('Link not valid', 'This unsubscribe link is invalid or has expired. Email trialmatchrx@ijelany.com and we will remove you right away.', 400);
  }
  try {
    await disable(id);
    return page('You are unsubscribed', 'You will no longer receive trial alert emails. You can turn alerts back on at any time from the Alerts page after signing in.');
  } catch (e) {
    console.error('[alerts/unsubscribe]', e);
    return page('Something went wrong', 'We could not process your request. Email trialmatchrx@ijelany.com and we will remove you right away.', 500);
  }
}

export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || '';
  const token = req.nextUrl.searchParams.get('token') || '';
  if (!verifyUnsubscribeToken(id, token)) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  try {
    await disable(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

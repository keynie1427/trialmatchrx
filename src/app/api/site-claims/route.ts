// src/app/api/site-claims/route.ts
//
// POST /api/site-claims → a research coordinator asks to claim a trial listing,
// update recruiting status, or receive pre-screened patient referrals.
// Writes to the `site_claims` Firestore collection for admin review (nothing is
// published automatically) and emails the team if RESEND_API_KEY is set.
//
// Firestore doc shape (collection: site_claims):
//   { name, email, role, institution, phone|null, nctIds: string[],
//     requestType: 'claim' | 'status' | 'referrals', message|null,
//     status: 'pending', submittedAt: Date, userAgent|null }

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NCT_RE = /NCT\d{8}/gi;
const REQUEST_TYPES = ['claim', 'status', 'referrals'] as const;

const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field
  if (clean(body?.website)) return NextResponse.json({ success: true });

  const name = clean(body?.name);
  const email = clean(body?.email).toLowerCase();
  const role = clean(body?.role);
  const institution = clean(body?.institution);
  const phone = clean(body?.phone, 40) || null;
  const message = clean(body?.message, 2000) || null;
  const requestType = REQUEST_TYPES.includes(body?.requestType) ? body.requestType : 'claim';
  const nctIds = Array.from(new Set((clean(body?.nctIds, 2000).match(NCT_RE) || []).map((s) => s.toUpperCase()))).slice(0, 25);

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid work email is required' }, { status: 400 });
  if (!institution) return NextResponse.json({ error: 'Institution is required' }, { status: 400 });
  if (nctIds.length === 0) return NextResponse.json({ error: 'Enter at least one NCT number (e.g. NCT01234567)' }, { status: 400 });

  try {
    const db = getAdminDb();
    const ref = await db.collection('site_claims').add({
      name, email, role: role || null, institution, phone, nctIds, requestType, message,
      status: 'pending',
      submittedAt: new Date(),
      userAgent: req.headers.get('user-agent') || null,
    });

    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'TrialMatchRX <alerts@mytrialmatchrx.com>',
            to: 'trialmatchrx@ijelany.com',
            subject: `[Research site] ${requestType} — ${institution} (${nctIds.join(', ')})`,
            html: `
              <h2>New research-site request</h2>
              <p><strong>Request:</strong> ${esc(requestType)}</p>
              <p><strong>Name:</strong> ${esc(name)} (${esc(role || 'role not given')})</p>
              <p><strong>Email:</strong> ${esc(email)} · <strong>Phone:</strong> ${esc(phone || '—')}</p>
              <p><strong>Institution:</strong> ${esc(institution)}</p>
              <p><strong>Trials:</strong> ${nctIds.map((n) => `<a href="https://clinicaltrials.gov/study/${n}">${n}</a>`).join(', ')}</p>
              <p><strong>Message:</strong><br/>${esc(message || '—').replace(/\n/g, '<br/>')}</p>
              <p><small>site_claims/${ref.id}</small></p>`,
          }),
        });
      } catch (e) {
        console.error('[site-claims] email failed', e);
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[site-claims POST]', err);
    return NextResponse.json({ error: 'Could not submit your request. Please try again.' }, { status: 500 });
  }
}

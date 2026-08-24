// src/app/api/waitlist/route.ts
//
// POST /api/waitlist  → record a public "request access" submission.
//
// Public self-serve signup (createUserWithEmailAndPassword / Google) is
// closed — see src/hooks/index.ts. This endpoint does NOT create a Firebase
// Auth account. It only writes a request into the waitlist_requests
// Firestore collection so an admin can review it and, if appropriate,
// provision access the same way trial-matcher users are added today
// (see src/app/api/trial-matcher/admin/users/route.ts).
//
// Firestore doc shape (collection: waitlist_requests):
//   {
//     email: string,
//     name: string,
//     organization: string | null,
//     status: 'pending',
//     requestedAt: Timestamp,
//     userAgent: string | null,
//   }

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 200;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, MAX_LEN) : '';
  const emailRaw = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const organization = typeof body?.organization === 'string' ? body.organization.trim().slice(0, MAX_LEN) : null;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!emailRaw || emailRaw.length > MAX_LEN || !EMAIL_RE.test(emailRaw)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    // Avoid piling up duplicate pending requests from the same email.
    const existing = await db
      .collection('waitlist_requests')
      .where('email', '==', emailRaw)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: true, alreadyRequested: true });
    }

    await db.collection('waitlist_requests').add({
      email: emailRaw,
      name,
      organization: organization || null,
      status: 'pending',
      requestedAt: new Date(),
      userAgent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[waitlist POST]', err);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

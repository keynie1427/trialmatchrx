// src/app/api/trial-matcher/trials/[nctId]/route.ts
//
// PATCH  /api/trial-matcher/trials/[nctId] → update trial (activate, edit rules, color)
// DELETE /api/trial-matcher/trials/[nctId] → remove trial from matcher

import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  try {
    const app = getAdminApp();
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAuth(app).verifyIdToken(token);
    const db = getFirestore(app);
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    if (!doc.exists || doc.data()?.role !== 'admin' || doc.data()?.active === false) return null;
    return decoded.email!;
  } catch { return null; }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { nctId: string } }
) {
  const adminEmail = await verifyAdmin(req);
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const nctId = params.nctId.toUpperCase();
  const body = await req.json().catch(() => ({}));

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const docRef = db.collection('trial_matcher_trials').doc(nctId);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ error: 'Trial not found' }, { status: 404 });

    const updates: Record<string, any> = { updatedAt: Timestamp.now(), updatedBy: adminEmail };

    if (body.trialStatus !== undefined) {
      updates.trialStatus = body.trialStatus;
      if (body.trialStatus === 'active') updates.activatedAt = Timestamp.now();
    }
    if (body.matchingRules !== undefined) updates.matchingRules = body.matchingRules;
    if (body.shortName !== undefined)     updates.shortName = body.shortName;
    if (body.biomarker !== undefined)     updates.biomarker = body.biomarker;
    if (body.color !== undefined)         updates.color = body.color;
    if (body.colorLight !== undefined)    updates.colorLight = body.colorLight;
    if (body.colorDark !== undefined)     updates.colorDark = body.colorDark;
    if (body.route !== undefined)         updates.route = body.route;

    await docRef.update(updates);
    return NextResponse.json({ success: true, nctId, updates });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update trial' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { nctId: string } }
) {
  const adminEmail = await verifyAdmin(req);
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const nctId = params.nctId.toUpperCase();

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const docRef = db.collection('trial_matcher_trials').doc(nctId);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ error: 'Trial not found' }, { status: 404 });

    await docRef.delete();
    return NextResponse.json({ success: true, deleted: nctId });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete trial' }, { status: 500 });
  }
}

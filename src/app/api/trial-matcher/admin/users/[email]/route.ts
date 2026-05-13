// src/app/api/trial-matcher/admin/users/[email]/route.ts
//
// PATCH  /api/trial-matcher/admin/users/[email]  → update role, name, org, active
// DELETE /api/trial-matcher/admin/users/[email]  → permanently delete user

import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

async function verifyAdminToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token);
    const db = getFirestore(app);
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    if (!doc.exists || doc.data()?.role !== 'admin' || doc.data()?.active === false) return null;
    return decoded.email!;
  } catch {
    return null;
  }
}

// ─── PATCH — Update user ──────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  const adminEmail = await verifyAdminToken(req);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targetEmail = decodeURIComponent(params.email).toLowerCase();

  try {
    const body = await req.json();
    const { role, name, organization, active, assignedTrialId } = body;

    // Prevent admin from removing their own admin role
    if (targetEmail === adminEmail && role && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date(), updatedBy: adminEmail };
    if (role !== undefined) {
      if (!['crc', 'physician', 'admin', 'sponsor'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = role;
    }
    if (name !== undefined)             updates.name = name?.trim() || null;
    if (organization !== undefined)     updates.organization = organization?.trim() || null;
    if (active !== undefined)           updates.active = Boolean(active);
    if (assignedTrialId !== undefined)  updates.assignedTrialId = assignedTrialId || null;

    const app = getAdminApp();
    const db = getFirestore(app);
    const docRef = db.collection('trial_matcher_users').doc(targetEmail);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await docRef.update(updates);

    return NextResponse.json({ success: true, email: targetEmail, updates });
  } catch (err) {
    console.error('[admin/users PATCH]', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// ─── DELETE — Remove user ─────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  const adminEmail = await verifyAdminToken(req);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targetEmail = decodeURIComponent(params.email).toLowerCase();

  // Prevent admin from deleting themselves
  if (targetEmail === adminEmail) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const docRef = db.collection('trial_matcher_users').doc(targetEmail);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true, deleted: targetEmail });
  } catch (err) {
    console.error('[admin/users DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

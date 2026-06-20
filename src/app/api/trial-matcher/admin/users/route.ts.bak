// src/app/api/trial-matcher/admin/users/route.ts
//
// GET  /api/trial-matcher/admin/users  → list all trial_matcher_users
// POST /api/trial-matcher/admin/users  → add a new user to the whitelist
//
// Both endpoints verify the caller is an authenticated admin before proceeding.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';



async function verifyAdminToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const app = getAdminApp();
    const decoded = await getAdminAuth().verifyIdToken(token);
    // Check admin role in Firestore
    const db = getAdminDb();
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    if (!doc.exists || doc.data()?.role !== 'admin' || doc.data()?.active === false) return null;
    return decoded.email!;
  } catch {
    return null;
  }
}

// ─── GET — List all users ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const adminEmail = await verifyAdminToken(req);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const app = getAdminApp();
    const db = getAdminDb();
    const snapshot = await db.collection('trial_matcher_users').orderBy('addedAt', 'desc').get();

    const users = snapshot.docs.map(doc => ({
      email:          doc.id,
      role:           doc.data().role,
      name:           doc.data().name || null,
      organization:   doc.data().organization || null,
      active:         doc.data().active ?? true,
      addedAt:        doc.data().addedAt?.toDate?.()?.toISOString() || null,
      lastLogin:      doc.data().lastLogin?.toDate?.()?.toISOString() || null,
      assignedTrialId: doc.data().assignedTrialId || null,
    }));

    return NextResponse.json({ users, count: users.length });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// ─── POST — Add new user ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminEmail = await verifyAdminToken(req);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, role, name, organization, assignedTrialId } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
    }
    if (!['crc', 'physician', 'admin', 'sponsor'].includes(role)) {
      return NextResponse.json({ error: 'role must be crc, physician, admin, or sponsor' }, { status: 400 });
    }
    if (role === 'sponsor' && !assignedTrialId) {
      return NextResponse.json({ error: 'Sponsor users must have an assignedTrialId' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const app = getAdminApp();
    const db = getAdminDb();
    const docRef = db.collection('trial_matcher_users').doc(normalizedEmail);
    const existing = await docRef.get();

    if (existing.exists) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    await docRef.set({
      email:           normalizedEmail,
      role,
      name:            name?.trim() || null,
      organization:    organization?.trim() || null,
      active:          true,
      addedAt:         new Date(),
      addedBy:         adminEmail,
      lastLogin:       null,
      assignedTrialId: assignedTrialId || null,
    });

    return NextResponse.json({
      success: true,
      user: { email: normalizedEmail, role, name, organization, active: true },
    }, { status: 201 });
  } catch (err) {
    console.error('[admin/users POST]', err);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}

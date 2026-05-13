// src/app/api/trial-matcher/rescreen/route.ts
//
// Re-screening alert engine for the Trial Matcher.
//
// How it works:
//   1. POST is triggered manually (admin UI) or via Vercel cron
//   2. Fetches current FHIR patient data from /api/trial-matcher/patients
//   3. Compares each patient's current eligibility against their last snapshot
//      stored in Firestore (collection: trial_matcher_snapshots)
//   4. For patients whose status changed (e.g. EXCLUDED → LIKELY_ELIGIBLE):
//      a. Updates the snapshot in Firestore
//      b. Writes an in-app notification to trial_matcher_notifications
//      c. Sends an email to all CRC/physician users via Resend
//
// Firestore collections used:
//   trial_matcher_snapshots/{patientId}  → last known eligibility per trial
//   trial_matcher_notifications/{id}     → in-app notification feed
//
// Vercel cron setup (vercel.json):
//   { "crons": [{ "path": "/api/trial-matcher/rescreen", "schedule": "0 8 * * 1" }] }
//   (runs every Monday at 8am UTC)

import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// ─── Firebase Admin ───────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientSnapshot {
  patientId: string;
  cancerType: string;
  lastChecked: Timestamp;
  eligibility: Record<string, {
    status: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'EXCLUDED';
    score: number;
  }>;
}

interface EligibilityChange {
  patientId: string;
  cancerType: string;
  trialId: string;
  trialName: string;
  previousStatus: string;
  newStatus: string;
  newScore: number;
}

// ─── Email helper (reuses Resend like your existing alerts) ───────────────────

async function sendRescreenEmail(
  to: string,
  changes: EligibilityChange[]
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mytrialmatchrx.com';
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const changeRows = changes.slice(0, 10).map(c => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${c.patientId}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${c.cancerType}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${c.trialName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">
        <span style="text-decoration:line-through;color:#9ca3af;">${c.previousStatus.replace(/_/g,' ')}</span>
        → <span style="color:#059669;font-weight:700;">${c.newStatus.replace(/_/g,' ')}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:700;">${c.newScore}%</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;">
  <div style="max-width:640px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#0F6E56,#05c8ae);padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">MyTrialMatchRX</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Trial Matcher — Re-screening Alert</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;font-weight:700;color:#111827;margin-bottom:6px;">
        ${changes.length} patient${changes.length !== 1 ? 's have' : ' has'} new trial eligibility
      </p>
      <p style="font-size:13px;color:#6b7280;margin-bottom:20px;">
        The following patients changed eligibility status during the latest EMR re-screening on ${date}.
        Review them in the Trial Matcher dashboard.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Patient</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Cancer type</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Trial</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Status change</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Score</th>
          </tr>
        </thead>
        <tbody>${changeRows}</tbody>
      </table>
      ${changes.length > 10 ? `<p style="font-size:12px;color:#6b7280;margin-top:12px;">...and ${changes.length - 10} more. View all in the dashboard.</p>` : ''}
      <div style="margin-top:24px;text-align:center;">
        <a href="${baseUrl}/trial-matcher" style="display:inline-block;background:#0F6E56;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
          Open Trial Matcher →
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">
        You're receiving this as an authorized Trial Matcher user.<br>
        This is not medical advice. Verify eligibility per protocol before consent.
      </p>
    </div>
  </div>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'TrialMatchRX <alerts@mytrialmatchrx.com>',
      to,
      subject: `[Trial Matcher] ${changes.length} patient${changes.length !== 1 ? 's' : ''} newly eligible — ${date}`,
      html,
    }),
  });

  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth: accept cron secret OR admin Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  const isFromCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  // If not cron, verify admin token
  if (!isFromCron) {
    try {
      const app = getAdminApp();
      const { getAuth } = await import('firebase-admin/auth');
      const token = authHeader.replace('Bearer ', '');
      const decoded = await getAuth(app).verifyIdToken(token);
      const db = getFirestore(app);
      const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
      if (!doc.exists || doc.data()?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun === true;

  try {
    const app = getAdminApp();
    const db = getFirestore(app);

    // 1. Fetch current patient eligibility from FHIR pipeline
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mytrialmatchrx.com';
    const patientsRes = await fetch(`${baseUrl}/api/trial-matcher/patients`);
    if (!patientsRes.ok) throw new Error('Failed to fetch patient data');
    const { patients } = await patientsRes.json();

    if (!patients?.length) {
      return NextResponse.json({ success: true, message: 'No patients to process', changes: 0 });
    }

    // 2. Load existing snapshots
    const snapshotDocs = await db.collection('trial_matcher_snapshots').get();
    const snapshots = new Map<string, PatientSnapshot>();
    snapshotDocs.forEach(doc => snapshots.set(doc.id, doc.data() as PatientSnapshot));

    // 3. Find changes
    const changes: EligibilityChange[] = [];
    const TRIAL_NAMES: Record<string, string> = {
      NCT06983743: 'ERAS-0015',   NCT04093167: 'MARIPOSA-2',
      NCT04657003: 'BREAKWATER',  NCT02628067: 'KEYNOTE-158',
      NCT02422615: 'MONARCH-3',   NCT04494425: 'DESTINY-Breast06',
      NCT02263508: 'MASTERKEY-265', NCT03318939: 'ZENITH20',
      NCT03539536: 'PRODIGE-48',
    };

    // Track which patients need snapshot updates
    const snapshotUpdates: Array<{ patientId: string; data: Partial<PatientSnapshot> }> = [];

    for (const patient of patients) {
      const prev = snapshots.get(patient.patientId);
      const newEligibility: PatientSnapshot['eligibility'] = {};

      for (const [trialId, match] of Object.entries(patient.trialMatches as Record<string, { status: string; score: number }>)) {
        newEligibility[trialId] = { status: match.status as any, score: match.score };

        const prevStatus = prev?.eligibility?.[trialId]?.status || 'EXCLUDED';
        const newStatus = match.status;

        // Only alert on improvements (excluded → eligible/review, or review → eligible)
        const improved =
          (prevStatus === 'EXCLUDED' && newStatus !== 'EXCLUDED') ||
          (prevStatus === 'REVIEW_REQUIRED' && newStatus === 'LIKELY_ELIGIBLE');

        if (improved) {
          changes.push({
            patientId: patient.patientId,
            cancerType: patient.cancerType,
            trialId,
            trialName: TRIAL_NAMES[trialId] || trialId,
            previousStatus: prevStatus,
            newStatus,
            newScore: match.score,
          });
        }
      }

      snapshotUpdates.push({
        patientId: patient.patientId,
        data: {
          patientId: patient.patientId,
          cancerType: patient.cancerType,
          lastChecked: Timestamp.now(),
          eligibility: newEligibility,
        },
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        patientsProcessed: patients.length,
        changesFound: changes.length,
        changes: changes.slice(0, 20),
      });
    }

    // 4. Update snapshots in Firestore
    const batch = db.batch();
    for (const { patientId, data } of snapshotUpdates) {
      batch.set(db.collection('trial_matcher_snapshots').doc(patientId), data, { merge: true });
    }
    await batch.commit();

    // 5. Write in-app notifications
    if (changes.length > 0) {
      const notifBatch = db.batch();
      for (const change of changes) {
        const notifRef = db.collection('trial_matcher_notifications').doc();
        notifBatch.set(notifRef, {
          type: 'eligibility_change',
          patientId: change.patientId,
          cancerType: change.cancerType,
          trialId: change.trialId,
          trialName: change.trialName,
          previousStatus: change.previousStatus,
          newStatus: change.newStatus,
          newScore: change.newScore,
          read: false,
          createdAt: Timestamp.now(),
        });
      }
      await notifBatch.commit();

      // 6. Email all active CRC/physician users
      const usersSnap = await db.collection('trial_matcher_users')
        .where('active', '==', true)
        .get();

      const emailTargets = usersSnap.docs
        .filter(d => ['crc', 'physician', 'admin'].includes(d.data().role))
        .map(d => d.data().email as string)
        .filter(Boolean);

      const emailResults = await Promise.allSettled(
        emailTargets.map(email => sendRescreenEmail(email, changes))
      );

      const emailsSent = emailResults.filter(r => r.status === 'fulfilled').length;
      const emailsFailed = emailResults.filter(r => r.status === 'rejected').length;

      return NextResponse.json({
        success: true,
        patientsProcessed: patients.length,
        snapshotsUpdated: snapshotUpdates.length,
        changesFound: changes.length,
        notificationsCreated: changes.length,
        emailsSent,
        emailsFailed,
        changes: changes.slice(0, 10),
      });
    }

    return NextResponse.json({
      success: true,
      patientsProcessed: patients.length,
      snapshotsUpdated: snapshotUpdates.length,
      changesFound: 0,
      message: 'No eligibility changes detected',
    });

  } catch (err) {
    console.error('[trial-matcher/rescreen]', err);
    return NextResponse.json({ error: 'Re-screening failed', details: String(err) }, { status: 500 });
  }
}

// ─── GET — return current notifications for the dashboard ─────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  try {
    const app = getAdminApp();
    const { getAuth } = await import('firebase-admin/auth');
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAuth(app).verifyIdToken(token);
    const db = getFirestore(app);
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    if (!doc.exists || doc.data()?.active === false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const snap = await db.collection('trial_matcher_notifications')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notifications = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ notifications, count: notifications.length });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

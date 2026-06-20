import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { frequency = 'weekly', dryRun = false } = body;

    const db = getFirestore();
    const snapshot = await db
      .collection('alertPreferences')
      .where('enabled', '==', true)
      .where('frequency', '==', frequency)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No users to notify', processed: 0 });
    }

    const results = { processed: 0, sent: 0, failed: 0, skipped: 0, errors: [] as string[] };

    for (const doc of snapshot.docs) {
      results.processed++;
      const prefs = doc.data();

      try {
        if (prefs.lastSentAt) {
          const lastSent = prefs.lastSentAt.toDate();
          const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
          const minHours = frequency === 'daily' ? 20 : frequency === 'weekly' ? 144 : 288;
          if (hoursSince < minHours) { results.skipped++; continue; }
        }

        const trials = await fetchNewTrials(prefs.criteria, frequency);
        if (trials.length === 0) { results.skipped++; continue; }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mytrialmatchrx.com';
        const digestResponse = await fetch(`${baseUrl}/api/ai/digest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trials, patientProfile: { name: prefs.email.split('@')[0], ...prefs.criteria }, digestType: frequency }),
        });

        if (!digestResponse.ok) throw new Error('Failed to generate digest');
        const { digest } = await digestResponse.json();

        if (dryRun) { console.log(`[DRY RUN] Would send to ${prefs.email}:`, digest.subject); results.sent++; continue; }

        await sendEmail({ to: prefs.email, subject: digest.subject, html: generateEmailHtml(digest, baseUrl) });
        await doc.ref.update({ lastSentAt: new Date() });
        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${prefs.email}: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send alerts' }, { status: 500 });
  }
}

async function fetchNewTrials(criteria: any, frequency: string): Promise<any[]> {
  try {
    const daysBack = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);

    const params = new URLSearchParams({
      'filter.overallStatus': 'RECRUITING',
      pageSize: '20',
      format: 'json',
    });

    if (criteria.cancerType) params.set('query.cond', criteria.cancerType);

    const response = await fetch(`https://clinicaltrials.gov/api/v2/studies?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.studies || []).map((s: any) => {
      const p = s.protocolSection || {};
      return {
        nctId: p.identificationModule?.nctId,
        briefTitle: p.identificationModule?.briefTitle,
        phase: p.designModule?.phases?.[0] || 'N/A',
        status: p.statusModule?.overallStatus,
        conditions: p.conditionsModule?.conditions || [],
      };
    }).filter((t: any) => t.nctId);
  } catch { return []; }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'TrialMatchRX <alerts@mytrialmatchrx.com>',
      to,
      subject,
      html,
    }),
  });
  if (!response.ok) throw new Error(`Resend error: ${await response.text()}`);
  return response.json();
}

function generateEmailHtml(digest: any, baseUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#05c8ae,#0891b2);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">MyTrialMatchRX</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Your Clinical Trial Digest</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;">${digest.greeting}</p>
      <p style="font-size:15px;color:#6b7280;line-height:1.6;">${digest.summary}</p>
      <div style="background:#f0fdfa;border-radius:12px;padding:16px;margin:24px 0;display:flex;justify-content:space-around;text-align:center;">
        <div><div style="font-size:24px;font-weight:700;color:#0d9488;">${digest.quickStats?.totalNew || 0}</div><div style="font-size:12px;color:#6b7280;">New Trials</div></div>
        <div><div style="font-size:24px;font-weight:700;color:#0d9488;">${digest.quickStats?.recruiting || 0}</div><div style="font-size:12px;color:#6b7280;">Recruiting</div></div>
      </div>
      <h2 style="font-size:18px;color:#111827;">✨ Highlighted Trials</h2>
      ${(digest.highlights || []).slice(0, 5).map((t: any) => `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px;">
        <div style="font-size:12px;color:#6b7280;">${t.nctId} • ${t.phase} • ${t.status}</div>
        <h3 style="font-size:15px;color:#111827;margin:8px 0;">${t.title}</h3>
        <p style="font-size:14px;color:#059669;margin:0 0 8px;">${t.oneLiner}</p>
        <a href="${baseUrl}/trial/${t.nctId}" style="display:inline-block;background:#0d9488;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;">View Details →</a>
      </div>`).join('')}
      <div style="background:#f0fdfa;border-radius:12px;padding:20px;text-align:center;">
        <p style="color:#0d9488;margin:0 0 16px;">${digest.callToAction}</p>
        <a href="${baseUrl}/search" style="display:inline-block;background:linear-gradient(135deg,#05c8ae,#0891b2);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Browse All Trials</a>
      </div>
      ${digest.tip ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;margin-top:24px;"><p style="font-size:13px;color:#92400e;margin:0;">💡 <strong>Tip:</strong> ${digest.tip}</p></div>` : ''}
    </div>
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">You're receiving this because you signed up for trial alerts.</p>
      <a href="${baseUrl}/profile" style="font-size:12px;color:#0d9488;">Manage preferences</a>
      <p style="font-size:11px;color:#9ca3af;margin:16px 0 0;">This is not medical advice. Always consult your healthcare provider.</p>
    </div>
  </div>
</body>
</html>`;
}

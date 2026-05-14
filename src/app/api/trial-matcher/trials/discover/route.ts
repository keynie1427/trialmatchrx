// src/app/api/trial-matcher/trials/discover/route.ts
//
// Auto-discovery engine — searches ClinicalTrials.gov for recruiting oncology
// trials matching your 7 cancer types and key biomarkers.
//
// Triggered by:
//   - Vercel cron (add to vercel.json): "0 6 * * *" (6am UTC daily)
//   - Admin manual trigger from the Trials tab
//
// New trials found that aren't already in Firestore get saved with
// trialStatus: 'pending_review' and a bell notification is created.
//
// Add to vercel.json:
//   { "path": "/api/trial-matcher/trials/discover", "schedule": "0 6 * * *" }

import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';



async function verifyAccess(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  try {
    const app = getAdminApp();
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    return doc.exists && doc.data()?.role === 'admin' && doc.data()?.active !== false;
  } catch { return false; }
}

const CT_BASE = 'https://clinicaltrials.gov/api/v2';

// Search queries covering your 7 cancer types + key biomarkers
const DISCOVERY_QUERIES = [
  { term: 'KRAS mutation colorectal cancer', label: 'KRAS+ CRC' },
  { term: 'BRAF V600E colorectal cancer', label: 'BRAF+ CRC' },
  { term: 'MSI-H colorectal cancer pembrolizumab', label: 'MSI-H CRC' },
  { term: 'EGFR mutation non-small cell lung cancer', label: 'EGFR+ NSCLC' },
  { term: 'KRAS G12C non-small cell lung cancer', label: 'KRAS G12C NSCLC' },
  { term: 'HER2 positive breast cancer', label: 'HER2+ Breast' },
  { term: 'HR positive HER2 negative breast cancer CDK4/6', label: 'HR+/HER2- Breast' },
  { term: 'BRAF V600E melanoma', label: 'BRAF+ Melanoma' },
  { term: 'pancreatic cancer KRAS gemcitabine', label: 'Pancreatic' },
  { term: 'ovarian cancer BRCA olaparib', label: 'Ovarian BRCA' },
  { term: 'prostate cancer enzalutamide abiraterone', label: 'Prostate' },
];

const COLOR_PALETTE = [
  { color: '#0F6E56', colorLight: '#E1F5EE', colorDark: '#085041' },
  { color: '#185FA5', colorLight: '#E6F1FB', colorDark: '#0C447C' },
  { color: '#7C3AED', colorLight: '#EDE9FE', colorDark: '#5B21B6' },
  { color: '#BE185D', colorLight: '#FCE7F3', colorDark: '#9D174D' },
  { color: '#D97706', colorLight: '#FEF3C7', colorDark: '#B45309' },
  { color: '#0E7490', colorLight: '#CFFAFE', colorDark: '#0C4A6E' },
  { color: '#854F0B', colorLight: '#FAEEDA', colorDark: '#633806' },
  { color: '#065F46', colorLight: '#D1FAE5', colorDark: '#064E3B' },
];

function parseCtStudy(data: any, colorIdx: number) {
  const p = data?.protocolSection || {};
  const id = p.identificationModule || {};
  const stat = p.statusModule || {};
  const desc = p.descriptionModule || {};
  const elig = p.eligibilityModule || {};
  const design = p.designModule || {};
  const sponsor = p.sponsorCollaboratorsModule || {};
  const arms = p.armsInterventionsModule || {};

  const phase = (design.phases || []).join('/').replace(/PHASE/g, 'Phase ') || 'N/A';
  const interventions = (arms.interventions || [])
    .filter((i: any) => ['DRUG','BIOLOGICAL'].includes(i.type))
    .map((i: any) => i.name).slice(0, 3).join(' + ') || 'See protocol';

  const statusMap: Record<string, string> = {
    'RECRUITING': 'Recruiting', 'ACTIVE_NOT_RECRUITING': 'Active',
    'NOT_YET_RECRUITING': 'Recruiting', 'COMPLETED': 'Completed',
  };

  const colors = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];

  return {
    nctId: id.nctId || '',
    name: id.briefTitle || '',
    shortName: id.nctId || '',
    sponsor: sponsor.leadSponsor?.name || '',
    phase,
    route: 'See protocol',
    indication: (p.conditionsModule?.conditions || []).join(', '),
    drug: interventions,
    status: statusMap[stat.overallStatus] || 'Active',
    biomarker: 'See criteria',
    ...colors,
    rawEligibility: elig.eligibilityCriteria || '',
    matchingRules: null,
    briefSummary: desc.briefSummary || '',
    trialStatus: 'pending_review',
    source: 'auto_discovery',
    addedAt: Timestamp.now(),
    addedBy: 'auto_discovery',
    activatedAt: null,
  };
}

export async function POST(req: NextRequest) {
  const hasAccess = await verifyAccess(req);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun === true;

  try {
    const app = getAdminApp();
    const db = getAdminDb();

    // Get existing trial IDs to avoid duplicates
    const existingSnap = await db.collection('trial_matcher_trials').get();
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    const discovered: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < DISCOVERY_QUERIES.length; i++) {
      const { term, label } = DISCOVERY_QUERIES[i];
      try {
        const params = new URLSearchParams({
          'query.term': term,
          'filter.overallStatus': 'RECRUITING,NOT_YET_RECRUITING',
          'filter.studyType': 'INTERVENTIONAL',
          pageSize: '5',
          format: 'json',
        });
        const res = await fetch(`${CT_BASE}/studies?${params}`);
        if (!res.ok) continue;
        const data = await res.json();

        for (const study of (data.studies || [])) {
          const nctId = study?.protocolSection?.identificationModule?.nctId;
          if (!nctId || existingIds.has(nctId)) continue;

          const trial = parseCtStudy(study, discovered.length);
          discovered.push({ ...trial, discoveryQuery: label });
          existingIds.add(nctId); // prevent duplicates across queries
        }
      } catch (err) {
        errors.push(`Query "${label}" failed: ${err}`);
      }

      // Respect rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    if (dryRun) {
      return NextResponse.json({
        success: true, dryRun: true,
        discovered: discovered.length,
        trials: discovered.map(t => ({ nctId: t.nctId, name: t.name, phase: t.phase, sponsor: t.sponsor, query: t.discoveryQuery })),
        errors,
      });
    }

    // Save to Firestore
    let saved = 0;
    const batch = db.batch();
    for (const trial of discovered) {
      batch.set(db.collection('trial_matcher_trials').doc(trial.nctId), trial);
      saved++;
    }
    if (saved > 0) await batch.commit();

    // Create in-app notifications for admins
    if (discovered.length > 0) {
      const notifBatch = db.batch();
      const notifRef = db.collection('trial_matcher_notifications').doc();
      notifBatch.set(notifRef, {
        type: 'new_trials_discovered',
        count: discovered.length,
        trials: discovered.map(t => ({ nctId: t.nctId, name: t.name })).slice(0, 5),
        message: `${discovered.length} new recruiting trial${discovered.length !== 1 ? 's' : ''} found on ClinicalTrials.gov — pending admin review`,
        read: false,
        createdAt: Timestamp.now(),
      });
      await notifBatch.commit();
    }

    return NextResponse.json({
      success: true,
      queriesRun: DISCOVERY_QUERIES.length,
      discovered: discovered.length,
      saved,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Discovery failed', details: String(err) }, { status: 500 });
  }
}

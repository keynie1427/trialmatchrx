// src/app/api/trial-matcher/trials/route.ts
//
// Trial management API for the Trial Matcher admin UI.
//
// GET  /api/trial-matcher/trials           → list all trials from Firestore
// POST /api/trial-matcher/trials           → fetch trial from ClinicalTrials.gov + save to Firestore
// GET  /api/trial-matcher/trials?nctId=X   → fetch single trial details from ClinicalTrials.gov
//
// Firestore collection: trial_matcher_trials
// Document structure:
// {
//   nctId:          string        (document ID)
//   name:           string
//   shortName:      string
//   sponsor:        string
//   phase:          string
//   route:          string
//   indication:     string
//   drug:           string
//   status:         'Recruiting' | 'Active' | 'Completed'
//   biomarker:      string        (display label)
//   color:          string        (hex)
//   colorLight:     string        (hex)
//   colorDark:      string        (hex)
//   rawEligibility: string        (raw text from ClinicalTrials.gov)
//   matchingRules:  object | null (AI-generated, null until reviewed)
//   trialStatus:    'pending_review' | 'active' | 'inactive'
//   addedAt:        Timestamp
//   addedBy:        string
//   activatedAt:    Timestamp | null
//   source:         'manual' | 'auto_discovery'
// }

import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';


async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  try {
    const app = getAdminApp();
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    if (!doc.exists || doc.data()?.role !== 'admin' || doc.data()?.active === false) return null;
    return decoded.email!;
  } catch { return null; }
}

// ─── ClinicalTrials.gov API v2 helper ────────────────────────────────────────

const CT_BASE = 'https://clinicaltrials.gov/api/v2';

async function fetchTrialFromCT(nctId: string) {
  const res = await fetch(`${CT_BASE}/studies/${nctId}?format=json`);
  if (!res.ok) throw new Error(`ClinicalTrials.gov API error: ${res.status}`);
  const data = await res.json();
  return parseCtStudy(data);
}

function parseCtStudy(data: any) {
  const p = data?.protocolSection || {};
  const id   = p.identificationModule || {};
  const stat = p.statusModule || {};
  const desc = p.descriptionModule || {};
  const elig = p.eligibilityModule || {};
  const design = p.designModule || {};
  const sponsor = p.sponsorCollaboratorsModule || {};
  const arms = p.armsInterventionsModule || {};

  const nctId      = id.nctId || '';
  const title      = id.briefTitle || '';
  const phase      = (design.phases || []).join('/').replace('PHASE', 'Phase ').replace('_', '/') || 'N/A';
  const status     = stat.overallStatus || '';
  const conditions = (p.conditionsModule?.conditions || []).join(', ');
  const sponsorName = sponsor.leadSponsor?.name || '';

  // Extract drug/intervention names
  const interventions = (arms.interventions || [])
    .filter((i: any) => i.type === 'DRUG' || i.type === 'BIOLOGICAL')
    .map((i: any) => i.name)
    .slice(0, 3)
    .join(' + ') || 'See protocol';

  const eligText = elig.eligibilityCriteria || '';

  // Map CT status to our status type
  const statusMap: Record<string, string> = {
    'RECRUITING': 'Recruiting',
    'ACTIVE_NOT_RECRUITING': 'Active',
    'NOT_YET_RECRUITING': 'Recruiting',
    'COMPLETED': 'Completed',
    'ENROLLING_BY_INVITATION': 'Active',
  };

  return {
    nctId,
    name: title,
    shortName: nctId,
    sponsor: sponsorName,
    phase,
    route: 'See protocol',
    indication: conditions,
    drug: interventions,
    status: statusMap[status] || 'Active',
    biomarker: 'See criteria',
    color: '#374151',
    colorLight: '#F3F4F6',
    colorDark: '#1F2937',
    rawEligibility: eligText,
    matchingRules: null,
    briefSummary: desc.briefSummary || '',
  };
}

// ─── Color palette for new trials ────────────────────────────────────────────

const COLOR_PALETTE = [
  { color: '#0F6E56', colorLight: '#E1F5EE', colorDark: '#085041' },
  { color: '#185FA5', colorLight: '#E6F1FB', colorDark: '#0C447C' },
  { color: '#7C3AED', colorLight: '#EDE9FE', colorDark: '#5B21B6' },
  { color: '#BE185D', colorLight: '#FCE7F3', colorDark: '#9D174D' },
  { color: '#D97706', colorLight: '#FEF3C7', colorDark: '#B45309' },
  { color: '#0E7490', colorLight: '#CFFAFE', colorDark: '#0C4A6E' },
  { color: '#854F0B', colorLight: '#FAEEDA', colorDark: '#633806' },
  { color: '#065F46', colorLight: '#D1FAE5', colorDark: '#064E3B' },
  { color: '#92400E', colorLight: '#FDE68A', colorDark: '#78350F' },
];

// ─── GET — list trials or fetch single from CT.gov ───────────────────────────

export async function GET(req: NextRequest) {
  const adminEmail = await verifyAdmin(req);
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const nctId = searchParams.get('nctId');
  const query = searchParams.get('query');

  // Fetch single trial from ClinicalTrials.gov
  if (nctId) {
    try {
      const trial = await fetchTrialFromCT(nctId.toUpperCase());
      return NextResponse.json({ trial });
    } catch (err) {
      return NextResponse.json({ error: `Trial not found: ${nctId}` }, { status: 404 });
    }
  }

  // Search ClinicalTrials.gov
  if (query) {
    try {
      const params = new URLSearchParams({
        'query.term': query,
        'filter.overallStatus': 'RECRUITING,ACTIVE_NOT_RECRUITING',
        'filter.studyType': 'INTERVENTIONAL',
        pageSize: '10',
        format: 'json',
      });
      const res = await fetch(`${CT_BASE}/studies?${params}`);
      if (!res.ok) throw new Error('CT.gov search failed');
      const data = await res.json();
      const trials = (data.studies || []).map((s: any) => parseCtStudy(s));
      return NextResponse.json({ trials, total: data.totalCount || trials.length });
    } catch (err) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
  }

  // List all trials from Firestore
  try {
    const app = getAdminApp();
    const db = getAdminDb();
    const snap = await db.collection('trial_matcher_trials').orderBy('addedAt', 'desc').get();
    const trials = snap.docs.map(d => ({
      ...d.data(),
      addedAt:     d.data().addedAt?.toDate?.()?.toISOString() || null,
      activatedAt: d.data().activatedAt?.toDate?.()?.toISOString() || null,
    }));
    return NextResponse.json({ trials, count: trials.length });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to list trials' }, { status: 500 });
  }
}

// ─── POST — add trial to Firestore ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminEmail = await verifyAdmin(req);
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { nctId, matchingRules, colorIndex } = body;

  if (!nctId) return NextResponse.json({ error: 'nctId required' }, { status: 400 });

  try {
    const app = getAdminApp();
    const db = getAdminDb();

    // Check if already exists
    const existing = await db.collection('trial_matcher_trials').doc(nctId.toUpperCase()).get();
    if (existing.exists) {
      return NextResponse.json({ error: 'Trial already exists in matcher' }, { status: 409 });
    }

    // Fetch from ClinicalTrials.gov
    const trialData = await fetchTrialFromCT(nctId.toUpperCase());

    // Assign color from palette
    const colorIdx = typeof colorIndex === 'number' ? colorIndex % COLOR_PALETTE.length : Math.floor(Math.random() * COLOR_PALETTE.length);
    const colors = COLOR_PALETTE[colorIdx];

    const doc = {
      ...trialData,
      ...colors,
      matchingRules: matchingRules || null,
      trialStatus: matchingRules ? 'pending_review' : 'pending_review',
      addedAt: Timestamp.now(),
      addedBy: adminEmail,
      activatedAt: null,
      source: 'manual',
    };

    await db.collection('trial_matcher_trials').doc(nctId.toUpperCase()).set(doc);

    return NextResponse.json({ success: true, trial: { ...doc, addedAt: new Date().toISOString() } }, { status: 201 });
  } catch (err: any) {
    if (err.message?.includes('not found') || err.message?.includes('404')) {
      return NextResponse.json({ error: `Trial ${nctId} not found on ClinicalTrials.gov` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to add trial', details: String(err) }, { status: 500 });
  }
}

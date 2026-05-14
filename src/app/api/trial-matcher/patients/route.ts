// src/app/api/trial-matcher/patients/route.ts
//
// API route that reads Synthea FHIR R4 JSON files from /public/synthea/
// parses them through fhirAdapter, runs trial matching, and returns
// TrialMatcherPatient[] to the Trial Matcher page.
//
// SETUP:
//   1. Generate Synthea data (see fhirAdapter.ts for instructions)
//   2. Copy the FHIR JSON files to: public/synthea/
//      trialmatchrx-v2/public/synthea/*.json
//   3. The Trial Matcher page calls GET /api/trial-matcher/patients
//
// The route reads files at build/request time from the filesystem.
// On Vercel this works because /public is included in the deployment bundle.
//
// PRODUCTION UPGRADE PATH:
//   Replace the file reads with a Firestore query:
//   const snapshot = await getDocs(collection(adminDb, 'patients'));
//   const patients = snapshot.docs.map(d => d.data() as TrialMatcherPatient);

import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { parseFhirBundle } from '@/lib/fhirAdapter';
import type { TrialMatcherPatient } from '@/lib/trialMatcherData';
import { getAdminDb } from '@/lib/firebaseAdmin';

// ─── Fetch active Firestore trials ────────────────────────────────────────────

async function getActiveFirestoreTrials(): Promise<Array<{ nctId: string; matchingRules: any[]; name: string; shortName: string; sponsor: string; phase: string; indication: string; drug: string; status: string; biomarker: string; color: string; colorLight: string; colorDark: string }>> {
  try {
    const db = getAdminDb();
    const snap = await db.collection('trial_matcher_trials')
      .where('trialStatus', '==', 'active')
      .get();
    return snap.docs
      .map(d => ({ nctId: d.id, ...d.data() } as any))
      ;
  } catch (err) {
    console.error('[patients] Firestore trials fetch error:', err);
    return [];
  }
}

export async function GET() {
  try {
    const syntheaDir = join(process.cwd(), 'public', 'synthea');

    // Fetch active Firestore trials in parallel with file read
    const [files, firestoreTrials] = await Promise.all([
      readdir(syntheaDir).catch(() => null),
      getActiveFirestoreTrials(),
    ]);

    if (!files) {
      return NextResponse.json(
        { patients: [], count: 0, source: 'synthea', firestoreTrials: [], message: 'No Synthea data found.' },
        { status: 200 }
      );
    }

    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('practitioner') && !f.startsWith('hospital'));

    const patients: TrialMatcherPatient[] = [];
    const errors: string[] = [];

    for (const file of jsonFiles) {
      try {
        const content = await readFile(join(syntheaDir, file), 'utf-8');
        const bundle = JSON.parse(content);
        const patient = parseFhirBundle(bundle, firestoreTrials);
        if (patient) patients.push(patient);
      } catch (err) {
        errors.push(`${file}: ${err instanceof Error ? err.message : 'parse error'}`);
      }
    }

    // Sort: eligible first, then by score
    const statusOrder: Record<string, number> = {
      LIKELY_ELIGIBLE: 3,
      REVIEW_REQUIRED: 2,
      EXCLUDED: 1,
    };

    patients.sort((a, b) => {
      const oa = statusOrder[a.bestMatch.status] ?? 0;
      const ob = statusOrder[b.bestMatch.status] ?? 0;
      if (ob !== oa) return ob - oa;
      return b.bestMatch.score - a.bestMatch.score;
    });

    return NextResponse.json({
      patients,
      count: patients.length,
      total: jsonFiles.length,
      errors: errors.length > 0 ? errors : undefined,
      source: 'synthea-fhir-r4',
      firestoreTrials: firestoreTrials.map(t => ({
        nctId: t.nctId,
        name: t.name,
        shortName: t.shortName || t.nctId,
        sponsor: t.sponsor,
        phase: t.phase,
        indication: t.indication,
        drug: t.drug,
        status: t.status,
        biomarker: t.biomarker,
        color: t.color,
        colorLight: t.colorLight,
        colorDark: t.colorDark,
      })),
    });
  } catch (err) {
    console.error('[trial-matcher/patients] Error:', err);
    return NextResponse.json(
      { error: 'Failed to load patient data', patients: [], count: 0 },
      { status: 500 }
    );
  }
}

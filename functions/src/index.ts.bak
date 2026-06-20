import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

// =============================================================================
// TYPES
// =============================================================================

interface SearchCriteria {
  cancerType?: string;
  stage?: string;
  biomarkers?: string[];
  phase?: string[];
  priorTreatment?: string;
  treatmentNaive?: boolean;
  zip?: string;
  distance?: number;
  status?: string[];
  query?: string;
  limit?: number;
  offset?: number;
}

interface PatientProfile {
  cancerType: string;
  cancerSubtype?: string;
  stage?: string;
  biomarkers: string[];
  priorTreatments: Array<{ treatment: string; type: string }>;
  treatmentNaive: boolean;
  age?: number;
  ecogStatus?: number;
  zip?: string;
}

// =============================================================================
// SEARCH API
// =============================================================================

export const search = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { criteria, profile } = req.body as {
      criteria: SearchCriteria;
      profile?: PatientProfile;
    };

    // Build Firestore query
    let query: admin.firestore.Query = db.collection('trials');

    // Filter by status
    if (criteria.status && criteria.status.length > 0) {
      query = query.where('status', 'in', criteria.status);
    } else {
      query = query.where('status', '==', 'Recruiting');
    }

    // Filter by cancer type
    if (criteria.cancerType) {
      query = query.where('conditionsNormalized', 'array-contains', criteria.cancerType);
    }

    // Filter by phase
    if (criteria.phase && criteria.phase.length > 0) {
      query = query.where('phase', 'in', criteria.phase);
    }

    // Order and limit
    query = query
      .orderBy('lastUpdateDate', 'desc')
      .limit(criteria.limit || 50);

    // Execute query
    const snapshot = await query.get();
    let trials = snapshot.docs.map(doc => ({
      nctId: doc.id,
      ...doc.data(),
    }));

    // Client-side filtering for complex criteria
    if (criteria.biomarkers && criteria.biomarkers.length > 0) {
      trials = trials.filter((trial: any) =>
        criteria.biomarkers!.some(b => trial.biomarkers?.includes(b))
      );
    }

    if (criteria.stage) {
      trials = trials.filter((trial: any) =>
        trial.stages?.includes(criteria.stage)
      );
    }

    // Calculate match scores
    const results = trials.map((trial: any) => {
      const matchScore = calculateMatchScore(trial, criteria, profile);
      const matchReasons = generateMatchReasons(trial, criteria, profile);

      return {
        trial,
        matchScore,
        matchReasons,
      };
    });

    // Sort by match score
    results.sort((a: any, b: any) => b.matchScore - a.matchScore);

    res.json({
      results,
      total: results.length,
      facets: generateFacets(trials),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// =============================================================================
// AI MATCH API
// =============================================================================

export const aiMatch = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { action, trial, profile, query } = req.body;

    switch (action) {
      case 'parse':
        // Parse natural language query
        const parsed = await parseNaturalLanguageQuery(query);
        res.json(parsed);
        break;

      case 'analyze':
        // Analyze trial-profile match
        const analysis = await analyzeTrialMatch(trial, profile);
        res.json(analysis);
        break;

      case 'summarize':
        // Generate trial summary
        const summary = await generateTrialSummary(trial);
        res.json({ summary });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('AI Match error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// =============================================================================
// SYNC TRIALS (Scheduled)
// =============================================================================

export const syncTrials = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Starting trial sync...');

    try {
      // Fetch from ClinicalTrials.gov API
      const cancerTypes = [
        'breast cancer',
        'lung cancer',
        'prostate cancer',
        'colorectal cancer',
        'melanoma',
        'leukemia',
        'lymphoma',
        'pancreatic cancer',
        'ovarian cancer',
      ];

      for (const cancerType of cancerTypes) {
        await syncTrialsForCondition(cancerType);
      }

      // Update metadata
      await db.collection('metadata').doc('lastSync').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success',
      });

      console.log('Trial sync completed');
    } catch (error) {
      console.error('Trial sync failed:', error);

      await db.collection('metadata').doc('lastSync').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed',
        error: String(error),
      });
    }
  });

// =============================================================================
// ALERTS (Scheduled)
// =============================================================================

export const processAlerts = functions.pubsub
  .schedule('every monday 09:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Processing alerts...');

    try {
      // Get all enabled weekly alerts
      const alertsSnapshot = await db
        .collection('alerts')
        .where('enabled', '==', true)
        .where('frequency', '==', 'weekly')
        .get();

      for (const alertDoc of alertsSnapshot.docs) {
        const alert = alertDoc.data();
        await processUserAlert(alertDoc.id, alert);
      }

      console.log(`Processed ${alertsSnapshot.size} alerts`);
    } catch (error) {
      console.error('Alert processing failed:', error);
    }
  });

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateMatchScore(
  trial: any,
  criteria: SearchCriteria,
  profile?: PatientProfile
): number {
  let score = 50; // Base score

  // Cancer type match
  if (criteria.cancerType && trial.conditionsNormalized?.includes(criteria.cancerType)) {
    score += 20;
  }

  // Stage match
  if (criteria.stage && trial.stages?.includes(criteria.stage)) {
    score += 10;
  }

  // Biomarker match
  if (criteria.biomarkers && criteria.biomarkers.length > 0) {
    const matchedBiomarkers = criteria.biomarkers.filter(b =>
      trial.biomarkers?.includes(b)
    );
    score += (matchedBiomarkers.length / criteria.biomarkers.length) * 15;
  }

  // Phase preference (Phase 3 gets bonus)
  if (trial.phase?.includes('3')) {
    score += 5;
  }

  // Profile-specific scoring
  if (profile) {
    // Treatment history alignment
    if (profile.treatmentNaive && trial.treatmentNaive) {
      score += 10;
    }

    // ECOG match
    if (
      profile.ecogStatus !== undefined &&
      trial.eligibilityParsed?.ecogMax !== undefined &&
      profile.ecogStatus <= trial.eligibilityParsed.ecogMax
    ) {
      score += 5;
    }
  }

  return Math.min(Math.round(score), 100);
}

function generateMatchReasons(
  trial: any,
  criteria: SearchCriteria,
  profile?: PatientProfile
): Array<{ factor: string; weight: number; matched: boolean; details?: string }> {
  const reasons: Array<{ factor: string; weight: number; matched: boolean; details?: string }> = [];

  // Cancer type
  reasons.push({
    factor: 'Cancer Type',
    weight: 10,
    matched: !!criteria.cancerType && trial.conditionsNormalized?.includes(criteria.cancerType),
    details: criteria.cancerType || 'Not specified',
  });

  // Stage
  reasons.push({
    factor: 'Cancer Stage',
    weight: 8,
    matched: !!criteria.stage && trial.stages?.includes(criteria.stage),
    details: criteria.stage || 'Not specified',
  });

  // Biomarkers
  if (criteria.biomarkers && criteria.biomarkers.length > 0) {
    const matched = criteria.biomarkers.filter(b => trial.biomarkers?.includes(b));
    reasons.push({
      factor: 'Biomarkers',
      weight: 9,
      matched: matched.length > 0,
      details: `${matched.length}/${criteria.biomarkers.length} match`,
    });
  }

  // Status
  reasons.push({
    factor: 'Recruiting Status',
    weight: 10,
    matched: trial.status === 'Recruiting',
    details: trial.status,
  });

  return reasons;
}

function generateFacets(trials: any[]): {
  phases: Array<{ value: string; count: number }>;
  statuses: Array<{ value: string; count: number }>;
  biomarkers: Array<{ value: string; count: number }>;
} {
  const phaseCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const biomarkerCounts: Record<string, number> = {};

  for (const trial of trials) {
    // Phases
    if (trial.phase) {
      phaseCounts[trial.phase] = (phaseCounts[trial.phase] || 0) + 1;
    }

    // Status
    if (trial.status) {
      statusCounts[trial.status] = (statusCounts[trial.status] || 0) + 1;
    }

    // Biomarkers
    if (trial.biomarkers) {
      for (const biomarker of trial.biomarkers) {
        biomarkerCounts[biomarker] = (biomarkerCounts[biomarker] || 0) + 1;
      }
    }
  }

  return {
    phases: Object.entries(phaseCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    statuses: Object.entries(statusCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    biomarkers: Object.entries(biomarkerCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
  };
}

async function parseNaturalLanguageQuery(query: string): Promise<SearchCriteria> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Parse this clinical trial search query into structured criteria.

Query: "${query}"

Extract:
- cancerType (normalize to standard names)
- stage (Stage I-IV, Metastatic, etc.)
- biomarkers (EGFR, ALK, KRAS, etc.)
- priorTreatment
- treatmentNaive (true/false/null)
- phase preferences

Respond ONLY with JSON:
{
  "cancerType": "string or null",
  "stage": "string or null",
  "biomarkers": ["array"] or [],
  "priorTreatment": "string or null",
  "treatmentNaive": true/false/null,
  "phase": ["array"] or []
}`,
      },
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function analyzeTrialMatch(trial: any, profile: PatientProfile): Promise<any> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this clinical trial match for the patient.

Patient: ${profile.cancerType} ${profile.stage || ''}, Biomarkers: ${profile.biomarkers.join(', ') || 'None'}, Prior: ${profile.treatmentNaive ? 'Treatment-naïve' : profile.priorTreatments.map(t => t.treatment).join(', ')}

Trial: ${trial.nctId} - ${trial.briefTitle}
Phase: ${trial.phase}
Biomarkers: ${trial.biomarkers?.join(', ') || 'None'}
Stages: ${trial.stages?.join(', ') || 'Not specified'}

Eligibility:
${trial.eligibilityCriteria?.substring(0, 2000) || 'Not available'}

Respond with JSON:
{
  "score": 0-100,
  "summary": "2-3 sentences",
  "matchReasons": ["reason 1", ...],
  "concerns": ["concern 1", ...],
  "questions": ["question for oncologist", ...]
}`,
      },
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function generateTrialSummary(trial: any): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Summarize this clinical trial in 2-3 sentences for a patient. Be clear and avoid jargon.

Trial: ${trial.briefTitle}
Phase: ${trial.phase}
Treatments: ${trial.interventions?.map((i: any) => i.name).join(', ') || 'Not specified'}
Conditions: ${trial.conditions?.join(', ') || 'Not specified'}

Write a brief, patient-friendly summary:`,
      },
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent?.type === 'text' ? textContent.text.trim() : trial.briefTitle;
}

async function syncTrialsForCondition(condition: string): Promise<void> {
  const CTG_API = 'https://clinicaltrials.gov/api/v2/studies';
  const params = new URLSearchParams({
    'query.cond': condition,
    'filter.overallStatus': 'RECRUITING',
    pageSize: '100',
  });

  const response = await fetch(`${CTG_API}?${params}`);
  const data = await response.json();

  const batch = db.batch();
  let count = 0;

  for (const study of data.studies || []) {
    const nctId = study.protocolSection?.identificationModule?.nctId;
    if (!nctId) continue;

    const trialRef = db.collection('trials').doc(nctId);
    batch.set(trialRef, transformStudy(study), { merge: true });
    count++;

    // Firestore batch limit is 500
    if (count >= 450) {
      await batch.commit();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`Synced trials for: ${condition}`);
}

function transformStudy(study: any): any {
  const protocol = study.protocolSection || {};
  const id = protocol.identificationModule || {};
  const status = protocol.statusModule || {};
  const design = protocol.designModule || {};
  const conditions = protocol.conditionsModule || {};
  const eligibility = protocol.eligibilityModule || {};

  return {
    nctId: id.nctId,
    title: id.briefTitle,
    briefTitle: id.briefTitle,
    officialTitle: id.officialTitle,
    status: mapStatus(status.overallStatus),
    lastUpdateDate: status.lastUpdateSubmitDate || new Date().toISOString(),
    phase: mapPhase(design.phases?.[0]),
    studyType: design.studyType || 'Interventional',
    conditions: conditions.conditions || [],
    conditionsNormalized: normalizeConditions(conditions.conditions || []),
    biomarkers: extractBiomarkers(eligibility.eligibilityCriteria || ''),
    stages: extractStages(eligibility.eligibilityCriteria || '', conditions.conditions || []),
    eligibilityCriteria: eligibility.eligibilityCriteria || '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    RECRUITING: 'Recruiting',
    NOT_YET_RECRUITING: 'Not yet recruiting',
    ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
    COMPLETED: 'Completed',
    SUSPENDED: 'Suspended',
    TERMINATED: 'Terminated',
    WITHDRAWN: 'Withdrawn',
  };
  return map[status] || 'Unknown status';
}

function mapPhase(phase: string | undefined): string {
  if (!phase) return 'Not Applicable';
  const map: Record<string, string> = {
    EARLY_PHASE1: 'Early Phase 1',
    PHASE1: 'Phase 1',
    PHASE1_PHASE2: 'Phase 1/Phase 2',
    PHASE2: 'Phase 2',
    PHASE2_PHASE3: 'Phase 2/Phase 3',
    PHASE3: 'Phase 3',
    PHASE4: 'Phase 4',
  };
  return map[phase] || 'Not Applicable';
}

function normalizeConditions(conditions: string[]): string[] {
  const normalized = new Set<string>();
  const mappings: Record<string, string[]> = {
    'Breast Cancer': ['breast cancer', 'breast carcinoma'],
    'Non-Small Cell Lung Cancer': ['non-small cell lung cancer', 'nsclc'],
    'Lung Cancer': ['lung cancer', 'lung carcinoma'],
    'Prostate Cancer': ['prostate cancer', 'prostate carcinoma'],
    'Colorectal Cancer': ['colorectal cancer', 'colon cancer', 'rectal cancer'],
    'Melanoma': ['melanoma'],
    'Leukemia': ['leukemia'],
    'Lymphoma': ['lymphoma'],
    'Pancreatic Cancer': ['pancreatic cancer', 'pancreas cancer'],
    'Ovarian Cancer': ['ovarian cancer'],
  };

  for (const condition of conditions) {
    const lower = condition.toLowerCase();
    for (const [standard, keywords] of Object.entries(mappings)) {
      if (keywords.some(k => lower.includes(k))) {
        normalized.add(standard);
      }
    }
  }

  return Array.from(normalized);
}

function extractBiomarkers(text: string): string[] {
  const biomarkers = new Set<string>();
  const patterns = [
    'EGFR', 'ALK', 'ROS1', 'KRAS', 'BRAF', 'HER2', 'PD-L1',
    'BRCA1', 'BRCA2', 'MSI-H', 'NTRK', 'RET', 'MET', 'PIK3CA',
  ];

  const upper = text.toUpperCase();
  for (const pattern of patterns) {
    if (upper.includes(pattern)) {
      biomarkers.add(pattern);
    }
  }

  return Array.from(biomarkers);
}

function extractStages(text: string, conditions: string[]): string[] {
  const stages = new Set<string>();
  const combined = `${text} ${conditions.join(' ')}`.toLowerCase();

  if (combined.includes('stage i') || combined.includes('stage 1')) stages.add('Stage I');
  if (combined.includes('stage ii') || combined.includes('stage 2')) stages.add('Stage II');
  if (combined.includes('stage iii') || combined.includes('stage 3')) stages.add('Stage III');
  if (combined.includes('stage iv') || combined.includes('stage 4')) stages.add('Stage IV');
  if (combined.includes('metastatic')) stages.add('Metastatic');
  if (combined.includes('locally advanced')) stages.add('Locally Advanced');

  return Array.from(stages);
}

async function processUserAlert(alertId: string, alert: any): Promise<void> {
  // Search for new trials matching criteria
  const criteria = alert.searchCriteria;
  const lastSent = alert.lastSent?.toDate() || new Date(0);

  let query: admin.firestore.Query = db.collection('trials')
    .where('status', '==', 'Recruiting')
    .where('updatedAt', '>', lastSent);

  if (criteria.cancerType) {
    query = query.where('conditionsNormalized', 'array-contains', criteria.cancerType);
  }

  const snapshot = await query.limit(50).get();

  if (snapshot.empty) {
    return;
  }

  // TODO: Send email notification
  console.log(`Alert ${alertId}: Found ${snapshot.size} new trials`);

  // Update alert
  await db.collection('alerts').doc(alertId).update({
    lastSent: admin.firestore.FieldValue.serverTimestamp(),
    lastMatchCount: snapshot.size,
  });
}

// src/app/api/trial-matcher/trials/parse-criteria/route.ts
//
// AI-powered eligibility criteria parser with:
//   - Confidence scoring per rule (0–100)
//   - Plain English summaries for clinical review
//   - Auto-confirmed vs needs-review classification
//   - Live patient match count validation against current cohort

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

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  try {
    const app = getAdminApp();
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAuth(app).verifyIdToken(token);
    const db = getFirestore(app);
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    return doc.exists && doc.data()?.role === 'admin' && doc.data()?.active !== false;
  } catch { return false; }
}

const SYSTEM_PROMPT = `You are a clinical trial eligibility criteria parser for an oncology EMR screening system.

Extract structured matching rules from raw eligibility criteria text. For each rule, provide a plain English summary a nurse or CRC would understand, the technical rule for the matching engine, and a confidence score.

Available EMR data fields:
- age (years)
- sex: 'Male' | 'Female'
- cancerType: 'Colorectal Cancer' | 'Lung Cancer' | 'Breast Cancer' | 'Pancreatic Cancer' | 'Melanoma' | 'Prostate Cancer' | 'Ovarian Cancer' | 'Advanced Solid Tumor'
- biomarkers.kras / .egfr / .braf / .her2 / .msi / .er / .pr: 'Positive' | 'Negative' | 'Not tested'
- labs.hemoglobin (g/dL) / .ast (U/L) / .alt (U/L) / .creatinine (mg/dL) / .platelets (10^9/L) / .wbc (10^9/L)
- priorTreatments: array of 'Chemotherapy' | 'Immunotherapy' | 'Targeted Therapy' | 'Radiation' | 'Surgery' | 'Hormonal Therapy'

Operators: gte, lte, eq, not_eq, includes, not_includes, in, manual

Confidence scoring:
- 95-100: Unambiguous, maps exactly (Age >= 18, KRAS mutation required)
- 80-94: Clear with minor interpretation (ECOG 0-1 mapped to hemoglobin proxy)
- 60-79: Partial mapping, some ambiguity (adequate renal function — which threshold?)
- 0-59: Cannot determine from EMR data — use operator 'manual'

Auto-confirm if confidence >= 85 AND operator is not 'manual'.

Return ONLY a valid JSON array. No preamble, no markdown. Each item must have:
criterion, plainEnglish, field, operator, value, type (include|exclude_warn), required (boolean), confidence (0-100), autoConfirm (boolean), reviewNote (string|null)

Example item:
{"criterion":"ECOG 0-1","plainEnglish":"Patient must be able to carry out normal activity. Using hemoglobin >= 9 as EMR proxy — confirm at screening.","field":"labs.hemoglobin","operator":"gte","value":9,"type":"include","required":true,"confidence":78,"autoConfirm":false,"reviewNote":"ECOG not directly in EMR — hemoglobin used as proxy."}`;

function getFieldValue(patient: any, field: string): any {
  return field.split('.').reduce((obj, key) => obj?.[key], patient) ?? null;
}

function evaluateRules(patient: any, rules: any[]): boolean {
  for (const rule of rules) {
    if (!rule.required || rule.operator === 'manual') continue;
    const val = getFieldValue(patient, rule.field);
    if (val === null || val === undefined) continue;
    let passes = true;
    switch (rule.operator) {
      case 'gte': passes = Number(val) >= Number(rule.value); break;
      case 'lte': passes = Number(val) <= Number(rule.value); break;
      case 'eq':  passes = val === rule.value; break;
      case 'not_eq': passes = val !== rule.value; break;
      case 'includes': passes = Array.isArray(val) && val.includes(rule.value); break;
      case 'not_includes': passes = !Array.isArray(val) || !val.includes(rule.value); break;
      case 'in': passes = Array.isArray(rule.value) && rule.value.includes(val); break;
    }
    if (!passes) return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  const hasAccess = await verifyAdmin(req);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { nctId, rawEligibility, indication } = body;
  if (!rawEligibility) return NextResponse.json({ error: 'rawEligibility required' }, { status: 400 });

  const truncated = rawEligibility.length > 4000 ? rawEligibility.slice(0, 4000) + '\n\n[Truncated]' : rawEligibility;

  // ── 1. Claude parses criteria ─────────────────────────────────────────────
  let matchingRules: any[] = [];
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Parse eligibility criteria for ${nctId || 'trial'} (${indication || 'Oncology'}).\n\nELIGIBILITY CRITERIA:\n${truncated}\n\nReturn ONLY the JSON array.` }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const data = await res.json();
    const text = data.content?.find((c: any) => c.type === 'text')?.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try { matchingRules = JSON.parse(cleaned); }
    catch { const m = cleaned.match(/\[[\s\S]*\]/); if (m) matchingRules = JSON.parse(m[0]); }
    if (!Array.isArray(matchingRules)) throw new Error('Not an array');
    matchingRules = matchingRules
      .filter(r => r.criterion && r.field && r.operator)
      .map(r => ({ ...r, autoConfirm: r.confidence >= 85 && r.operator !== 'manual' }));
  } catch (err) {
    return NextResponse.json({ error: 'AI parsing failed', details: String(err) }, { status: 500 });
  }

  // ── 2. Live patient validation ─────────────────────────────────────────────
  let matchCount = 0, totalPatients = 0;
  let plausibilityFlag: 'ok' | 'low' | 'high' | 'unknown' = 'unknown';
  let plausibilityMessage = '';
  let validationError: string | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mytrialmatchrx.com';
    const pRes = await fetch(`${baseUrl}/api/trial-matcher/patients`);
    if (pRes.ok) {
      const { patients } = await pRes.json();
      totalPatients = patients.length;
      const validationRules = matchingRules.filter(r => r.autoConfirm && r.required);
      matchCount = patients.filter((p: any) => evaluateRules(p, validationRules)).length;
      const rate = matchCount / totalPatients;
      if (rate === 0) {
        plausibilityFlag = 'low';
        plausibilityMessage = `No patients matched the auto-confirmed criteria. The rules may be too restrictive or a key criterion may be mis-parsed. Review the required rules carefully.`;
      } else if (rate > 0.5) {
        plausibilityFlag = 'high';
        plausibilityMessage = `${Math.round(rate * 100)}% of patients matched — unusually high. Some required criteria may have been parsed as optional. Review before activating.`;
      } else {
        plausibilityFlag = 'ok';
        plausibilityMessage = `${matchCount} of ${totalPatients} patients (${Math.round(rate * 100)}%) matched the confirmed criteria. This looks clinically plausible.`;
      }
    }
  } catch (err) {
    validationError = 'Could not run live validation';
  }

  return NextResponse.json({
    success: true,
    nctId,
    matchingRules,
    summary: {
      total: matchingRules.length,
      autoConfirmed: matchingRules.filter(r => r.autoConfirm).length,
      needsReview: matchingRules.filter(r => !r.autoConfirm).length,
      manualOnly: matchingRules.filter(r => r.operator === 'manual').length,
    },
    validation: {
      matchCount,
      totalPatients,
      matchRate: totalPatients > 0 ? Math.round((matchCount / totalPatients) * 100) : 0,
      plausibilityFlag,
      plausibilityMessage,
      error: validationError,
    },
  });
}

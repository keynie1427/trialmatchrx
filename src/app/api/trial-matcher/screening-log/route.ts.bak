// src/app/api/trial-matcher/screening-log/route.ts
//
// Generates an IRB Screening Log Excel (.xlsx) file server-side.
// Returns the file as a binary download.
//
// Uses a Node.js approach with the 'xlsx' (SheetJS) library which
// is already available as a frontend dependency and works in Next.js
// API routes without needing Python/openpyxl.
//
// 4 sheets:
//   1. Cover          — trial info, stats, regulatory references
//   2. Screening Log  — one row per patient, all criteria columns
//   3. Summary Stats  — eligibility yield, screen failure rate
//   4. Failure Analysis — breakdown by exclusion criterion

import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAdminDb, getAdminAuth, verifyAdminRole } from '@/lib/firebaseAdmin';
import * as XLSX from 'xlsx';


async function verifyAccess(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  try {
    const app = getAdminApp();
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const doc = await db.collection('trial_matcher_users').doc(decoded.email!).get();
    const role = doc.data()?.role;
    return doc.exists && doc.data()?.active !== false && ['crc', 'physician', 'admin'].includes(role);
  } catch {
    return false;
  }
}

// ─── Trial definitions (inline to avoid import issues in API route) ───────────

const TRIAL_NAMES: Record<string, { name: string; sponsor: string; phase: string; drug: string; indication: string; status: string }> = {
  NCT06983743: { name: 'ERAS-0015 (AURORAS-1)', sponsor: 'Erasca, Inc.', phase: 'Phase 1/1b', drug: 'ERAS-0015 ± pembrolizumab', indication: 'RAS-mutant Advanced Solid Tumors', status: 'Recruiting' },
  NCT04093167: { name: 'MARIPOSA-2', sponsor: 'Janssen / Johnson & Johnson', phase: 'Phase 3', drug: 'Amivantamab + lazertinib', indication: 'EGFR-mutant NSCLC', status: 'Active' },
  NCT04657003: { name: 'BREAKWATER', sponsor: 'Pfizer', phase: 'Phase 3', drug: 'Encorafenib + cetuximab', indication: 'BRAF V600E mCRC', status: 'Recruiting' },
  NCT02628067: { name: 'KEYNOTE-158', sponsor: 'Merck', phase: 'Phase 2', drug: 'Pembrolizumab', indication: 'MSI-H Advanced Solid Tumors', status: 'Active' },
  NCT02422615: { name: 'MONARCH-3', sponsor: 'Eli Lilly', phase: 'Phase 3', drug: 'Abemaciclib + letrozole', indication: 'HR+/HER2- Metastatic Breast Cancer', status: 'Active' },
  NCT04494425: { name: 'DESTINY-Breast06', sponsor: 'AstraZeneca', phase: 'Phase 3', drug: 'T-DXd (trastuzumab deruxtecan)', indication: 'HER2+ Metastatic Breast Cancer', status: 'Recruiting' },
  NCT02263508: { name: 'MASTERKEY-265', sponsor: 'Amgen / Merck', phase: 'Phase 3', drug: 'Talimogene laherparepvec + pembrolizumab', indication: 'BRAF V600 Melanoma', status: 'Active' },
  NCT03318939: { name: 'ZENITH20', sponsor: 'Janssen', phase: 'Phase 2', drug: 'Amivantamab', indication: 'EGFR Exon 20 NSCLC', status: 'Active' },
  NCT03539536: { name: 'PRODIGE-48', sponsor: 'UNICANCER', phase: 'Phase 2/3', drug: 'mFOLFIRINOX ± olaparib', indication: 'Metastatic Pancreatic Cancer', status: 'Recruiting' },
};

// ─── Cell styling helpers ─────────────────────────────────────────────────────

function headerStyle(bgColor: string = '0F6E56') {
  return {
    font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 10 },
    fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    },
  };
}

function dataStyle(bgColor?: string) {
  return {
    font: { name: 'Arial', sz: 9 },
    fill: bgColor ? { patternType: 'solid', fgColor: { rgb: bgColor } } : undefined,
    alignment: { vertical: 'center', wrapText: false },
  };
}

function passStyle(pass: boolean | null) {
  if (pass === true)  return { font: { bold: true, color: { rgb: '059669' }, name: 'Arial', sz: 9 }, alignment: { horizontal: 'center' } };
  if (pass === false) return { font: { bold: true, color: { rgb: 'DC2626' }, name: 'Arial', sz: 9 }, alignment: { horizontal: 'center' } };
  return { font: { color: { rgb: 'D97706' }, name: 'Arial', sz: 9 }, alignment: { horizontal: 'center' } };
}

function passValue(pass: boolean | null): string {
  if (pass === true)  return '✓ PASS';
  if (pass === false) return '✗ FAIL';
  return '⚠ REVIEW';
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const hasAccess = await verifyAccess(req);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { trialId } = body;

  if (!trialId || !TRIAL_NAMES[trialId]) {
    return NextResponse.json({ error: 'Invalid or missing trialId' }, { status: 400 });
  }

  // Fetch patient data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mytrialmatchrx.com';
  const patientsRes = await fetch(`${baseUrl}/api/trial-matcher/patients`);
  if (!patientsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 });
  }
  const { patients } = await patientsRes.json();
  const trialInfo = TRIAL_NAMES[trialId];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];

  const trialPatients = (patients as any[]).filter(p => p.trialMatches?.[trialId]);
  const eligible = trialPatients.filter(p => p.trialMatches[trialId]?.status === 'LIKELY_ELIGIBLE');
  const review   = trialPatients.filter(p => p.trialMatches[trialId]?.status === 'REVIEW_REQUIRED');
  const excluded = trialPatients.filter(p => p.trialMatches[trialId]?.status === 'EXCLUDED');
  const total    = trialPatients.length;

  const wb = XLSX.utils.book_new();

  // ─── Sheet 1: Cover ──────────────────────────────────────────────────────────

  const coverData = [
    ['MyTrialMatchRX — IRB Pre-Screening Log'],
    ['EMR-Driven Clinical Trial Eligibility Documentation'],
    [''],
    ['PROTOCOL INFORMATION', '', 'SCREENING DOCUMENTATION', ''],
    ['NCT ID:', trialId, 'Report Date:', today],
    ['Trial Name:', trialInfo.name, 'Screening Method:', 'EMR-driven (FHIR R4)'],
    ['Sponsor:', trialInfo.sponsor, 'Data Source:', 'MyTrialMatchRX Platform'],
    ['Phase:', trialInfo.phase, 'Total Screened:', total],
    ['Drug:', trialInfo.drug, 'Likely Eligible:', eligible.length],
    ['Indication:', trialInfo.indication, 'Review Required:', review.length],
    ['Status:', trialInfo.status, 'Screen Failures:', excluded.length],
    ['', '', 'Screen Failure Rate:', `${((excluded.length / total) * 100).toFixed(1)}%`],
    ['', '', 'Eligibility Yield:', `${(((eligible.length + review.length) / total) * 100).toFixed(1)}%`],
    [''],
    ['REGULATORY REFERENCES'],
    ['21 CFR Part 11 — Electronic Records; Electronic Signatures'],
    ['ICH E6(R2) — Good Clinical Practice'],
    ['ICH E8 — General Considerations for Clinical Studies'],
    ['FDA Guidance: Considerations for the Design, Development, and Validation of Electronic Systems Used in Clinical Investigations'],
    [''],
    ['DISCLAIMER'],
    ['This pre-screening log was generated by the MyTrialMatchRX EMR-driven eligibility engine.'],
    ['All patients identified require formal eligibility confirmation per protocol before consent.'],
    ['This document is for investigator use only and should not be distributed outside the study team.'],
  ];

  const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
  coverSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  coverSheet['!cols'] = [{ wch: 30 }, { wch: 45 }, { wch: 28 }, { wch: 35 }];

  // Style cover header
  if (coverSheet['A1']) {
    coverSheet['A1'].s = { font: { bold: true, sz: 18, color: { rgb: 'FFFFFF' }, name: 'Arial' }, fill: { patternType: 'solid', fgColor: { rgb: '0F6E56' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  }
  if (coverSheet['A2']) {
    coverSheet['A2'].s = { font: { sz: 12, color: { rgb: '085041' }, name: 'Arial' }, fill: { patternType: 'solid', fgColor: { rgb: 'E1F5EE' } }, alignment: { horizontal: 'center' } };
  }

  XLSX.utils.book_append_sheet(wb, coverSheet, 'Cover');

  // ─── Sheet 2: Screening Log ───────────────────────────────────────────────────

  const logHeaders = [
    'Screen #', 'Patient ID', 'Age', 'Sex', 'Cancer Type',
    'KRAS', 'EGFR', 'BRAF', 'HER2', 'MSI', 'ER', 'PR',
    'Hgb (g/dL)', 'AST (U/L)', 'ALT (U/L)', 'Creatinine (mg/dL)', 'Platelets (10⁹/L)', 'WBC (10⁹/L)',
    'Prior Chemo', 'Prior Immuno', 'Prior Targeted', 'Prior Radiation', 'Prior Surgery',
    'Age ≥ 18', 'Solid Tumor', 'Biomarker', 'ECOG 0-1', 'Prior Therapy', 'Organ Function',
    'Match Score (%)', 'Eligibility Status', 'Primary Exclusion Reason',
    'Screen Date', 'Data Source', 'Reviewed By',
  ];

  const logRows: any[][] = [logHeaders];

  const sortedPatients = [...trialPatients].sort((a, b) => {
    const order: Record<string, number> = { LIKELY_ELIGIBLE: 3, REVIEW_REQUIRED: 2, EXCLUDED: 1 };
    return (order[b.trialMatches[trialId]?.status] || 0) - (order[a.trialMatches[trialId]?.status] || 0);
  });

  sortedPatients.forEach((p: any, i: number) => {
    const tm = p.trialMatches[trialId];
    const criteria = tm.criteria || [];

    const getCrit = (keyword: string) => criteria.find((c: any) => c.criterion.toLowerCase().includes(keyword.toLowerCase()));
    const age_c    = getCrit('age');
    const solid_c  = getCrit('solid tumor');
    const bio_c    = getCrit('mutation') || getCrit('msi') || getCrit('her2') || getCrit('hr-positive') || getCrit('egfr') || getCrit('braf') || getCrit('ras');
    const ecog_c   = getCrit('ecog');
    const prior_c  = getCrit('prior');
    const labs_c   = getCrit('organ');

    const exclusionReasons = criteria
      .filter((c: any) => c.type === 'include' && c.pass === false)
      .map((c: any) => c.criterion)
      .join('; ');

    const row = [
      i + 1,
      p.patientId,
      p.age,
      p.sex,
      p.cancerType,
      p.biomarkers?.kras || 'Not tested',
      p.biomarkers?.egfr || 'Not tested',
      p.biomarkers?.braf || 'Not tested',
      p.biomarkers?.her2 || 'Not tested',
      p.biomarkers?.msi  || 'Not tested',
      p.biomarkers?.er   || 'Not tested',
      p.biomarkers?.pr   || 'Not tested',
      p.labs?.hemoglobin  ?? '',
      p.labs?.ast         ?? '',
      p.labs?.alt         ?? '',
      p.labs?.creatinine  ?? '',
      p.labs?.platelets   ?? '',
      p.labs?.wbc         ?? '',
      p.priorTreatments?.includes('Chemotherapy')    ? 'Yes' : 'No',
      p.priorTreatments?.includes('Immunotherapy')   ? 'Yes' : 'No',
      p.priorTreatments?.includes('Targeted Therapy')? 'Yes' : 'No',
      p.priorTreatments?.includes('Radiation')       ? 'Yes' : 'No',
      p.priorTreatments?.includes('Surgery')         ? 'Yes' : 'No',
      passValue(age_c?.pass ?? null),
      passValue(solid_c?.pass ?? null),
      passValue(bio_c?.pass ?? null),
      passValue(ecog_c?.pass ?? null),
      passValue(prior_c?.pass ?? null),
      passValue(labs_c?.pass ?? null),
      tm.score,
      tm.status === 'LIKELY_ELIGIBLE' ? 'LIKELY ELIGIBLE' : tm.status === 'REVIEW_REQUIRED' ? 'REVIEW REQUIRED' : 'EXCLUDED',
      exclusionReasons || '',
      todayISO,
      'FHIR R4 / EMR',
      'MyTrialMatchRX Engine',
    ];

    logRows.push(row);
  });

  const logSheet = XLSX.utils.aoa_to_sheet(logRows);

  // Column widths
  logSheet['!cols'] = [
    { wch: 8 }, { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 20 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 18 }, { wch: 40 },
    { wch: 12 }, { wch: 14 }, { wch: 20 },
  ];

  // Freeze header row
  logSheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, logSheet, 'Screening Log');

  // ─── Sheet 3: Summary Statistics ─────────────────────────────────────────────

  const summaryData = [
    ['Screening Summary Statistics'],
    [''],
    ['Metric', 'Count', 'Percentage', 'Notes'],
    ['Total patients screened', total, '100.0%', `${total.toLocaleString()}-patient cohort`],
    ['Likely eligible', eligible.length, `${((eligible.length / total) * 100).toFixed(1)}%`, 'Passed all EMR-verifiable criteria'],
    ['Review required', review.length, `${((review.length / total) * 100).toFixed(1)}%`, 'Data gaps requiring manual review'],
    ['Screen failures (excluded)', excluded.length, `${((excluded.length / total) * 100).toFixed(1)}%`, 'Did not meet one or more criteria'],
    [''],
    ['Screen failure rate', excluded.length, `${((excluded.length / total) * 100).toFixed(1)}%`, ''],
    ['Eligibility yield', eligible.length + review.length, `${(((eligible.length + review.length) / total) * 100).toFixed(1)}%`, 'Eligible + review / total screened'],
    [''],
    ['Disposition', 'n', '% of Screened', ''],
    ['Proceeded to formal screening', eligible.length, `${((eligible.length / total) * 100).toFixed(1)}%`, 'Likely eligible patients'],
    ['Pending review', review.length, `${((review.length / total) * 100).toFixed(1)}%`, 'Require manual data verification'],
    ['Screen failure — criteria not met', excluded.length, `${((excluded.length / total) * 100).toFixed(1)}%`, 'Automatic exclusion'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 38 }, { wch: 12 }, { wch: 16 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary Statistics');

  // ─── Sheet 4: Screen Failure Analysis ────────────────────────────────────────

  const failureMap = new Map<string, number>();
  excluded.forEach((p: any) => {
    const criteria = p.trialMatches[trialId]?.criteria || [];
    criteria.filter((c: any) => c.type === 'include' && c.pass === false).forEach((c: any) => {
      failureMap.set(c.criterion, (failureMap.get(c.criterion) || 0) + 1);
    });
  });

  const failureData = [
    ['Screen Failure Analysis by Criterion'],
    [`Trial: ${trialInfo.name} (${trialId})`],
    [''],
    ['Exclusion Criterion', 'Screen Failures (n)', '% of Total Screened', '% of All Failures', 'Notes'],
    ...Array.from(failureMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([criterion, count]) => [
        criterion,
        count,
        `${((count / total) * 100).toFixed(1)}%`,
        `${((count / Math.max(excluded.length, 1)) * 100).toFixed(1)}%`,
        count === excluded.length ? 'Primary exclusion criterion' : '',
      ]),
    [''],
    ['TOTAL SCREEN FAILURES', excluded.length, `${((excluded.length / total) * 100).toFixed(1)}%`, '100.0%', ''],
  ];

  const failureSheet = XLSX.utils.aoa_to_sheet(failureData);
  failureSheet['!cols'] = [{ wch: 50 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, failureSheet, 'Screen Failure Analysis');

  // ─── Generate and return file ─────────────────────────────────────────────────

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="IRB_Screening_Log_${trialId}_${todayISO}.xlsx"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}

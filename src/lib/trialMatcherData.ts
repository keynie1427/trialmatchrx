// src/lib/trialMatcherData.ts
//
// Trial definitions, types, and status config for the Trial Matcher.
// Patient data is loaded live from /api/trial-matcher/patients (FHIR R4 bundles).
//
// 9 trials across 6 tumor types and 7 biomarker spaces:
//   KRAS+    → ERAS-0015
//   EGFR+    → MARIPOSA-2, ZENITH20
//   BRAF+    → BREAKWATER (CRC), MASTERKEY-265 (Melanoma)
//   MSI-H    → KEYNOTE-158 (pan-tumor)
//   ER+/HER2-→ MONARCH-3 (Breast)
//   HER2+    → DESTINY-Breast06
//   Chemo-based → PRODIGE-48 (Pancreatic)

export type MatchStatus = 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'EXCLUDED';
export type CriterionType = 'include' | 'exclude_warn';

export interface EligibilityCriterion {
  criterion: string;
  pass: boolean | null;
  value: string;
  type: CriterionType;
}

export interface TrialMatchResult {
  score: number;
  status: MatchStatus;
  criteria: EligibilityCriterion[];
}

export interface TrialMatcherPatient {
  patientId: string;
  age: number;
  sex: string;
  cancerType: string;
  biomarkers: {
    kras: string;
    egfr: string;
    braf: string;
    her2: string;
    msi: string;
    er: string;
    pr: string;
  };
  labs: {
    ast: number | null;
    alt: number | null;
    creatinine: number | null;
    hemoglobin: number | null;
    platelets: number | null;
    wbc: number | null;
  };
  priorTreatments: string[];
  lastVisit: string;
  trialMatches: Record<string, TrialMatchResult>;
  bestMatch: {
    trialId: string;
    score: number;
    status: MatchStatus;
  };
}

export interface TrialDefinition {
  nctId: string;
  name: string;
  shortName: string;
  sponsor: string;
  phase: string;
  route: string;
  indication: string;
  drug: string;
  status: 'Recruiting' | 'Active' | 'Completed';
  biomarker: string;
  color: string;
  colorLight: string;
  colorDark: string;
}

// ─── Trial Definitions ────────────────────────────────────────────────────────

export const TRIALS: Record<string, TrialDefinition> = {
  NCT06983743: {
    nctId: 'NCT06983743', name: 'ERAS-0015 (AURORAS-1)', shortName: 'ERAS-0015',
    sponsor: 'Erasca, Inc.', phase: 'Phase 1/1b', route: 'Oral',
    indication: 'RAS-mutant Advanced Solid Tumors',
    drug: 'ERAS-0015 ± pembrolizumab or panitumumab',
    status: 'Recruiting', biomarker: 'KRAS+',
    color: '#0F6E56', colorLight: '#E1F5EE', colorDark: '#085041',
  },
  NCT04093167: {
    nctId: 'NCT04093167', name: 'MARIPOSA-2', shortName: 'MARIPOSA-2',
    sponsor: 'Janssen / Johnson & Johnson', phase: 'Phase 3', route: 'IV + Oral',
    indication: 'EGFR-mutant NSCLC (post-osimertinib)',
    drug: 'Amivantamab + lazertinib + chemotherapy',
    status: 'Active', biomarker: 'EGFR+',
    color: '#185FA5', colorLight: '#E6F1FB', colorDark: '#0C447C',
  },
  NCT04657003: {
    nctId: 'NCT04657003', name: 'BREAKWATER', shortName: 'BREAKWATER',
    sponsor: 'Pfizer', phase: 'Phase 3', route: 'Oral + IV',
    indication: 'BRAF V600E Metastatic Colorectal Cancer',
    drug: 'Encorafenib + cetuximab ± mFOLFOX6',
    status: 'Recruiting', biomarker: 'BRAF+ CRC',
    color: '#854F0B', colorLight: '#FAEEDA', colorDark: '#633806',
  },
  NCT02628067: {
    nctId: 'NCT02628067', name: 'KEYNOTE-158', shortName: 'KN-158',
    sponsor: 'Merck', phase: 'Phase 2', route: 'IV',
    indication: 'MSI-H/dMMR Advanced Solid Tumors (pan-tumor)',
    drug: 'Pembrolizumab (Keytruda)',
    status: 'Active', biomarker: 'MSI-H',
    color: '#7C3AED', colorLight: '#EDE9FE', colorDark: '#5B21B6',
  },
  NCT02422615: {
    nctId: 'NCT02422615', name: 'MONARCH-3', shortName: 'MONARCH-3',
    sponsor: 'Eli Lilly', phase: 'Phase 3', route: 'Oral',
    indication: 'HR+/HER2- Metastatic Breast Cancer',
    drug: 'Abemaciclib + anastrozole or letrozole',
    status: 'Active', biomarker: 'ER+/HER2-',
    color: '#BE185D', colorLight: '#FCE7F3', colorDark: '#9D174D',
  },
  NCT04494425: {
    nctId: 'NCT04494425', name: 'DESTINY-Breast06', shortName: 'DB-06',
    sponsor: 'AstraZeneca / Daiichi Sankyo', phase: 'Phase 3', route: 'IV',
    indication: 'HER2-positive Metastatic Breast Cancer',
    drug: 'Trastuzumab deruxtecan (T-DXd)',
    status: 'Recruiting', biomarker: 'HER2+',
    color: '#D97706', colorLight: '#FEF3C7', colorDark: '#B45309',
  },
  NCT02263508: {
    nctId: 'NCT02263508', name: 'MASTERKEY-265', shortName: 'MK-265',
    sponsor: 'Amgen / Merck', phase: 'Phase 3', route: 'IV + Intralesional',
    indication: 'BRAF V600-mutant Unresectable Melanoma',
    drug: 'Talimogene laherparepvec + pembrolizumab',
    status: 'Active', biomarker: 'BRAF+ Mel.',
    color: '#92400E', colorLight: '#FDE68A', colorDark: '#78350F',
  },
  NCT03318939: {
    nctId: 'NCT03318939', name: 'ZENITH20', shortName: 'ZENITH20',
    sponsor: 'Janssen', phase: 'Phase 2', route: 'IV',
    indication: 'EGFR Exon 20 Insertion NSCLC',
    drug: 'Amivantamab (JNJ-61186372)',
    status: 'Active', biomarker: 'EGFR ex20',
    color: '#0E7490', colorLight: '#CFFAFE', colorDark: '#0C4A6E',
  },
  NCT03539536: {
    nctId: 'NCT03539536', name: 'PRODIGE-48', shortName: 'PRODIGE-48',
    sponsor: 'UNICANCER', phase: 'Phase 2/3', route: 'IV + Oral',
    indication: 'Metastatic Pancreatic Adenocarcinoma',
    drug: 'mFOLFIRINOX maintenance ± olaparib',
    status: 'Recruiting', biomarker: 'Prior chemo',
    color: '#065F46', colorLight: '#D1FAE5', colorDark: '#064E3B',
  },
};

// ─── Status Config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<MatchStatus, {
  label: string;
  shortLabel: string;
  bgClass: string;
  textClass: string;
  dotColor: string;
  barColor: string;
}> = {
  LIKELY_ELIGIBLE: {
    label: 'Likely eligible', shortLabel: 'Eligible',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-800 dark:text-emerald-300',
    dotColor: '#639922', barColor: '#639922',
  },
  REVIEW_REQUIRED: {
    label: 'Review required', shortLabel: 'Review',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-800 dark:text-amber-300',
    dotColor: '#EF9F27', barColor: '#EF9F27',
  },
  EXCLUDED: {
    label: 'Excluded', shortLabel: 'Excluded',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-800 dark:text-red-300',
    dotColor: '#E24B4A', barColor: '#E24B4A',
  },
};

// ─── Empty patients array — data loaded live from /api/trial-matcher/patients ─
// The page fetches FHIR R4 bundles at runtime and falls back to this if the
// API is unavailable.

export const PATIENTS: TrialMatcherPatient[] = [];

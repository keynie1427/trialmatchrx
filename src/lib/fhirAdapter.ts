// src/lib/fhirAdapter.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// Synthea FHIR R4 → TrialMatcherPatient Adapter
//
// Converts a Synthea-generated FHIR R4 Bundle (one file per patient) into the
// TrialMatcherPatient type the Trial Matcher dashboard expects.
//
// FHIR resources used:
//   Patient       → age, sex
//   Condition     → cancerType (ICD-10 / SNOMED codes)
//   Observation   → labs (CBC, CMP) + biomarkers (KRAS, EGFR, BRAF, HER2, MSI)
//   Procedure     → priorTreatments (chemo, surgery, radiation)
//   MedicationRequest → priorTreatments (targeted therapy, immunotherapy, hormonal)
//   Encounter     → lastVisit date
//
// USAGE:
//   import { parseFhirBundle, parseFhirBundleDirectory } from '@/lib/fhirAdapter';
//
//   // Single patient file
//   const patient = parseFhirBundle(fhirJson);
//
//   // All patients from a directory (Node.js / build script only)
//   const patients = await parseFhirBundleDirectory('./synthea-output/fhir');
//
// GENERATING SYNTHEA DATA:
//   1. Download Synthea: https://github.com/synthetichealth/synthea/releases
//   2. Run: java -jar synthea-with-dependencies.jar -p 200 --exporter.fhir.export=true
//   3. Output lands in: ./output/fhir/*.json
//   4. Copy files to: /public/synthea/ or load via API route
//
// ─────────────────────────────────────────────────────────────────────────────

import type { TrialMatcherPatient } from './trialMatcherData';
import { TRIALS } from './trialMatcherData';

// ─── FHIR R4 Type Definitions ────────────────────────────────────────────────
// Minimal types — only the fields we actually read

interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

interface FhirReference {
  reference?: string;
}

interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: Array<{ system?: string; value?: string }>;
  birthDate?: string;     // "1960-03-15"
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

interface FhirCondition {
  resourceType: 'Condition';
  code?: FhirCodeableConcept;
  clinicalStatus?: FhirCodeableConcept;
  onsetDateTime?: string;
  subject?: FhirReference;
}

interface FhirObservation {
  resourceType: 'Observation';
  code?: FhirCodeableConcept;
  status?: string;
  valueQuantity?: { value?: number; unit?: string };
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  effectiveDateTime?: string;
  subject?: FhirReference;
  component?: Array<{
    code?: FhirCodeableConcept;
    valueQuantity?: { value?: number; unit?: string };
    valueCodeableConcept?: FhirCodeableConcept;
  }>;
}

interface FhirProcedure {
  resourceType: 'Procedure';
  code?: FhirCodeableConcept;
  status?: string;
  performedDateTime?: string;
  performedPeriod?: { start?: string; end?: string };
  subject?: FhirReference;
}

interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  medicationCodeableConcept?: FhirCodeableConcept;
  status?: string;
  authoredOn?: string;
  subject?: FhirReference;
}

interface FhirEncounter {
  resourceType: 'Encounter';
  period?: { start?: string; end?: string };
  status?: string;
}

type FhirResource =
  | FhirPatient
  | FhirCondition
  | FhirObservation
  | FhirProcedure
  | FhirMedicationRequest
  | FhirEncounter;

interface FhirBundle {
  resourceType: 'Bundle';
  entry?: Array<{ resource?: FhirResource }>;
}

// ─── LOINC Codes for Lab Values ───────────────────────────────────────────────
// Standard LOINC codes used by Synthea and Epic for common labs

const LOINC_LABS: Record<string, keyof LabValues> = {
  '1742-6':  'alt',         // Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma
  '1920-8':  'ast',         // Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma
  '2160-0':  'creatinine',  // Creatinine [Mass/volume] in Serum or Plasma
  '718-7':   'hemoglobin',  // Hemoglobin [Mass/volume] in Blood
  '777-3':   'platelets',   // Platelets [#/volume] in Blood by Automated count
  '6690-2':  'wbc',         // Leukocytes [#/volume] in Blood by Automated count
  '26464-8': 'wbc',         // Leukocytes [#/volume] in Blood (alternate)
  '32623-1': 'platelets',   // Platelet mean volume (alternate)
};

interface LabValues {
  ast: number | null;
  alt: number | null;
  creatinine: number | null;
  hemoglobin: number | null;
  platelets: number | null;
  wbc: number | null;
}

// ─── ICD-10 / SNOMED Cancer Type Mapping ────────────────────────────────────

const CANCER_CODE_MAP: Array<{ patterns: string[]; type: string }> = [
  {
    patterns: ['C18', 'C19', 'C20', 'C21', '363406003', '109838007', '93761005'],
    type: 'Colorectal Cancer',
  },
  {
    patterns: ['C34', 'C33', '363358000', '254637007', '254626006', '424132000'],
    type: 'Lung Cancer',
  },
  {
    patterns: ['C25', '372003004', '363418001'],
    type: 'Pancreatic Cancer',
  },
  {
    patterns: ['C50', '363346000', '254837009', '408643008'],
    type: 'Breast Cancer',
  },
  {
    patterns: ['C43', 'C44', '372244006', '372130007'],
    type: 'Melanoma',
  },
  {
    patterns: ['C61', '399068003', '314994000'],
    type: 'Prostate Cancer',
  },
  {
    patterns: ['C56', 'C57', '363443007', '413448000'],
    type: 'Ovarian Cancer',
  },
];

// ─── Biomarker LOINC / SNOMED Codes ─────────────────────────────────────────

const BIOMARKER_CODES: Record<string, string[]> = {
  kras: [
    '55233-1',   // KRAS gene mutation analysis
    '21717-0',   // KRAS codon 12/13 mutation
    '79476-8',   // KRAS gene targeted mutation analysis
    'LA9634-2',  // KRAS mutation present (answer code)
  ],
  egfr: [
    '55201-8',   // EGFR gene mutation analysis
    '85319-2',   // EGFR gene targeted mutation analysis in tumor
    '21717-0',   // Alternate
  ],
  braf: [
    '55233-1',   // Shared molecular panel (check display for BRAF)
    '81287-0',   // BRAF gene targeted mutation analysis
    '21717-0',   // Alternate
  ],
  her2: [
    '85319-2',   // HER2/ERBB2 gene amplification
    '72383-3',   // HER2 [Presence] in Tissue by FISH
    '18474-7',   // HER2 [Presence] in Tissue by Immune stain
  ],
  msi: [
    '81695-4',   // Microsatellite instability
    '85062-8',   // MSI status by fragment analysis
  ],
};

// ─── Treatment Procedure / Medication Codes ──────────────────────────────────

const CHEMO_CODES = [
  '367336001',  // Chemotherapy (SNOMED)
  '385786002',  // Chemotherapy regimen
  'C8648',      // NCI: Chemotherapy
];

const CHEMO_DRUG_PATTERNS = [
  'folfox', 'folfiri', 'capecitabine', 'oxaliplatin', 'irinotecan',
  'carboplatin', 'cisplatin', 'paclitaxel', 'docetaxel', 'gemcitabine',
  'fluorouracil', '5-fu', 'cyclophosphamide', 'doxorubicin',
];

const IMMUNOTHERAPY_PATTERNS = [
  'pembrolizumab', 'nivolumab', 'atezolizumab', 'durvalumab',
  'ipilimumab', 'cemiplimab', 'keytruda', 'opdivo',
];

const TARGETED_PATTERNS = [
  'osimertinib', 'erlotinib', 'gefitinib', 'afatinib', 'lapatinib',
  'vemurafenib', 'dabrafenib', 'encorafenib', 'trametinib',
  'cetuximab', 'panitumumab', 'bevacizumab', 'trastuzumab',
  'pertuzumab', 'adagrasib', 'sotorasib', 'eras-0015', 'amivantamab',
];

const HORMONAL_PATTERNS = [
  'tamoxifen', 'letrozole', 'anastrozole', 'exemestane',
  'fulvestrant', 'leuprolide', 'bicalutamide', 'enzalutamide',
];

const RADIATION_CODES = [
  '108290001',  // Radiation oncology (SNOMED)
  '33195004',   // Radiation therapy procedure
  '385798007',  // Radiation therapy regimen
];

const SURGERY_CODES = [
  '387713003',  // Surgical procedure
  '173171007',  // Colectomy
  '456381000124102', // Resection of lung
  '80146002',   // Appendectomy (Synthea often codes surgery here)
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getCodes(concept?: FhirCodeableConcept): string[] {
  const codes: string[] = [];
  if (concept?.coding) {
    concept.coding.forEach(c => {
      if (c.code) codes.push(c.code);
      if (c.display) codes.push(c.display.toLowerCase());
    });
  }
  if (concept?.text) codes.push(concept.text.toLowerCase());
  return codes;
}

function matchesCodes(concept: FhirCodeableConcept | undefined, patterns: string[]): boolean {
  if (!concept) return false;
  const codes = getCodes(concept);
  return patterns.some(p => codes.some(c => c.toLowerCase().includes(p.toLowerCase())));
}

function detectCancerType(conditions: FhirCondition[]): string {
  // Only look at active conditions
  const active = conditions.filter(c => {
    const status = getCodes(c.clinicalStatus);
    return status.includes('active') || status.includes('active') || status.length === 0;
  });

  for (const condition of active) {
    const codes = getCodes(condition.code);
    for (const mapping of CANCER_CODE_MAP) {
      if (mapping.patterns.some(p => codes.some(c => c.toUpperCase().startsWith(p) || c.includes(p.toLowerCase())))) {
        return mapping.type;
      }
    }
  }
  return 'Advanced Solid Tumor';
}

function extractLabValue(observations: FhirObservation[], loincCode: string): number | null {
  const obs = observations.find(o => {
    const codes = getCodes(o.code);
    return codes.includes(loincCode);
  });
  return obs?.valueQuantity?.value ?? null;
}

function extractBiomarker(observations: FhirObservation[], biomarker: string): string {
  const codes = BIOMARKER_CODES[biomarker] || [];

  const obs = observations.find(o => {
    const obsCodes = getCodes(o.code);
    const obsDisplay = o.code?.coding?.map(c => c.display?.toLowerCase() || '').join(' ') || '';
    return codes.some(c => obsCodes.includes(c)) ||
           obsDisplay.includes(biomarker.toLowerCase());
  });

  if (!obs) return 'Not tested';

  // Check valueCodeableConcept for positive/negative/mutant/wild-type
  if (obs.valueCodeableConcept) {
    const valueCodes = getCodes(obs.valueCodeableConcept);
    const valueText = valueCodes.join(' ').toLowerCase();
    if (valueText.includes('positive') || valueText.includes('mutant') ||
        valueText.includes('present') || valueText.includes('detected')) {
      return 'Positive';
    }
    if (valueText.includes('negative') || valueText.includes('wild') ||
        valueText.includes('absent') || valueText.includes('not detected')) {
      return 'Negative';
    }
  }

  // Check valueString
  if (obs.valueString) {
    const v = obs.valueString.toLowerCase();
    if (v.includes('positive') || v.includes('mutant') || v.includes('detected')) return 'Positive';
    if (v.includes('negative') || v.includes('wild') || v.includes('not detected')) return 'Negative';
  }

  return 'Not tested';
}

function detectPriorTreatments(
  procedures: FhirProcedure[],
  medications: FhirMedicationRequest[]
): string[] {
  const treatments = new Set<string>();

  // Check procedures
  for (const proc of procedures) {
    if (proc.status === 'not-done') continue;
    const display = proc.code?.coding?.map(c => c.display?.toLowerCase() || '').join(' ') || '';
    const codes = getCodes(proc.code);

    if (CHEMO_CODES.some(c => codes.includes(c)) ||
        CHEMO_DRUG_PATTERNS.some(p => display.includes(p))) {
      treatments.add('Chemotherapy');
    }
    if (RADIATION_CODES.some(c => codes.includes(c)) || display.includes('radiation')) {
      treatments.add('Radiation');
    }
    if (SURGERY_CODES.some(c => codes.includes(c)) ||
        display.includes('resection') || display.includes('surgery') ||
        display.includes('excision') || display.includes('colectomy')) {
      treatments.add('Surgery');
    }
    if (IMMUNOTHERAPY_PATTERNS.some(p => display.includes(p))) {
      treatments.add('Immunotherapy');
    }
    if (TARGETED_PATTERNS.some(p => display.includes(p))) {
      treatments.add('Targeted Therapy');
    }
  }

  // Check medications
  for (const med of medications) {
    if (med.status === 'cancelled' || med.status === 'entered-in-error') continue;
    const display = med.medicationCodeableConcept?.coding
      ?.map(c => c.display?.toLowerCase() || '').join(' ') || '';
    const text = (med.medicationCodeableConcept?.text || '').toLowerCase();
    const fullText = `${display} ${text}`;

    if (CHEMO_DRUG_PATTERNS.some(p => fullText.includes(p))) treatments.add('Chemotherapy');
    if (IMMUNOTHERAPY_PATTERNS.some(p => fullText.includes(p))) treatments.add('Immunotherapy');
    if (TARGETED_PATTERNS.some(p => fullText.includes(p))) treatments.add('Targeted Therapy');
    if (HORMONAL_PATTERNS.some(p => fullText.includes(p))) treatments.add('Hormonal Therapy');
  }

  return Array.from(treatments);
}

function getLastVisitDate(encounters: FhirEncounter[]): string {
  const dates = encounters
    .map(e => e.period?.end || e.period?.start)
    .filter(Boolean) as string[];
  if (!dates.length) return new Date().toISOString().split('T')[0];
  return dates.sort().reverse()[0].split('T')[0];
}

// ─── ERAS-0015 Matching Rules ─────────────────────────────────────────────────

function matchEras(patient: Omit<TrialMatcherPatient, 'trialMatches' | 'bestMatch'>) {
  const c = [];

  const ageOk = patient.age >= 18;
  c.push({ criterion: 'Age ≥ 18', pass: ageOk, value: `Age: ${patient.age}`, type: 'include' as const });

  c.push({ criterion: 'Advanced solid tumor', pass: true, value: patient.cancerType, type: 'include' as const });

  const rasOk = patient.biomarkers.kras === 'Positive';
  c.push({ criterion: 'RAS mutation (KRAS/NRAS/HRAS)', pass: rasOk, value: `KRAS: ${patient.biomarkers.kras}`, type: 'include' as const });

  const hgbOk = (patient.labs.hemoglobin ?? 0) >= 8.0;
  c.push({ criterion: 'ECOG 0–1 (Hgb proxy ≥ 8)', pass: hgbOk, value: `Hgb: ${patient.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const });

  const hasPrior = patient.priorTreatments.length > 0;
  c.push({ criterion: 'Prior systemic therapy', pass: hasPrior, value: hasPrior ? patient.priorTreatments.join(', ') : 'None documented', type: 'include' as const });

  const labsOk = (patient.labs.ast ?? 999) <= 100 &&
                 (patient.labs.alt ?? 999) <= 100 &&
                 (patient.labs.creatinine ?? 999) <= 1.5 &&
                 (patient.labs.platelets ?? 0) >= 100 &&
                 hgbOk &&
                 (patient.labs.wbc ?? 0) >= 1.5;
  c.push({ criterion: 'Adequate organ function', pass: labsOk, value: `AST:${patient.labs.ast} ALT:${patient.labs.alt} Cr:${patient.labs.creatinine} Plt:${patient.labs.platelets} WBC:${patient.labs.wbc}`, type: 'include' as const });

  c.push({ criterion: 'No prior RAS inhibitor', pass: null, value: 'Not determinable from FHIR data — manual review required', type: 'exclude_warn' as const });

  const passes = c.filter(x => x.type === 'include').map(x => x.pass);
  const score = Math.round(passes.filter(Boolean).length / passes.length * 1000) / 10;

  let status: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'EXCLUDED';
  if (!rasOk) status = 'EXCLUDED';
  else if (score >= 83) status = 'LIKELY_ELIGIBLE';
  else if (score >= 50) status = 'REVIEW_REQUIRED';
  else status = 'EXCLUDED';

  return { score, status, criteria: c };
}

function matchMariposa(patient: Omit<TrialMatcherPatient, 'trialMatches' | 'bestMatch'>) {
  const c = [];

  const ageOk = patient.age >= 18;
  c.push({ criterion: 'Age ≥ 18', pass: ageOk, value: `Age: ${patient.age}`, type: 'include' as const });

  const nsclc = patient.cancerType === 'Lung Cancer';
  c.push({ criterion: 'NSCLC tumor type', pass: nsclc, value: patient.cancerType, type: 'include' as const });

  const egfr = patient.biomarkers.egfr === 'Positive';
  c.push({ criterion: 'EGFR mutation', pass: egfr, value: `EGFR: ${patient.biomarkers.egfr}`, type: 'include' as const });

  const hgbOk = (patient.labs.hemoglobin ?? 0) >= 9.0;
  c.push({ criterion: 'ECOG 0–1 (Hgb proxy ≥ 9)', pass: hgbOk, value: `Hgb: ${patient.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const });

  const priorTki = patient.priorTreatments.includes('Targeted Therapy');
  c.push({ criterion: 'Prior EGFR TKI (osimertinib)', pass: priorTki, value: `Targeted: ${priorTki ? 'Yes' : 'No'}`, type: 'include' as const });

  const labsOk = (patient.labs.ast ?? 999) <= 90 &&
                 (patient.labs.alt ?? 999) <= 90 &&
                 (patient.labs.creatinine ?? 999) <= 1.5 &&
                 (patient.labs.platelets ?? 0) >= 75 &&
                 hgbOk &&
                 (patient.labs.wbc ?? 0) >= 2.0;
  c.push({ criterion: 'Adequate organ function', pass: labsOk, value: `AST:${patient.labs.ast} ALT:${patient.labs.alt} Cr:${patient.labs.creatinine} Plt:${patient.labs.platelets} WBC:${patient.labs.wbc}`, type: 'include' as const });

  c.push({ criterion: 'No active CNS metastases', pass: null, value: 'CNS status not in FHIR data — manual review required', type: 'exclude_warn' as const });

  const passes = c.filter(x => x.type === 'include').map(x => x.pass);
  const score = Math.round(passes.filter(Boolean).length / passes.length * 1000) / 10;

  let status: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'EXCLUDED';
  if (!nsclc || !egfr) status = 'EXCLUDED';
  else if (score >= 83) status = 'LIKELY_ELIGIBLE';
  else if (score >= 50) status = 'REVIEW_REQUIRED';
  else status = 'EXCLUDED';

  return { score, status, criteria: c };
}

function matchBreakwater(patient: Omit<TrialMatcherPatient, 'trialMatches' | 'bestMatch'>) {
  const c = [];

  const ageOk = patient.age >= 18;
  c.push({ criterion: 'Age ≥ 18', pass: ageOk, value: `Age: ${patient.age}`, type: 'include' as const });

  const crc = patient.cancerType === 'Colorectal Cancer';
  c.push({ criterion: 'Metastatic colorectal cancer', pass: crc, value: patient.cancerType, type: 'include' as const });

  const braf = patient.biomarkers.braf === 'Positive';
  c.push({ criterion: 'BRAF V600E mutation', pass: braf, value: `BRAF: ${patient.biomarkers.braf}`, type: 'include' as const });

  const rasNeg = patient.biomarkers.kras !== 'Positive';
  c.push({ criterion: 'RAS wild-type (KRAS/NRAS neg)', pass: rasNeg, value: `KRAS: ${patient.biomarkers.kras}`, type: 'include' as const });

  const hgbOk = (patient.labs.hemoglobin ?? 0) >= 9.0;
  c.push({ criterion: 'ECOG 0–1 (Hgb proxy ≥ 9)', pass: hgbOk, value: `Hgb: ${patient.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const });

  const labsOk = (patient.labs.ast ?? 999) <= 90 &&
                 (patient.labs.alt ?? 999) <= 90 &&
                 (patient.labs.creatinine ?? 999) <= 1.5 &&
                 (patient.labs.platelets ?? 0) >= 75 &&
                 hgbOk &&
                 (patient.labs.wbc ?? 0) >= 2.0;
  c.push({ criterion: 'Adequate organ function', pass: labsOk, value: `AST:${patient.labs.ast} ALT:${patient.labs.alt} Cr:${patient.labs.creatinine} Plt:${patient.labs.platelets} WBC:${patient.labs.wbc}`, type: 'include' as const });

  c.push({ criterion: 'No prior BRAF inhibitor', pass: null, value: 'Not determinable from FHIR data — manual review required', type: 'exclude_warn' as const });

  const passes = c.filter(x => x.type === 'include').map(x => x.pass);
  const score = Math.round(passes.filter(Boolean).length / passes.length * 1000) / 10;

  let status: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'EXCLUDED';
  if (!crc || !braf) status = 'EXCLUDED';
  else if (score >= 83) status = 'LIKELY_ELIGIBLE';
  else if (score >= 50) status = 'REVIEW_REQUIRED';
  else status = 'EXCLUDED';

  return { score, status, criteria: c };
}

// ─── Main Export: Parse a Single FHIR Bundle ────────────────────────────────

export function parseFhirBundle(bundle: FhirBundle): TrialMatcherPatient | null {
  if (bundle.resourceType !== 'Bundle' || !bundle.entry) return null;

  const resources = bundle.entry.map(e => e.resource).filter(Boolean) as FhirResource[];

  const patient    = resources.find(r => r.resourceType === 'Patient') as FhirPatient | undefined;
  const conditions = resources.filter(r => r.resourceType === 'Condition') as FhirCondition[];
  const observations = resources.filter(r => r.resourceType === 'Observation') as FhirObservation[];
  const procedures = resources.filter(r => r.resourceType === 'Procedure') as FhirProcedure[];
  const medications = resources.filter(r => r.resourceType === 'MedicationRequest') as FhirMedicationRequest[];
  const encounters = resources.filter(r => r.resourceType === 'Encounter') as FhirEncounter[];

  if (!patient || !patient.birthDate) return null;

  const patientId = patient.identifier?.find(i => i.system === 'urn:trialmatchrx:patient')?.value
    || patient.id
    || `FHIR-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

  // ── Demographics
  const age = getAge(patient.birthDate);
  const sex = patient.gender === 'female' ? 'Female' : patient.gender === 'male' ? 'Male' : 'Unknown';

  // ── Cancer type from conditions
  const cancerType = detectCancerType(conditions);

  // ── Labs — use most recent value for each LOINC code
  const latestObs = (loincCode: string): number | null => {
    const matches = observations
      .filter(o => getCodes(o.code).includes(loincCode) && o.valueQuantity?.value != null)
      .sort((a, b) => (b.effectiveDateTime || '').localeCompare(a.effectiveDateTime || ''));
    return matches[0]?.valueQuantity?.value ?? null;
  };

  const labs = {
    ast:        latestObs('1920-8'),
    alt:        latestObs('1742-6'),
    creatinine: latestObs('2160-0'),
    hemoglobin: latestObs('718-7'),
    platelets:  latestObs('777-3'),
    wbc:        latestObs('6690-2') ?? latestObs('26464-8'),
  };

  // ── Biomarkers
  const biomarkers = {
    kras: extractBiomarker(observations, 'kras'),
    egfr: extractBiomarker(observations, 'egfr'),
    braf: extractBiomarker(observations, 'braf'),
    her2: extractBiomarker(observations, 'her2'),
    msi:  extractBiomarker(observations, 'msi'),
  };

  // ── Prior treatments
  const priorTreatments = detectPriorTreatments(procedures, medications);

  // ── Last visit
  const lastVisit = getLastVisitDate(encounters);

  // ── Build base patient (without trial matches)
  const base = { patientId, age, sex, cancerType, biomarkers, labs, priorTreatments, lastVisit };

  // ── Run trial matching rules
  const t1 = matchEras(base);
  const t2 = matchMariposa(base);
  const t3 = matchBreakwater(base);

  const trialMatches = {
    NCT06983743: t1,
    NCT04093167: t2,
    NCT04657003: t3,
  };

  const statusOrder: Record<string, number> = { LIKELY_ELIGIBLE: 3, REVIEW_REQUIRED: 2, EXCLUDED: 1 };
  const best = Object.entries(trialMatches)
    .sort((a, b) => statusOrder[b[1].status] - statusOrder[a[1].status] || b[1].score - a[1].score)[0];

  return {
    ...base,
    trialMatches,
    bestMatch: { trialId: best[0], score: best[1].score, status: best[1].status },
  };
}

// ─── Parse Multiple Bundles (browser / API route) ────────────────────────────

export function parseFhirBundles(bundles: FhirBundle[]): TrialMatcherPatient[] {
  return bundles
    .map(parseFhirBundle)
    .filter((p): p is TrialMatcherPatient => p !== null);
}

// ─── Parse from JSON strings (useful for file uploads in the browser) ────────

export function parseFhirBundleJson(json: string): TrialMatcherPatient | null {
  try {
    const bundle = JSON.parse(json) as FhirBundle;
    return parseFhirBundle(bundle);
  } catch {
    console.error('[fhirAdapter] Failed to parse FHIR bundle JSON');
    return null;
  }
}

// src/lib/fhirAdapter.ts
//
// FHIR R4 Bundle → TrialMatcherPatient adapter
// Supports 9 oncology trials across 6 tumor types
//
// Biomarkers extracted: KRAS, EGFR, BRAF, HER2, MSI, ER, PR
// Labs extracted: AST, ALT, Creatinine, Hemoglobin, Platelets, WBC

import type { TrialMatcherPatient } from './trialMatcherData';

// ─── FHIR Types ───────────────────────────────────────────────────────────────

interface FhirCoding { system?: string; code?: string; display?: string; }
interface FhirCodeableConcept { coding?: FhirCoding[]; text?: string; }
interface FhirPatient {
  resourceType: 'Patient'; id?: string;
  identifier?: Array<{ system?: string; value?: string }>;
  birthDate?: string; gender?: 'male' | 'female' | 'other' | 'unknown';
}
interface FhirCondition {
  resourceType: 'Condition'; code?: FhirCodeableConcept;
  clinicalStatus?: FhirCodeableConcept; onsetDateTime?: string;
}
interface FhirObservation {
  resourceType: 'Observation'; code?: FhirCodeableConcept; status?: string;
  valueQuantity?: { value?: number; unit?: string };
  valueCodeableConcept?: FhirCodeableConcept; valueString?: string;
  effectiveDateTime?: string;
}
interface FhirProcedure {
  resourceType: 'Procedure'; code?: FhirCodeableConcept; status?: string;
  performedDateTime?: string;
}
interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  medicationCodeableConcept?: FhirCodeableConcept; status?: string;
}
interface FhirEncounter {
  resourceType: 'Encounter'; period?: { start?: string; end?: string };
}
type FhirResource = FhirPatient | FhirCondition | FhirObservation | FhirProcedure | FhirMedicationRequest | FhirEncounter;
interface FhirBundle { resourceType: 'Bundle'; entry?: Array<{ resource?: FhirResource }>; }

// ─── Code Maps ────────────────────────────────────────────────────────────────

const CANCER_CODES: Array<{ patterns: string[]; type: string }> = [
  { patterns: ['C18','C19','C20','C21','363406003','109838007'], type: 'Colorectal Cancer' },
  { patterns: ['C34','C33','254637007','254626006','424132000'], type: 'Lung Cancer' },
  { patterns: ['C25','372003004','363418001'], type: 'Pancreatic Cancer' },
  { patterns: ['C50','363346000','254837009','408643008'], type: 'Breast Cancer' },
  { patterns: ['C43','C44','372244006','372130007'], type: 'Melanoma' },
  { patterns: ['C61','399068003','314994000'], type: 'Prostate Cancer' },
  { patterns: ['C56','C57','363443007','413448000'], type: 'Ovarian Cancer' },
];

const BIOMARKER_LOINC: Record<string, string[]> = {
  kras: ['55233-1','21717-0','79476-8'],
  egfr: ['55201-8','85319-2'],
  braf: ['81287-0','55233-1'],
  her2: ['72383-3','18474-7','85319-2'],
  msi:  ['81695-4','85062-8'],
  er:   ['85319-2','10861-3'],
  pr:   ['85320-0','10862-1'],
};

const CHEMO_CODES = ['367336001','385786002'];
const CHEMO_PATTERNS = ['folfox','folfiri','capecitabine','oxaliplatin','irinotecan','carboplatin','cisplatin','paclitaxel','docetaxel','gemcitabine','fluorouracil','5-fu','cyclophosphamide','doxorubicin'];
const IMMUNO_PATTERNS = ['pembrolizumab','nivolumab','atezolizumab','durvalumab','ipilimumab','cemiplimab','keytruda','opdivo','talimogene'];
const TARGETED_PATTERNS = ['osimertinib','erlotinib','gefitinib','afatinib','lapatinib','vemurafenib','dabrafenib','encorafenib','trametinib','cetuximab','panitumumab','bevacizumab','trastuzumab','pertuzumab','abemaciclib','ribociclib','palbociclib','amivantamab','adagrasib','sotorasib'];
const HORMONAL_PATTERNS = ['tamoxifen','letrozole','anastrozole','exemestane','fulvestrant','leuprolide','bicalutamide','enzalutamide'];
const RADIATION_CODES = ['108290001','33195004','385798007'];
const SURGERY_CODES = ['387713003','173171007','456381000124102'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  concept?.coding?.forEach(c => { if (c.code) codes.push(c.code); if (c.display) codes.push(c.display.toLowerCase()); });
  if (concept?.text) codes.push(concept.text.toLowerCase());
  return codes;
}

function detectCancerType(conditions: FhirCondition[]): string {
  for (const cond of conditions) {
    const codes = getCodes(cond.code);
    for (const m of CANCER_CODES) {
      if (m.patterns.some(p => codes.some(c => c.toUpperCase().startsWith(p) || c.includes(p.toLowerCase())))) return m.type;
    }
  }
  return 'Advanced Solid Tumor';
}

function extractBiomarker(observations: FhirObservation[], biomarker: string): string {
  const loincs = BIOMARKER_LOINC[biomarker] || [];
  const obs = observations.find(o => {
    const codes = getCodes(o.code);
    const display = o.code?.coding?.map(c => c.display?.toLowerCase() || '').join(' ') || '';
    return loincs.some(l => codes.includes(l)) || display.includes(biomarker.toLowerCase());
  });
  if (!obs) return 'Not tested';
  const valCodes = getCodes(obs.valueCodeableConcept);
  const valText = valCodes.join(' ').toLowerCase();
  if (obs.valueString) {
    const v = obs.valueString.toLowerCase();
    if (v.includes('positive') || v.includes('mutant')) return 'Positive';
    if (v.includes('negative') || v.includes('wild')) return 'Negative';
  }
  if (valText.includes('positive') || valText.includes('mutant') || valText.includes('10828004')) return 'Positive';
  if (valText.includes('negative') || valText.includes('wild') || valText.includes('260385009')) return 'Negative';
  return 'Not tested';
}

function detectPriorTreatments(procedures: FhirProcedure[], meds: FhirMedicationRequest[]): string[] {
  const tx = new Set<string>();
  for (const p of procedures) {
    if (p.status === 'not-done') continue;
    const display = p.code?.coding?.map(c => c.display?.toLowerCase() || '').join(' ') || '';
    const codes = getCodes(p.code);
    if (CHEMO_CODES.some(c => codes.includes(c)) || CHEMO_PATTERNS.some(p => display.includes(p))) tx.add('Chemotherapy');
    if (RADIATION_CODES.some(c => codes.includes(c)) || display.includes('radiation')) tx.add('Radiation');
    if (SURGERY_CODES.some(c => codes.includes(c)) || display.includes('resection') || display.includes('surgery')) tx.add('Surgery');
    if (IMMUNO_PATTERNS.some(p => display.includes(p))) tx.add('Immunotherapy');
    if (TARGETED_PATTERNS.some(p => display.includes(p))) tx.add('Targeted Therapy');
    if (HORMONAL_PATTERNS.some(p => display.includes(p))) tx.add('Hormonal Therapy');
  }
  for (const m of meds) {
    if (m.status === 'cancelled' || m.status === 'entered-in-error') continue;
    const display = (m.medicationCodeableConcept?.coding?.map(c => c.display?.toLowerCase() || '').join(' ') || '') + ' ' + (m.medicationCodeableConcept?.text || '').toLowerCase();
    if (CHEMO_PATTERNS.some(p => display.includes(p))) tx.add('Chemotherapy');
    if (IMMUNO_PATTERNS.some(p => display.includes(p))) tx.add('Immunotherapy');
    if (TARGETED_PATTERNS.some(p => display.includes(p))) tx.add('Targeted Therapy');
    if (HORMONAL_PATTERNS.some(p => display.includes(p))) tx.add('Hormonal Therapy');
  }
  return Array.from(tx);
}

function latestLabValue(observations: FhirObservation[], loincCode: string): number | null {
  const matches = observations
    .filter(o => getCodes(o.code).includes(loincCode) && o.valueQuantity?.value != null)
    .sort((a, b) => (b.effectiveDateTime || '').localeCompare(a.effectiveDateTime || ''));
  return matches[0]?.valueQuantity?.value ?? null;
}

function getLastVisit(encounters: FhirEncounter[]): string {
  const dates = encounters.map(e => e.period?.end || e.period?.start).filter(Boolean) as string[];
  if (!dates.length) return new Date().toISOString().split('T')[0];
  return dates.sort().reverse()[0].split('T')[0];
}

// ─── Trial Matching Rules ─────────────────────────────────────────────────────

type BasePatient = Omit<TrialMatcherPatient, 'trialMatches' | 'bestMatch'>;
type MatchResult = { score: number; status: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'EXCLUDED'; criteria: TrialMatcherPatient['trialMatches'][string]['criteria'] };

function scoreAndStatus(criteria: MatchResult['criteria'], hardExclude: boolean): Pick<MatchResult, 'score' | 'status'> {
  if (hardExclude) return { score: 0, status: 'EXCLUDED' };
  const passes = criteria.filter(c => c.type === 'include').map(c => c.pass);
  const score = Math.round(passes.filter(Boolean).length / passes.length * 1000) / 10;
  const status = score >= 83 ? 'LIKELY_ELIGIBLE' : score >= 50 ? 'REVIEW_REQUIRED' : 'EXCLUDED';
  return { score, status };
}

function matchEras(p: BasePatient): MatchResult {
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 8;
  const labsOk = (p.labs.ast ?? 999) <= 100 && (p.labs.alt ?? 999) <= 100 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 100 && hgbOk && (p.labs.wbc ?? 0) >= 1.5;
  const rasOk = p.biomarkers.kras === 'Positive';
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Advanced solid tumor', pass: true, value: p.cancerType, type: 'include' as const },
    { criterion: 'RAS mutation (KRAS/NRAS/HRAS)', pass: rasOk, value: `KRAS: ${p.biomarkers.kras}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 8)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: 'Prior systemic therapy', pass: p.priorTreatments.length > 0, value: p.priorTreatments.join(', ') || 'None documented', type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No prior RAS inhibitor', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !rasOk) };
}

function matchMariposa(p: BasePatient): MatchResult {
  const nsclc = p.cancerType === 'Lung Cancer'; const egfr = p.biomarkers.egfr === 'Positive';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'NSCLC tumor type', pass: nsclc, value: p.cancerType, type: 'include' as const },
    { criterion: 'EGFR mutation', pass: egfr, value: `EGFR: ${p.biomarkers.egfr}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: 'Prior EGFR TKI (osimertinib)', pass: p.priorTreatments.includes('Targeted Therapy'), value: `Targeted: ${p.priorTreatments.includes('Targeted Therapy') ? 'Yes' : 'No'}`, type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No active CNS metastases', pass: null, value: 'CNS status not in FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !nsclc || !egfr) };
}

function matchBreakwater(p: BasePatient): MatchResult {
  const crc = p.cancerType === 'Colorectal Cancer'; const braf = p.biomarkers.braf === 'Positive'; const rasNeg = p.biomarkers.kras !== 'Positive';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Metastatic colorectal cancer', pass: crc, value: p.cancerType, type: 'include' as const },
    { criterion: 'BRAF V600E mutation', pass: braf, value: `BRAF: ${p.biomarkers.braf}`, type: 'include' as const },
    { criterion: 'RAS wild-type (KRAS/NRAS neg)', pass: rasNeg, value: `KRAS: ${p.biomarkers.kras}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No prior BRAF inhibitor', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !crc || !braf) };
}

function matchKeynote(p: BasePatient): MatchResult {
  const msi = p.biomarkers.msi === 'Positive';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Advanced solid tumor (any type)', pass: true, value: p.cancerType, type: 'include' as const },
    { criterion: 'MSI-H or dMMR tumor', pass: msi, value: `MSI: ${p.biomarkers.msi}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: '>= 1 prior line of therapy', pass: p.priorTreatments.length > 0, value: p.priorTreatments.join(', ') || 'None documented', type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No prior anti-PD-1/PD-L1 therapy', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !msi) };
}

function matchMonarch(p: BasePatient): MatchResult {
  const breast = p.cancerType === 'Breast Cancer'; const erPos = p.biomarkers.er === 'Positive'; const her2Neg = p.biomarkers.her2 !== 'Positive';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Metastatic breast cancer', pass: breast, value: p.cancerType, type: 'include' as const },
    { criterion: 'HR-positive (ER+ or PR+)', pass: erPos, value: `ER: ${p.biomarkers.er} PR: ${p.biomarkers.pr}`, type: 'include' as const },
    { criterion: 'HER2-negative', pass: her2Neg, value: `HER2: ${p.biomarkers.her2}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No prior CDK4/6 inhibitor', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !breast || !erPos) };
}

function matchDestinyBreast(p: BasePatient): MatchResult {
  const breast = p.cancerType === 'Breast Cancer'; const her2Pos = p.biomarkers.her2 === 'Positive';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Metastatic breast cancer', pass: breast, value: p.cancerType, type: 'include' as const },
    { criterion: 'HER2-positive (IHC 3+ or FISH+)', pass: her2Pos, value: `HER2: ${p.biomarkers.her2}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: '>= 1 prior line of therapy', pass: p.priorTreatments.length > 0, value: p.priorTreatments.join(', ') || 'None documented', type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No prior T-DXd (trastuzumab deruxtecan)', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !breast || !her2Pos) };
}

function matchMasterkey(p: BasePatient): MatchResult {
  const melanoma = p.cancerType === 'Melanoma'; const braf = p.biomarkers.braf === 'Positive';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Unresectable or metastatic melanoma', pass: melanoma, value: p.cancerType, type: 'include' as const },
    { criterion: 'BRAF V600E/K mutation', pass: braf, value: `BRAF: ${p.biomarkers.braf}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No prior anti-PD-1 therapy', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
    { criterion: 'No prior BRAF/MEK inhibitor', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !melanoma || !braf) };
}

function matchZenith(p: BasePatient): MatchResult {
  const nsclc = p.cancerType === 'Lung Cancer'; const egfr = p.biomarkers.egfr === 'Positive';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Metastatic NSCLC', pass: nsclc, value: p.cancerType, type: 'include' as const },
    { criterion: 'EGFR exon 20 insertion mutation', pass: egfr, value: `EGFR: ${p.biomarkers.egfr} (exon 20 subtype — manual confirm)`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: '>= 1 prior platinum-based therapy', pass: p.priorTreatments.includes('Chemotherapy') || p.priorTreatments.includes('Targeted Therapy'), value: p.priorTreatments.join(', ') || 'None', type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No prior EGFR exon 20 inhibitor', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !nsclc || !egfr) };
}

function matchProdige(p: BasePatient): MatchResult {
  const pdac = p.cancerType === 'Pancreatic Cancer';
  const hgbOk = (p.labs.hemoglobin ?? 0) >= 9;
  const labsOk = (p.labs.ast ?? 999) <= 90 && (p.labs.alt ?? 999) <= 90 && (p.labs.creatinine ?? 999) <= 1.5 && (p.labs.platelets ?? 0) >= 75 && hgbOk && (p.labs.wbc ?? 0) >= 2;
  const priorChemo = p.priorTreatments.includes('Chemotherapy');
  const criteria = [
    { criterion: 'Age >= 18', pass: p.age >= 18, value: `Age: ${p.age}`, type: 'include' as const },
    { criterion: 'Metastatic pancreatic adenocarcinoma', pass: pdac, value: p.cancerType, type: 'include' as const },
    { criterion: 'Prior gemcitabine-based chemotherapy', pass: priorChemo, value: `Chemo: ${priorChemo ? 'Yes' : 'No'}`, type: 'include' as const },
    { criterion: 'ECOG 0-1 (Hgb >= 9)', pass: hgbOk, value: `Hgb: ${p.labs.hemoglobin ?? 'N/A'} g/dL`, type: 'include' as const },
    { criterion: 'Adequate organ function', pass: labsOk, value: `AST:${p.labs.ast} ALT:${p.labs.alt} Cr:${p.labs.creatinine} Plt:${p.labs.platelets} WBC:${p.labs.wbc}`, type: 'include' as const },
    { criterion: 'No active biliary obstruction', pass: null, value: 'Not determinable from FHIR — manual review', type: 'exclude_warn' as const },
  ];
  return { criteria, ...scoreAndStatus(criteria, !pdac) };
}

const TRIAL_MATCHERS: Record<string, (p: BasePatient) => MatchResult> = {
  NCT06983743: matchEras,
  NCT04093167: matchMariposa,
  NCT04657003: matchBreakwater,
  NCT02628067: matchKeynote,
  NCT02422615: matchMonarch,
  NCT04494425: matchDestinyBreast,
  NCT02263508: matchMasterkey,
  NCT03318939: matchZenith,
  NCT03539536: matchProdige,
};

// ─── Dynamic trial evaluator (for Firestore trials) ───────────────────────────
// Evaluates a patient against AI-parsed matching rules from Firestore.
// Rules have: field, operator, value, type, required, criterion, plainEnglish

function evaluateFirestoreTrial(base: BasePatient, rules: any[]): MatchResult {
  if (!rules?.length) {
    return { score: 0, status: 'EXCLUDED', criteria: [] };
  }

  const criteria: MatchResult['criteria'] = [];
  let hardExclude = false;

  for (const rule of rules) {
    const field = rule.field as string;
    const operator = rule.operator as string;
    const expected = rule.value;
    const required = rule.required ?? true;

    // Get actual value from patient
    const actual = field.split('.').reduce((obj: any, key) => obj?.[key], base as any);

    let pass: boolean | null = null;

    if (operator === 'manual') {
      pass = null; // always manual review
    } else if (actual === null || actual === undefined) {
      pass = null; // data not available
    } else {
      switch (operator) {
        case 'gte':          pass = Number(actual) >= Number(expected); break;
        case 'lte':          pass = Number(actual) <= Number(expected); break;
        case 'eq':           pass = actual === expected; break;
        case 'not_eq':       pass = actual !== expected; break;
        case 'includes':     pass = Array.isArray(actual) && actual.includes(expected); break;
        case 'not_includes': pass = !Array.isArray(actual) || !actual.includes(expected); break;
        case 'in':           pass = Array.isArray(expected) && expected.includes(actual); break;
        default:             pass = null;
      }
    }

    if (pass === false && required && rule.type === 'include') {
      hardExclude = true;
    }

    criteria.push({
      criterion: rule.criterion || field,
      pass,
      value: rule.plainEnglish
        ? `${actual ?? 'N/A'}`
        : `${field}: ${actual ?? 'N/A'}`,
      type: rule.type === 'exclude_warn' ? 'exclude_warn' : 'include',
    });
  }

  if (hardExclude) return { score: 0, status: 'EXCLUDED', criteria };

  const includeRules = criteria.filter(c => c.type === 'include');
  const passes = includeRules.filter(c => c.pass === true).length;
  const score = includeRules.length > 0
    ? Math.round((passes / includeRules.length) * 1000) / 10
    : 0;

  const status = score >= 83 ? 'LIKELY_ELIGIBLE' : score >= 50 ? 'REVIEW_REQUIRED' : 'EXCLUDED';
  return { score, status, criteria };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function parseFhirBundle(
  bundle: FhirBundle,
  firestoreTrials: Array<{ nctId: string; matchingRules: any[] }> = []
): TrialMatcherPatient | null {
  if (bundle.resourceType !== 'Bundle' || !bundle.entry) return null;
  const resources = bundle.entry.map(e => e.resource).filter(Boolean) as FhirResource[];
  const patient = resources.find(r => r.resourceType === 'Patient') as FhirPatient | undefined;
  if (!patient?.birthDate) return null;

  const conditions  = resources.filter(r => r.resourceType === 'Condition') as FhirCondition[];
  const observations = resources.filter(r => r.resourceType === 'Observation') as FhirObservation[];
  const procedures  = resources.filter(r => r.resourceType === 'Procedure') as FhirProcedure[];
  const medications = resources.filter(r => r.resourceType === 'MedicationRequest') as FhirMedicationRequest[];
  const encounters  = resources.filter(r => r.resourceType === 'Encounter') as FhirEncounter[];

  const patientId = patient.identifier?.find(i => i.system === 'urn:trialmatchrx:patient')?.value
    || patient.id
    || `FHIR-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

  const base: BasePatient = {
    patientId,
    age: getAge(patient.birthDate),
    sex: patient.gender === 'female' ? 'Female' : patient.gender === 'male' ? 'Male' : 'Unknown',
    cancerType: detectCancerType(conditions),
    biomarkers: {
      kras: extractBiomarker(observations, 'kras'),
      egfr: extractBiomarker(observations, 'egfr'),
      braf: extractBiomarker(observations, 'braf'),
      her2: extractBiomarker(observations, 'her2'),
      msi:  extractBiomarker(observations, 'msi'),
      er:   extractBiomarker(observations, 'er'),
      pr:   extractBiomarker(observations, 'pr'),
    },
    labs: {
      ast:        latestLabValue(observations, '1920-8'),
      alt:        latestLabValue(observations, '1742-6'),
      creatinine: latestLabValue(observations, '2160-0'),
      hemoglobin: latestLabValue(observations, '718-7'),
      platelets:  latestLabValue(observations, '777-3'),
      wbc:        latestLabValue(observations, '6690-2') ?? latestLabValue(observations, '26464-8'),
    },
    priorTreatments: detectPriorTreatments(procedures, medications),
    lastVisit: getLastVisit(encounters),
  };

  // Run hardcoded trial matching rules
  const hardcodedMatches = Object.fromEntries(
    Object.entries(TRIAL_MATCHERS).map(([nct, fn]) => [nct, fn(base)])
  );

  // Run dynamic Firestore trial rules
  const dynamicMatches = Object.fromEntries(
    firestoreTrials
      .filter(t => t.matchingRules && t.matchingRules.length > 0)
      .map(t => [t.nctId, evaluateFirestoreTrial(base, t.matchingRules)])
  );

  const trialMatches = { ...hardcodedMatches, ...dynamicMatches };

  const statusOrder: Record<string, number> = { LIKELY_ELIGIBLE: 3, REVIEW_REQUIRED: 2, EXCLUDED: 1 };
  const best = Object.entries(trialMatches)
    .sort((a, b) => statusOrder[b[1].status] - statusOrder[a[1].status] || b[1].score - a[1].score)[0];

  return { ...base, trialMatches, bestMatch: { trialId: best[0], score: best[1].score, status: best[1].status } };
}

export function parseFhirBundles(
  bundles: FhirBundle[],
  firestoreTrials: Array<{ nctId: string; matchingRules: any[] }> = []
): TrialMatcherPatient[] {
  return bundles
    .map(b => parseFhirBundle(b, firestoreTrials))
    .filter((p): p is TrialMatcherPatient => p !== null);
}

export function parseFhirBundleJson(json: string): TrialMatcherPatient | null {
  try { return parseFhirBundle(JSON.parse(json) as FhirBundle); }
  catch { return null; }
}

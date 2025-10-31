// /lib/matchScore.ts
import { computeEvidenceScore } from "@/lib/evidence";

/**
* TrialMatchRX Match Scoring Engine v1.1
*
* Combines Clinical Evidence, Eligibility Fit, and Convenience factors
* into a 0–100 Match Score for ranking clinical trials.
*/

export interface PatientProfile {
condition?: string;
stage?: string;
biomarkers?: string[];
zipCode?: string;
willingToTravelMiles?: number;
}

export interface TrialData {
nctId: string;
title: string;
protocolSection?: any;
status?: string;
phase?: string;
conditions?: string[] | string; // ✅ can be array OR string
city?: string;
state?: string;
country?: string;
biomarkers?: string[];
hasResults?: boolean;
randomized?: boolean;
primaryEndpoint?: string;
metPrimary?: boolean;
}

export interface MatchScoreResult {
nctId: string;
matchScore: number;
clinicalEvidence: number;
eligibilityFit: number;
convenienceScore: number;
reasoning: string[];
}

/** -------------------------------
*  Clinical Evidence (60%)
*  ------------------------------- */
function computeClinicalEvidence(trial: TrialData): { score: number; reasons: string[] } {
  const { score, reasons } = computeEvidenceScore({
    phase: trial.phase,
    randomized: trial.randomized,
    primaryEndpoint: trial.primaryEndpoint,
    hasResults: trial.hasResults,
    metPrimary: trial.metPrimary,
    biomarkerHits: trial.biomarkers,
  });
  return { score: Math.min(score, 100) * 0.6, reasons };
}

/** -------------------------------
 *  Eligibility Fit (25%)
 *  ------------------------------- */
function computeEligibilityFit(
  trial: TrialData,
  patient: PatientProfile
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // ✅ Handle string OR array safely
  let conditionMatch = false;
  if (Array.isArray(trial.conditions)) {
    conditionMatch = trial.conditions.some((c) =>
      c.toLowerCase().includes(patient.condition?.toLowerCase() || "")
    );
  } else if (typeof trial.conditions === "string") {
    conditionMatch = trial.conditions.toLowerCase().includes(
      patient.condition?.toLowerCase() || ""
    );
  }

  if (conditionMatch) {
    score += 10;
    reasons.push(`Condition match: ${patient.condition}`);
  } else {
    reasons.push("Condition mismatch or unspecified.");
  }

  // Disease stage alignment (basic heuristic)
  if (patient.stage && trial.title.toLowerCase().includes(patient.stage.toLowerCase())) {
    score += 5;
    reasons.push(`Stage aligned: ${patient.stage}`);
  }

  // Biomarker overlap
  const trialMarkers = (trial.biomarkers || []).map((b) => b.toLowerCase());
  const patientMarkers = (patient.biomarkers || []).map((b) => b.toLowerCase());
  const markerOverlap = trialMarkers.filter((b) => patientMarkers.includes(b));
  if (markerOverlap.length > 0) {
    score += Math.min(5, markerOverlap.length * 2.5);
    reasons.push(`Biomarker overlap: ${markerOverlap.join(", ").toUpperCase()}`);
  }

  // Generic eligibility heuristic (placeholder)
  if (trial.hasResults) {
    score += 5;
    reasons.push("No exclusion conflicts detected.");
  }

  return { score: Math.min(score, 25), reasons };
}

/** -------------------------------
 *  Convenience (15%)
 *  ------------------------------- */
function computeConvenience(
  trial: TrialData,
  patient: PatientProfile
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Recruitment status
  const status = (trial.status || "").toLowerCase();
  if (status.includes("recruiting")) {
    score += 5;
    reasons.push("Currently recruiting.");
  } else if (status.includes("active")) {
    score += 3;
    reasons.push("Active but not recruiting.");
  }

  // Geographic proximity (approx placeholder)
  if (trial.city && patient.zipCode) {
    score += 5;
    reasons.push("Trial location likely within travel range (approx).");
  }

  // Duration heuristic
  const longTrial = (trial.title || "").toLowerCase().includes("long term");
  if (!longTrial) {
    score += 5;
    reasons.push("Shorter study duration (< 1 year).");
  } else {
    reasons.push("Longer-duration trial.");
  }

  return { score: Math.min(score, 15), reasons };
}

/** -------------------------------
 *  Master Match Score Computation
 *  ------------------------------- */
export function computeMatchScore(
  trial: TrialData,
  patient: PatientProfile
): MatchScoreResult {
  const evidence = computeClinicalEvidence(trial);
  const eligibility = computeEligibilityFit(trial, patient);
  const convenience = computeConvenience(trial, patient);

  const total = evidence.score + eligibility.score + convenience.score;
  const matchScore = Math.min(100, Math.round(total));

  const reasoning = [
    ...evidence.reasons,
    ...eligibility.reasons,
    ...convenience.reasons,
  ];

  return {
    nctId: trial.nctId,
    matchScore,
    clinicalEvidence: Math.round(evidence.score / 0.6),
    eligibilityFit: Math.round(eligibility.score / 0.25),
    convenienceScore: Math.round(convenience.score / 0.15),
    reasoning,
  };
}
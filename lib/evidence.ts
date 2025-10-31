// /lib/evidence.ts

/**
* TrialMatchRX – Evidence scoring (v1.0)
* Deterministic, interpretable scoring (0–100) with human-readable reasons.
*/

export type EvidenceInput = {
phase?: string;                    // "Phase 3" | "Phase 2" | "Phase 1" | "Phase 4" | "Not Applicable"
randomized?: boolean;              // randomized design?
primaryEndpoint?: string;          // "OS" | "PFS" | "ORR" | other
hasResults?: boolean;              // results posted?
metPrimary?: boolean;              // primary endpoint met?
biomarkerHits?: string[];          // detected biomarkers (lower/upper ok)
  totalEnrollment?: number;          // optional: N
  firstPostedDateISO?: string | null;// optional
  lastUpdateDateISO?: string | null; // optional
};

export type EvidenceOutput = {
  score: number;          // 0–100
  reasons: string[];
  breakdown?: {
    phase: number;
    randomized: number;
    endpoint: number;
    metPrimary: number;
    resultsPosted: number;
    biomarkers: number;
    enrollment: number;
    recency: number;
    cap: number;          // raw total before clamp
  };
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const safeUpper = (n: number | undefined | null) =>
  typeof n === "number" && isFinite(n) ? n : 0;

function phaseWeight(phase?: string): { points: number; note?: string } {
  const p = (phase || "").toLowerCase();
  if (p.includes("phase 3")) return { points: 55, note: "Phase III — confirmatory efficacy evidence." };
  if (p.includes("phase 2")) return { points: 35, note: "Phase II — moderate clinical evidence." };
  if (p.includes("phase 4")) return { points: 45, note: "Phase IV — post-marketing/real-world evidence." };
  if (p.includes("phase 1")) return { points: 15, note: "Phase I — preliminary safety/PK evidence." };
  if (p.includes("applicable") || p.includes("not applicable") || p.includes("na") || p.includes("n/a"))
    return { points: 10, note: "Not applicable phase — limited evidence tier." };
  return { points: 10, note: "Unspecified phase — treated as limited evidence." };
}

function endpointWeight(endpoint?: string): { points: number; note?: string } {
  const ep = (endpoint || "").toUpperCase().trim();
  if (ep === "OS")  return { points: 18, note: "Primary endpoint: Overall Survival (OS)." };
  if (ep === "PFS") return { points: 12, note: "Primary endpoint: Progression-Free Survival (PFS)." };
  if (ep === "ORR") return { points: 6,  note: "Primary endpoint: Objective Response Rate (ORR)." };
  if (!ep) return { points: 0 };
  return { points: 4, note: `Primary endpoint: ${ep}.` };
}

function biomarkerWeight(hits?: string[]): { points: number; note?: string } {
  const count = Array.isArray(hits) ? hits.length : 0;
  if (count <= 0) return { points: 0 };
  const capped = Math.min(15, count * 5); // 5 each, max 15
  const label = hits!.map((h) => h.toUpperCase()).join(", ");
  return { points: capped, note: `Biomarker alignment: ${label}.` };
}

function enrollmentWeight(total?: number): { points: number; note?: string } {
  const n = safeUpper(total);
  if (n <= 0) return { points: 0 };
  let pts = 0;
  if (n >= 800) pts = 10;
  else if (n >= 400) pts = 8;
  else if (n >= 200) pts = 6;
  else if (n >= 100) pts = 4;
  else if (n >= 50)  pts = 2;
  return { points: pts, note: `Enrollment size ~${n} participants.` };
}

function recencyWeight(firstPosted?: string | null, lastUpdate?: string | null): { points: number; note?: string } {
  const d = new Date(lastUpdate || firstPosted || "");
  if (isNaN(d.getTime())) return { points: 0 };
  const now = Date.now();
  const ageDays = Math.max(0, (now - d.getTime()) / (1000 * 60 * 60 * 24));
  const pts = Math.round((1 - clamp01(ageDays / 365)) * 5); // up to +5 if updated within 12 months
  if (pts <= 0) return { points: 0 };
  return { points: pts, note: `Recent activity (${Math.round(ageDays)} days ago).` };
}

export function computeEvidenceScore(input: EvidenceInput): EvidenceOutput {
  const reasons: string[] = [];

  // 1) Phase
  const ph = phaseWeight(input.phase);
  if (ph.note) reasons.push(ph.note);

  // 2) Randomization
  const randomizedPts = input.randomized ? 12 : 0;
  if (input.randomized) reasons.push("Randomized design — reduces bias (+12).");

  // 3) Endpoint importance
  const ep = endpointWeight(input.primaryEndpoint);
  if (ep.note) reasons.push(ep.note);

  // 4) Primary endpoint met
  const metPts = input.metPrimary ? 20 : 0;
  if (input.metPrimary) reasons.push("Primary endpoint met / significant benefit (+20).");

  // 5) Results posted
  const postedPts = input.hasResults ? 8 : 0;
  if (input.hasResults) reasons.push("Results publicly posted (+8).");

  // 6) Biomarkers
  const bm = biomarkerWeight(input.biomarkerHits);
  if (bm.note) reasons.push(bm.note);

  // 7) Enrollment (optional)
  const en = enrollmentWeight(input.totalEnrollment);
  if (en.note) reasons.push(en.note);

  // 8) Recency (optional)
  const rc = recencyWeight(input.firstPostedDateISO, input.lastUpdateDateISO);
  if (rc.note) reasons.push(rc.note);

  const raw =
    ph.points +
    randomizedPts +
    ep.points +
    metPts +
    postedPts +
    bm.points +
    en.points +
    rc.points;

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  if (score < 30) reasons.push("Overall evidence remains preliminary/limited.");

  return {
    score,
    reasons,
    breakdown: {
      phase: ph.points,
      randomized: randomizedPts,
      endpoint: ep.points,
      metPrimary: metPts,
      resultsPosted: postedPts,
      biomarkers: bm.points,
      enrollment: en.points,
      recency: rc.points,
      cap: raw,
    },
  };
}
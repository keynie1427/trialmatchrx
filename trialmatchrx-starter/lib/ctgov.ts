import type { Trial } from "./types";

const BASE = "https://clinicaltrials.gov/api/query/study_fields";

function mapRecord(rec: any): Trial {
  const get = (k: string) => Array.isArray(rec[k]) ? rec[k][0] : rec[k];
  const nctId = get("NCTId");
  const locations = (rec.LocationFacility || []).map((name: string, i: number) => ({
    name,
    city: rec.LocationCity?.[i],
    state: rec.LocationState?.[i],
    phone: rec.LocationContactPhone?.[i],
  }));
  return {
    nctId,
    title: get("BriefTitle"),
    condition: get("Condition"),
    phase: (get("Phase") || "").replace("Phase ", ""),
    status: get("OverallStatus"),
    briefSummary: get("BriefSummary"),
    eligibility: get("EligibilityCriteria"),
    locations,
  } as Trial;
}

type Query = { condition?: string; zip?: string; radius?: string; age?: string; phase?: string };

export async function getTrials(q: Query): Promise<Trial[]> {
  const fields = [
    "NCTId","BriefTitle","Condition","Phase","OverallStatus","BriefSummary",
    "EligibilityCriteria","LocationFacility","LocationCity","LocationState","LocationContactPhone"
  ];
  const params = new URLSearchParams({
    expr: buildExpr(q),
    fields: fields.join(","),
    min_rnk: "1",
    max_rnk: "25",
    fmt: "json",
  });
  const url = `${BASE}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  const recs = json?.StudyFieldsResponse?.StudyFields || [];
  return recs.map(mapRecord);
}

export async function getTrialById(nctId: string): Promise<Trial | null> {
  const fields = [
    "NCTId","BriefTitle","Condition","Phase","OverallStatus","BriefSummary",
    "EligibilityCriteria","LocationFacility","LocationCity","LocationState","LocationContactPhone"
  ];
  const params = new URLSearchParams({
    expr: `NCTId:${nctId}`,
    fields: fields.join(","),
    min_rnk: "1",
    max_rnk: "1",
    fmt: "json",
  });
  const url = `${BASE}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  const recs = json?.StudyFieldsResponse?.StudyFields || [];
  return recs.length ? mapRecord(recs[0]) : null;
}

function buildExpr(q: Query): string {
  const parts: string[] = [];
  if (q.condition) parts.push(`AREA[Condition] ${escapeTerm(q.condition)}`);
  if (q.phase) parts.push(`AREA[Phase] ${escapeTerm("Phase " + q.phase)}`);
  if (q.zip && q.radius) parts.push(`AREA[LocationZip] ${q.zip} AND AREA[LocationRadius] ${q.radius}`);
  if (q.age) parts.push(`AREA[MinimumAge] ${q.age} OR AREA[MaximumAge] ${q.age}`);
  if (!parts.length) return "cancer";
  return parts.join(" AND ");
}
function escapeTerm(s: string){ return `\"${s.replace(/\"/g, '\\\"')}\"`; }

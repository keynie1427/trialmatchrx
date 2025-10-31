import { NextResponse } from "next/server";

const BASE = "https://clinicaltrials.gov/api/query/study_fields";
const FIELDS = [
"NCTId","BriefTitle","Condition","Phase","OverallStatus","BriefSummary",
"EligibilityCriteria","LocationFacility","LocationCity","LocationState",
"LocationContactPhone","LeadSponsorName"
];

export async function GET(
  _req: Request,
  { params }: { params: { nctId: string } }
) {
  const { nctId } = params;
  try {
    const query = new URLSearchParams({
      expr: `NCTId:${nctId}`,
      fields: FIELDS.join(","),
      fmt: "json",
    });
    const res = await fetch(`${BASE}?${query.toString()}`, { cache: "no-store" });
    const data = await res.json();
    const trial = data?.StudyFieldsResponse?.StudyFields?.[0] ?? null;
    if (!trial) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }
    return NextResponse.json(trial);
  } catch (err: any) {
    console.error("Lookup error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
import { TrialCard } from "@/components/TrialCard";
import { getTrials } from "@/lib/ctgov";
import { headers } from "next/headers";

export async function SearchResults() {
  const hdrs = headers();
  // Next.js does not expose full URL by default; we simulate via query parsing in server action context.
  // Fallback to reading NEXT_URL if passed via proxy; for now, parse search params from 'referer'.
  const referer = hdrs.get("referer") ?? "";
  const qs = referer.split("?")[1] ?? "";
  const params = new URLSearchParams(qs);

  const trials = await getTrials({
    condition: params.get("condition") || undefined,
    zip: params.get("zip") || undefined,
    radius: params.get("radius") || undefined,
    age: params.get("age") || undefined,
    phase: params.get("phase") || undefined,
  });

  if (!trials?.length) {
    return <p className="text-slate-600">No trials found. Try broadening your search.</p>;
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-6">
      <aside className="hidden md:block">
        <div className="border rounded-2xl p-4">
          <h2 className="font-medium mb-2">Filters</h2>
          <p className="text-sm text-slate-600">Phase, status, distance, sponsor.</p>
        </div>
      </aside>
      <div className="grid gap-4">
        {trials.map((t) => <TrialCard key={t.nctId} trial={t} />)}
      </div>
    </div>
  );
}

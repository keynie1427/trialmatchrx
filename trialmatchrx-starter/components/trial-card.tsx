import Link from "next/link";

export function TrialCard({ trial }: { trial: any }) {
  const { nctId, title, condition, phase, status, locations } = trial;
  return (
    <article className="border rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {phase && <span className="badge">Phase {phase}</span>}
        {status && <span className="badge">{status}</span>}
        {condition && <span className="badge">{condition}</span>}
      </div>
      <h3 className="text-lg font-semibold"><Link href={`/trial/${nctId}`}>{title}</Link></h3>
      <p className="text-sm text-slate-600 mt-1">
        {locations?.[0]?.city ? `${locations[0].city}, ${locations[0].state}` : "Multiple locations"}
      </p>
      <div className="mt-3">
        <Link href={`/trial/${nctId}`} className="btn-primary inline-block">View details</Link>
      </div>
    </article>
  );
}

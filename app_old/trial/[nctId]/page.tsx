import { getTrialById } from "@/lib/ctgov";

export default async function TrialDetailsPage({ params }: { params: { nctId: string }}) {
  const trial = await getTrialById(params.nctId);
  if (!trial) return <p>Trial not found.</p>;

  return (
    <article className="grid gap-4">
      <h1 className="text-2xl font-semibold">{trial.title}</h1>
      <p className="text-sm text-slate-600">NCT ID: {trial.nctId}</p>
      <div className="flex flex-wrap gap-2 text-sm">
        {trial.phase && <span className="badge">Phase {trial.phase}</span>}
        {trial.status && <span className="badge">{trial.status}</span>}
        {trial.condition && <span className="badge">{trial.condition}</span>}
      </div>

      <section className="grid gap-2">
        <h2 className="font-medium">Summary</h2>
        <p className="text-slate-700 whitespace-pre-wrap">{trial.briefSummary}</p>
      </section>

      <section className="grid gap-2">
        <h2 className="font-medium">Locations & Contacts</h2>
        <ul className="list-disc ml-5 text-slate-700">
          {trial.locations?.map((loc: any, idx: number) => (
            <li key={idx}>{loc.name} – {loc.city}, {loc.state} {loc.phone ? `• ${loc.phone}`: ""}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2">
        <h2 className="font-medium">Request More Info</h2>
        <form action="/contact" method="get" className="grid md:grid-cols-[1fr_auto] gap-3">
          <input type="hidden" name="nctId" value={trial.nctId} />
          <input name="email" type="email" placeholder="Your email" className="input" aria-label="Your email" required />
          <button className="btn-primary">Contact Coordinator</button>
        </form>
      </section>
    </article>
  );
}

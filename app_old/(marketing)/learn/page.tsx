import fs from "node:fs";
import path from "node:path";

export default function LearnPage() {
  const dir = path.join(process.cwd(), "data", "learn");
  const topics = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  return (
    <section className="grid gap-4">
      <h1 className="text-xl font-semibold">Learn about Clinical Trials</h1>
      <ul className="list-disc ml-5">
        {topics.map((t) => <li key={t}><a href={`#${t}`}>{t.replace(/\.md$/, "")}</a></li>)}
      </ul>
      <p className="text-slate-600 text-sm">Topics include phases, consent, placebo, randomization, and patient rights.</p>
    </section>
  );
}

import { SearchHero } from "@/components/search-hero";

export default function HomePage() {
  return (
    <div className="grid gap-10">
      <SearchHero />
      <section aria-labelledby="featured-trials" className="grid gap-4">
        <h2 id="featured-trials" className="text-xl font-semibold">Featured Trials</h2>
        <p className="text-slate-600 text-sm">No featured trials yet. Try a search above.</p>
      </section>
    </div>
  );
}

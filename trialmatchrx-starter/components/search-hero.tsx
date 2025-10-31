import { SearchForm } from "@/components/search-form";

export function SearchHero() {
  return (
    <section className="bg-slate-50 border rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="grid gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Find clinical trials near you</h1>
        <p className="text-slate-600">Search by cancer type, location, age, and phase.</p>
        <SearchForm compact={false} />
      </div>
    </section>
  );
}

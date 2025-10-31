import { Suspense } from "react";
import { SearchResults } from "./results";

export default async function SearchPage() {
  return (
    <section className="grid gap-4">
      <h1 className="text-xl font-semibold">Search Results</h1>
      <Suspense fallback={<p>Loading results…</p>}>
        <SearchResults />
      </Suspense>
    </section>
  );
}

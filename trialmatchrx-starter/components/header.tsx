"use client";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-xl">TrialMatchRX</Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/search" aria-label="Find trials">Search</Link>
          <Link href="/learn" aria-label="Learn about clinical trials">Learn</Link>
          <Link href="/stories" aria-label="Patient stories">Stories</Link>
          <Link href="/contact" aria-label="Contact us">Contact</Link>
        </nav>
      </div>
    </header>
  );
}

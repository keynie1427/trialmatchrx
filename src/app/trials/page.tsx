import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CANCER_TYPE_PAGES } from '@/lib/cancerTypes';

export const metadata: Metadata = {
  title: 'Cancer Clinical Trials by Type | TrialMatchRX',
  description:
    'Browse recruiting cancer clinical trials by cancer type — breast, lung, colorectal, prostate, pancreatic, blood cancers and more. Live data from ClinicalTrials.gov.',
  alternates: { canonical: 'https://www.mytrialmatchrx.com/trials' },
};

export default function TrialsIndexPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold mb-3">Cancer Clinical Trials by Type</h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 mb-10 max-w-3xl">
            Pick a cancer type to see trials recruiting at U.S. research sites right now, then match them to your stage,
            biomarkers and location.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CANCER_TYPE_PAGES.map((c) => (
              <Link key={c.slug} href={`/trials/${c.slug}`} className="card p-5 hover:shadow-lg transition-shadow group">
                <h2 className="font-display font-semibold text-lg flex items-center justify-between">
                  {c.name}
                  <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-600 transition-colors" />
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

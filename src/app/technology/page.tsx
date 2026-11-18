import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, Filter, Atom, MessageSquareText, ShieldCheck, ArrowRight, Cpu, Scale } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Our Matching Technology | TrialMatchRX',
  description:
    'How TrialMatchRX matches cancer patients to clinical trials: live ClinicalTrials.gov data, eligibility parsing, quantum-classical optimization (QAOA) and plain-language AI explanations.',
  alternates: { canonical: 'https://www.mytrialmatchrx.com/technology' },
};

const PIPELINE = [
  {
    icon: Database,
    title: '1. Live trial data',
    text:
      'Every search pulls current recruiting studies straight from the ClinicalTrials.gov API, the official registry run by the U.S. National Library of Medicine. Nothing is cached for long, so closed trials drop out quickly.',
  },
  {
    icon: Filter,
    title: '2. Eligibility parsing',
    text:
      'Trial criteria are written as free text. We pull out the parts that decide eligibility: age and sex limits, stage, biomarkers like EGFR, KRAS G12C or MSI-H, prior treatments, and performance status. Then we filter out trials that clearly can’t apply to you.',
  },
  {
    icon: Atom,
    title: '3. Quantum-classical ranking',
    text:
      'Ranking many trials against many criteria at once is an optimization problem. Our engine encodes each criterion as a weighted term and uses the Quantum Approximate Optimization Algorithm (QAOA), built with the open-source PennyLane framework, alongside classical scoring to find the best-fitting set of trials.',
  },
  {
    icon: MessageSquareText,
    title: '4. Plain-language explanations',
    text:
      'A large language model (Claude, by Anthropic) turns each match into plain English: what the trial is testing, who it is for, and which of your criteria it meets or misses. It writes at an 8th-grade reading level, in English or Spanish.',
  },
];

const FACTORS = [
  ['Cancer type', 'Does the trial study your diagnosis or subtype?'],
  ['Biomarkers', 'Does it require, or exclude, a mutation or marker you have?'],
  ['Stage', 'Is it open to your stage, e.g. metastatic, locally advanced or recurrent?'],
  ['Treatment history', 'Does it require, or rule out, treatments you’ve already had?'],
  ['Performance status (ECOG)', 'Is it open to your current activity level?'],
  ['Age, sex & distance', 'Hard eligibility limits, plus how far the nearest site is from you'],
];

export default function TechnologyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 to-white dark:from-surface-900 dark:to-surface-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              <Cpu className="w-4 h-4" /> Our Technology
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">How TrialMatchRX finds your matches</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Official trial data, careful eligibility parsing, a quantum-classical optimization engine, and AI that
              explains every result in plain language.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6">
            {PIPELINE.map((s) => (
              <div key={s.title} className="card p-6">
                <s.icon className="w-7 h-7 text-primary-600 mb-3" />
                <h2 className="font-display text-xl font-semibold mb-2">{s.title}</h2>
                <p className="text-surface-600 dark:text-surface-400">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 bg-surface-100 dark:bg-surface-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold mb-2 text-center flex items-center justify-center gap-3">
              <Scale className="w-7 h-7 text-primary-600" /> What goes into a match score
            </h2>
            <p className="text-center text-surface-600 dark:text-surface-400 mb-10 max-w-2xl mx-auto">
              Every score is broken down by factor, so you can see exactly why a trial ranked where it did. We never
              show you a bare number.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FACTORS.map(([f, d]) => (
                <div key={f} className="card p-5">
                  <h3 className="font-semibold mb-1">{f}</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold mb-4">Why quantum?</h2>
            <div className="space-y-4 text-surface-700 dark:text-surface-300">
              <p>
                Matching one patient against hundreds of trials, each with dozens of criteria, gets very large very
                fast. QAOA is a hybrid algorithm: a quantum circuit proposes candidate rankings, and a classical
                optimizer tunes the circuit over repeated rounds until the ranking settles.
              </p>
              <p>
                We pair it with conventional scoring rather than replacing it. Hard eligibility rules, such as age
                limits or a required biomarker, are always applied first by classical code, so the quantum step only
                ranks trials you could actually join.
              </p>
              <p>
                The quantum-classical engine currently powers our <strong>Trial Matcher for research teams</strong>.
                Public patient search uses the same factors with a transparent weighted score.
              </p>
            </div>

            <div className="mt-10 card p-6 flex gap-4">
              <ShieldCheck className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Technology helps you find options. It does not decide what is right for you. Every result should be
                reviewed with your oncologist, and the study team makes the final eligibility decision.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/search" className="btn-primary">Try a search <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/for-research-sites" className="btn-secondary">For research sites</Link>
              <Link href="/about" className="btn-secondary">About the team</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

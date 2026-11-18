import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Target, Eye, ShieldCheck, Database, Cpu, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About Us | TrialMatchRX',
  description:
    'TrialMatchRX is built by S-n-K Elite Development in Shreveport-Bossier City, Louisiana, to close the gap between cancer research and the patients who need it.',
  alternates: { canonical: 'https://www.mytrialmatchrx.com/about' },
};

// ─── Team ────────────────────────────────────────────────────────────────────
// Edit bios here. Photos: drop a square image in /public/team/ and set `photo`.
const TEAM: { name: string; role: string; bio: string; photo?: string }[] = [
  {
    name: 'Kenneth Brown',
    role: 'Co-Founder & Principal Technical Architect',
    bio:
      'Kenneth brings a 30-year career in IT operations, including three years as a Chief Information Officer. ' +
      'He holds a Master of Business Intelligence and focuses on applied AI and quantum computing. ' +
      'He designed and built TrialMatchRX, including its quantum-classical matching engine.',
  },
  {
    name: 'Steven Chaisson, MBA',
    role: 'Co-Founder',
    bio:
      'Steven co-founded S-n-K Elite Development and leads the business side of TrialMatchRX, ' +
      'from partnerships with research sites to the long-term strategy for the platform.',
  },
];

const PRINCIPLES = [
  {
    icon: Database,
    title: 'Official data only',
    text: 'Every trial comes from ClinicalTrials.gov, the registry run by the U.S. National Library of Medicine. We never invent or pad listings.',
  },
  {
    icon: ShieldCheck,
    title: 'Your information stays yours',
    text: 'You can search without an account. If you save a profile, we never sell it or share it with sponsors without your permission.',
  },
  {
    icon: Target,
    title: 'Honest matching',
    text: 'Match scores show which of your criteria a trial meets and which it doesn’t. A score is a starting point for a conversation with your doctor, not a verdict.',
  },
  {
    icon: Cpu,
    title: 'Serious technology, plain language',
    text: 'We use AI and quantum-classical optimization behind the scenes, then explain results at an 8th-grade reading level.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 to-white dark:from-surface-900 dark:to-surface-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              <Users className="w-4 h-4" /> About TrialMatchRX
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Real people, building a better way to find cancer trials
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Fewer than 1 in 10 adults with cancer take part in a clinical trial, and many never hear about the
              ones they qualify for. TrialMatchRX was built to change that, starting with patients and caregivers
              who don&apos;t have a research coordinator in their corner.
            </p>
            <p className="mt-4 text-sm text-surface-500 flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4" /> Built in Shreveport-Bossier City, Louisiana, by S-n-K Elite Development
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <Target className="w-6 h-6 text-primary-600 mb-3" />
              <h2 className="font-display text-xl font-semibold mb-2">Our Mission</h2>
              <p className="text-surface-600 dark:text-surface-400">
                To use AI to eliminate the gap between breakthrough cancer research and the patients who need it most.
              </p>
            </div>
            <div className="card p-6">
              <Eye className="w-6 h-6 text-primary-600 mb-3" />
              <h2 className="font-display text-xl font-semibold mb-2">Our Vision</h2>
              <p className="text-surface-600 dark:text-surface-400">
                A world where no cancer patient misses a life-saving trial because they didn&apos;t know it existed.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-surface-100 dark:bg-surface-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold mb-10 text-center">The Team</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {TEAM.map((m) => (
                <div key={m.name} className="card p-6 flex gap-5">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-display text-2xl font-bold flex items-center justify-center flex-shrink-0">
                      {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-semibold">{m.name}</h3>
                    <p className="text-sm text-primary-600 dark:text-primary-400 mb-2">{m.role}</p>
                    <p className="text-sm text-surface-600 dark:text-surface-400">{m.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold mb-10 text-center">What We Stand For</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="card p-6 flex gap-4">
                  <p.icon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">{p.title}</h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/technology" className="btn-secondary">How our matching works</Link>
              <Link href="/legal/hipaa" className="btn-secondary">Privacy &amp; HIPAA</Link>
              <Link href="/for-research-sites" className="btn-secondary">For research sites</Link>
              <Link href="/search" className="btn-primary">Search trials</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

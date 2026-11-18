// /trials/[slug] — SEO landing page per cancer type (e.g. /trials/colorectal-cancer).
// Server-rendered with live ClinicalTrials.gov data, regenerated every 12 hours,
// so search engines index real, current trial listings.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, FlaskConical, Database, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CANCER_TYPE_PAGES, getCancerTypePage } from '@/lib/cancerTypes';

export const revalidate = 43200; // 12 hours

const SITE = 'https://www.mytrialmatchrx.com';
const CTG = 'https://clinicaltrials.gov/api/v2/studies';

interface Listing {
  nctId: string;
  title: string;
  phase: string;
  sponsor: string;
  usSites: number;
  states: string[];
  updated?: string;
}

const PHASE: Record<string, string> = {
  EARLY_PHASE1: 'Early Phase 1', PHASE1: 'Phase 1', PHASE2: 'Phase 2', PHASE3: 'Phase 3', PHASE4: 'Phase 4', NA: '',
};

async function getTrials(query: string): Promise<{ total: number | null; trials: Listing[] }> {
  const qs = new URLSearchParams({
    'query.cond': query,
    'filter.overallStatus': 'RECRUITING',
    'query.locn': 'United States',
    countTotal: 'true',
    pageSize: '12',
    sort: 'LastUpdatePostDate:desc',
    fields: [
      'NCTId', 'BriefTitle', 'Phase', 'LeadSponsorName', 'LocationCountry', 'LocationState', 'LastUpdatePostDate',
    ].join(','),
  });
  try {
    const res = await fetch(`${CTG}?${qs.toString()}`, { next: { revalidate } });
    if (!res.ok) return { total: null, trials: [] };
    const data = await res.json();
    const trials: Listing[] = (data.studies || []).map((s: any) => {
      const p = s.protocolSection || {};
      const locs = (p.contactsLocationsModule?.locations || []).filter((l: any) => l.country === 'United States');
      const states = Array.from(new Set(locs.map((l: any) => l.state).filter(Boolean))) as string[];
      return {
        nctId: p.identificationModule?.nctId,
        title: p.identificationModule?.briefTitle,
        phase: (p.designModule?.phases || []).map((x: string) => PHASE[x] ?? x).filter(Boolean).join(' / '),
        sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name || '',
        usSites: locs.length,
        states,
        updated: p.statusModule?.lastUpdatePostDateStruct?.date,
      };
    });
    return { total: data.totalCount ?? null, trials };
  } catch {
    return { total: null, trials: [] };
  }
}

export function generateStaticParams() {
  return CANCER_TYPE_PAGES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = getCancerTypePage(params.slug);
  if (!c) return {};
  const title = `${c.name} Clinical Trials Recruiting Now | TrialMatchRX`;
  const description = `Browse ${c.name.toLowerCase()} clinical trials currently recruiting at U.S. research sites. ${c.blurb} Free AI-powered matching by stage, biomarkers and location.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/trials/${c.slug}` },
    openGraph: { title, description, url: `${SITE}/trials/${c.slug}`, type: 'website' },
  };
}

export default async function CancerTypePage({ params }: { params: { slug: string } }) {
  const c = getCancerTypePage(params.slug);
  if (!c) notFound();

  const { total, trials } = await getTrials(c.query);
  const searchHref = `/search?cancerType=${encodeURIComponent(c.name)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${c.name} clinical trials recruiting in the United States`,
    numberOfItems: trials.length,
    itemListElement: trials.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/trial/${t.nctId}`,
      name: t.title,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1">
        <section className="py-14 bg-gradient-to-br from-primary-50 to-white dark:from-surface-900 dark:to-surface-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm text-surface-500 mb-4">
              <Link href="/" className="hover:underline">Home</Link> /{' '}
              <Link href="/trials" className="hover:underline">Trials by cancer type</Link> / {c.name}
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">{c.name} Clinical Trials</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-3xl mb-6">{c.blurb}</p>
            {total !== null && (
              <p className="text-surface-700 dark:text-surface-300 mb-6">
                <span className="font-display text-3xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                  {total.toLocaleString()}
                </span>{' '}
                {c.name.toLowerCase()} trials are recruiting at U.S. sites right now.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href={searchHref} className="btn-primary" data-umami-event="cancer_page_cta" data-umami-event-cancer={c.slug} data-umami-event-position="top">
                <Search className="w-4 h-4" /> Match these trials to my profile
              </Link>
              <Link href="/search" className="btn-secondary">Search by ZIP code</Link>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold mb-6">Recently updated {c.name.toLowerCase()} trials</h2>
            {trials.length === 0 ? (
              <p className="text-surface-600">
                Live listings are temporarily unavailable.{' '}
                <Link href={searchHref} className="text-primary-600 underline">Search {c.name.toLowerCase()} trials</Link>.
              </p>
            ) : (
              <ul className="space-y-3">
                {trials.map((t) => (
                  <li key={t.nctId} className="card p-5">
                    <Link href={`/trial/${t.nctId}`} className="font-semibold hover:text-primary-600" data-umami-event="cancer_page_trial_click" data-umami-event-cancer={c.slug}>
                      {t.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-surface-500">
                      <span className="font-mono">{t.nctId}</span>
                      {t.phase && (
                        <span className="flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5" />{t.phase}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {t.usSites} U.S. site{t.usSites === 1 ? '' : 's'}
                        {t.states.length > 0 && ` · ${t.states.slice(0, 4).join(', ')}${t.states.length > 4 ? ` +${t.states.length - 4}` : ''}`}
                      </span>
                      {t.sponsor && <span>{t.sponsor}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 card p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">See which of these fit your situation</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Add your stage, biomarkers, age and ZIP code to get a ranked list with a plain-language reason for every match.
                </p>
              </div>
              <Link href={searchHref} className="btn-primary whitespace-nowrap" data-umami-event="cancer_page_cta" data-umami-event-cancer={c.slug} data-umami-event-position="bottom">
                Start matching <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="mt-6 text-xs text-surface-500 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Source: ClinicalTrials.gov, refreshed every 12 hours. This page is
              informational and is not medical advice.
            </p>
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-lg font-semibold mb-3">Other cancer types</h2>
            <div className="flex flex-wrap gap-2">
              {CANCER_TYPE_PAGES.filter((o) => o.slug !== c.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/trials/${o.slug}`}
                  className="px-3 py-1.5 rounded-full text-sm bg-surface-100 dark:bg-surface-800 hover:bg-primary-100 dark:hover:bg-primary-900/40"
                >
                  {o.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

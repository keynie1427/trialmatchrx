// src/app/api/stats/route.ts
//
// GET /api/stats → live homepage numbers from ClinicalTrials.gov.
// Replaces the hard-coded "10,000+ / 200+ / 50+ / 5,000+" figures.
// Cached for 6 hours at the edge so we make ~4 upstream calls per quarter-day.

import { NextResponse } from 'next/server';
import { CANCER_TYPES } from '@/types';

export const revalidate = 21600; // 6 hours

const CTG = 'https://clinicaltrials.gov/api/v2/studies';

async function count(params: Record<string, string>): Promise<number | null> {
  const qs = new URLSearchParams({
    'query.cond': 'cancer',
    'filter.overallStatus': 'RECRUITING',
    countTotal: 'true',
    pageSize: '1',
    fields: 'NCTId',
    ...params,
  });
  try {
    const res = await fetch(`${CTG}?${qs.toString()}`, { next: { revalidate } });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.totalCount === 'number' ? data.totalCount : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [recruitingWorld, recruitingUS, newLast30Days] = await Promise.all([
    count({}),
    count({ 'query.locn': 'United States' }),
    count({ 'filter.advanced': `AREA[StudyFirstPostDate]RANGE[${since},MAX]` }),
  ]);

  return NextResponse.json(
    {
      recruitingWorld,
      recruitingUS,
      newLast30Days,
      cancerTypes: CANCER_TYPES.length,
      source: 'ClinicalTrials.gov',
      asOf: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } }
  );
}

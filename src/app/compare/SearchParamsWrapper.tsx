'use client';

import { useSearchParams } from 'next/navigation';

export function useCompareSearchParams() {
  const searchParams = useSearchParams();
  const trialIds = searchParams.get('trials')?.split(',') || [];
  return { trialIds };
}

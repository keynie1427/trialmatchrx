'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Target,
  Dna,
  Beaker,
  Layers,
  GitBranch,
  Pill,
  MapPin,
  Building2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Info,
  Zap,
} from 'lucide-react';
import { useSavedTrials } from '@/hooks';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface TrialRecommendation {
  nctId: string;
  relevanceScore: number;
  whySimilar: string;
  keyDifference: string;
  highlightTag: string;
  personalizedNote: string | null;
  trial: any;
}

interface TrialSimilarProps {
  trial: any;
  patientProfile?: any;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag styling
// ─────────────────────────────────────────────────────────────────────────────
const tagStyles: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  'Same Drug': {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    icon: Pill,
  },
  'Same Target': {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    text: 'text-primary-700 dark:text-primary-300',
    icon: Target,
  },
  'Same Cancer': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Layers,
  },
  'Alternative Approach': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: GitBranch,
  },
  'Different Phase': {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: Beaker,
  },
  'Combination Therapy': {
    bg: 'bg-secondary-100 dark:bg-secondary-900/30',
    text: 'text-secondary-700 dark:text-secondary-300',
    icon: Dna,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TrialSimilar({
  trial,
  patientProfile,
  className = '',
}: TrialSimilarProps) {
  const [recommendations, setRecommendations] = useState<TrialRecommendation[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { isSaved, toggleSaved } = useSavedTrials();

  const findSimilar = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trial, patientProfile, limit: 5 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || '');
      setHasLoaded(true);
    } catch (err: any) {
      console.error('Similar trials error:', err);
      setError(err.message || 'Failed to find similar trials');
    } finally {
      setIsLoading(false);
    }
  }, [trial, patientProfile, isLoading]);

  // Auto-load on mount (optional — remove if you want button-triggered only)
  // useEffect(() => {
  //   if (!hasLoaded && trial?.nctId) {
  //     findSimilar();
  //   }
  // }, [trial?.nctId]);

  // ── Not yet loaded — show trigger button ─────────────────────────────────
  if (!hasLoaded && !isLoading && !error) {
    return (
      <div className={className}>
        <button
          onClick={findSimilar}
          className="group w-full card p-6 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-semibold text-lg">
                Trials Like This
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Find similar trials based on cancer type, biomarkers, and treatment approach
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              Find Similar
            </div>
          </div>
        </button>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Finding Similar Trials...</h3>
            <p className="text-sm text-surface-500">Searching for related studies</p>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
              <div className="flex items-start gap-4">
                <div className="skeleton w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`card p-6 border-red-200 dark:border-red-800 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-display font-semibold text-red-700 dark:text-red-400">
            Couldn&apos;t find similar trials
          </h3>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{error}</p>
        <button onClick={findSimilar} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── No results ───────────────────────────────────────────────────────────
  if (hasLoaded && recommendations.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-display font-semibold">Trials Like This</h3>
        </div>
        <p className="text-surface-500 text-sm">
          No similar recruiting trials were found. This might be a unique trial or there
          may be limited options currently available for this specific condition.
        </p>
        <button
          onClick={findSimilar}
          className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Search again
        </button>
      </div>
    );
  }

  // ── Results display ──────────────────────────────────────────────────────
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-lg">
                Trials Like This
              </h3>
              <p className="text-blue-100 text-xs">
                {recommendations.length} similar trials found
              </p>
            </div>
          </div>
          <button
            onClick={findSimilar}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Refresh recommendations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary */}
        {summary && (
          <p className="text-sm text-surface-600 dark:text-surface-400 pb-4 border-b border-surface-200 dark:border-surface-700">
            {summary}
          </p>
        )}

        {/* Recommendations */}
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const tagStyle = tagStyles[rec.highlightTag] || tagStyles['Same Cancer'];
            const TagIcon = tagStyle.icon;
            const saved = isSaved(rec.nctId);

            return (
              <motion.div
                key={rec.nctId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-xl border border-surface-200 dark:border-surface-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Relevance score indicator */}
                <div
                  className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-primary-500"
                  style={{ width: `${rec.relevanceScore}%` }}
                />

                <div className="p-4">
                  {/* Top row: Tag + Score */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tagStyle.bg} ${tagStyle.text}`}>
                      <TagIcon className="w-3 h-3" />
                      {rec.highlightTag}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-surface-500">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {rec.relevanceScore}%
                      </span>
                      <span>match</span>
                    </div>
                  </div>

                  {/* Title + NCT ID */}
                  <Link
                    href={`/trial/${rec.nctId}`}
                    className="block mb-2"
                  >
                    <h4 className="font-display font-semibold text-surface-900 dark:text-surface-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {rec.trial?.briefTitle}
                    </h4>
                    <span className="text-xs font-mono text-surface-500">
                      {rec.nctId}
                    </span>
                  </Link>

                  {/* Why similar */}
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">
                    {rec.whySimilar}
                  </p>

                  {/* Key difference */}
                  <div className="text-xs text-surface-500 mb-3">
                    <span className="font-medium">Difference:</span> {rec.keyDifference}
                  </div>

                  {/* Personalized note */}
                  {rec.personalizedNote && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-primary-700 dark:text-primary-300">
                        {rec.personalizedNote}
                      </p>
                    </div>
                  )}

                  {/* Trial meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500 mb-3">
                    <span className="badge badge-primary text-xs">
                      {rec.trial?.phase}
                    </span>
                    <span className="badge badge-success text-xs">
                      {rec.trial?.status}
                    </span>
                    {rec.trial?.locationCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {rec.trial.locationCount} sites
                      </span>
                    )}
                    {rec.trial?.sponsor && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {rec.trial.sponsor.length > 20
                          ? rec.trial.sponsor.slice(0, 20) + '...'
                          : rec.trial.sponsor}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
                    <Link
                      href={`/trial/${rec.nctId}`}
                      className="btn-primary text-xs py-1.5 px-3 flex-1"
                    >
                      View Details
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => toggleSaved(rec.nctId)}
                      className={`p-2 rounded-lg transition-colors ${
                        saved
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-700'
                      }`}
                      title={saved ? 'Remove from saved' : 'Save trial'}
                    >
                      {saved ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://clinicaltrials.gov/study/${rec.nctId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-700 transition-colors"
                      title="View on ClinicalTrials.gov"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="flex gap-2.5 p-3 rounded-lg bg-surface-100 dark:bg-surface-800 mt-4">
          <Info className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
            These recommendations are based on similarities in cancer type, biomarkers, and
            treatment approach. Always discuss trial options with your healthcare team.
          </p>
        </div>
      </div>
    </div>
  );
}

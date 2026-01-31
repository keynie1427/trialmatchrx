'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Shield,
  Clock,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lightbulb,
  Pill,
  Stethoscope,
  CalendarDays,
  Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AISummary {
  overview: string;
  treatment: {
    what: string;
    how: string;
    administration: string;
  } | null;
  eligibility: {
    summary: string;
    mustHave: string[];
    cantHave: string[];
    ageRange: string;
  } | null;
  timeline: {
    phase: string;
    estimatedDuration: string;
    visits: string;
    details: string;
  } | null;
  sideEffects: {
    summary: string;
    known: string[];
    note: string;
  } | null;
  keyTakeaway: string | null;
}

interface TrialAISummaryProps {
  trial: any; // Trial type from your types
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TrialAISummary({ trial, className = '' }: TrialAISummaryProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const generateSummary = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trial }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setSummary(data.summary);
    } catch (err: any) {
      console.error('AI summary error:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  }, [trial, isLoading]);

  // ── Not yet generated ────────────────────────────────────────────────────
  if (!summary && !isLoading && !error) {
    return (
      <div className={`${className}`}>
        <button
          onClick={generateSummary}
          className="group w-full card p-6 transition-all hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-semibold text-lg">
                AI Trial Summary
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Get a plain-English explanation of this trial — what it does, who it&apos;s for, and what to expect
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
              Summarize
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Generating AI Summary...</h3>
            <p className="text-sm text-surface-500">Reading through trial details</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Skeleton pulse animation */}
          {['overview', 'treatment', 'eligibility', 'timeline'].map((section) => (
            <div key={section} className="space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-500"
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
            Couldn&apos;t generate summary
          </h3>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{error}</p>
        <button
          onClick={generateSummary}
          className="btn-secondary text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── Summary display ──────────────────────────────────────────────────────
  const sections = [
    {
      id: 'treatment',
      icon: Pill,
      title: 'Treatment',
      color: 'primary',
      content: summary?.treatment,
    },
    {
      id: 'eligibility',
      icon: Users,
      title: 'Who Can Join',
      color: 'info',
      content: summary?.eligibility,
    },
    {
      id: 'timeline',
      icon: CalendarDays,
      title: 'What to Expect',
      color: 'secondary',
      content: summary?.timeline,
    },
    {
      id: 'sideEffects',
      icon: Shield,
      title: 'Side Effects',
      color: 'warning',
      content: summary?.sideEffects,
    },
  ];

  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-lg">
                AI Trial Summary
              </h3>
              <p className="text-primary-100 text-xs">
                Plain-English summary powered by AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateSummary}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Regenerate summary"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 space-y-6">
              {/* Overview */}
              {summary?.overview && (
                <div className="pb-5 border-b border-surface-200 dark:border-surface-700">
                  <p className="text-surface-700 dark:text-surface-300 text-base leading-relaxed">
                    {summary.overview}
                  </p>
                </div>
              )}

              {/* Sections */}
              <div className="grid gap-4 md:grid-cols-2">
                {sections.map((section) => {
                  if (!section.content) return null;
                  const isActive = activeSection === section.id;
                  const Icon = section.icon;

                  return (
                    <div
                      key={section.id}
                      className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                    >
                      <button
                        onClick={() => setActiveSection(isActive ? null : section.id)}
                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="font-display font-semibold text-sm flex-1">
                          {section.title}
                        </span>
                        {isActive ? (
                          <ChevronUp className="w-4 h-4 text-surface-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-surface-400" />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-4">
                              <SectionContent id={section.id} content={section.content} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Key Takeaway */}
              {summary?.keyTakeaway && (
                <div className="flex gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-800 dark:text-primary-200 font-medium leading-relaxed">
                    {summary.keyTakeaway}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex gap-2.5 p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
                <Info className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                  This AI-generated summary is for informational purposes only and is{' '}
                  <strong>not medical advice</strong>. Always consult your oncologist or
                  care team before making decisions about clinical trials. Summary may
                  not capture all details — review the full trial record for complete
                  information.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section content renderers
// ─────────────────────────────────────────────────────────────────────────────
function SectionContent({ id, content }: { id: string; content: any }) {
  switch (id) {
    case 'treatment':
      return <TreatmentContent content={content} />;
    case 'eligibility':
      return <EligibilityContent content={content} />;
    case 'timeline':
      return <TimelineContent content={content} />;
    case 'sideEffects':
      return <SideEffectsContent content={content} />;
    default:
      return null;
  }
}

function TreatmentContent({ content }: { content: any }) {
  return (
    <div className="space-y-3 text-sm">
      {content.what && (
        <div>
          <span className="font-medium text-surface-700 dark:text-surface-300">What: </span>
          <span className="text-surface-600 dark:text-surface-400">{content.what}</span>
        </div>
      )}
      {content.how && (
        <div>
          <span className="font-medium text-surface-700 dark:text-surface-300">How it works: </span>
          <span className="text-surface-600 dark:text-surface-400">{content.how}</span>
        </div>
      )}
      {content.administration && (
        <div>
          <span className="font-medium text-surface-700 dark:text-surface-300">Given as: </span>
          <span className="text-surface-600 dark:text-surface-400">{content.administration}</span>
        </div>
      )}
    </div>
  );
}

function EligibilityContent({ content }: { content: any }) {
  return (
    <div className="space-y-3 text-sm">
      {content.summary && (
        <p className="text-surface-600 dark:text-surface-400">{content.summary}</p>
      )}
      {content.ageRange && (
        <div>
          <span className="font-medium text-surface-700 dark:text-surface-300">Age: </span>
          <span className="text-surface-600 dark:text-surface-400">{content.ageRange}</span>
        </div>
      )}
      {content.mustHave?.length > 0 && (
        <div>
          <span className="font-medium text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wide">
            ✓ Must have
          </span>
          <ul className="mt-1.5 space-y-1">
            {content.mustHave.map((item: string, i: number) => (
              <li key={i} className="flex gap-2 text-surface-600 dark:text-surface-400">
                <span className="text-emerald-500 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.cantHave?.length > 0 && (
        <div>
          <span className="font-medium text-red-600 dark:text-red-400 text-xs uppercase tracking-wide">
            ✗ Cannot have
          </span>
          <ul className="mt-1.5 space-y-1">
            {content.cantHave.map((item: string, i: number) => (
              <li key={i} className="flex gap-2 text-surface-600 dark:text-surface-400">
                <span className="text-red-400 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TimelineContent({ content }: { content: any }) {
  return (
    <div className="space-y-3 text-sm">
      {content.phase && (
        <div>
          <span className="font-medium text-surface-700 dark:text-surface-300">Phase: </span>
          <span className="text-surface-600 dark:text-surface-400">{content.phase}</span>
        </div>
      )}
      {content.estimatedDuration && (
        <div>
          <span className="font-medium text-surface-700 dark:text-surface-300">Duration: </span>
          <span className="text-surface-600 dark:text-surface-400">{content.estimatedDuration}</span>
        </div>
      )}
      {content.visits && (
        <div>
          <span className="font-medium text-surface-700 dark:text-surface-300">Visits: </span>
          <span className="text-surface-600 dark:text-surface-400">{content.visits}</span>
        </div>
      )}
      {content.details && (
        <div>
          <span className="text-surface-600 dark:text-surface-400">{content.details}</span>
        </div>
      )}
    </div>
  );
}

function SideEffectsContent({ content }: { content: any }) {
  return (
    <div className="space-y-3 text-sm">
      {content.summary && (
        <p className="text-surface-600 dark:text-surface-400">{content.summary}</p>
      )}
      {content.known?.length > 0 && (
        <ul className="space-y-1">
          {content.known.map((effect: string, i: number) => (
            <li key={i} className="flex gap-2 text-surface-600 dark:text-surface-400">
              <span className="text-amber-500 mt-0.5">•</span>
              {effect}
            </li>
          ))}
        </ul>
      )}
      {content.note && (
        <p className="text-xs text-surface-500 dark:text-surface-400 italic">
          {content.note}
        </p>
      )}
    </div>
  );
}

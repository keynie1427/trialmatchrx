'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  MapPin,
  Clock,
  Pill,
  Shield,
  Star,
  Users,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Info,
  ArrowRight,
  Scale,
  MessageSquare,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ProCon {
  point: string;
  detail: string;
  icon: string;
}

interface TrialInsight {
  nctId: string;
  title: string;
  pros: ProCon[];
  cons: ProCon[];
  bestFor: string;
  personalizedNote: string | null;
}

interface KeyDifference {
  category: string;
  comparison: string;
}

interface Comparison {
  overview: string;
  trialInsights: TrialInsight[];
  keyDifferences: KeyDifference[];
  questions: string[];
  bottomLine: string;
}

interface TrialComparisonInsightsProps {
  trials: any[];
  patientProfile?: any;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon mapping
// ─────────────────────────────────────────────────────────────────────────────
const proIconMap: Record<string, React.ComponentType<any>> = {
  target: Target,
  location: MapPin,
  clock: Clock,
  pill: Pill,
  shield: Shield,
  star: Star,
  users: Users,
  trending: TrendingUp,
};

const conIconMap: Record<string, React.ComponentType<any>> = {
  alert: AlertTriangle,
  clock: Clock,
  location: MapPin,
  question: HelpCircle,
  x: X,
};

// Color palette for trial cards (up to 4 trials)
const trialColors = [
  {
    gradient: 'from-primary-500 to-primary-700',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    border: 'border-primary-200 dark:border-primary-800',
    text: 'text-primary-700 dark:text-primary-300',
    badge: 'bg-primary-100 dark:bg-primary-900/40',
  },
  {
    gradient: 'from-secondary-500 to-secondary-700',
    bg: 'bg-secondary-50 dark:bg-secondary-900/20',
    border: 'border-secondary-200 dark:border-secondary-800',
    text: 'text-secondary-700 dark:text-secondary-300',
    badge: 'bg-secondary-100 dark:bg-secondary-900/40',
  },
  {
    gradient: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/40',
  },
  {
    gradient: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/40',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TrialComparisonInsights({
  trials,
  patientProfile,
  className = '',
}: TrialComparisonInsightsProps) {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedTrials, setExpandedTrials] = useState<Record<string, boolean>>({});

  const generateComparison = useCallback(async () => {
    if (isLoading || trials.length < 2) return;
    setIsLoading(true);
    setError(null);
    setComparison(null);

    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trials, patientProfile }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setComparison(data.comparison);

      // Auto-expand all trials
      const expanded: Record<string, boolean> = {};
      data.comparison?.trialInsights?.forEach((insight: TrialInsight) => {
        expanded[insight.nctId] = true;
      });
      setExpandedTrials(expanded);
    } catch (err: any) {
      console.error('Comparison generation error:', err);
      setError(err.message || 'Failed to generate comparison');
    } finally {
      setIsLoading(false);
    }
  }, [trials, patientProfile, isLoading]);

  const toggleTrial = (nctId: string) => {
    setExpandedTrials((prev) => ({
      ...prev,
      [nctId]: !prev[nctId],
    }));
  };

  // ── Not enough trials ────────────────────────────────────────────────────
  if (trials.length < 2) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-3 text-surface-500">
          <Scale className="w-5 h-5" />
          <p className="text-sm">Add at least 2 trials to compare with AI insights.</p>
        </div>
      </div>
    );
  }

  // ── Not yet generated ────────────────────────────────────────────────────
  if (!comparison && !isLoading && !error) {
    return (
      <div className={className}>
        <button
          onClick={generateComparison}
          className="group w-full card p-6 transition-all hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-semibold text-lg">
                AI Comparison Insights
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Get personalized pros & cons for {trials.length} trials based on your profile
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium group-hover:from-primary-200 group-hover:to-secondary-200 dark:group-hover:from-primary-900/50 dark:group-hover:to-secondary-900/50 transition-colors">
              Compare
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Analyzing Trials...</h3>
            <p className="text-sm text-surface-500">Comparing {trials.length} trials</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {trials.map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
              <div className="skeleton h-5 w-24 rounded mb-3" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-5/6 rounded" />
              </div>
            </div>
          ))}
        </div>

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
            Couldn&apos;t generate comparison
          </h3>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{error}</p>
        <button onClick={generateComparison} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── Comparison display ───────────────────────────────────────────────────
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-lg">
                AI Comparison Insights
              </h3>
              <p className="text-primary-100 text-xs">
                Personalized analysis of {comparison?.trialInsights.length} trials
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateComparison}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Regenerate comparison"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && comparison && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
                  {comparison.overview}
                </p>
              </div>

              {/* Trial Cards */}
              <div className="space-y-4">
                {comparison.trialInsights.map((insight, index) => {
                  const colors = trialColors[index % trialColors.length];
                  const isTrialExpanded = expandedTrials[insight.nctId];

                  return (
                    <div
                      key={insight.nctId}
                      className={`rounded-xl border ${colors.border} overflow-hidden`}
                    >
                      {/* Trial Header */}
                      <button
                        onClick={() => toggleTrial(insight.nctId)}
                        className={`w-full p-4 flex items-center gap-4 text-left ${colors.bg} hover:opacity-90 transition-opacity`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white font-bold`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs text-surface-500 dark:text-surface-400">
                            {insight.nctId}
                          </div>
                          <div className="font-display font-semibold truncate">
                            {insight.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <ThumbsUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {insight.pros.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <ThumbsDown className="w-4 h-4 text-red-400" />
                            <span className="text-red-500 dark:text-red-400 font-medium">
                              {insight.cons.length}
                            </span>
                          </div>
                          {isTrialExpanded ? (
                            <ChevronUp className="w-4 h-4 text-surface-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-surface-400" />
                          )}
                        </div>
                      </button>

                      {/* Trial Details */}
                      <AnimatePresence initial={false}>
                        {isTrialExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="p-4 space-y-4 bg-white dark:bg-surface-900">
                              {/* Personalized Note */}
                              {insight.personalizedNote && (
                                <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
                                  <div className="flex items-start gap-2">
                                    <Sparkles className={`w-4 h-4 ${colors.text} mt-0.5 flex-shrink-0`} />
                                    <p className={`text-sm ${colors.text} font-medium`}>
                                      {insight.personalizedNote}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Pros and Cons Grid */}
                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Pros */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                                    <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400">
                                      Advantages
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {insight.pros.map((pro, i) => {
                                      const Icon = proIconMap[pro.icon] || Star;
                                      return (
                                        <div
                                          key={i}
                                          className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50"
                                        >
                                          <div className="flex items-start gap-2">
                                            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <div className="font-medium text-sm text-emerald-800 dark:text-emerald-200">
                                                {pro.point}
                                              </div>
                                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                {pro.detail}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Cons */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <ThumbsDown className="w-4 h-4 text-red-400" />
                                    <span className="font-medium text-sm text-red-600 dark:text-red-400">
                                      Considerations
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {insight.cons.map((con, i) => {
                                      const Icon = conIconMap[con.icon] || AlertTriangle;
                                      return (
                                        <div
                                          key={i}
                                          className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50"
                                        >
                                          <div className="flex items-start gap-2">
                                            <Icon className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <div className="font-medium text-sm text-red-800 dark:text-red-200">
                                                {con.point}
                                              </div>
                                              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                                {con.detail}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Best For */}
                              <div className="pt-3 border-t border-surface-200 dark:border-surface-700">
                                <div className="flex items-start gap-2">
                                  <Target className={`w-4 h-4 ${colors.text} mt-0.5 flex-shrink-0`} />
                                  <div>
                                    <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
                                      Best for:
                                    </span>
                                    <p className="text-sm text-surface-700 dark:text-surface-300">
                                      {insight.bestFor}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Key Differences */}
              {comparison.keyDifferences.length > 0 && (
                <div>
                  <h4 className="font-display font-semibold text-surface-900 dark:text-surface-100 mb-3">
                    Key Differences
                  </h4>
                  <div className="space-y-2">
                    {comparison.keyDifferences.map((diff, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                      >
                        <div className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                          {diff.category}
                        </div>
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          {diff.comparison}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions to Ask */}
              {comparison.questions.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-sm text-blue-800 dark:text-blue-200">
                      Questions to Ask Your Doctor
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {comparison.questions.map((question, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <ArrowRight className="w-3 h-3 mt-1.5 flex-shrink-0" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom Line */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm text-primary-800 dark:text-primary-200 mb-1">
                      The Bottom Line
                    </div>
                    <p className="text-sm text-primary-700 dark:text-primary-300 leading-relaxed">
                      {comparison.bottomLine}
                    </p>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex gap-2.5 p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
                <Info className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                  This AI comparison is for informational purposes only and is{' '}
                  <strong>not medical advice</strong>. Each patient&apos;s situation is unique.
                  Discuss all options with your oncologist before making any decisions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

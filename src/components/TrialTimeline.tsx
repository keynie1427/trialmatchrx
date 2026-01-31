'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CalendarDays,
  Pill,
  Syringe,
  ClipboardList,
  ScanLine,
  TestTube,
  Heart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Info,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface TimelineActivity {
  name: string;
  description: string;
  timing: string;
}

interface TimelineCycles {
  count: string;
  length: string;
  note?: string;
}

interface TimelinePhase {
  id: string;
  name: string;
  duration: string;
  icon: string;
  color: string;
  description: string;
  activities: TimelineActivity[];
  cycles?: TimelineCycles;
}

interface TimelineMilestone {
  name: string;
  timing: string;
  description: string;
}

interface Timeline {
  totalDuration: {
    estimate: string;
    note?: string;
  };
  phases: TimelinePhase[];
  visitFrequency: {
    duringTreatment: string;
    duringFollowUp: string;
  };
  timeCommitment: {
    perVisit: string;
    note?: string;
  };
  keyMilestones: TimelineMilestone[];
  importantNotes: string[];
  confidence: 'high' | 'medium' | 'low';
  confidenceNote?: string;
}

interface TrialTimelineProps {
  trial: any;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon mapping
// ─────────────────────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<any>> = {
  clipboard: ClipboardList,
  pill: Pill,
  syringe: Syringe,
  calendar: CalendarDays,
  scan: ScanLine,
  vial: TestTube,
  heart: Heart,
  clock: Clock,
};

const colorMap: Record<string, { bg: string; border: string; text: string; light: string }> = {
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    light: 'bg-blue-50 dark:bg-blue-900/20',
  },
  green: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    light: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    light: 'bg-purple-50 dark:bg-purple-900/20',
  },
  amber: {
    bg: 'bg-amber-500',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    light: 'bg-amber-50 dark:bg-amber-900/20',
  },
  teal: {
    bg: 'bg-primary-500',
    border: 'border-primary-500',
    text: 'text-primary-600 dark:text-primary-400',
    light: 'bg-primary-50 dark:bg-primary-900/20',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TrialTimeline({ trial, className = '' }: TrialTimelineProps) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  const generateTimeline = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setTimeline(null);

    try {
      const res = await fetch('/api/ai/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trial }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setTimeline(data.timeline);
      
      // Auto-expand all phases
      const expanded: Record<string, boolean> = {};
      data.timeline?.phases?.forEach((phase: TimelinePhase) => {
        expanded[phase.id] = true;
      });
      setExpandedPhases(expanded);
    } catch (err: any) {
      console.error('Timeline generation error:', err);
      setError(err.message || 'Failed to generate timeline');
    } finally {
      setIsLoading(false);
    }
  }, [trial, isLoading]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  // ── Not yet generated ────────────────────────────────────────────────────
  if (!timeline && !isLoading && !error) {
    return (
      <div className={className}>
        <button
          onClick={generateTimeline}
          className="group w-full card p-6 transition-all hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-semibold text-lg">
                Treatment Timeline
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                See what participation in this trial would look like over time
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              Generate
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Generating Timeline...</h3>
            <p className="text-sm text-surface-500">Analyzing trial protocol</p>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-500"
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
            Couldn&apos;t generate timeline
          </h3>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{error}</p>
        <button onClick={generateTimeline} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── Timeline display ─────────────────────────────────────────────────────
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-lg">
                Treatment Timeline
              </h3>
              <p className="text-purple-100 text-xs">
                What to expect during this trial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateTimeline}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Regenerate timeline"
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
        {isExpanded && timeline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 space-y-6">
              {/* Total Duration Banner */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Estimated Total Duration
                  </div>
                  <div className="font-display text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {timeline.totalDuration.estimate}
                  </div>
                  {timeline.totalDuration.note && (
                    <div className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">
                      {timeline.totalDuration.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Phases */}
              <div className="space-y-4">
                <h4 className="font-display font-semibold text-surface-900 dark:text-surface-100">
                  Trial Phases
                </h4>

                <div className="relative">
                  {/* Vertical line connector */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700" />

                  <div className="space-y-4">
                    {timeline.phases.map((phase, index) => {
                      const Icon = iconMap[phase.icon] || ClipboardList;
                      const colors = colorMap[phase.color] || colorMap.teal;
                      const isPhaseExpanded = expandedPhases[phase.id];

                      return (
                        <div key={phase.id} className="relative">
                          {/* Phase card */}
                          <div className="ml-12 card overflow-hidden">
                            {/* Phase icon (on the timeline) */}
                            <div
                              className={`absolute left-0 w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shadow-lg z-10`}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>

                            {/* Phase header */}
                            <button
                              onClick={() => togglePhase(phase.id)}
                              className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                            >
                              <div>
                                <h5 className="font-display font-semibold">
                                  {phase.name}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-sm font-medium ${colors.text}`}>
                                    {phase.duration}
                                  </span>
                                  <span className="text-surface-400">•</span>
                                  <span className="text-sm text-surface-500">
                                    {phase.description}
                                  </span>
                                </div>
                              </div>
                              {isPhaseExpanded ? (
                                <ChevronUp className="w-4 h-4 text-surface-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-surface-400" />
                              )}
                            </button>

                            {/* Phase details */}
                            <AnimatePresence initial={false}>
                              {isPhaseExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className={`px-4 pb-4 border-t ${colors.light} border-surface-200 dark:border-surface-700`}>
                                    {/* Cycles info */}
                                    {phase.cycles && (
                                      <div className="mt-4 p-3 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                                        <div className="flex items-center gap-2 mb-2">
                                          <RefreshCw className={`w-4 h-4 ${colors.text}`} />
                                          <span className="font-medium text-sm">Treatment Cycles</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <span className="text-surface-500">Number:</span>{' '}
                                            <span className="font-medium">{phase.cycles.count}</span>
                                          </div>
                                          <div>
                                            <span className="text-surface-500">Length:</span>{' '}
                                            <span className="font-medium">{phase.cycles.length}</span>
                                          </div>
                                        </div>
                                        {phase.cycles.note && (
                                          <p className="text-xs text-surface-500 mt-2">
                                            {phase.cycles.note}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* Activities */}
                                    {phase.activities.length > 0 && (
                                      <div className="mt-4 space-y-2">
                                        {phase.activities.map((activity, actIndex) => (
                                          <div
                                            key={actIndex}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-surface-800"
                                          >
                                            <CheckCircle2 className={`w-4 h-4 mt-0.5 ${colors.text} flex-shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-sm">
                                                  {activity.name}
                                                </span>
                                                <span className="text-xs text-surface-500 whitespace-nowrap">
                                                  {activity.timing}
                                                </span>
                                              </div>
                                              <p className="text-xs text-surface-500 mt-0.5">
                                                {activity.description}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Key Milestones */}
              {timeline.keyMilestones.length > 0 && (
                <div>
                  <h4 className="font-display font-semibold text-surface-900 dark:text-surface-100 mb-3">
                    Key Milestones
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {timeline.keyMilestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{milestone.name}</div>
                          <div className="text-xs text-surface-500">{milestone.timing}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visit Info Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <div className="text-sm font-medium text-surface-500 mb-1">
                    Visit Frequency
                  </div>
                  <div className="text-sm">
                    <span className="text-surface-900 dark:text-surface-100">During treatment:</span>{' '}
                    <span className="text-surface-600 dark:text-surface-400">
                      {timeline.visitFrequency.duringTreatment}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-surface-900 dark:text-surface-100">Follow-up:</span>{' '}
                    <span className="text-surface-600 dark:text-surface-400">
                      {timeline.visitFrequency.duringFollowUp}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <div className="text-sm font-medium text-surface-500 mb-1">
                    Time Commitment
                  </div>
                  <div className="text-sm text-surface-900 dark:text-surface-100">
                    {timeline.timeCommitment.perVisit}
                  </div>
                  {timeline.timeCommitment.note && (
                    <div className="text-xs text-surface-500 mt-1">
                      {timeline.timeCommitment.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Important Notes */}
              {timeline.importantNotes.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-sm text-amber-800 dark:text-amber-200">
                      Important Notes
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {timeline.importantNotes.map((note, i) => (
                      <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence indicator */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
                <Sparkles className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                      Confidence Level:
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        timeline.confidence === 'high'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : timeline.confidence === 'medium'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {timeline.confidence.charAt(0).toUpperCase() + timeline.confidence.slice(1)}
                    </span>
                  </div>
                  {timeline.confidenceNote && (
                    <p className="text-xs text-surface-500 mt-1">{timeline.confidenceNote}</p>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex gap-2.5 p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
                <Info className="w-4 h-4 text-surface-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                  This timeline is an <strong>AI-generated estimate</strong> based on the trial
                  protocol and standard practices. Actual schedules vary by site and individual
                  circumstances. The research team will provide your specific schedule if you enroll.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

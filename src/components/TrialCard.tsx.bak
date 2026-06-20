'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  Clock,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Phone,
  Mail,
  Shield,
  BadgeCheck
} from 'lucide-react';
import { useSavedTrials } from '@/hooks';
import { findMatchingTherapies, getNciDrugUrl, getFdaDrugUrl } from '@/lib/fda-therapies';
import type { Trial, SearchResult, MatchReason } from '@/types';

interface TrialCardProps {
  result: SearchResult;
  showMatchReasons?: boolean;
  compact?: boolean;
}

export default function TrialCard({ result, showMatchReasons = true, compact = false }: TrialCardProps) {
  const { trial, matchScore, matchReasons, distance } = result;
  const { isSaved, toggleSaved } = useSavedTrials();
  const [expanded, setExpanded] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const saved = isSaved(trial.nctId);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'match-score-high';
    if (score >= 50) return 'match-score-medium';
    return 'match-score-low';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Recruiting':
        return 'badge-success';
      case 'Not yet recruiting':
        return 'badge-info';
      case 'Active, not recruiting':
        return 'badge-warning';
      default:
        return 'badge bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400';
    }
  };

  const getPhaseColor = (phase: string) => {
    if (phase.includes('3')) return 'badge-primary';
    if (phase.includes('2')) return 'badge-secondary';
    return 'badge bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400';
  };

  // Filter to US locations only and limit display
  const usLocations = trial.locations.filter(loc => 
    loc.country === 'United States' || !loc.country
  );
  const displayLocations = usLocations.slice(0, 10);
  const hasMoreLocations = usLocations.length > 10;

  // Find nearest location name
  const nearestLocation = distance !== undefined && usLocations.length > 0
    ? usLocations[0] // First location should be nearest after sorting
    : null;

  // Find FDA/NCI matched therapies
  const matchedTherapies = useMemo(() => {
    return findMatchingTherapies(trial.interventions);
  }, [trial.interventions]);

  const hasFDAApproved = matchedTherapies.fdaApproved.length > 0;
  const hasNCIDesignated = matchedTherapies.nciDesignated.length > 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-hover overflow-hidden ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex gap-4">
        {/* Match Score */}
        {showMatchReasons && (
          <div className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center ${getScoreBg(matchScore)}`}>
            <span className={`font-display font-bold text-xl ${getScoreColor(matchScore).replace('match-score-', 'text-').replace('high', 'emerald-600 dark:text-emerald-400').replace('medium', 'amber-600 dark:text-amber-400').replace('low', 'red-600 dark:text-red-400')}`}>
              {matchScore}
            </span>
            <span className="text-2xs text-surface-500 uppercase tracking-wider">Match</span>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={getStatusColor(trial.status)}>{trial.status}</span>
                <span className={getPhaseColor(trial.phase)}>{trial.phase}</span>
                {hasFDAApproved && (
                  <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    FDA Approved
                  </span>
                )}
                {hasNCIDesignated && (
                  <span className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    NCI
                  </span>
                )}
              </div>
              <Link 
                href={`/trial/${trial.nctId}`}
                className="font-display font-semibold text-lg leading-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
              >
                {trial.briefTitle}
              </Link>
              <p className="text-sm text-surface-500 mt-1">{trial.nctId}</p>
            </div>

            <button
              onClick={() => toggleSaved(trial.nctId)}
              className={`flex-shrink-0 p-2 rounded-xl transition-all ${
                saved 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600'
              }`}
              aria-label={saved ? 'Remove from saved' : 'Save trial'}
            >
              {saved ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-surface-600 dark:text-surface-400 mb-3">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {trial.sponsor}
            </span>
            
            {/* Clickable Sites Count */}
            <button
              onClick={() => setShowLocations(!showLocations)}
              className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span className="underline decoration-dotted underline-offset-2">
                {trial.locationCount} {trial.locationCount === 1 ? 'site' : 'sites'}
              </span>
              {showLocations ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            
            {/* Nearest Site with Distance */}
            {distance !== undefined && nearestLocation && (
              <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                <span className="font-medium">{Math.round(distance)} mi</span>
                <span className="text-surface-500">to</span>
                <span className="font-medium truncate max-w-[200px]" title={nearestLocation.facility}>
                  {nearestLocation.city}, {nearestLocation.state}
                </span>
              </span>
            )}
            
            {trial.interventions.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {trial.interventions[0].name}
                {trial.interventions.length > 1 && ` +${trial.interventions.length - 1}`}
              </span>
            )}
          </div>

          {/* FDA/NCI Approved Therapies Detail */}
          {(hasFDAApproved || hasNCIDesignated) && (
            <div className="mb-3 p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/30">
              <div className="flex flex-wrap gap-2">
                {matchedTherapies.fdaApproved.slice(0, 3).map((therapy, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <a 
                      href={getNciDrugUrl(therapy.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 dark:text-blue-300 hover:underline"
                      title={`View ${therapy.name} on NCI Drug Dictionary`}
                    >
                      {therapy.name}
                    </a>
                    {therapy.brandNames[0] && (
                      <a
                        href={getFdaDrugUrl(therapy.brandNames[0])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 dark:text-blue-400 hover:underline"
                        title={`View ${therapy.brandNames[0]} FDA label`}
                      >
                        ({therapy.brandNames[0]})
                      </a>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${
                      therapy.type === 'immunotherapy' 
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        : therapy.type === 'targeted'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {therapy.type}
                    </span>
                  </div>
                ))}
                {matchedTherapies.fdaApproved.length > 3 && (
                  <span className="text-xs text-surface-500">
                    +{matchedTherapies.fdaApproved.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Expandable Locations List */}
          <AnimatePresence>
            {showLocations && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-3 overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 space-y-2 max-h-64 overflow-y-auto">
                  <div className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                    Trial Locations
                  </div>
                  {displayLocations.length > 0 ? (
                    <>
                      {displayLocations.map((location, index) => (
                        <div 
                          key={index}
                          className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {location.facility}
                            </div>
                            <div className="text-xs text-surface-500">
                              {location.city}{location.state ? `, ${location.state}` : ''} {location.zip}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {location.status && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                location.status === 'Recruiting' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                              }`}>
                                {location.status}
                              </span>
                            )}
                            {location.contact?.phone && (
                              <a 
                                href={`tel:${location.contact.phone}`}
                                className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                title="Call"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {location.contact?.email && (
                              <a 
                                href={`mailto:${location.contact.email}`}
                                className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                title="Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {hasMoreLocations && (
                        <div className="text-xs text-center text-surface-500 pt-2 border-t border-surface-200 dark:border-surface-700">
                          +{usLocations.length - 10} more locations • 
                          <Link 
                            href={`/trial/${trial.nctId}`}
                            className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
                          >
                            View all
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-surface-500 text-center py-2">
                      No US locations available
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Biomarkers */}
          {trial.biomarkers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {trial.biomarkers.slice(0, 5).map((biomarker) => (
                <span 
                  key={biomarker} 
                  className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium"
                >
                  {biomarker}
                </span>
              ))}
              {trial.biomarkers.length > 5 && (
                <span className="px-2 py-0.5 text-xs text-surface-500">
                  +{trial.biomarkers.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* AI Summary */}
          {trial.summary && (
            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-3">
              {trial.summary}
            </p>
          )}

          {/* Match Reasons (Expandable) */}
          {showMatchReasons && matchReasons && matchReasons.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <Sparkles className="w-4 h-4" />
                Why this matches
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-900 space-y-2"
                >
                  {matchReasons.map((reason, index) => (
                    <MatchReasonItem key={index} reason={reason} />
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-surface-200 dark:border-surface-800">
            <Link
              href={`/trial/${trial.nctId}`}
              className="btn-primary text-sm py-2"
            >
              View Details
            </Link>
            <a
              href={`https://clinicaltrials.gov/study/${trial.nctId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm py-2"
            >
              <ExternalLink className="w-4 h-4" />
              ClinicalTrials.gov
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function MatchReasonItem({ reason }: { reason: MatchReason }) {
  const getIcon = () => {
    if (reason.matched) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (reason.weight > 5) {
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
    return <Info className="w-4 h-4 text-surface-400" />;
  };

  return (
    <div className="flex items-start gap-2 text-sm">
      {getIcon()}
      <div>
        <span className={reason.matched ? 'text-surface-900 dark:text-surface-100' : 'text-surface-500'}>
          {reason.factor}
        </span>
        {reason.details && (
          <p className="text-xs text-surface-500 mt-0.5">{reason.details}</p>
        )}
      </div>
    </div>
  );
}

// Compact variant for lists
export function TrialCardCompact({ trial }: { trial: Trial }) {
  const { isSaved, toggleSaved } = useSavedTrials();
  const saved = isSaved(trial.nctId);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
      <div className="flex-1 min-w-0">
        <Link 
          href={`/trial/${trial.nctId}`}
          className="font-medium hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1"
        >
          {trial.briefTitle}
        </Link>
        <div className="flex items-center gap-2 mt-1 text-sm text-surface-500">
          <span className="badge-success text-xs">{trial.status}</span>
          <span>{trial.phase}</span>
          <span>•</span>
          <span>{trial.locationCount} sites</span>
        </div>
      </div>
      
      <button
        onClick={() => toggleSaved(trial.nctId)}
        className={`p-2 rounded-lg transition-colors ${
          saved 
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-surface-400 hover:text-surface-600'
        }`}
      >
        {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
      </button>
    </div>
  );
}

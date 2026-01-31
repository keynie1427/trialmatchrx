'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Trash2,
  Search,
  ArrowRight,
  Scale,
  Download,
  Share2,
  FolderOpen
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialCard from '@/components/TrialCard';
import { useSavedTrials } from '@/hooks';
import type { Trial, SearchResult } from '@/types';

export default function SavedTrialsPage() {
  const { savedTrialIds, removeSaved, clearAll, loadTrialDetails } = useSavedTrials();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrials, setSelectedTrials] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load trial details for saved IDs
  useEffect(() => {
    async function fetchTrials() {
      if (savedTrialIds.length === 0) {
        setTrials([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const loadedTrials: Trial[] = [];

      for (const nctId of savedTrialIds) {
        try {
          const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
          if (response.ok) {
            const study = await response.json();
            const trial = transformStudyToTrial(study);
            if (trial) loadedTrials.push(trial);
          }
        } catch (error) {
          console.error(`Failed to load trial ${nctId}:`, error);
        }
      }

      setTrials(loadedTrials);
      setIsLoading(false);
    }

    fetchTrials();
  }, [savedTrialIds]);

  const toggleSelect = (nctId: string) => {
    setSelectedTrials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nctId)) {
        newSet.delete(nctId);
      } else {
        newSet.add(nctId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedTrials.size === trials.length) {
      setSelectedTrials(new Set());
    } else {
      setSelectedTrials(new Set(trials.map(t => t.nctId)));
    }
  };

  const removeSelected = () => {
    selectedTrials.forEach(id => removeSaved(id));
    setSelectedTrials(new Set());
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
    setSelectedTrials(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Bookmark className="w-8 h-8 text-primary-500" />
                Saved Trials
              </h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                {savedTrialIds.length} {savedTrialIds.length === 1 ? 'trial' : 'trials'} saved
              </p>
            </div>

            {trials.length > 0 && (
              <div className="flex items-center gap-2">
                {selectedTrials.size >= 2 && (
                  <Link
                    href={`/compare?trials=${Array.from(selectedTrials).join(',')}`}
                    className="btn-primary"
                  >
                    <Scale className="w-4 h-4" />
                    Compare ({selectedTrials.size})
                  </Link>
                )}
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="btn-ghost text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Clear Confirmation Modal */}
          <AnimatePresence>
            {showClearConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowClearConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-surface-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
                  onClick={e => e.stopPropagation()}
                >
                  <h3 className="font-display font-semibold text-xl mb-2">Clear All Saved Trials?</h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-6">
                    This will remove all {savedTrialIds.length} saved trials. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="btn-primary bg-red-600 hover:bg-red-700 flex-1"
                    >
                      Clear All
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="flex gap-4">
                    <div className="skeleton w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="skeleton h-4 w-24 rounded" />
                      <div className="skeleton h-6 w-3/4 rounded" />
                      <div className="skeleton h-4 w-1/2 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && trials.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-12 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-surface-400" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">
                No Saved Trials Yet
              </h3>
              <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto mb-6">
                Save trials while browsing to keep track of ones you're interested in. 
                Click the bookmark icon on any trial card to save it.
              </p>
              <Link href="/search" className="btn-primary">
                <Search className="w-4 h-4" />
                Search Trials
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {/* Trials List */}
          {!isLoading && trials.length > 0 && (
            <div className="space-y-4">
              {/* Selection Bar */}
              <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-900 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTrials.size === trials.length && trials.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-600 dark:text-surface-400">
                    Select all
                  </span>
                </label>

                {selectedTrials.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-surface-500">
                      {selectedTrials.size} selected
                    </span>
                    <button
                      onClick={removeSelected}
                      className="btn-ghost text-sm py-1 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Trial Cards */}
              {trials.map((trial, index) => (
                <motion.div
                  key={trial.nctId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div className="absolute left-4 top-6 z-10">
                    <input
                      type="checkbox"
                      checked={selectedTrials.has(trial.nctId)}
                      onChange={() => toggleSelect(trial.nctId)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                  <div className="pl-8">
                    <TrialCard
                      result={{
                        trial,
                        matchScore: 0,
                        matchReasons: [],
                      }}
                      showMatchReasons={false}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Helper function to transform API response to Trial type
function transformStudyToTrial(study: any): Trial | null {
  try {
    const protocol = study.protocolSection || {};
    const id = protocol.identificationModule || {};
    const status = protocol.statusModule || {};
    const design = protocol.designModule || {};
    const conditions = protocol.conditionsModule || {};
    const eligibility = protocol.eligibilityModule || {};
    const contacts = protocol.contactsLocationsModule || {};
    const sponsors = protocol.sponsorCollaboratorsModule || {};
    const arms = protocol.armsInterventionsModule || {};
    const description = protocol.descriptionModule || {};

    return {
      nctId: id.nctId,
      title: id.briefTitle,
      briefTitle: id.briefTitle,
      officialTitle: id.officialTitle,
      status: mapStatus(status.overallStatus) as any,
      lastUpdateDate: status.lastUpdateSubmitDate || new Date().toISOString(),
      phase: mapPhase(design.phases?.[0]),
      studyType: 'Interventional',
      conditions: conditions.conditions || [],
      conditionsNormalized: [],
      interventions: (arms.interventions || []).map((i: any) => ({
        type: i.type || 'Other',
        name: i.name,
        description: i.description,
      })),
      biomarkers: extractBiomarkers(eligibility.eligibilityCriteria || ''),
      biomarkersRequired: [],
      biomarkersExcluded: [],
      stages: [],
      priorTherapies: [],
      treatmentNaive: false,
      eligibilityCriteria: eligibility.eligibilityCriteria || '',
      eligibilityParsed: {
        minAge: undefined,
        sex: 'All',
        healthyVolunteers: false,
        inclusionCriteria: [],
        exclusionCriteria: [],
        keyInclusions: [],
        keyExclusions: [],
      },
      locations: (contacts.locations || []).slice(0, 10).map((loc: any) => ({
        facility: loc.facility || 'Unknown',
        city: loc.city || '',
        state: loc.state || '',
        country: loc.country || 'United States',
        zip: loc.zip,
        status: loc.status === 'RECRUITING' ? 'Recruiting' : loc.status,
      })),
      locationCount: contacts.locations?.length || 0,
      contacts: [],
      sponsor: sponsors.leadSponsor?.name || 'Unknown',
      collaborators: [],
      summary: description.briefSummary,
      searchText: '',
      updatedAt: new Date(),
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error transforming study:', error);
    return null;
  }
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    RECRUITING: 'Recruiting',
    NOT_YET_RECRUITING: 'Not yet recruiting',
    ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
    COMPLETED: 'Completed',
  };
  return map[status] || status || 'Unknown';
}

function mapPhase(phase?: string): any {
  if (!phase) return 'Not Applicable';
  const map: Record<string, string> = {
    EARLY_PHASE1: 'Early Phase 1',
    PHASE1: 'Phase 1',
    PHASE2: 'Phase 2',
    PHASE3: 'Phase 3',
    PHASE4: 'Phase 4',
  };
  return map[phase] || 'Not Applicable';
}

function extractBiomarkers(text: string): string[] {
  const found = new Set<string>();
  const patterns = ['EGFR', 'ALK', 'ROS1', 'KRAS', 'BRAF', 'HER2', 'PD-L1', 'BRCA', 'MSI-H', 'NTRK'];
  const upper = text.toUpperCase();
  patterns.forEach(p => { if (upper.includes(p)) found.add(p); });
  return Array.from(found);
}

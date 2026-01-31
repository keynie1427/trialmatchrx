'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Scale,
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  MinusCircle,
  MapPin,
  Building2,
  Calendar,
  Dna,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Search
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialComparisonInsights from '@/components/TrialComparisonInsights';
import { useSavedTrials, useAuth } from '@/hooks';
import { findMatchingTherapies, getNciDrugUrl } from '@/lib/fda-therapies';
import type { Trial } from '@/types';

function ComparePageContent() {
  const searchParams = useSearchParams();
  const { savedTrialIds, isSaved, toggleSaved } = useSavedTrials();
  const { profile } = useAuth();
  
  const [trials, setTrials] = useState<Trial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get trial IDs from URL or use saved trials
  const trialIds = searchParams.get('trials')?.split(',') || [];

  useEffect(() => {
    async function fetchTrials() {
      const idsToFetch = trialIds.length > 0 ? trialIds : savedTrialIds.slice(0, 4);
      
      if (idsToFetch.length === 0) {
        setTrials([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const loadedTrials: Trial[] = [];

      for (const nctId of idsToFetch.slice(0, 4)) {
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
  }, [searchParams]);

  const removeTrial = (nctId: string) => {
    setTrials(prev => prev.filter(t => t.nctId !== nctId));
  };

  const addTrial = async (nctId: string) => {
    if (trials.find(t => t.nctId === nctId) || trials.length >= 4) return;

    try {
      const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
      if (response.ok) {
        const study = await response.json();
        const trial = transformStudyToTrial(study);
        if (trial) {
          setTrials(prev => [...prev, trial]);
        }
      }
    } catch (error) {
      console.error(`Failed to load trial ${nctId}:`, error);
    }
    setShowAddModal(false);
  };

  // Comparison metrics
  const getComparisonValue = (trial: Trial, metric: string): { value: string; status: 'good' | 'neutral' | 'bad' } => {
    switch (metric) {
      case 'status':
        return {
          value: trial.status,
          status: trial.status === 'Recruiting' ? 'good' : trial.status === 'Active, not recruiting' ? 'neutral' : 'bad'
        };
      case 'phase':
        return {
          value: trial.phase,
          status: trial.phase.includes('3') ? 'good' : trial.phase.includes('2') ? 'neutral' : 'neutral'
        };
      case 'locations':
        return {
          value: `${trial.locationCount} sites`,
          status: trial.locationCount > 20 ? 'good' : trial.locationCount > 5 ? 'neutral' : 'bad'
        };
      case 'biomarkers':
        return {
          value: trial.biomarkers.length > 0 ? trial.biomarkers.join(', ') : 'None specified',
          status: trial.biomarkers.length > 0 ? 'good' : 'neutral'
        };
      default:
        return { value: '-', status: 'neutral' };
    }
  };

  const StatusIcon = ({ status }: { status: 'good' | 'neutral' | 'bad' }) => {
    if (status === 'good') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'bad') return <XCircle className="w-4 h-4 text-red-500" />;
    return <MinusCircle className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/saved"
                className="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Saved
              </Link>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Scale className="w-8 h-8 text-primary-500" />
                Compare Trials
              </h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                Compare up to 4 trials side by side
              </p>
            </div>

            {trials.length < 4 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4" />
                Add Trial
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="skeleton h-6 w-3/4 rounded mb-4" />
                  <div className="skeleton h-4 w-1/2 rounded mb-2" />
                  <div className="skeleton h-4 w-2/3 rounded" />
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
                <Scale className="w-10 h-10 text-surface-400" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">
                No Trials to Compare
              </h3>
              <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto mb-6">
                Save at least 2 trials to compare them side by side. Or search for specific trials to add.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/search" className="btn-primary">
                  <Search className="w-4 h-4" />
                  Search Trials
                </Link>
                <Link href="/saved" className="btn-secondary">
                  View Saved
                </Link>
              </div>
            </motion.div>
          )}

          {/* Comparison Table */}
          {!isLoading && trials.length > 0 && (
            <div className="space-y-8">
              {/* AI Comparison Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrialComparisonInsights trials={trials} patientProfile={profile} />
              </motion.div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
              <table className="w-full">
                {/* Trial Headers */}
                <thead>
                  <tr>
                    <th className="text-left p-4 bg-surface-50 dark:bg-surface-900 rounded-tl-xl font-medium text-surface-500 w-40">
                      Trial
                    </th>
                    {trials.map((trial, index) => (
                      <th key={trial.nctId} className={`p-4 bg-surface-50 dark:bg-surface-900 ${index === trials.length - 1 ? 'rounded-tr-xl' : ''}`}>
                        <div className="relative">
                          <button
                            onClick={() => removeTrial(trial.nctId)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-surface-200 dark:bg-surface-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <Link 
                            href={`/trial/${trial.nctId}`}
                            className="font-display font-semibold text-sm hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 block text-left"
                          >
                            {trial.briefTitle}
                          </Link>
                          <p className="text-xs text-surface-500 mt-1 text-left">{trial.nctId}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                  {/* Status */}
                  <tr>
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">Status</td>
                    {trials.map(trial => {
                      const { value, status } = getComparisonValue(trial, 'status');
                      return (
                        <td key={trial.nctId} className="p-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={status} />
                            <span className={`badge ${status === 'good' ? 'badge-success' : ''}`}>
                              {value}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Phase */}
                  <tr className="bg-surface-50/50 dark:bg-surface-900/50">
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">Phase</td>
                    {trials.map(trial => {
                      const { value, status } = getComparisonValue(trial, 'phase');
                      return (
                        <td key={trial.nctId} className="p-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={status} />
                            <span>{value}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Sponsor */}
                  <tr>
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Sponsor
                      </div>
                    </td>
                    {trials.map(trial => (
                      <td key={trial.nctId} className="p-4 text-sm">
                        {trial.sponsor}
                      </td>
                    ))}
                  </tr>

                  {/* Locations */}
                  <tr className="bg-surface-50/50 dark:bg-surface-900/50">
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Locations
                      </div>
                    </td>
                    {trials.map(trial => {
                      const { value, status } = getComparisonValue(trial, 'locations');
                      return (
                        <td key={trial.nctId} className="p-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={status} />
                            <span>{value}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Biomarkers */}
                  <tr>
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">
                      <div className="flex items-center gap-2">
                        <Dna className="w-4 h-4" />
                        Biomarkers
                      </div>
                    </td>
                    {trials.map(trial => (
                      <td key={trial.nctId} className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {trial.biomarkers.length > 0 ? (
                            trial.biomarkers.slice(0, 4).map(biomarker => (
                              <span key={biomarker} className="px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                                {biomarker}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-surface-500">None specified</span>
                          )}
                          {trial.biomarkers.length > 4 && (
                            <span className="text-xs text-surface-500">+{trial.biomarkers.length - 4}</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* FDA Therapies */}
                  <tr className="bg-surface-50/50 dark:bg-surface-900/50">
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">
                      FDA Therapies
                    </td>
                    {trials.map(trial => {
                      const { fdaApproved } = findMatchingTherapies(trial.interventions);
                      return (
                        <td key={trial.nctId} className="p-4">
                          {fdaApproved.length > 0 ? (
                            <div className="space-y-1">
                              {fdaApproved.slice(0, 2).map(therapy => (
                                <a
                                  key={therapy.name}
                                  href={getNciDrugUrl(therapy.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {therapy.name} ({therapy.brandNames[0]})
                                </a>
                              ))}
                              {fdaApproved.length > 2 && (
                                <span className="text-xs text-surface-500">+{fdaApproved.length - 2} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-surface-500">None</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Interventions */}
                  <tr>
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">
                      Interventions
                    </td>
                    {trials.map(trial => (
                      <td key={trial.nctId} className="p-4">
                        <div className="space-y-1">
                          {trial.interventions.slice(0, 3).map((intervention, i) => (
                            <div key={i} className="text-sm">
                              {intervention.name}
                            </div>
                          ))}
                          {trial.interventions.length > 3 && (
                            <span className="text-xs text-surface-500">+{trial.interventions.length - 3} more</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr className="bg-surface-50/50 dark:bg-surface-900/50">
                    <td className="p-4 font-medium text-surface-600 dark:text-surface-400">
                      Actions
                    </td>
                    {trials.map(trial => (
                      <td key={trial.nctId} className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/trial/${trial.nctId}`}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => toggleSaved(trial.nctId)}
                            className={`p-2 rounded-lg ${
                              isSaved(trial.nctId)
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                                : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                            }`}
                          >
                            {isSaved(trial.nctId) ? (
                              <BookmarkCheck className="w-4 h-4" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          )}

          {/* Add Trial Modal */}
          {showAddModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-surface-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-display font-semibold text-xl mb-4">Add Trial to Compare</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">NCT ID</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="e.g., NCT05012345"
                    className="input"
                  />
                </div>

                {savedTrialIds.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Or select from saved trials</label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {savedTrialIds
                        .filter(id => !trials.find(t => t.nctId === id))
                        .map(nctId => (
                          <button
                            key={nctId}
                            onClick={() => addTrial(nctId)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 text-sm"
                          >
                            {nctId}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => searchQuery && addTrial(searchQuery)}
                    disabled={!searchQuery}
                    className="btn-primary flex-1"
                  >
                    Add Trial
                  </button>
                </div>
              </motion.div>
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

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ComparePageContent />
    </Suspense>
  );
}

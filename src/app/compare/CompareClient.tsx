'use client';

import { useState, useEffect } from 'react';
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

export default function CompareClient() {
  const { savedTrialIds, isSaved, toggleSaved } = useSavedTrials();
  const { profile } = useAuth();
  
  const [trials, setTrials] = useState<Trial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trialIds, setTrialIds] = useState<string[]>([]);

  // Get trial IDs from URL on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ids = params.get('trials')?.split(',') || [];
      setTrialIds(ids);
    }
  }, []);

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
  }, [trialIds, savedTrialIds]);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/saved" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm mb-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Saved Trials
              </Link>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Scale className="w-8 h-8 text-primary-600" />
                Compare Trials
              </h1>
              <p className="text-surface-600 mt-1">Side-by-side comparison of up to 4 trials</p>
            </div>
            {trials.length < 4 && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                Add Trial
              </button>
            )}
          </div>

          {/* AI Comparison Insights */}
          {trials.length >= 2 && (
            <div className="mb-8">
              <TrialComparisonInsights trials={trials} patientProfile={profile} />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && trials.length === 0 && (
            <div className="text-center py-12">
              <Scale className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No trials to compare</h2>
              <p className="text-surface-600 mb-4">Save some trials first, then come back to compare them.</p>
              <Link href="/search" className="btn-primary">
                <Search className="w-4 h-4" />
                Search Trials
              </Link>
            </div>
          )}

          {/* Comparison Grid */}
          {!isLoading && trials.length > 0 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${trials.length}, 1fr)` }}>
              {trials.map(trial => (
                <div key={trial.nctId} className="card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono text-surface-500">{trial.nctId}</span>
                    <button onClick={() => removeTrial(trial.nctId)} className="text-surface-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{trial.briefTitle}</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="badge badge-primary">{trial.phase}</span>
                      <span className="badge badge-success">{trial.status}</span>
                    </div>
                    {trial.conditions && (
                      <p className="text-surface-600">{trial.conditions.slice(0, 2).join(', ')}</p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t flex gap-2">
                    <Link href={`/trial/${trial.nctId}`} className="btn-secondary text-xs flex-1 justify-center">
                      View
                    </Link>
                    <button
                      onClick={() => toggleSaved(trial.nctId)}
                      className={`p-2 rounded-lg ${isSaved(trial.nctId) ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-500'}`}
                    >
                      {isSaved(trial.nctId) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

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
      briefTitle: id.briefTitle,
      officialTitle: id.officialTitle,
      status: mapStatus(status.overallStatus) as any,
      lastUpdateDate: status.lastUpdateSubmitDate || new Date().toISOString(),
      phase: mapPhase(design.phases?.[0]),
      studyType: 'Interventional',
      conditions: conditions.conditions || [],
      interventions: (arms.interventions || []).map((i: any) => ({
        type: i.type || 'Other',
        name: i.name,
        description: i.description,
      })),
      eligibilityCriteria: eligibility.eligibilityCriteria || '',
      biomarkers: extractBiomarkers(eligibility.eligibilityCriteria || ''),
      locations: (contacts.locations || []).slice(0, 10).map((loc: any) => ({
        facility: loc.facility || '',
        city: loc.city || '',
        state: loc.state || '',
        country: loc.country || 'United States',
        zip: loc.zip || '',
      })),
      sponsor: sponsors.leadSponsor?.name || 'Unknown',
      collaborators: (sponsors.collaborators || []).map((c: any) => c.name),
    };
  } catch (error) {
    console.error('Transform error:', error);
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

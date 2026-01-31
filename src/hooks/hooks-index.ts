'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUser, createUser, updateUserProfile } from '@/lib/firestore';
import { useUserStore } from '@/lib/store';
import type { PatientProfile } from '@/types';

// =============================================================================
// AUTH HOOK
// =============================================================================

export function useAuth() {
  const { user, profile, isAuthenticated, isLoading, setUser, setProfile, logout } = useUserStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch or create user document
        let userData = await getUser(firebaseUser.uid);
        
        if (!userData) {
          // New user, create document
          userData = await createUser(
            firebaseUser.uid,
            firebaseUser.email || '',
            firebaseUser.displayName || undefined
          );
        }
        
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    logout();
  }, [logout]);

  const saveProfile = useCallback(async (profileData: PatientProfile) => {
    if (!user) return;
    
    await updateUserProfile(user.uid, profileData);
    setProfile(profileData);
  }, [user, setProfile]);

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut: handleSignOut,
    saveProfile,
  };
}

// =============================================================================
// TRIAL SEARCH HOOK
// =============================================================================

import { useSearchStore } from '@/lib/store';
import type { SearchCriteria, SearchResult, Trial, TrialPhase } from '@/types';

// ClinicalTrials.gov API search
async function searchClinicalTrialsGov(criteria: SearchCriteria): Promise<{ trials: Trial[]; total: number }> {
  const CTG_API = 'https://clinicaltrials.gov/api/v2/studies';
  
  const params = new URLSearchParams();
  
  // Build query
  const queryParts: string[] = [];
  if (criteria.cancerType) {
    queryParts.push(criteria.cancerType);
  }
  if (criteria.query) {
    queryParts.push(criteria.query);
  }
  if (queryParts.length === 0) {
    queryParts.push('cancer');
  }
  
  params.set('query.cond', queryParts.join(' '));
  params.set('filter.overallStatus', 'RECRUITING');
  params.set('pageSize', String(criteria.limit || 25));
  
  // Add biomarkers to search if specified
  if (criteria.biomarkers && criteria.biomarkers.length > 0) {
    params.set('query.term', criteria.biomarkers.join(' OR '));
  }
  
  const response = await fetch(`${CTG_API}?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Search failed');
  }
  
  const data = await response.json();
  
  // Transform results
  const trials: Trial[] = (data.studies || []).map((study: any) => {
    const protocol = study.protocolSection || {};
    const id = protocol.identificationModule || {};
    const status = protocol.statusModule || {};
    const design = protocol.designModule || {};
    const conditions = protocol.conditionsModule || {};
    const eligibility = protocol.eligibilityModule || {};
    const contacts = protocol.contactsLocationsModule || {};
    const sponsors = protocol.sponsorCollaboratorsModule || {};
    const arms = protocol.armsInterventionsModule || {};
    
    // Extract biomarkers from eligibility text
    const eligibilityText = eligibility.eligibilityCriteria || '';
    const biomarkers = extractBiomarkers(eligibilityText);
    const stages = extractStages(eligibilityText, conditions.conditions || []);
    
    return {
      nctId: id.nctId,
      title: id.briefTitle,
      briefTitle: id.briefTitle,
      officialTitle: id.officialTitle,
      status: mapStatus(status.overallStatus),
      lastUpdateDate: status.lastUpdateSubmitDate || new Date().toISOString(),
      phase: mapPhase(design.phases?.[0]),
      studyType: 'Interventional',
      conditions: conditions.conditions || [],
      conditionsNormalized: normalizeConditions(conditions.conditions || []),
      interventions: (arms.interventions || []).map((i: any) => ({
        type: i.type || 'Other',
        name: i.name,
        description: i.description,
      })),
      biomarkers,
      biomarkersRequired: biomarkers,
      biomarkersExcluded: [],
      stages,
      priorTherapies: [],
      treatmentNaive: eligibilityText.toLowerCase().includes('treatment-naïve') || eligibilityText.toLowerCase().includes('no prior'),
      eligibilityCriteria: eligibilityText,
      eligibilityParsed: {
        minAge: parseAge(eligibility.minimumAge),
        maxAge: parseAge(eligibility.maximumAge),
        sex: eligibility.sex === 'MALE' ? 'Male' : eligibility.sex === 'FEMALE' ? 'Female' : 'All',
        healthyVolunteers: eligibility.healthyVolunteers === 'Yes',
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
    } as Trial;
  });
  
  return { trials, total: data.totalCount || trials.length };
}

// Helper functions
function mapStatus(status: string): string {
  const map: Record<string, string> = {
    RECRUITING: 'Recruiting',
    NOT_YET_RECRUITING: 'Not yet recruiting',
    ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
    COMPLETED: 'Completed',
  };
  return map[status] || status || 'Unknown';
}

function mapPhase(phase?: string): TrialPhase {
  if (!phase) return 'Not Applicable';
  const map: Record<string, TrialPhase> = {
    EARLY_PHASE1: 'Early Phase 1',
    PHASE1: 'Phase 1',
    PHASE1_PHASE2: 'Phase 1/Phase 2',
    PHASE2: 'Phase 2',
    PHASE2_PHASE3: 'Phase 2/Phase 3',
    PHASE3: 'Phase 3',
    PHASE4: 'Phase 4',
  };
  return map[phase] || 'Not Applicable';
}

function parseAge(ageStr?: string): number | undefined {
  if (!ageStr) return undefined;
  const match = ageStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function extractBiomarkers(text: string): string[] {
  const found = new Set<string>();
  const patterns = ['EGFR', 'ALK', 'ROS1', 'KRAS', 'BRAF', 'HER2', 'PD-L1', 'BRCA', 'MSI-H', 'NTRK', 'RET', 'MET'];
  const upper = text.toUpperCase();
  patterns.forEach(p => { if (upper.includes(p)) found.add(p); });
  return Array.from(found);
}

function extractStages(text: string, conditions: string[]): string[] {
  const stages = new Set<string>();
  const combined = `${text} ${conditions.join(' ')}`.toLowerCase();
  if (combined.includes('stage i') || combined.includes('stage 1')) stages.add('Stage I');
  if (combined.includes('stage ii') || combined.includes('stage 2')) stages.add('Stage II');
  if (combined.includes('stage iii') || combined.includes('stage 3')) stages.add('Stage III');
  if (combined.includes('stage iv') || combined.includes('stage 4')) stages.add('Stage IV');
  if (combined.includes('metastatic')) stages.add('Metastatic');
  return Array.from(stages);
}

function normalizeConditions(conditions: string[]): string[] {
  const normalized = new Set<string>();
  const mappings: Record<string, string[]> = {
    'Breast Cancer': ['breast cancer', 'breast carcinoma'],
    'Non-Small Cell Lung Cancer': ['non-small cell lung cancer', 'nsclc'],
    'Lung Cancer': ['lung cancer', 'lung carcinoma'],
    'Prostate Cancer': ['prostate cancer'],
    'Colorectal Cancer': ['colorectal cancer', 'colon cancer'],
    'Melanoma': ['melanoma'],
    'Leukemia': ['leukemia'],
    'Lymphoma': ['lymphoma'],
    'Pancreatic Cancer': ['pancreatic cancer'],
  };
  for (const condition of conditions) {
    const lower = condition.toLowerCase();
    for (const [standard, keywords] of Object.entries(mappings)) {
      if (keywords.some(k => lower.includes(k))) normalized.add(standard);
    }
  }
  return Array.from(normalized);
}

function calculateMatchScore(trial: Trial, criteria: SearchCriteria): number {
  let score = 50;
  if (criteria.cancerType && trial.conditionsNormalized.some(c => c.toLowerCase().includes(criteria.cancerType!.toLowerCase()))) score += 20;
  if (criteria.stage && trial.stages.includes(criteria.stage)) score += 10;
  if (criteria.biomarkers && criteria.biomarkers.length > 0) {
    const matched = criteria.biomarkers.filter(b => trial.biomarkers.includes(b));
    score += (matched.length / criteria.biomarkers.length) * 15;
  }
  if (trial.phase.includes('3')) score += 5;
  if (trial.status === 'Recruiting') score += 5;
  return Math.min(Math.round(score), 100);
}

export function useTrialSearch() {
  const {
    criteria,
    results,
    isLoading,
    error,
    totalResults,
    setCriteria,
    resetCriteria,
    setResults,
    setLoading,
    setError,
  } = useSearchStore();

  const search = useCallback(async (searchCriteria?: Partial<SearchCriteria>) => {
    const finalCriteria = { ...criteria, ...searchCriteria };
    setCriteria(finalCriteria);
    setLoading(true);
    setError(null);

    try {
      const { trials, total } = await searchClinicalTrialsGov(finalCriteria);
      
      // Calculate match scores
      const searchResults: SearchResult[] = trials.map(trial => ({
        trial,
        matchScore: calculateMatchScore(trial, finalCriteria),
        matchReasons: [
          { factor: 'Cancer Type', weight: 10, matched: !!finalCriteria.cancerType && trial.conditions.some(c => c.toLowerCase().includes(finalCriteria.cancerType!.toLowerCase())) },
          { factor: 'Recruiting Status', weight: 10, matched: trial.status === 'Recruiting' },
          { factor: 'Biomarkers', weight: 8, matched: (finalCriteria.biomarkers || []).some(b => trial.biomarkers.includes(b)) },
        ],
      }));
      
      // Sort by match score
      searchResults.sort((a, b) => b.matchScore - a.matchScore);
      
      setResults(searchResults, total);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [criteria, setCriteria, setResults, setLoading, setError]);

  const searchWithAI = useCallback(async (query: string) => {
    // For now, do a simple keyword search
    // AI parsing would require Cloud Functions
    setLoading(true);
    setError(null);

    try {
      const simpleCriteria: Partial<SearchCriteria> = { query };
      await search(simpleCriteria);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [search, setLoading, setError]);

  return {
    criteria,
    results,
    isLoading,
    error,
    totalResults,
    search,
    searchWithAI,
    setCriteria,
    resetCriteria,
  };
}

// =============================================================================
// SAVED TRIALS HOOK
// =============================================================================

import { useSavedTrialsStore } from '@/lib/store';
import { getTrial } from '@/lib/firestore';
import type { Trial } from '@/types';

export function useSavedTrials() {
  const {
    savedTrials,
    trialDetails,
    addTrial,
    removeTrial,
    isSaved,
    setTrialDetails,
    clearAll,
  } = useSavedTrialsStore();
  
  const [isLoading, setIsLoading] = useState(false);

  const toggleSaved = useCallback((nctId: string) => {
    if (isSaved(nctId)) {
      removeTrial(nctId);
    } else {
      addTrial(nctId);
    }
  }, [isSaved, addTrial, removeTrial]);

  const loadTrialDetails = useCallback(async () => {
    setIsLoading(true);
    
    const promises = savedTrials.map(async (nctId) => {
      if (!trialDetails.has(nctId)) {
        const trial = await getTrial(nctId);
        if (trial) {
          setTrialDetails(nctId, trial);
        }
      }
    });

    await Promise.all(promises);
    setIsLoading(false);
  }, [savedTrials, trialDetails, setTrialDetails]);

  return {
    savedTrials,
    trialDetails,
    isLoading,
    toggleSaved,
    isSaved,
    loadTrialDetails,
    clearAll,
  };
}

// =============================================================================
// THEME HOOK
// =============================================================================

import { useUIStore } from '@/lib/store';

export function useTheme() {
  const { theme, setTheme } = useUIStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(systemDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  };
}

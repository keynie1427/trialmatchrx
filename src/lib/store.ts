'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PatientProfile, Trial, SearchCriteria, SearchResult } from '@/types';

// =============================================================================
// USER STORE
// =============================================================================

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface UserState {
  user: User | null;
  profile: PatientProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: PatientProfile | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false,
      }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ 
        user: null, 
        profile: null, 
        isAuthenticated: false,
      }),
    }),
    {
      name: 'trialmatchrx-user',
      partialize: (state) => ({ 
        profile: state.profile,
      }),
    }
  )
);

// =============================================================================
// SEARCH STORE
// =============================================================================

interface SearchState {
  criteria: SearchCriteria;
  results: SearchResult[];
  isSearching: boolean;
  totalResults: number;
  error: string | null;
  setCriteria: (criteria: Partial<SearchCriteria>) => void;
  setResults: (results: SearchResult[], total: number) => void;
  setSearching: (isSearching: boolean) => void;
  setError: (error: string | null) => void;
  clearResults: () => void;
}

const defaultCriteria: SearchCriteria = {
  cancerType: '',
  biomarkers: [],
  stage: undefined,
  priorTreatments: [],
  treatmentNaive: false,
  zip: '',
  distance: 100,
  phases: [],
  recruitingOnly: true,
  limit: 25,
};

export const useSearchStore = create<SearchState>()((set) => ({
  criteria: defaultCriteria,
  results: [],
  isSearching: false,
  totalResults: 0,
  error: null,
  setCriteria: (newCriteria) =>
    set((state) => ({
      criteria: { ...state.criteria, ...newCriteria },
    })),
  setResults: (results, total) => set({ results, totalResults: total }),
  setSearching: (isSearching) => set({ isSearching }),
  setError: (error) => set({ error }),
  clearResults: () => set({ results: [], totalResults: 0, error: null }),
}));

// =============================================================================
// SAVED TRIALS STORE
// =============================================================================

interface SavedTrialsState {
  savedTrials: string[];
  trialDetails: Map<string, Trial>;
  addTrial: (nctId: string) => void;
  removeTrial: (nctId: string) => void;
  isSaved: (nctId: string) => boolean;
  setTrialDetails: (nctId: string, trial: Trial) => void;
  clearAll: () => void;
  setSavedTrials: (trials: string[]) => void;
}

export const useSavedTrialsStore = create<SavedTrialsState>()(
  persist(
    (set, get) => ({
      savedTrials: [],
      trialDetails: new Map(),
      addTrial: (nctId) =>
        set((state) => {
          if (state.savedTrials.includes(nctId)) return state;
          return { savedTrials: [...state.savedTrials, nctId] };
        }),
      removeTrial: (nctId) =>
        set((state) => ({
          savedTrials: state.savedTrials.filter((id) => id !== nctId),
        })),
      isSaved: (nctId) => get().savedTrials.includes(nctId),
      setTrialDetails: (nctId, trial) =>
        set((state) => {
          const newDetails = new Map(state.trialDetails);
          newDetails.set(nctId, trial);
          return { trialDetails: newDetails };
        }),
      clearAll: () => set({ savedTrials: [], trialDetails: new Map() }),
      setSavedTrials: (trials) => set({ savedTrials: trials }),
    }),
    {
      name: 'trialmatchrx-saved',
      partialize: (state) => ({ savedTrials: state.savedTrials }),
    }
  )
);

// =============================================================================
// UI STORE
// =============================================================================

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'trialmatchrx-ui',
    }
  )
);

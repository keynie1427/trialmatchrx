import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trial, PatientProfile, SearchCriteria, SearchResult, User } from '@/types';

// =============================================================================
// SEARCH STORE
// =============================================================================

interface SearchState {
  criteria: SearchCriteria;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  facets: {
    phases: { value: string; count: number }[];
    statuses: { value: string; count: number }[];
    biomarkers: { value: string; count: number }[];
  };
  
  // Actions
  setCriteria: (criteria: Partial<SearchCriteria>) => void;
  resetCriteria: () => void;
  setResults: (results: SearchResult[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultCriteria: SearchCriteria = {
  status: ['Recruiting'],
  limit: 25,
  offset: 0,
};

export const useSearchStore = create<SearchState>()((set) => ({
  criteria: defaultCriteria,
  results: [],
  isLoading: false,
  error: null,
  totalResults: 0,
  facets: {
    phases: [],
    statuses: [],
    biomarkers: [],
  },
  
  setCriteria: (criteria) =>
    set((state) => ({
      criteria: { ...state.criteria, ...criteria },
    })),
  
  resetCriteria: () => set({ criteria: defaultCriteria }),
  
  setResults: (results, total) =>
    set({ results, totalResults: total, error: null }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
}));

// =============================================================================
// USER STORE
// =============================================================================

interface UserState {
  user: User | null;
  profile: PatientProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: PatientProfile | null) => void;
  updateProfile: (updates: Partial<PatientProfile>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) =>
        set({
          user,
          profile: user?.profile || null,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      
      setProfile: (profile) => set({ profile }),
      
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
      
      logout: () =>
        set({
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
// SAVED TRIALS STORE
// =============================================================================

interface SavedTrialsState {
  savedTrials: string[]; // NCT IDs
  trialDetails: Map<string, Trial>;
  
  // Actions
  addTrial: (nctId: string) => void;
  removeTrial: (nctId: string) => void;
  isSaved: (nctId: string) => boolean;
  setTrialDetails: (nctId: string, trial: Trial) => void;
  clearAll: () => void;
}

export const useSavedTrialsStore = create<SavedTrialsState>()(
  persist(
    (set, get) => ({
      savedTrials: [],
      trialDetails: new Map(),
      
      addTrial: (nctId) =>
        set((state) => ({
          savedTrials: state.savedTrials.includes(nctId)
            ? state.savedTrials
            : [...state.savedTrials, nctId],
        })),
      
      removeTrial: (nctId) =>
        set((state) => ({
          savedTrials: state.savedTrials.filter((id) => id !== nctId),
        })),
      
      isSaved: (nctId) => get().savedTrials.includes(nctId),
      
      setTrialDetails: (nctId, trial) =>
        set((state) => {
          const newMap = new Map(state.trialDetails);
          newMap.set(nctId, trial);
          return { trialDetails: newMap };
        }),
      
      clearAll: () => set({ savedTrials: [], trialDetails: new Map() }),
    }),
    {
      name: 'trialmatchrx-saved',
      partialize: (state) => ({
        savedTrials: state.savedTrials,
      }),
    }
  )
);

// =============================================================================
// UI STORE
// =============================================================================

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  compareMode: boolean;
  compareTrials: string[]; // NCT IDs to compare (max 3)
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  toggleCompareMode: () => void;
  addToCompare: (nctId: string) => void;
  removeFromCompare: (nctId: string) => void;
  clearCompare: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      compareMode: false,
      compareTrials: [],
      
      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      toggleCompareMode: () =>
        set((state) => ({ compareMode: !state.compareMode })),
      
      addToCompare: (nctId) =>
        set((state) => ({
          compareTrials:
            state.compareTrials.length < 3 && !state.compareTrials.includes(nctId)
              ? [...state.compareTrials, nctId]
              : state.compareTrials,
        })),
      
      removeFromCompare: (nctId) =>
        set((state) => ({
          compareTrials: state.compareTrials.filter((id) => id !== nctId),
        })),
      
      clearCompare: () => set({ compareTrials: [], compareMode: false }),
    }),
    {
      name: 'trialmatchrx-ui',
    }
  )
);

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  X,
  Dna,
  MapPin,
  Clock,
  Filter,
  User
} from 'lucide-react';
import { useTrialSearch } from '@/hooks';
import { useUserStore } from '@/lib/store';
import { extractDemographics } from '@/lib/demographics';
import { CANCER_TYPES, BIOMARKERS, STAGES, PHASES, PRIOR_TREATMENTS } from '@/types';
import type { SearchCriteria, CancerStage, TrialPhase } from '@/types';
import { analytics_events } from '@/lib/analytics'; // ADD THIS IMPORT

interface SearchFormProps {
  onSearch?: (criteria: SearchCriteria) => void;
  compact?: boolean;
}

export default function SearchForm({ onSearch, compact = false }: SearchFormProps) {
  const router = useRouter();
  const { criteria, setCriteria, search, searchWithAI, isLoading } = useTrialSearch();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [useAI, setUseAI] = useState(false);

  // Form state
  const [cancerType, setCancerType] = useState(criteria.cancerType || '');
  const [stage, setStage] = useState<CancerStage | ''>(criteria.stage || '');
  const [selectedBiomarkers, setSelectedBiomarkers] = useState<string[]>(criteria.biomarkers || []);
  const [selectedPhases, setSelectedPhases] = useState<TrialPhase[]>(criteria.phase || []);
  const [priorTreatment, setPriorTreatment] = useState(criteria.priorTreatment || '');
  const [zip, setZip] = useState(criteria.zip || '');
  const [distance, setDistance] = useState(criteria.distance || 100);
  const [age, setAge] = useState<string>(criteria.age !== undefined ? String(criteria.age) : '');
  const [sex, setSex] = useState<'Male' | 'Female' | ''>(criteria.sex || '');

  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  // Pre-fill age/sex from the signed-in user's saved profile (once, and only
  // if the user hasn't already set them in this search).
  const profile = useUserStore((s) => s.profile);
  const didPrefill = useRef(false);
  useEffect(() => {
    if (didPrefill.current || !profile) return;
    if (criteria.age !== undefined || criteria.sex) { didPrefill.current = true; return; }
    let filled = false;
    if (typeof profile.age === 'number' && !age) { setAge(String(profile.age)); filled = true; }
    if ((profile.sex === 'Male' || profile.sex === 'Female') && !sex) { setSex(profile.sex); filled = true; }
    didPrefill.current = true;
    if (filled) setPrefilledFromProfile(true);
  }, [profile, criteria.age, criteria.sex, age, sex]);

  // Live preview of age/sex detected in the AI search text
  const aiDetected = useMemo(() => extractDemographics(aiQuery), [aiQuery]);

  const parsedAge = age.trim() === '' ? undefined : Number(age);
  const ageValid = parsedAge === undefined || (Number.isInteger(parsedAge) && parsedAge >= 0 && parsedAge <= 120);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useAI && !ageValid) return;

    if (useAI && aiQuery.trim()) {
      // TRACK AI SEARCH
      analytics_events.trialSearch({
        searchType: 'ai',
        aiQuery: aiQuery.trim(),
        queryLength: aiQuery.trim().length
      });

      await searchWithAI(aiQuery);
    } else {
      const searchCriteria: SearchCriteria = {
        cancerType: cancerType || undefined,
        stage: stage || undefined,
        biomarkers: selectedBiomarkers.length > 0 ? selectedBiomarkers : undefined,
        phase: selectedPhases.length > 0 ? selectedPhases : undefined,
        priorTreatment: priorTreatment || undefined,
        age: parsedAge,
        sex: sex || undefined,
        zip: zip || undefined,
        distance: zip ? distance : undefined,
        status: ['Recruiting'],
      };

      // TRACK STANDARD SEARCH
      analytics_events.trialSearch({
        searchType: 'standard',
        cancerType: cancerType || undefined,
        stage: stage || undefined,
        biomarkerCount: selectedBiomarkers.length,
        phaseCount: selectedPhases.length,
        hasPriorTreatment: !!priorTreatment,
        hasLocation: !!zip,
        hasAge: parsedAge !== undefined,
        sex: sex || undefined,
        distance: zip ? distance : undefined
      });

      await search(searchCriteria);
      onSearch?.(searchCriteria);
    }

    // Navigate to search results page if on homepage (compact mode)
    if (compact) {
      router.push('/search');
    }
  }, [useAI, aiQuery, cancerType, stage, selectedBiomarkers, selectedPhases, priorTreatment, parsedAge, ageValid, sex, zip, distance, search, searchWithAI, onSearch, compact, router]);

  const toggleBiomarker = (biomarker: string) => {
    setSelectedBiomarkers(prev =>
      prev.includes(biomarker)
        ? prev.filter(b => b !== biomarker)
        : [...prev, biomarker]
    );
  };

  const togglePhase = (phase: TrialPhase) => {
    setSelectedPhases(prev =>
      prev.includes(phase)
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const clearFilters = () => {
    setCancerType('');
    setStage('');
    setSelectedBiomarkers([]);
    setSelectedPhases([]);
    setPriorTreatment('');
    setAge('');
    setSex('');
    setPrefilledFromProfile(false);
    setZip('');
    setDistance(100);
    setAiQuery('');

    // TRACK FILTER CLEAR
    analytics_events.trackEvent('filters_cleared', {});
  };

  const hasFilters = cancerType || stage || selectedBiomarkers.length > 0 ||
                     selectedPhases.length > 0 || priorTreatment || age || sex || zip;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Search Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setUseAI(!useAI);
            // TRACK AI TOGGLE
            analytics_events.trackEvent('ai_search_toggled', { enabled: !useAI });
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            useAI
              ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${useAI ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">AI Search</span>
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* AI Natural Language Search */}
      <AnimatePresence mode="wait">
        {useAI ? (
          <motion.div
            key="ai-search"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Describe what you're looking for... e.g., 'Stage 4 lung cancer with EGFR mutation after Tagrisso failed'"
                className="input-lg pl-12 pr-4"
              />
            </div>
            {(aiDetected.age !== undefined || aiDetected.sex) && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-surface-500">Will filter by:</span>
                {aiDetected.age !== undefined && (
                  <span className="px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium">
                    Age {aiDetected.age}
                  </span>
                )}
                {aiDetected.sex && (
                  <span className="px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium">
                    {aiDetected.sex}
                  </span>
                )}
              </div>
            )}
            <p className="mt-2 text-sm text-surface-500">
              Tip: Include age, sex, cancer type, stage, biomarkers, and treatment history for best results
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="standard-search"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Main Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cancer Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cancer Type
                </label>
                <select
                  value={cancerType}
                  onChange={(e) => setCancerType(e.target.value)}
                  className="select"
                >
                  <option value="">All cancer types</option>
                  {CANCER_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as CancerStage | '')}
                  className="select"
                >
                  <option value="">All stages</option>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Prior Treatment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prior Treatment
                </label>
                <select
                  value={priorTreatment}
                  onChange={(e) => setPriorTreatment(e.target.value)}
                  className="select"
                >
                  <option value="">Any treatment history</option>
                  {PRIOR_TREATMENTS.map((treatment) => (
                    <option key={treatment} value={treatment}>{treatment}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Age & Sex */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="search-age" className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="w-4 h-4 text-primary-500" />
                  Age
                </label>
                <input
                  id="search-age"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={120}
                  step={1}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Any age"
                  className={`input ${!ageValid ? 'ring-2 ring-red-500' : ''}`}
                  aria-invalid={!ageValid}
                />
                {!ageValid && (
                  <p className="mt-1 text-xs text-red-600">Enter a whole number from 0 to 120</p>
                )}
              </div>
              <div>
                <label htmlFor="search-sex" className="block text-sm font-medium mb-2">
                  Sex
                </label>
                <select
                  id="search-sex"
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'Male' | 'Female' | '')}
                  className="select"
                >
                  <option value="">Any</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>
            {prefilledFromProfile && (
              <p className="-mt-2 text-xs text-surface-500">Age and sex filled in from your profile</p>
            )}

            {/* Biomarkers */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Dna className="w-4 h-4 text-primary-500" />
                Biomarkers
              </label>
              <div className="flex flex-wrap gap-2">
                {BIOMARKERS.slice(0, compact ? 12 : 20).map((biomarker) => (
                  <button
                    key={biomarker}
                    type="button"
                    onClick={() => toggleBiomarker(biomarker)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedBiomarkers.includes(biomarker)
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                        : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
                    }`}
                  >
                    {biomarker}
                  </button>
                ))}
                {!compact && BIOMARKERS.length > 20 && (
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(true)}
                    className="px-3 py-1.5 rounded-full text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    +{BIOMARKERS.length - 20} more
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            {!compact && (
              <button
                type="button"
                onClick={() => {
                  setShowAdvanced(!showAdvanced);
                  // TRACK ADVANCED FILTERS TOGGLE
                  analytics_events.trackEvent('advanced_filters_toggled', { expanded: !showAdvanced });
                }}
                className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
              >
                <Filter className="w-4 h-4" />
                Advanced filters
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvanced && !compact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Trial Phases */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-3">
                      <Clock className="w-4 h-4 text-primary-500" />
                      Trial Phase
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PHASES.map((phase) => (
                        <button
                          key={phase}
                          type="button"
                          onClick={() => togglePhase(phase)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            selectedPhases.includes(phase)
                              ? 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300 ring-2 ring-secondary-500'
                              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
                          }`}
                        >
                          {phase}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="Enter ZIP code"
                        maxLength={5}
                        pattern="[0-9]{5}"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Distance (miles)
                      </label>
                      <select
                        value={distance}
                        onChange={(e) => setDistance(Number(e.target.value))}
                        className="select"
                        disabled={!zip}
                      >
                        <option value={25}>Within 25 miles</option>
                        <option value={50}>Within 50 miles</option>
                        <option value={100}>Within 100 miles</option>
                        <option value={250}>Within 250 miles</option>
                        <option value={500}>Within 500 miles</option>
                        <option value={0}>Any distance</option>
                      </select>
                    </div>
                  </div>

                  {/* All Biomarkers */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">All Biomarkers</label>
                    <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                      <div className="flex flex-wrap gap-2">
                        {BIOMARKERS.map((biomarker) => (
                          <button
                            key={biomarker}
                            type="button"
                            onClick={() => toggleBiomarker(biomarker)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              selectedBiomarkers.includes(biomarker)
                                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                                : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'
                            }`}
                          >
                            {biomarker}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || (!useAI && !ageValid)}
        className="btn-primary w-full py-4 text-lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Trials
          </span>
        )}
      </button>
    </form>
  );
}
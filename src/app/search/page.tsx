'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  X, 
  Grid3X3, 
  List,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import TrialCard from '@/components/TrialCard';
import QueryExpansion from '@/components/QueryExpansion';
import { useTrialSearch, useAuth } from '@/hooks';

export default function SearchPage() {
  const router = useRouter();
  const { results, isLoading, error, totalResults, criteria } = useTrialSearch();
  const { profile } = useAuth();
  
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'distance'>('relevance');

  // Build current query string from criteria for QueryExpansion
  const currentQuery = useMemo(() => {
    const parts: string[] = [];
    if (criteria.cancerType) parts.push(criteria.cancerType);
    if (criteria.stage) parts.push(criteria.stage);
    if (criteria.biomarkers && criteria.biomarkers.length > 0) parts.push(...criteria.biomarkers);
    return parts.join(' ');
  }, [criteria]);

  // Handle expanded query search - navigate with query param
  const handleExpandedSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return b.matchScore - a.matchScore;
      case 'date':
        return new Date(b.trial.lastUpdateDate).getTime() - new Date(a.trial.lastUpdateDate).getTime();
      case 'distance':
        return (a.distance || 9999) - (b.distance || 9999);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              Search Clinical Trials
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Find trials matched to your cancer profile using AI-powered precision matching
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <AnimatePresence mode="wait">
              {showFilters && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:w-96 flex-shrink-0"
                >
                  <div className="card p-6 sticky top-24">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5" />
                        Search Filters
                      </h2>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="lg:hidden btn-ghost p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <SearchForm />
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  {!showFilters && (
                    <button
                      onClick={() => setShowFilters(true)}
                      className="btn-secondary"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                    </button>
                  )}
                  
                  {totalResults > 0 && (
                    <p className="text-surface-600 dark:text-surface-400">
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        {totalResults.toLocaleString()}
                      </span>{' '}
                      trials found
                      {criteria.cancerType && (
                        <span> for <span className="font-medium">{criteria.cancerType}</span></span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-surface-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="select py-2 pr-8 text-sm"
                    >
                      <option value="relevance">Best Match</option>
                      <option value="date">Most Recent</option>
                      <option value="distance">Nearest</option>
                    </select>
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center rounded-lg bg-surface-100 dark:bg-surface-800 p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-surface-700 shadow-sm'
                          : 'hover:bg-surface-200 dark:hover:bg-surface-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-surface-700 shadow-sm'
                          : 'hover:bg-surface-200 dark:hover:bg-surface-700'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Smart Query Expansion - Shows when there's a search query */}
              {currentQuery && !isLoading && results.length > 0 && (
                <QueryExpansion
                  query={currentQuery}
                  patientProfile={profile}
                  onSearchQuery={handleExpandedSearch}
                  className="mb-6"
                />
              )}

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

              {/* Error State */}
              {error && (
                <div className="card p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Search Error</h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-4">{error}</p>
                  <button onClick={() => window.location.reload()} className="btn-primary">
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && results.length === 0 && (
                <div className="card p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
                    <SearchIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-2">
                    Start Your Search
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 max-w-md mx-auto mb-6">
                    Use the filters to search for clinical trials matched to your cancer type, 
                    stage, biomarkers, and location.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                    <Sparkles className="w-4 h-4" />
                    Try AI Search for natural language queries
                  </div>
                </div>
              )}

              {/* Results Grid/List */}
              {!isLoading && !error && sortedResults.length > 0 && (
                <div className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 gap-4'
                    : 'space-y-4'
                }>
                  {sortedResults.map((result, index) => (
                    <motion.div
                      key={result.trial.nctId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <TrialCard 
                        result={result} 
                        compact={viewMode === 'grid'}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load More */}
              {!isLoading && sortedResults.length > 0 && sortedResults.length < totalResults && (
                <div className="mt-8 text-center">
                  <button className="btn-secondary">
                    Load More Trials
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
 

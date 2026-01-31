'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Dna,
  Layers,
  ArrowRight,
  RefreshCw,
  X,
  Lightbulb,
  Tag,
  Zap,
  Target,
  FlaskConical,
  Pill,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Synonym {
  term: string;
  alternatives: string[];
}

interface Suggestion {
  query: string;
  reason: string;
  type: 'biomarker' | 'subtype' | 'synonym' | 'drug_class' | 'stage';
}

interface QueryExpansion {
  originalQuery: string;
  expandedQueries: string[];
  synonyms: Synonym[];
  relatedBiomarkers: string[];
  broaderTerms: string[];
  narrowerTerms: string[];
  suggestions: Suggestion[];
  explanation: string | null;
}

interface QueryExpansionProps {
  query: string;
  patientProfile?: any;
  onSearchQuery: (query: string) => void;
  className?: string;
  autoExpand?: boolean;
  minQueryLength?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion type icons and colors
// ─────────────────────────────────────────────────────────────────────────────
const suggestionStyles: Record<string, { icon: React.ComponentType<any>; bg: string; text: string }> = {
  biomarker: {
    icon: Dna,
    bg: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    text: 'text-purple-700 dark:text-purple-300',
  },
  subtype: {
    icon: Layers,
    bg: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    text: 'text-blue-700 dark:text-blue-300',
  },
  synonym: {
    icon: Tag,
    bg: 'bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  drug_class: {
    icon: Pill,
    bg: 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50',
    text: 'text-amber-700 dark:text-amber-300',
  },
  stage: {
    icon: Target,
    bg: 'bg-secondary-100 dark:bg-secondary-900/30 hover:bg-secondary-200 dark:hover:bg-secondary-900/50',
    text: 'text-secondary-700 dark:text-secondary-300',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function QueryExpansion({
  query,
  patientProfile,
  onSearchQuery,
  className = '',
  autoExpand = true,
  minQueryLength = 3,
}: QueryExpansionProps) {
  const [expansion, setExpansion] = useState<QueryExpansion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const expandQuery = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setExpansion(null);
      return;
    }

    // Don't re-expand the same query
    if (searchQuery === lastQuery) return;

    setIsLoading(true);
    setIsDismissed(false);

    try {
      const res = await fetch('/api/ai/expand-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, patientProfile }),
      });

      if (!res.ok) {
        throw new Error('Failed to expand query');
      }

      const data = await res.json();
      setExpansion(data);
      setLastQuery(searchQuery);
    } catch (error) {
      console.error('Query expansion error:', error);
      setExpansion(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientProfile, lastQuery, minQueryLength]);

  // Auto-expand when query changes
  useEffect(() => {
    if (autoExpand && query && query.length >= minQueryLength && query !== lastQuery) {
      const debounce = setTimeout(() => {
        expandQuery(query);
      }, 500); // Debounce to avoid excessive API calls

      return () => clearTimeout(debounce);
    }
  }, [query, autoExpand, expandQuery, lastQuery, minQueryLength]);

  const handleSuggestionClick = (suggestedQuery: string) => {
    onSearchQuery(suggestedQuery);
  };

  // Don't render anything if dismissed or no query
  if (isDismissed || !query || query.length < minQueryLength) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-surface-500 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-4 h-4 text-primary-500" />
        </motion.div>
        <span>Expanding search...</span>
      </div>
    );
  }

  // No expansion data or nothing useful to show
  if (!expansion || (expansion.suggestions.length === 0 && expansion.relatedBiomarkers.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`card p-4 border-primary-200 dark:border-primary-800 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/20 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Smart Search Suggestions</h4>
            {expansion.explanation && (
              <p className="text-xs text-surface-500 line-clamp-1">
                {expansion.explanation}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-surface-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-surface-400" />
            )}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-surface-400" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Quick Suggestions */}
            {expansion.suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-surface-400" />
                  <span className="text-xs font-medium text-surface-500">Try these searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {expansion.suggestions.map((suggestion, index) => {
                    const style = suggestionStyles[suggestion.type] || suggestionStyles.synonym;
                    const Icon = style.icon;

                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.query)}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${style.bg}`}
                        title={suggestion.reason}
                      >
                        <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                        <span className={`text-sm font-medium ${style.text}`}>
                          {suggestion.query}
                        </span>
                        <ArrowRight className={`w-3 h-3 ${style.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related Biomarkers */}
            {expansion.relatedBiomarkers.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Dna className="w-3.5 h-3.5 text-surface-400" />
                  <span className="text-xs font-medium text-surface-500">Related biomarkers</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {expansion.relatedBiomarkers.map((biomarker) => (
                    <button
                      key={biomarker}
                      onClick={() => handleSuggestionClick(`${query} ${biomarker}`)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      + {biomarker}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Broader / Narrower Terms */}
            {(expansion.broaderTerms.length > 0 || expansion.narrowerTerms.length > 0) && (
              <div className="flex flex-wrap gap-4">
                {expansion.broaderTerms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-surface-400" />
                      <span className="text-xs font-medium text-surface-500">Broader search</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {expansion.broaderTerms.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSuggestionClick(term)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {expansion.narrowerTerms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5 text-surface-400" />
                      <span className="text-xs font-medium text-surface-500">More specific</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {expansion.narrowerTerms.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSuggestionClick(term)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Synonyms */}
            {expansion.synonyms.length > 0 && (
              <div className="pt-3 border-t border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-surface-400" />
                  <span className="text-xs font-medium text-surface-500">Also known as</span>
                </div>
                <div className="space-y-1.5">
                  {expansion.synonyms.slice(0, 3).map((syn, index) => (
                    <div key={index} className="text-xs text-surface-600 dark:text-surface-400">
                      <span className="font-medium">{syn.term}</span>
                      <span className="text-surface-400 mx-1">→</span>
                      {syn.alternatives.map((alt, altIndex) => (
                        <button
                          key={altIndex}
                          onClick={() => handleSuggestionClick(alt)}
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {alt}
                          {altIndex < syn.alternatives.length - 1 && ', '}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact inline version for search bar
// ─────────────────────────────────────────────────────────────────────────────
export function QueryExpansionInline({
  query,
  patientProfile,
  onSearchQuery,
  className = '',
}: Omit<QueryExpansionProps, 'autoExpand' | 'minQueryLength'>) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    if (!query || query.length < 3 || query === lastQuery) {
      setSuggestions([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai/expand-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, patientProfile }),
        });

        if (res.ok) {
          const data = await res.json();
          // Get top 3 suggestion queries
          const topSuggestions = (data.suggestions || [])
            .slice(0, 3)
            .map((s: Suggestion) => s.query);
          setSuggestions(topSuggestions);
          setLastQuery(query);
        }
      } catch (error) {
        console.error('Query expansion error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(debounce);
  }, [query, patientProfile, lastQuery]);

  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {isLoading ? (
        <span className="text-xs text-surface-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 animate-pulse" />
          Finding related searches...
        </span>
      ) : (
        <>
          <span className="text-xs text-surface-400">Also try:</span>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSearchQuery(suggestion)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              {suggestion}
              {index < suggestions.length - 1 && <span className="text-surface-300 ml-1">•</span>}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

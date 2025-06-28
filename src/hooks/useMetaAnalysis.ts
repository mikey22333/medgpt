import { useState, useEffect, useCallback } from 'react';
import { type EuropePMCMetaAnalysis } from '@/lib/research/europepmc';

export interface FallbackSuggestion {
  query: string;
  description: string;
  url: string;
}

interface UseMetaAnalysisOptions {
  minStudies?: number;
  minYear?: number;
  maxYear?: number;
  hasFullText?: boolean;
  includeNonEnglish?: boolean;
  sortBy?: 'relevance' | 'date' | 'cited';
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
  includeSummary?: boolean;
  suggestFallbacks?: boolean;
}

export function useMetaAnalysis(
  query: string,
  options: UseMetaAnalysisOptions = {}
) {
  const {
    minStudies,
    minYear,
    maxYear,
    hasFullText,
    includeNonEnglish,
    sortBy = 'relevance',
    sortOrder = 'desc',
    enabled = true,
    includeSummary = false,
    suggestFallbacks = true,
  } = options;

  const [data, setData] = useState<EuropePMCMetaAnalysis[]>([]);
  const [fallbackSuggestions, setFallbackSuggestions] = useState<FallbackSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetaAnalyses = useCallback(async () => {
    if (!query || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query,
        ...(minStudies !== undefined && { minStudies: minStudies.toString() }),
        ...(minYear !== undefined && { minYear: minYear.toString() }),
        ...(maxYear !== undefined && { maxYear: maxYear.toString() }),
        ...(hasFullText !== undefined && { hasFullText: hasFullText.toString() }),
        ...(includeNonEnglish !== undefined && { includeNonEnglish: includeNonEnglish.toString() }),
        sortBy,
        sortOrder,
        includeSummary: includeSummary.toString(),
        suggestFallbacks: suggestFallbacks.toString(),
      });

      const response = await fetch(`/api/research/meta-analysis?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch meta-analyses');
      }

      const result = await response.json();
      setData(result.results || []);
      setFallbackSuggestions(result.fallbackSuggestions || []);
    } catch (err) {
      console.error('Error fetching meta-analyses:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [query, minStudies, minYear, maxYear, hasFullText, includeNonEnglish, sortBy, sortOrder, enabled, includeSummary]);

  useEffect(() => {
    fetchMetaAnalyses();
  }, [fetchMetaAnalyses]);

  const refetch = useCallback(() => {
    return fetchMetaAnalyses();
  }, [fetchMetaAnalyses]);

  return {
    data,
    fallbackSuggestions,
    hasFallbackSuggestions: fallbackSuggestions.length > 0,
    isLoading,
    error,
    refetch,
  };
}

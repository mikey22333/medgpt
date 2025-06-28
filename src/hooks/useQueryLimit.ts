import { useState, useEffect, useCallback } from 'react';

interface QueryLimitData {
  can_chat: boolean;
  queries_used: number;
  query_limit: number;
  subscription_tier: 'free' | 'pro';
  time_until_reset_hours: number;
  reset_needed: boolean;
}

export function useQueryLimit() {
  const [limitData, setLimitData] = useState<QueryLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkLimit = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching query limit...');
      const response = await fetch('/api/query-limit', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Query limit response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Query limit API error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Query limit data received:', data);
      
      // Validate the response data
      if (!data || typeof data.can_chat === 'undefined') {
        throw new Error('Invalid response format from query limit API');
      }
      
      setLimitData(data);
      setError(null);
    } catch (err) {
      console.error('Query limit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking query limit';
      setError(errorMessage);
      setLimitData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const incrementCount = useCallback(async () => {
    try {
      const response = await fetch('/api/query-limit', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to increment query count');
      }
      
      // Refresh the limit data after incrementing
      await checkLimit();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [checkLimit]);

  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  const formatTimeUntilReset = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.ceil(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.ceil((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
    }
    
    return `${wholeHours}h ${minutes}m`;
  };

  return {
    limitData,
    loading,
    error,
    checkLimit,
    incrementCount,
    formatTimeUntilReset,
    canChat: limitData?.can_chat ?? false,
    isProUser: limitData?.subscription_tier === 'pro',
    queriesUsed: limitData?.queries_used ?? 0,
    queryLimit: limitData?.query_limit ?? 3,
    timeUntilReset: limitData ? formatTimeUntilReset(limitData.time_until_reset_hours) : null,
    refresh: checkLimit, // Add explicit refresh function
  };
}

// Safe database transaction operations
// Prevents race conditions in query limit updates and user operations

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

interface QueryLimitResult {
  success: boolean;
  remainingQueries: number;
  error?: string;
}

interface UserProfile {
  id: string;
  query_limit: number;
  queries_used: number;
  subscription_tier: string;
  last_reset_date: string;
}

class DatabaseTransactions {
  
  // Safely check and decrement query limit with atomic operation
  async checkAndDecrementQueryLimit(userId: string): Promise<QueryLimitResult> {
    const supabase = await createClient();
    
    // DEVELOPMENT BYPASS: Skip database check in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing query limit check');
      return {
        success: true,
        remainingQueries: 99,
        error: undefined
      };
    }
    
    try {
      // Use a stored procedure for atomic operation
      const { data, error } = await supabase.rpc('check_and_use_query', {
        user_id: userId
      });

      if (error) {
        console.error('Database error in checkAndDecrementQueryLimit:', error);
        return {
          success: false,
          remainingQueries: 0,
          error: 'Database error occurred'
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          remainingQueries: 0,
          error: 'User not found'
        };
      }

      const result = data[0];
      
      return {
        success: result.can_query,
        remainingQueries: result.remaining_queries,
        error: result.can_query ? undefined : 'Query limit exceeded'
      };

    } catch (error: any) {
      console.error('Exception in checkAndDecrementQueryLimit:', error);
      return {
        success: false,
        remainingQueries: 0,
        error: 'Unexpected error occurred'
      };
    }
  }

  // Get user query status without decrementing
  async getUserQueryStatus(userId: string): Promise<{ queryLimit: number; queriesUsed: number; remainingQueries: number } | null> {
    const supabase = await createClient();
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('query_limit, queries_used, last_reset_date')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching user query status:', error);
        return null;
      }

      // Check if we need to reset daily limits
      const today = new Date().toISOString().split('T')[0];
      const lastReset = data.last_reset_date;

      if (lastReset !== today) {
        // Reset daily queries
        const { error: resetError } = await supabase
          .from('user_profiles')
          .update({
            queries_used: 0,
            last_reset_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (!resetError) {
          return {
            queryLimit: data.query_limit,
            queriesUsed: 0,
            remainingQueries: data.query_limit
          };
        }
      }

      return {
        queryLimit: data.query_limit,
        queriesUsed: data.queries_used,
        remainingQueries: Math.max(0, data.query_limit - data.queries_used)
      };

    } catch (error) {
      console.error('Exception in getUserQueryStatus:', error);
      return null;
    }
  }

  // Safely create user profile with proper defaults
  async createUserProfile(userId: string, email: string, fullName?: string): Promise<boolean> {
    const supabase = await createClient();
    
    try {
      // Use upsert to handle race conditions
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName || '',
          query_limit: 3, // Explicitly set to 3 for free users
          queries_used: 0,
          subscription_tier: 'free',
          last_reset_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false // Update if exists
        });

      if (error) {
        console.error('Error creating user profile:', error);
        return false;
      }

      console.log(`✅ User profile created/updated for ${userId} with 3 query limit`);
      return true;

    } catch (error) {
      console.error('Exception in createUserProfile:', error);
      return false;
    }
  }

  // Update subscription tier safely
  async updateSubscriptionTier(userId: string, newTier: string): Promise<boolean> {
    const supabase = await createClient();
    
    try {
      // Determine new query limit based on tier
      const queryLimits = {
        'free': 3,
        'premium': 100,
        'pro': 1000
      };

      const newQueryLimit = queryLimits[newTier as keyof typeof queryLimits] || 3;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: newTier,
          query_limit: newQueryLimit,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating subscription tier:', error);
        return false;
      }

      console.log(`✅ Updated user ${userId} to ${newTier} tier with ${newQueryLimit} queries`);
      return true;

    } catch (error) {
      console.error('Exception in updateSubscriptionTier:', error);
      return false;
    }
  }

  // Batch operation for multiple users (admin use)
  async batchUpdateQueryLimits(updates: { userId: string; newLimit: number }[]): Promise<number> {
    const supabase = await createClient();
    let successCount = 0;

    // Process in batches of 10 to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      try {
        const promises = batch.map(update => 
          supabase
            .from('user_profiles')
            .update({
              query_limit: update.newLimit,
              updated_at: new Date().toISOString()
            })
            .eq('id', update.userId)
        );

        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && !result.value.error) {
            successCount++;
          } else {
            console.error(`Failed to update user ${batch[index].userId}:`, 
              result.status === 'rejected' ? result.reason : result.value.error);
          }
        });

        // Small delay between batches
        if (i + batchSize < updates.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error('Batch update error:', error);
      }
    }

    console.log(`✅ Batch update completed: ${successCount}/${updates.length} successful`);
    return successCount;
  }
}

// Create the stored procedure for atomic query checking
export const createQueryCheckProcedure = `
CREATE OR REPLACE FUNCTION check_and_use_query(user_id UUID)
RETURNS TABLE(can_query BOOLEAN, remaining_queries INTEGER) AS $$
DECLARE
    current_limit INTEGER;
    current_used INTEGER;
    current_reset_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get current user data
    SELECT query_limit, queries_used, last_reset_date
    INTO current_limit, current_used, current_reset_date
    FROM user_profiles
    WHERE id = user_id;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0;
        RETURN;
    END IF;
    
    -- Reset if it's a new day
    IF current_reset_date != today_date THEN
        UPDATE user_profiles 
        SET queries_used = 0, 
            last_reset_date = today_date,
            updated_at = NOW()
        WHERE id = user_id;
        current_used := 0;
    END IF;
    
    -- Check if user can make a query
    IF current_used >= current_limit THEN
        RETURN QUERY SELECT FALSE, 0;
        RETURN;
    END IF;
    
    -- Increment query count atomically
    UPDATE user_profiles 
    SET queries_used = queries_used + 1,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return success with remaining queries
    RETURN QUERY SELECT TRUE, (current_limit - current_used - 1);
END;
$$ LANGUAGE plpgsql;
`;

// Singleton instance
export const dbTransactions = new DatabaseTransactions();

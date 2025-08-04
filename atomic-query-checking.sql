-- ================================================
-- ATOMIC QUERY CHECKING FUNCTION
-- ================================================
-- This creates a race-condition-safe function for checking and using user queries
-- Run this in Supabase SQL Editor after the main fix-query-limit-complete.sql

-- Create the atomic query checking function
CREATE OR REPLACE FUNCTION public.check_and_use_query(user_id UUID)
RETURNS TABLE(can_query BOOLEAN, remaining_queries INTEGER) AS $$
DECLARE
    current_limit INTEGER;
    current_used INTEGER;
    current_reset_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get current user data with row lock to prevent race conditions
    SELECT query_limit, queries_used, last_reset_date
    INTO current_limit, current_used, current_reset_date
    FROM public.user_profiles
    WHERE id = user_id
    FOR UPDATE; -- This locks the row to prevent concurrent access
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, 0::INTEGER;
        RETURN;
    END IF;
    
    -- Reset daily queries if it's a new day
    IF current_reset_date != today_date THEN
        UPDATE public.user_profiles 
        SET queries_used = 0, 
            last_reset_date = today_date,
            updated_at = NOW()
        WHERE id = user_id;
        current_used := 0;
        
        -- Log the daily reset
        RAISE NOTICE 'Daily query reset for user %', user_id;
    END IF;
    
    -- Check if user has reached their query limit
    IF current_used >= current_limit THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, 0::INTEGER;
        RETURN;
    END IF;
    
    -- Atomically increment the query count
    UPDATE public.user_profiles 
    SET queries_used = queries_used + 1,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return success with remaining query count
    RETURN QUERY SELECT TRUE::BOOLEAN, (current_limit - current_used - 1)::INTEGER;
    
    -- Log successful query usage
    RAISE NOTICE 'Query used by user %. Remaining: %', user_id, (current_limit - current_used - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a complementary function to check query status without using a query
CREATE OR REPLACE FUNCTION public.get_query_status(user_id UUID)
RETURNS TABLE(
    query_limit INTEGER, 
    queries_used INTEGER, 
    remaining_queries INTEGER,
    last_reset_date DATE,
    needs_reset BOOLEAN
) AS $$
DECLARE
    current_limit INTEGER;
    current_used INTEGER;
    current_reset_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get current user data (read-only, no lock needed)
    SELECT up.query_limit, up.queries_used, up.last_reset_date
    INTO current_limit, current_used, current_reset_date
    FROM public.user_profiles up
    WHERE up.id = user_id;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::INTEGER, 0::INTEGER, 0::INTEGER, NULL::DATE, FALSE::BOOLEAN;
        RETURN;
    END IF;
    
    -- Check if reset is needed
    IF current_reset_date != today_date THEN
        -- User needs daily reset, show what it would be after reset
        RETURN QUERY SELECT 
            current_limit::INTEGER, 
            0::INTEGER, -- queries_used would be 0 after reset
            current_limit::INTEGER, -- remaining would be full limit
            current_reset_date::DATE,
            TRUE::BOOLEAN; -- needs reset
    ELSE
        -- Normal status
        RETURN QUERY SELECT 
            current_limit::INTEGER, 
            current_used::INTEGER, 
            GREATEST(0, current_limit - current_used)::INTEGER,
            current_reset_date::DATE,
            FALSE::BOOLEAN; -- no reset needed
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manually reset a user's daily queries (admin use)
CREATE OR REPLACE FUNCTION public.reset_user_queries(user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Reset the user's queries
    UPDATE public.user_profiles 
    SET queries_used = 0,
        last_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN QUERY SELECT TRUE::BOOLEAN, 'User queries reset successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- TESTING QUERIES
-- ================================================

-- Test 1: Check function exists and has correct signature
SELECT 
    routine_name, 
    routine_type,
    data_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_and_use_query', 'get_query_status', 'reset_user_queries');

-- Test 2: Test with non-existent user (should return false, 0)
SELECT * FROM public.check_and_use_query('00000000-0000-0000-0000-000000000000'::UUID);

-- Test 3: Test status check with non-existent user
SELECT * FROM public.get_query_status('00000000-0000-0000-0000-000000000000'::UUID);

-- Test 4: Show current user query statistics
SELECT 
    subscription_tier,
    COUNT(*) as user_count,
    AVG(query_limit) as avg_limit,
    AVG(queries_used) as avg_used,
    COUNT(CASE WHEN queries_used >= query_limit THEN 1 END) as users_at_limit
FROM public.user_profiles 
GROUP BY subscription_tier
ORDER BY subscription_tier;

-- Test 5: Find users who need daily reset
SELECT 
    id,
    full_name,
    email,
    query_limit,
    queries_used,
    last_reset_date,
    CURRENT_DATE as today,
    (last_reset_date != CURRENT_DATE) as needs_reset
FROM public.user_profiles 
WHERE last_reset_date != CURRENT_DATE
LIMIT 5;

-- ================================================
-- USAGE EXAMPLES
-- ================================================

/*
-- Example 1: Check and use a query (this is what your app will call)
SELECT * FROM public.check_and_use_query('your-user-uuid-here'::UUID);

-- Example 2: Just check status without using a query
SELECT * FROM public.get_query_status('your-user-uuid-here'::UUID);

-- Example 3: Admin reset a user's queries
SELECT * FROM public.reset_user_queries('user-uuid-here'::UUID);

-- Example 4: Batch check status for multiple users
SELECT 
    up.id,
    up.full_name,
    qs.*
FROM public.user_profiles up
CROSS JOIN LATERAL public.get_query_status(up.id) qs
WHERE up.subscription_tier = 'free'
LIMIT 10;
*/

-- ================================================
-- PERFORMANCE NOTES
-- ================================================

/*
1. The FOR UPDATE lock ensures atomicity but may cause brief delays under high concurrency
2. The function is marked SECURITY DEFINER so it runs with creator privileges
3. Daily resets happen automatically when the function is called
4. The status check function doesn't lock rows, making it fast for dashboard queries
5. Consider adding an index on (last_reset_date) if you have many users:
   CREATE INDEX IF NOT EXISTS idx_user_profiles_reset_date ON public.user_profiles(last_reset_date);
*/

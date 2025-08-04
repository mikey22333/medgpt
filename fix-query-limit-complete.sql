-- ================================
-- FIX QUERY LIMIT ISSUE
-- ================================
-- This script fixes the issue where free users get 1000 queries instead of 3

-- Step 1: Update the table default to prevent future issues
ALTER TABLE public.user_profiles 
ALTER COLUMN query_limit SET DEFAULT 3;

-- Step 2: Update existing free users who have 1000 queries to have 3 queries
UPDATE public.user_profiles 
SET 
    query_limit = 3,
    updated_at = now()
WHERE 
    subscription_tier = 'free' 
    AND query_limit = 1000
    AND queries_used < 3; -- Only reset if they haven't used more than 3

-- Step 3: For users who have used more than 3 queries, set their used count to limit
UPDATE public.user_profiles 
SET 
    queries_used = 3,
    updated_at = now()
WHERE 
    subscription_tier = 'free' 
    AND query_limit = 1000
    AND queries_used > 3;

-- Step 4: Ensure the handle_new_user function explicitly sets query_limit to 3
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        full_name, 
        email, 
        query_limit, 
        queries_used, 
        last_reset_date, 
        subscription_tier
    )
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        new.email, 
        3,  -- Explicitly set to 3 for free users
        0, 
        CURRENT_DATE, 
        'free'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify the changes
SELECT 
    subscription_tier,
    COUNT(*) as user_count,
    AVG(query_limit) as avg_limit,
    MIN(query_limit) as min_limit,
    MAX(query_limit) as max_limit
FROM public.user_profiles 
GROUP BY subscription_tier
ORDER BY subscription_tier;

-- Show users who still have issues (should return no rows after fix)
SELECT 
    id,
    full_name,
    email,
    subscription_tier,
    query_limit,
    queries_used
FROM public.user_profiles 
WHERE 
    subscription_tier = 'free' 
    AND query_limit != 3;

-- Step 6: Create atomic query checking function to prevent race conditions
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
    FOR UPDATE; -- This locks the row
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0;
        RETURN;
    END IF;
    
    -- Reset if it's a new day
    IF current_reset_date != today_date THEN
        UPDATE public.user_profiles 
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
    UPDATE public.user_profiles 
    SET queries_used = queries_used + 1,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return success with remaining queries
    RETURN QUERY SELECT TRUE, (current_limit - current_used - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the new atomic function
SELECT * FROM public.check_and_use_query('00000000-0000-0000-0000-000000000000'::UUID); -- Should return false, 0 for non-existent user

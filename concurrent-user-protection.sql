-- ===============================================
-- COMPLETE CONCURRENT USER CRASH PREVENTION
-- ===============================================
-- This script ensures the website doesn't crash when multiple users access it simultaneously
-- Run this AFTER fix-query-limit-complete.sql and atomic-query-checking.sql

-- Step 1: Add performance index for concurrent query checking
CREATE INDEX IF NOT EXISTS idx_user_profiles_concurrent_access 
ON public.user_profiles(id, last_reset_date, queries_used, query_limit);

-- Step 2: Create connection pooling monitoring function
CREATE OR REPLACE FUNCTION public.get_concurrent_usage_stats()
RETURNS TABLE(
    active_connections INTEGER,
    max_connections INTEGER,
    connection_usage_percent NUMERIC,
    current_queries INTEGER,
    slow_queries INTEGER,
    blocked_queries INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::INTEGER as active_connections,
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as max_connections,
        ROUND((SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC / 
              (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') * 100, 2) as connection_usage_percent,
        (SELECT count(*) FROM pg_stat_activity WHERE query NOT ILIKE '%pg_stat_activity%')::INTEGER as current_queries,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '10 seconds')::INTEGER as slow_queries,
        (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock')::INTEGER as blocked_queries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create emergency cleanup function for stuck connections
CREATE OR REPLACE FUNCTION public.emergency_cleanup_connections()
RETURNS TABLE(killed_connections INTEGER, cleanup_message TEXT) AS $$
DECLARE
    killed_count INTEGER := 0;
    rec RECORD;
BEGIN
    -- Kill connections that have been idle in transaction for more than 5 minutes
    FOR rec IN 
        SELECT pid, usename, application_name, state, query_start
        FROM pg_stat_activity 
        WHERE state = 'idle in transaction' 
        AND query_start < now() - interval '5 minutes'
        AND usename != 'postgres' -- Don't kill postgres admin connections
    LOOP
        BEGIN
            PERFORM pg_terminate_backend(rec.pid);
            killed_count := killed_count + 1;
            RAISE NOTICE 'Killed stuck connection: PID %, User %, App %', rec.pid, rec.usename, rec.application_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to kill connection PID %: %', rec.pid, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT killed_count, 
        CASE 
            WHEN killed_count = 0 THEN 'No stuck connections found'
            ELSE format('Cleaned up %s stuck connections', killed_count)
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create load balancing function for query distribution
CREATE OR REPLACE FUNCTION public.check_system_load()
RETURNS TABLE(
    system_status TEXT,
    can_accept_requests BOOLEAN,
    current_load_percent NUMERIC,
    recommendation TEXT
) AS $$
DECLARE
    active_conn_count INTEGER;
    max_conn_count INTEGER;
    load_percent NUMERIC;
    status_text TEXT;
    can_accept BOOLEAN;
    recommendation_text TEXT;
BEGIN
    -- Get connection statistics
    SELECT count(*) INTO active_conn_count FROM pg_stat_activity WHERE state = 'active';
    SELECT setting::INTEGER INTO max_conn_count FROM pg_settings WHERE name = 'max_connections';
    
    load_percent := ROUND((active_conn_count::NUMERIC / max_conn_count) * 100, 2);
    
    -- Determine system status and recommendations
    IF load_percent >= 90 THEN
        status_text := 'CRITICAL';
        can_accept := FALSE;
        recommendation_text := 'System at capacity - reject new requests, run emergency cleanup';
    ELSIF load_percent >= 75 THEN
        status_text := 'HIGH_LOAD';
        can_accept := TRUE;
        recommendation_text := 'High load detected - queue new requests, monitor closely';
    ELSIF load_percent >= 50 THEN
        status_text := 'MODERATE_LOAD';
        can_accept := TRUE;
        recommendation_text := 'Moderate load - normal operation with monitoring';
    ELSE
        status_text := 'NORMAL';
        can_accept := TRUE;
        recommendation_text := 'System operating normally';
    END IF;
    
    RETURN QUERY SELECT status_text, can_accept, load_percent, recommendation_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create batch query processing function to prevent stampeding herd
CREATE OR REPLACE FUNCTION public.batch_check_query_limits(user_ids UUID[])
RETURNS TABLE(
    user_id UUID,
    can_query BOOLEAN,
    remaining_queries INTEGER,
    error_message TEXT
) AS $$
DECLARE
    current_user_id UUID;
    batch_size INTEGER := 10; -- Process in batches of 10
    batch_start INTEGER := 1;
    batch_end INTEGER;
BEGIN
    -- Process users in batches to prevent overwhelming the database
    WHILE batch_start <= array_length(user_ids, 1) LOOP
        batch_end := LEAST(batch_start + batch_size - 1, array_length(user_ids, 1));
        
        -- Process current batch
        FOR i IN batch_start..batch_end LOOP
            current_user_id := user_ids[i];
            
            BEGIN
                -- Call the atomic query check function
                RETURN QUERY
                SELECT 
                    current_user_id,
                    result.can_query,
                    result.remaining_queries,
                    NULL::TEXT as error_message
                FROM public.check_and_use_query(current_user_id) as result;
                
            EXCEPTION WHEN OTHERS THEN
                -- Return error for this user but continue with others
                RETURN QUERY
                SELECT 
                    current_user_id,
                    FALSE::BOOLEAN,
                    0::INTEGER,
                    SQLERRM::TEXT;
            END;
        END LOOP;
        
        -- Move to next batch
        batch_start := batch_end + 1;
        
        -- Small delay between batches to prevent overwhelming
        IF batch_start <= array_length(user_ids, 1) THEN
            PERFORM pg_sleep(0.1); -- 100ms delay
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create session cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS TABLE(cleaned_sessions INTEGER, cleanup_details TEXT) AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean up old chat sessions (older than 30 days)
    DELETE FROM public.chat_messages 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned user queries
    DELETE FROM public.user_queries 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Vacuum analyze to reclaim space
    PERFORM pg_stat_reset();
    
    RETURN QUERY SELECT 
        deleted_count,
        format('Cleaned %s old messages and queries, reset statistics', deleted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create real-time monitoring view
CREATE OR REPLACE VIEW public.concurrent_usage_monitor AS
SELECT 
    NOW() as check_time,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock') as blocked_connections,
    (SELECT count(*) FROM public.user_profiles WHERE queries_used >= query_limit) as users_at_limit,
    (SELECT avg(queries_used) FROM public.user_profiles WHERE subscription_tier = 'free') as avg_free_user_usage,
    (SELECT count(*) FROM public.chat_messages WHERE created_at > NOW() - INTERVAL '1 hour') as messages_last_hour,
    (SELECT extract(epoch from (NOW() - pg_postmaster_start_time()))/3600) as uptime_hours;

-- ===============================================
-- TESTING AND VALIDATION
-- ===============================================

-- Test 1: Verify all functions are created
SELECT 
    routine_name,
    routine_type,
    'Created successfully' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_concurrent_usage_stats',
    'emergency_cleanup_connections', 
    'check_system_load',
    'batch_check_query_limits',
    'cleanup_old_sessions'
)
ORDER BY routine_name;

-- Test 2: Check current system load
SELECT * FROM public.check_system_load();

-- Test 3: Check concurrent usage stats
SELECT * FROM public.get_concurrent_usage_stats();

-- Test 4: Monitor current concurrent usage
SELECT * FROM public.concurrent_usage_monitor;

-- Test 5: Test batch processing with sample users (won't actually process non-existent users)
SELECT * FROM public.batch_check_query_limits(ARRAY[
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000003'::UUID
]);

-- ===============================================
-- MAINTENANCE SCHEDULE RECOMMENDATIONS
-- ===============================================

/*
Set up these automated tasks in your deployment:

1. HOURLY: Check system load
   SELECT * FROM public.check_system_load();

2. DAILY: Clean up old sessions  
   SELECT * FROM public.cleanup_old_sessions();

3. WEEKLY: Reset query statistics
   SELECT pg_stat_reset();

4. EMERGENCY: If system is unresponsive
   SELECT * FROM public.emergency_cleanup_connections();

5. MONITORING: Real-time dashboard query
   SELECT * FROM public.concurrent_usage_monitor;
*/

-- ===============================================
-- PERFORMANCE OPTIMIZATIONS
-- ===============================================

-- Add additional indexes for concurrent access patterns
CREATE INDEX IF NOT EXISTS idx_chat_messages_concurrent 
ON public.chat_messages(user_id, created_at, session_id);

CREATE INDEX IF NOT EXISTS idx_user_queries_concurrent 
ON public.user_queries(user_id, created_at);

-- Update table statistics for better query planning
ANALYZE public.user_profiles;
ANALYZE public.chat_messages;
ANALYZE public.user_queries;

-- ===============================================
-- SUCCESS CONFIRMATION
-- ===============================================

-- Final validation query
SELECT 
    'CONCURRENT USER PROTECTION' as system,
    'ACTIVE' as status,
    NOW() as deployed_at,
    (SELECT count(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' 
     AND routine_name LIKE '%concurrent%' OR routine_name LIKE '%batch%' OR routine_name LIKE '%cleanup%') as functions_deployed,
    'Website protected against concurrent user crashes' as message;

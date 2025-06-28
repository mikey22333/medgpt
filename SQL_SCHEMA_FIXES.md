# SQL Schema Fixes - MedGPT Scholar

## Issues Resolved

### 1. RLS Policy Duplicate Creation
**Issue**: SQL errors due to attempting to create RLS policies that already exist.

**Solution**: Implemented conditional policy creation using PostgreSQL's `DO $$ ... IF NOT EXISTS ... END $$;` pattern for both `user_queries` and `user_profiles` tables.

```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON public.user_profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;
    -- ... additional policies
END $$;
```

### 2. Column Addition Before Table Creation
**Issue**: `ALTER TABLE` command attempting to add `last_reset_date` column before the table was created.

**Solution**: Moved the table creation (`CREATE TABLE IF NOT EXISTS`) before the column addition (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

### 4. Manual Query Limit Control Issues
**Issue**: Manual changes to `queries_used` and `query_limit` in Supabase database not reflecting in the application.

**Root Causes**:
- Frontend infinite polling loop interfering with API calls
- Missing fallback mechanisms in API routes
- Insufficient error handling and debugging
- RPC function not handling edge cases (missing profiles, null dates)

**Solution**: Comprehensive debugging and fallback system implemented:

```typescript
// Added fallback to direct database query if RPC fails
const { data: rpcData, error: rpcError } = await supabase
  .rpc('check_query_limit', { user_uuid: user.id });

if (rpcError) {
  // Fallback to direct query with manual calculation
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('query_limit, queries_used, last_reset_date, subscription_tier')
    .eq('id', user.id)
    .single();
  // ... manual calculation logic
}
```

**Additional Fixes**:
- Added comprehensive logging to API routes
- Created debug page at `/debug` for troubleshooting
- Added force refresh functionality
- Enhanced RPC function with null checking and profile creation
- Added visual debug indicators in main UI

## Current Schema Structure

### Tables
1. **user_queries** - Tracks user chat queries and responses
2. **user_profiles** - User profile data including subscription and query limits

### Key Features
- Row Level Security (RLS) enabled on both tables
- Conditional policy creation to prevent duplicates
- Daily query limit reset functionality
- Stripe integration fields for subscriptions
- Automatic user profile creation on signup

### Functions
1. **handle_new_user()** - Creates user profile on auth signup
2. **increment_query_count()** - Increments user query count with daily reset
3. **check_query_limit()** - Checks if user can make queries (with daily reset)

## Deployment Notes
- The schema is now safe to run multiple times without errors
- Existing installations will have the `last_reset_date` column added safely
- All RLS policies are created conditionally to prevent conflicts

## Status
✅ **RESOLVED**: All SQL schema duplicate creation errors fixed
✅ **TESTED**: Schema can be applied multiple times safely
✅ **PRODUCTION READY**: Safe for deployment to Supabase

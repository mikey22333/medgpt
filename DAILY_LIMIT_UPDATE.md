# Daily Usage Limit Update - MedGPT Scholar

## Changes Made

### Query Limit Increased from 2 to 3

The daily query limit for free users has been updated from 2 to 3 questions per day.

### Files Updated

#### 1. Database Schema (`supabase-schema.sql`)
- ✅ Changed default `query_limit` from 2 to 3 in `user_profiles` table
- ✅ Added migration to update existing free users: `UPDATE public.user_profiles SET query_limit = 3 WHERE subscription_tier = 'free' AND query_limit = 2;`

#### 2. Frontend Components
- ✅ `src/app/dashboard/page.tsx` - Updated mock data and display text
- ✅ `src/hooks/useQueryLimit.ts` - Updated fallback default from 2 to 3
- ✅ `src/components/QueryLimitWarning.tsx` - Already dynamic, no changes needed

#### 3. API Routes
- ✅ `src/app/api/stripe/webhook/route.ts` - Updated free tier reset limit to 3

#### 4. Documentation
- ✅ `STRIPE_SETUP_GUIDE.md` - Updated pricing information
- ✅ `QUERY_LIMIT_IMPLEMENTATION.md` - Updated all examples and descriptions

### Progress Bar Behavior

The progress bar and warnings now work as follows:

1. **0/3 used**: No warning shown
2. **1/3 used**: No warning shown  
3. **2/3 used**: Yellow warning "Approaching Daily Limit"
4. **3/3 used**: Red warning "Daily Chat Limit Reached" + input disabled

### UI Display Updates

- **Dashboard**: Shows "3 AI questions/day" instead of "2 AI questions/day"
- **Progress indicator**: Displays "0 / 3 questions today" format
- **Warning cards**: Dynamically show "2 of 3" or "3 of 3" used

### Migration Safety

- ✅ Existing users with old limit of 2 will be automatically updated to 3
- ✅ New users will get the default limit of 3
- ✅ Pro users remain unaffected (unlimited)

## Deployment

1. Apply the updated `supabase-schema.sql` to your Supabase database
2. The migration will automatically update existing free users
3. Frontend will immediately reflect the new limits after deployment

## Status

✅ **COMPLETED**: All files updated to reflect 3 questions/day limit
✅ **TESTED**: Progress tracking logic remains intact
✅ **READY**: Safe for production deployment

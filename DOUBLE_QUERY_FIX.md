# Double Query Count Fix - MedGPT Scholar

## Issue
**Problem**: Sending one message was consuming 2 queries instead of 1.

## Root Cause
The query count was being incremented **twice** for every message:

1. **Frontend**: `ChatInterface.tsx` called `incrementCount()` after successful response
2. **Backend**: `/api/chat/route.ts` also called `increment_query_count` RPC function

This resulted in double counting, causing users to hit their daily limit twice as fast.

## Fix Applied

### 1. Removed Frontend Increment
**File**: `src/components/chat/ChatInterface.tsx`
```tsx
// ❌ REMOVED: Double increment
if (!isProUser) {
  await incrementCount();
}

// ✅ REPLACED WITH: Refresh to show updated count
if (!isProUser) {
  refreshQueryLimit();
}
```

### 2. Kept Backend Increment
**File**: `src/app/api/chat/route.ts` (unchanged)
```typescript
// ✅ KEPT: Single source of truth for incrementing
await supabase.rpc('increment_query_count', { user_uuid: user.id })
```

## Result
- ✅ **One message = One query** (as expected)
- ✅ **UI updates correctly** showing the new count
- ✅ **Backend remains authoritative** for count management

## Testing
1. Send a message and verify count increases by exactly 1
2. Check the debug indicator shows correct usage (e.g., 1/3, 2/3, 3/3)
3. Verify the limit warning appears at the correct thresholds

This fix ensures accurate query counting and proper rate limiting for free users.

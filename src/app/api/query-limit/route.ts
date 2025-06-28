import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Query limit API called');
    
    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check:', { user: user?.id, authError });

    if (authError) {
      console.log('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    console.log('Checking query limit for user:', user.id);

    // First try the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_query_limit', { user_uuid: user.id });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      
      // Fallback to direct database query
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('query_limit, queries_used, last_reset_date, subscription_tier')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile query error:', profileError);
        return NextResponse.json(
          { error: 'Failed to check query limit' },
          { status: 500 }
        );
      }

      console.log('Profile data (fallback):', profile);

      // Manual calculation
      const today = new Date().toISOString().split('T')[0];
      const resetNeeded = profile.last_reset_date < today;
      
      let queriesUsed = profile.queries_used;
      if (resetNeeded) {
        queriesUsed = 0;
        // Update the reset date
        await supabase
          .from('user_profiles')
          .update({ 
            queries_used: 0, 
            last_reset_date: today 
          })
          .eq('id', user.id);
      }

      const canChat = profile.subscription_tier === 'pro' || queriesUsed < profile.query_limit;
      
      const result = {
        can_chat: canChat,
        queries_used: queriesUsed,
        query_limit: profile.query_limit,
        subscription_tier: profile.subscription_tier,
        time_until_reset_hours: 24 - new Date().getHours(),
        reset_needed: resetNeeded
      };

      console.log('Manual calculation result:', result);
      return NextResponse.json(result);
    }

    console.log('Query limit result:', rpcData);
    return NextResponse.json(rpcData);

  } catch (error) {
    console.error('Query limit check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Increment query count using the database function
    const { error } = await supabase
      .rpc('increment_query_count', { user_uuid: user.id });

    if (error) {
      console.error('Error incrementing query count:', error);
      return NextResponse.json(
        { error: 'Failed to increment query count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Query count increment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

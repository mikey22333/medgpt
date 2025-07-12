import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Simple chat endpoint called');
    
    const body = await request.json();
    console.log('🔍 [DEBUG] Request body:', body);
    
    // Test 1: Check if we can create supabase client
    console.log('🔍 [DEBUG] Creating Supabase client...');
    const supabase = await createClient();
    console.log('🔍 [DEBUG] Supabase client created successfully');
    
    // Test 2: Check authentication
    console.log('🔍 [DEBUG] Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 [DEBUG] Auth result:', { user: !!user, error: authError?.message });
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", details: authError?.message },
        { status: 401 }
      );
    }
    
    // Test 3: Check query limit
    console.log('🔍 [DEBUG] Checking query limit...');
    const { data: limitCheck, error: limitError } = await supabase.rpc('check_query_limit', {
      user_uuid: user.id
    });
    console.log('🔍 [DEBUG] Query limit result:', { limitCheck, limitError: limitError?.message });
    
    if (limitError) {
      return NextResponse.json(
        { error: "Failed to check query limit", details: limitError.message },
        { status: 500 }
      );
    }
    
    if (!limitCheck || !limitCheck.can_chat) {
      return NextResponse.json(
        { error: "Query limit exceeded", details: limitCheck },
        { status: 429 }
      );
    }
    
    // Test 4: Return simple response
    console.log('🔍 [DEBUG] All checks passed, returning response');
    
    return NextResponse.json({
      message: {
        id: Date.now().toString(),
        role: "assistant",
        content: "This is a test response from the simplified chat endpoint.",
        timestamp: new Date(),
        citations: [],
      },
      metadata: {
        test: true,
        user_id: user.id
      }
    });
    
  } catch (error) {
    console.error("🔍 [DEBUG] Error in simple chat endpoint:", error);
    console.error("🔍 [DEBUG] Error stack:", error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

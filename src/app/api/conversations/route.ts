import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode");

    // Build query
    let query = supabase
      .from('chat_messages')
      .select('session_id, mode, content, created_at')
      .eq('user_id', user.id)
      .eq('role', 'user') // Only get user messages for preview
      .order('created_at', { ascending: false });

    // Filter by mode if specified
    if (mode && mode !== 'all') {
      query = query.eq('mode', mode);
    }

    const { data: messages, error } = await query.limit(100); // Limit to recent 100 conversations

    if (error) {
      console.error('Failed to load conversations:', error);
      return NextResponse.json(
        { error: "Failed to load conversations" },
        { status: 500 }
      );
    }

    // Group by session_id and get the latest message for each session
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const sessionId = message.session_id;
      if (!conversationMap.has(sessionId) || 
          new Date(message.created_at) > new Date(conversationMap.get(sessionId).created_at)) {
        conversationMap.set(sessionId, {
          sessionId: sessionId,
          mode: message.mode,
          preview: message.content.slice(0, 100) + (message.content.length > 100 ? '...' : ''),
          lastActivity: message.created_at,
          title: message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
        });
      }
    });

    // Convert to array and sort by last activity
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

    return NextResponse.json({
      conversations,
      total: conversations.length
    });

  } catch (error) {
    console.error("Load conversations error:", error);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

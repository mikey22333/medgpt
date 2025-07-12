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

    // Get all messages for this user
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (msgError) {
      return NextResponse.json(
        { error: msgError.message },
        { status: 500 }
      );
    }

    // Group by session
    const sessionGroups = new Map<string, any[]>();
    for (const message of messages || []) {
      const sessionId = message.session_id;
      if (!sessionGroups.has(sessionId)) {
        sessionGroups.set(sessionId, []);
      }
      sessionGroups.get(sessionId)!.push(message);
    }

    const result = {
      user_id: user.id,
      total_messages: messages?.length || 0,
      sessions: Array.from(sessionGroups.entries()).map(([sessionId, msgs]) => ({
        session_id: sessionId,
        message_count: msgs.length,
        modes: [...new Set(msgs.map(m => m.mode))],
        roles: msgs.map(m => m.role),
        first_message: msgs[msgs.length - 1]?.content?.slice(0, 100),
        last_message: msgs[0]?.content?.slice(0, 100)
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

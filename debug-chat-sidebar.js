// Test script to debug chat sidebar issues
// Run this in the browser console on the chat page

async function debugChatSidebar() {
  console.log('=== Chat Sidebar Debug ===');
  
  // Check if user is authenticated
  const { createClient } = await import('/src/lib/supabase/client.js');
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('1. User auth:', { user: user?.id, error: authError });
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  
  // Check raw database content
  console.log('2. Querying raw database...');
  const { data: rawMessages, error: rawError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('Raw messages:', { count: rawMessages?.length || 0, error: rawError, messages: rawMessages });
  
  // Check what getUserConversations returns
  console.log('3. Testing getUserConversations...');
  const { chatClient } = await import('/src/lib/supabase/chat.js');
  const conversations = await chatClient.getUserConversations(user.id);
  console.log('getUserConversations result:', conversations);
  
  // Check total counts
  const totalConversations = Object.values(conversations).reduce((sum, arr) => sum + arr.length, 0);
  console.log('Total conversations found:', totalConversations);
  
  // Check if there are any unique session IDs
  if (rawMessages && rawMessages.length > 0) {
    const sessionIds = [...new Set(rawMessages.map(m => m.session_id))];
    console.log('Unique session IDs:', sessionIds);
    
    // Check what's in each session
    for (const sessionId of sessionIds.slice(0, 3)) { // Check first 3 sessions
      const sessionMessages = rawMessages.filter(m => m.session_id === sessionId);
      console.log(`Session ${sessionId}:`, {
        messageCount: sessionMessages.length,
        roles: sessionMessages.map(m => m.role),
        hasUserMessages: sessionMessages.some(m => m.role === 'user'),
        hasAssistantMessages: sessionMessages.some(m => m.role === 'assistant'),
        firstMessage: sessionMessages[0]?.content?.slice(0, 100)
      });
    }
  }
}

debugChatSidebar().catch(console.error);

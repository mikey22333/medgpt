// Simple test to check database content
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytwbkdgxdmwwmqjqwzgp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0d2JrZGd4ZG13d21xanF3emdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MzUzMTksImV4cCI6MjA1MjExMTMxOX0.uVJ4ZJ6LdPKdOSvl28xYgqzZBfNbHT8oqMFbYf5VDNs';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('chat_messages')
      .select('count')
      .single();
    
    console.log('Connection test:', { data, error });
    
    // Get recent messages
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Recent messages:', { count: messages?.length || 0, error: msgError });
    
    if (messages && messages.length > 0) {
      console.log('Sample message:', messages[0]);
      
      // Group by user
      const userGroups = messages.reduce((acc, msg) => {
        if (!acc[msg.user_id]) acc[msg.user_id] = [];
        acc[msg.user_id].push(msg);
        return acc;
      }, {});
      
      console.log('Users with messages:', Object.keys(userGroups));
      
      // Check each user
      for (const [userId, userMessages] of Object.entries(userGroups)) {
        console.log(`User ${userId}:`, {
          messageCount: userMessages.length,
          sessions: [...new Set(userMessages.map(m => m.session_id))],
          roles: userMessages.map(m => m.role)
        });
      }
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();

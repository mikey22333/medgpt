// Quick test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  // This would need actual env vars, but let's see if we can at least create the client
  try {
    console.log('Testing Supabase connection...');
    
    // Try to get current user (this will help us see if auth is working)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'test',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test'
    );
    
    const { data, error } = await supabase.auth.getUser();
    console.log('Auth check result:', { data, error });
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();

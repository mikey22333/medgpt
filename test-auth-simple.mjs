// Test the authentication and query limit functions directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testAuth = async () => {
  console.log('Testing authentication...');
  
  // This will fail because we don't have a valid session
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Auth result:', { user: !!user, error: error?.message });
  
  // Test the query limit function with a dummy UUID
  const dummyUUID = '00000000-0000-0000-0000-000000000000';
  try {
    const { data, error } = await supabase.rpc('check_query_limit', {
      user_uuid: dummyUUID
    });
    console.log('Query limit test result:', { data, error: error?.message });
  } catch (err) {
    console.error('Query limit test error:', err);
  }
};

testAuth();

// Test script to check database content
const { createClient } = require('@supabase/supabase-js');

// Hardcode the environment variables for testing
const SUPABASE_URL = 'https://ofhmivuynqpgfhsusdhv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maG1pdnV5bnFwZ2Zoc3VzZGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwOTQzNzQsImV4cCI6MjA1MTY3MDM3NH0.V5bqp46TYLmEhMJVbHOXoADCGWyv0ckXMW3nLZpS_nc';

async function testDatabaseContent() {
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  console.log('Testing database content...');

  try {
    // Check if table exists and get all records
    const { data: allRecords, error: allError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(10);

    console.log('All chat_messages (first 10):', allRecords);
    console.log('Error:', allError);

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('chat_messages')
      .select('session_id, mode, role, content, created_at, user_id')
      .limit(5);

    console.log('Table structure test:', tableInfo);
    console.log('Table error:', tableError);

    // Try to get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    console.log('User error:', userError);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testDatabaseContent();

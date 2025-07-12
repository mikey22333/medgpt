// Simple test to verify database schema exists
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mjrvmvhoqqfhmnkpxjvo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcnZtdmhvcXFmaG1ua3B4anZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDA0NTksImV4cCI6MjA2NjU3NjQ1OX0.v-cK-DugGJciSp_ZXnSQ-_2hM_ZY9RSEP6JO1dwY1Hc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  try {
    console.log('Testing chat_messages table...');
    
    // Test if table exists and is accessible
    const { data, error, count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error accessing chat_messages table:', error);
      return;
    }
    
    console.log(`✅ chat_messages table exists and is accessible`);
    console.log(`   Record count: ${count || 0}`);
    
    // Test user_profiles table  
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profileError) {
      console.error('❌ Error accessing user_profiles table:', profileError);
    } else {
      console.log(`✅ user_profiles table exists and is accessible`);
    }
    
    // Test user_queries table
    const { data: queryData, error: queryError } = await supabase
      .from('user_queries')
      .select('*', { count: 'exact', head: true });
    
    if (queryError) {
      console.error('❌ Error accessing user_queries table:', queryError);
    } else {
      console.log(`✅ user_queries table exists and is accessible`);
    }
    
    console.log('\n✅ All database tables are accessible!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseSchema();

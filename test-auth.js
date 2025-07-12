// Quick test to verify authentication issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mjrvmvhoqqfhmnkpxjvo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcnZtdmhvcXFmaG1ua3B4anZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDA0NTksImV4cCI6MjA2NjU3NjQ1OX0.v-cK-DugGJciSp_ZXnSQ-_2hM_ZY9RSEP6JO1dwY1Hc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    console.log('Session data:', data);
    console.log('Error:', error);
    
    if (!data.session) {
      console.log('❌ No active session - this is why chat is not working');
      console.log('✅ Solution: Log in at http://localhost:3000/auth/login');
    } else {
      console.log('✅ Active session found');
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAuth();

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('chat_messages')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
    } else {
      console.log('✅ Database connection successful');
      console.log('Chat messages table exists and is accessible');
    }
    
    // Test table structure
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'chat_messages' })
      .single();
    
    if (schemaError) {
      console.log('⚠️  Could not get table schema (this is normal if the function doesn\'t exist)');
    } else {
      console.log('Table schema:', schema);
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();

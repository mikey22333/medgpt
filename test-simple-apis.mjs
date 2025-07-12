// Simple API test
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTogetherAI() {
  try {
    console.log('Testing Together AI API...');
    const response = await fetch('https://api.together.xyz/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Together AI API is working');
      return true;
    } else {
      console.log('❌ Together AI API failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Together AI API error:', error.message);
    return false;
  }
}

async function testPubMed() {
  try {
    console.log('Testing PubMed API...');
    const response = await fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=diabetes&retmode=json&retmax=1');
    
    if (response.ok) {
      const data = await response.json();
      if (data.esearchresult && data.esearchresult.idlist.length > 0) {
        console.log('✅ PubMed API is working');
        return true;
      }
    }
    console.log('❌ PubMed API failed');
    return false;
  } catch (error) {
    console.log('❌ PubMed API error:', error.message);
    return false;
  }
}

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase API is working');
      return true;
    } else {
      console.log('❌ Supabase API failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase API error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing all APIs...\n');
  
  const results = await Promise.all([
    testTogetherAI(),
    testPubMed(),
    testSupabase()
  ]);
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} APIs working`);
  
  if (passed === total) {
    console.log('🎉 All APIs are working! The issue is likely authentication.');
  } else {
    console.log('⚠️  Some APIs are not working. Check your environment variables.');
  }
}

runTests().catch(console.error);

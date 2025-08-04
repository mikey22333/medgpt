// Test the Semantic Scholar API directly
const fetch = require('node-fetch');

async function testSemanticScholarDirect() {
  console.log('🔬 Testing Semantic Scholar API directly...\n');
  
  const query = 'diabetes treatment';
  const limit = 5;
  
  const params = new URLSearchParams({
    query: query,
    limit: limit.toString(),
    fields: "paperId,title,abstract,authors,venue,year,url,citationCount,doi",
  });

  const url = `https://api.semanticscholar.org/graph/v1/paper/search?${params}`;
  console.log('🌐 URL:', url);
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📝 Status Text:', response.statusText);
    console.log('🔗 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ SUCCESS! Response structure:');
    console.log('- Data length:', data.data?.length || 0);
    console.log('- Total available:', data.total || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📄 Sample papers:');
      data.data.slice(0, 2).forEach((paper, i) => {
        console.log(`\n${i + 1}. ${paper.title}`);
        console.log(`   Authors: ${paper.authors?.map(a => a.name).join(', ') || 'N/A'}`);
        console.log(`   Year: ${paper.year || 'N/A'}`);
        console.log(`   Citations: ${paper.citationCount || 0}`);
      });
    } else {
      console.log('\n⚠️  No papers returned in data array');
    }
    
  } catch (error) {
    console.log('❌ Network/Parse Error:', error.message);
  }
}

testSemanticScholarDirect();

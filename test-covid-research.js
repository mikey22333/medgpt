// Test COVID-19 research functionality using built-in fetch
async function testCovidResearch() {
  try {
    console.log('🧪 Testing COVID-19 Long-term Effects Research...\n');
    
    const query = "long-term effects of COVID-19 on various organ systems";
    console.log(`Query: ${query}`);
    
    // Try to reach the API endpoint
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        maxResults: 5,
        includeAbstracts: true
      })
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error response: ${errorText}`);
      return;
    }

    const data = await response.json();
    
    console.log(`\n📊 Research Results:`);
    console.log(`Total papers found: ${data.papers?.length || 0}`);
    
    if (data.papers && data.papers.length > 0) {
      console.log(`\n📑 Top 3 Papers:`);
      data.papers.slice(0, 3).forEach((paper, index) => {
        console.log(`\n${index + 1}. ${paper.title}`);
        console.log(`   Journal: ${paper.journal || 'Unknown'}`);
        console.log(`   Relevance: ${paper.relevanceScore || 'Unknown'}`);
      });
      
      // Check if papers are actually COVID-19 related
      const covidPapers = data.papers.filter(paper => 
        paper.title?.toLowerCase().includes('covid') || 
        paper.title?.toLowerCase().includes('sars-cov-2') ||
        paper.abstract?.toLowerCase().includes('covid')
      );
      
      console.log(`\n✅ COVID-19 related papers: ${covidPapers.length}/${data.papers.length}`);
      
      if (covidPapers.length === 0) {
        console.log(`\n❌ WARNING: No COVID-19 papers found! System may be returning irrelevant results.`);
        console.log(`\nFirst paper title: ${data.papers[0]?.title || 'None'}`);
      } else {
        console.log(`\n✅ SUCCESS: Found relevant COVID-19 papers!`);
      }
      
    } else {
      console.log(`\n❌ No papers found`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('fetch is not defined')) {
      console.log('\n💡 Fetch not available in this Node.js version. Need to test via browser or server logs.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the development server is running with: npm run dev');
    }
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('❌ Fetch not available in this Node.js environment');
  console.log('💡 Please test the research endpoint manually or check server logs');
  console.log('💡 Query to test: "long-term effects of COVID-19 on various organ systems"');
} else {
  // Run the test
  testCovidResearch();
}

const testDetailed = async () => {
  try {
    console.log('🧪 Testing Detailed API Integration...');
    
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'diabetes treatment',
        sessionId: 'test-session-2',
        mode: 'research'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Response received for diabetes treatment');
    
    // Check sources used
    console.log('\n📚 Sources Found:');
    if (data.citations) {
      const sourceStats = {};
      data.citations.forEach(citation => {
        sourceStats[citation.source] = (sourceStats[citation.source] || 0) + 1;
      });
      
      Object.entries(sourceStats).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} papers`);
      });
      console.log(`\n📊 Total papers: ${data.citations.length}`);
      console.log(`📊 Unique sources: ${Object.keys(sourceStats).length}`);
      
      // List all expected sources
      const expectedSources = [
        'PubMed', 'CrossRef', 'Semantic Scholar', 'FDA', 'Europe PMC', 
        'OpenAlex', 'Cochrane Library', 'Trip Database', 'ClinicalTrials.gov', 
        'Clinical Guidelines', 'NIH RePORTER'
      ];
      
      console.log('\n🔍 Missing Sources:');
      expectedSources.forEach(source => {
        if (!sourceStats[source]) {
          console.log(`   ❌ ${source}`);
        } else {
          console.log(`   ✅ ${source}`);
        }
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
};

// Run the test
testDetailed();

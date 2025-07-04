// Comprehensive test of all free APIs and the main research endpoint
const fetch = require('node-fetch');

async function testMainResearchAPI() {
  try {
    console.log('🔬 Testing main research API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'migraine treatment'
      })
    });
    
    if (!response.ok) {
      console.error('❌ Research API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Research API Response:', {
      citationsCount: data.citations?.length || 0,
      sourceBreakdown: data.citations?.reduce((acc, citation) => {
        acc[citation.source] = (acc[citation.source] || 0) + 1;
        return acc;
      }, {}) || {}
    });
    
    // Check for DOAJ results specifically
    const doajCitations = data.citations?.filter(c => c.source === 'DOAJ') || [];
    console.log('📂 DOAJ citations found:', doajCitations.length);
    
    if (doajCitations.length > 0) {
      console.log('📄 Sample DOAJ citation:', {
        title: doajCitations[0].title,
        journal: doajCitations[0].journal,
        year: doajCitations[0].year,
        doi: doajCitations[0].doi
      });
    }
    
    // Check for bioRxiv/medRxiv results
    const biorxivCitations = data.citations?.filter(c => c.source === 'bioRxiv/medRxiv') || [];
    console.log('📄 bioRxiv/medRxiv citations found:', biorxivCitations.length);
    
  } catch (error) {
    console.error('💥 Research API test failed:', error.message);
  }
}

async function testDOAJDirectly() {
  try {
    console.log('\n🔬 Testing DOAJ API directly...');
    
    const response = await fetch('https://doaj.org/api/search/articles/migraine treatment?pageSize=5');
    
    if (!response.ok) {
      console.error('❌ DOAJ direct test failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ DOAJ direct response:', {
      total: data.total,
      resultsCount: data.results?.length || 0
    });
    
    if (data.results?.length > 0) {
      console.log('📄 First DOAJ result:', {
        title: data.results[0].bibjson?.title || 'No title',
        journal: data.results[0].bibjson?.journal?.title || 'No journal',
        year: data.results[0].bibjson?.year || 'No year'
      });
    }
    
  } catch (error) {
    console.error('💥 DOAJ direct test failed:', error.message);
  }
}

async function testBioRxivDirectly() {
  try {
    console.log('\n🔬 Testing bioRxiv API directly...');
    
    const response = await fetch('https://api.biorxiv.org/details/medrxiv/2024-01-01/2024-12-31');
    
    if (!response.ok) {
      console.error('❌ bioRxiv direct test failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ bioRxiv direct response:', {
      total: data.messages?.[0]?.count || 0,
      resultsCount: data.collection?.length || 0
    });
    
    if (data.collection?.length > 0) {
      // Look for migraine-related preprints
      const migrainePapers = data.collection.filter(paper => 
        paper.title?.toLowerCase().includes('migraine') ||
        paper.abstract?.toLowerCase().includes('migraine')
      );
      
      console.log('📄 Migraine-related preprints found:', migrainePapers.length);
      
      if (migrainePapers.length > 0) {
        console.log('📄 First migraine preprint:', {
          title: migrainePapers[0].title,
          date: migrainePapers[0].date,
          authors: migrainePapers[0].authors
        });
      }
    }
    
  } catch (error) {
    console.error('💥 bioRxiv direct test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Running comprehensive API tests...\n');
  
  await testDOAJDirectly();
  await testBioRxivDirectly();
  await testMainResearchAPI();
  
  console.log('\n✅ All tests completed!');
}

runAllTests();

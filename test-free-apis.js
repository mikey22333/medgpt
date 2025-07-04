// Test the new free APIs directly
async function testDOAJ() {
  try {
    console.log('🔬 Testing DOAJ API (v4)...');
    
    // Test the correct v4 endpoint
    const endpoint = 'https://doaj.org/api/search/articles/migraine?pageSize=3';
    console.log(`Testing: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MedGPT-Scholar/1.0'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ DOAJ Response:', {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        resultsFound: data.results?.length || 0
      });
      
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        console.log('📄 First DOAJ result:', {
          title: firstResult.bibjson?.title || 'No title',
          journal: firstResult.bibjson?.journal?.title || 'No journal',
          year: firstResult.bibjson?.year || 'No year',
          authors: firstResult.bibjson?.author?.map(a => a.name).slice(0, 3) || [],
          doi: firstResult.bibjson?.identifier?.find(id => id.type === 'doi')?.id || 'No DOI'
        });
      }
    } else {
      console.log('❌ DOAJ Error:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('💥 DOAJ test failed:', error.message);
  }
}

async function testBioRxiv() {
  try {
    console.log('🔬 Testing bioRxiv API directly...');
    
    const response = await fetch('https://api.biorxiv.org/details/medrxiv/2024-01-01/2024-06-30', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MedGPT-Scholar/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('❌ bioRxiv API failed:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('✅ bioRxiv Response:', {
      total: data.messages?.[0]?.count || 0,
      resultsFound: data.collection?.length || 0
    });
    
    if (data.collection && data.collection.length > 0) {
      // Filter for migraine-related preprints
      const migrainerPreprints = data.collection.filter(preprint => 
        preprint.title?.toLowerCase().includes('migraine') ||
        preprint.abstract?.toLowerCase().includes('migraine')
      );
      
      console.log('📄 Migraine-related preprints found:', migrainerPreprints.length);
      if (migrainerPreprints.length > 0) {
        console.log('📄 Sample migraine preprint:', migrainerPreprints[0].title);
      }
    }
    
  } catch (error) {
    console.error('💥 bioRxiv test failed:', error.message);
  }
}

async function runAllTests() {
  await testDOAJ();
  console.log('');
  await testBioRxiv();
}

runAllTests();

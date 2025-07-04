const testOpenAlexIntegration = async () => {
  try {
    console.log('Testing OpenAlex integration in MedGPT Scholar...');
    
    // Test direct API call to see what papers are found
    const response = await fetch('http://localhost:3002/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: 'migraine treatment clinical trial',
        sessionId: 'openalex-debug-session',
        mode: 'research'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('\n=== OPENALEX INTEGRATION TEST ===');
    console.log('Total papers analyzed:', data.response.includes('papers analyzed') ? 
      data.response.match(/(\d+) papers analyzed/)[1] : 'unknown');
    console.log('Total citations returned:', data.citations ? data.citations.length : 0);
    
    // Group citations by source
    const citationsBySource = {};
    if (data.citations) {
      data.citations.forEach(citation => {
        if (!citationsBySource[citation.source]) {
          citationsBySource[citation.source] = [];
        }
        citationsBySource[citation.source].push(citation);
      });
    }
    
    console.log('\n=== CITATIONS BY SOURCE ===');
    Object.keys(citationsBySource).forEach(source => {
      console.log(`${source}: ${citationsBySource[source].length} citations`);
    });
    
    // Check if OpenAlex is in the list
    if (citationsBySource['OpenAlex']) {
      console.log('\n✅ OpenAlex citations found:');
      citationsBySource['OpenAlex'].forEach((citation, index) => {
        console.log(`  ${index + 1}. ${citation.title.substring(0, 60)}...`);
      });
    } else {
      console.log('\n❌ No OpenAlex citations found in final results');
      console.log('This suggests OpenAlex papers are being filtered out');
    }
    
    // Check the response for OpenAlex mention
    if (data.response.includes('OpenAlex')) {
      console.log('\n✅ OpenAlex mentioned in response');
    } else {
      console.log('\n❌ OpenAlex not mentioned in response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testOpenAlexIntegration();

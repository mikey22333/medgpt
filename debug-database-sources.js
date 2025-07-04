const testIndividualDatabases = async () => {
  try {
    const response = await fetch('http://localhost:3004/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: 'migraine treatment prevention',
        sessionId: 'pubmed-test-456',
        mode: 'research'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('=== DATABASE SOURCE ANALYSIS ===');
    console.log('Total citations:', data.citations ? data.citations.length : 0);
    console.log('Total papers analyzed:', data.response.includes('papers analyzed') ? 
      data.response.match(/(\d+) papers analyzed/)[1] : 'unknown');
    
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
    
    console.log('\n=== CITATIONS BY DATABASE SOURCE ===');
    Object.keys(citationsBySource).forEach(source => {
      console.log(`\n${source}: ${citationsBySource[source].length} citations`);
      citationsBySource[source].forEach((citation, index) => {
        console.log(`  ${index + 1}. ${citation.title.substring(0, 80)}...`);
      });
    });
    
    // Check which databases should be returning results
    console.log('\n=== EXPECTED DATABASES ===');
    const expectedDatabases = [
      'PubMed',
      'Semantic Scholar', 
      'Europe PMC',
      'OpenAlex',
      'CrossRef',
      'FDA',
      'DOAJ',
      'bioRxiv',
      'ClinicalTrials.gov',
      'Clinical Guidelines',
      'NIH RePORTER'
    ];
    
    expectedDatabases.forEach(db => {
      const hasResults = citationsBySource[db] && citationsBySource[db].length > 0;
      console.log(`${db}: ${hasResults ? '✅ Has results' : '❌ No results'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testIndividualDatabases();

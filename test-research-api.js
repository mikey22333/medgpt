// Test the research API endpoint specifically for PubMed
async function testResearchAPI() {
  try {
    console.log('🔬 Testing research API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'migraine treatment',
        sessionId: 'test-session',
        mode: 'research'
      })
    });
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log('  - Response type:', typeof data);
    
    if (data.error) {
      console.error('❌ API error:', data.error);
      return;
    }
    
    if (data.answer) {
      console.log('  - Answer length:', data.answer.length);
      console.log('  - Answer preview:', data.answer.substring(0, 200) + '...');
      
      // Check if PubMed is mentioned
      if (data.answer.includes('PubMed')) {
        console.log('✅ PubMed mentioned in response');
      } else {
        console.log('⚠️ PubMed NOT mentioned in response');
      }
      
      // Check for citations
      const citationCount = (data.answer.match(/PMID:/g) || []).length;
      console.log('  - Number of PMID citations found:', citationCount);
      
      const doiCount = (data.answer.match(/DOI:/g) || []).length;
      console.log('  - Number of DOI citations found:', doiCount);
    }
    
    if (data.citations) {
      console.log('  - Number of citations:', data.citations.length);
      
      // Group by source
      const sourceCount = {};
      data.citations.forEach(citation => {
        const source = citation.source || 'Unknown';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      
      console.log('  - Citations by source:');
      Object.entries(sourceCount).forEach(([source, count]) => {
        console.log(`    ${source}: ${count} articles`);
      });
      
      console.log('  - Citation details:');
      data.citations.forEach((citation, index) => {
        console.log(`    ${index + 1}. Source: ${citation.source || 'Unknown'}`);
        console.log(`       Title: ${citation.title.substring(0, 60)}...`);
        if (citation.pmid) {
          console.log(`       PMID: ${citation.pmid}`);
        }
        if (citation.doi) {
          console.log(`       DOI: ${citation.doi}`);
        }
      });
    }
    
  } catch (error) {
    console.error('💥 API test failed:', error);
  }
}

testResearchAPI();

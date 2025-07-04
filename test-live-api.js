const testQuery = async () => {
  try {
    // Test with sessionId like the live system
    const response = await fetch('http://localhost:3002/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: 'latest treatments for migraine prevention',
        sessionId: 'test-session-456',
        mode: 'research'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response received:');
    console.log('Citations count:', data.citations ? data.citations.length : 0);
    console.log('Final results length from API:', data.response.includes('high-quality sources selected') ? 
      data.response.match(/(\d+) high-quality sources selected/)[1] : 'unknown');
    console.log('Total papers analyzed:', data.response.includes('papers analyzed') ? 
      data.response.match(/(\d+) papers analyzed/)[1] : 'unknown');
    console.log('\nCitations:');
    if (data.citations) {
      data.citations.forEach((citation, index) => {
        console.log(`${index + 1}. ${citation.title} (${citation.journal || 'Unknown journal'})`);
      });
    }
    
    // Also test the citation filtering logic
    console.log('\n--- Debugging citation filtering ---');
    console.log('Query contains treatment/prevention terms:', 
      ['treatment', 'therapy', 'prevention', 'latest'].some(term => 
        'latest treatments for migraine prevention'.toLowerCase().includes(term)));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testQuery();

// Test the actual research API endpoint
async function testResearchAPI() {
  console.log('🔬 Testing research API with migraine query...');
  
  const testPayload = {
    sessionId: "test-session",
    mode: "research", 
    query: "migraine prevention guidelines"
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response received');
    console.log('Response length:', JSON.stringify(data).length);
    console.log('Response structure:', Object.keys(data));
    
    // Extract some key info from the correct field
    const content = data.response || '';
    if (content) {
      console.log('\n📄 Response preview:');
      console.log(content.substring(0, 1000));
      console.log('\n📊 Content Analysis:');
      
      // Look for migraine-specific content
      const migraineMatches = (content.match(/migraine/gi) || []).length;
      console.log('- Migraine mentions:', migraineMatches);
      
      // Look for unrelated content  
      const metabolicMatches = (content.match(/metabolic syndrome/gi) || []).length;
      const bpMatches = (content.match(/blood pressure/gi) || []).length;
      console.log('- Metabolic syndrome mentions:', metabolicMatches);
      console.log('- Blood pressure mentions:', bpMatches);
      
      // Check what databases are mentioned
      const databases = [];
      if (content.includes('CrossRef')) databases.push('CrossRef');
      if (content.includes('Europe PMC')) databases.push('Europe PMC');
      if (content.includes('PubMed')) databases.push('PubMed');
      if (content.includes('DOAJ')) databases.push('DOAJ');
      console.log('- Databases found in response:', databases);
      
      // Check citations
      console.log('\n📚 Citations Analysis:');
      console.log('- Number of citations:', data.citations?.length || 0);
      if (data.citations && data.citations.length > 0) {
        data.citations.forEach((citation, i) => {
          console.log(`  ${i+1}. ${citation.title} (${citation.journal})`);
        });
      }
    } else {
      console.log('❌ No response content');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResearchAPI();

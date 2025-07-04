// Test fallback mechanism with queries that might not be well-covered in PubMed
async function testFallbackMechanism() {
  console.log('🔬 Testing fallback mechanism...');
  
  // Test 1: Very recent topic (might not be in PubMed yet)
  const recentQuery = "AI language models in healthcare 2024";
  
  // Test 2: Non-medical but science-related (PubMed might be limited)
  const nonMedicalQuery = "machine learning drug discovery algorithms";
  
  // Test 3: Industry/commercial topic (might need FDA or other sources)
  const industryQuery = "pharmaceutical pipeline cancer immunotherapy";
  
  const queries = [
    { name: "Recent AI in Healthcare", query: recentQuery },
    { name: "ML Drug Discovery", query: nonMedicalQuery },
    { name: "Pharma Pipeline", query: industryQuery }
  ];
  
  for (const testCase of queries) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testCase.query,
          sessionId: `test-fallback-${Date.now()}`,
          mode: 'research'
        })
      });
      
      if (!response.ok) {
        console.error(`❌ ${testCase.name} failed:`, response.status);
        continue;
      }
      
      const data = await response.json();
      
      if (data.citations) {
        console.log(`✅ ${testCase.name} results:`);
        console.log(`  - Total citations: ${data.citations.length}`);
        
        // Group by source
        const sources = {};
        data.citations.forEach(citation => {
          const source = citation.source || 'Unknown';
          sources[source] = (sources[source] || 0) + 1;
        });
        
        console.log('  - Sources breakdown:');
        Object.entries(sources).forEach(([source, count]) => {
          console.log(`    ${source}: ${count} articles`);
        });
        
        // Check if we have diverse sources (fallback working)
        const sourceCount = Object.keys(sources).length;
        if (sourceCount > 1) {
          console.log(`  ✅ Diverse sources found - fallback working!`);
        } else {
          console.log(`  ⚠️ Only ${Object.keys(sources)[0]} - fallback may need improvement`);
        }
      } else {
        console.log(`❌ ${testCase.name} - no citations returned`);
      }
      
    } catch (error) {
      console.error(`💥 ${testCase.name} error:`, error.message);
    }
  }
}

testFallbackMechanism();

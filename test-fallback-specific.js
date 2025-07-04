// Test with very specific queries that might have limited PubMed coverage
async function testSpecificFallback() {
  console.log('🔬 Testing specific fallback scenarios...');
  
  // Test 1: Very specific rare disease (might have limited PubMed results)
  const rareQuery = "riboflavin transporter deficiency type 3 treatment";
  
  // Test 2: Very recent pharmaceutical term (might not be indexed yet)
  const recentDrugQuery = "buprenorphine sublingual film pharmacokinetics";
  
  // Test 3: Industry-specific regulatory term
  const regulatoryQuery = "FDA breakthrough therapy designation criteria 2024";
  
  const queries = [
    { name: "Rare Disease", query: rareQuery },
    { name: "Recent Drug", query: recentDrugQuery },
    { name: "FDA Regulatory", query: regulatoryQuery }
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
          sessionId: `test-specific-${Date.now()}`,
          mode: 'research'
        })
      });
      
      if (!response.ok) {
        console.error(`❌ ${testCase.name} failed:`, response.status);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`✅ ${testCase.name} results:`);
      
      if (data.citations && data.citations.length > 0) {
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
        
        // Check diversity
        const sourceCount = Object.keys(sources).length;
        if (sourceCount > 1) {
          console.log(`  ✅ Multiple sources - fallback working!`);
        } else {
          console.log(`  ⚠️ Single source (${Object.keys(sources)[0]}) - checking if fallback should activate`);
        }
      } else {
        console.log(`  ❌ No citations found - this should trigger fallback APIs!`);
      }
      
      // Check if answer mentions limited results
      if (data.answer && data.answer.toLowerCase().includes('limited')) {
        console.log(`  ℹ️ Answer mentions limited results - fallback opportunity`);
      }
      
    } catch (error) {
      console.error(`💥 ${testCase.name} error:`, error.message);
    }
  }
}

testSpecificFallback();

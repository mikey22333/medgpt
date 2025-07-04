// Test migraine query construction and API response
async function testMigrainePubMedQuery() {
  console.log('🔍 Testing migraine query construction...');
  
  const originalQuery = "What are the latest treatments for migraine prevention?";
  
  // Test the query enhancement function (simulated)
  function buildHighQualitySearchQuery(originalQuery) {
    const queryLower = originalQuery.toLowerCase();
    
    // Start with the original query and add basic quality filters
    let enhancedQuery = originalQuery;
    
    // Add human studies filter (basic quality improvement)
    enhancedQuery += ' AND (humans[mh])';
    
    // Add recent studies filter (last 10 years for more modern evidence)
    enhancedQuery += ' AND (2014:2024[dp])';
    
    // For migraine, add modern treatment terms
    if (queryLower.includes('migraine')) {
      enhancedQuery = `(${originalQuery}) OR (migraine AND (CGRP OR gepant OR ubrogepant OR rimegepant OR erenumab))`;
      enhancedQuery += ' AND (humans[mh]) AND (2014:2024[dp])';
    }
    
    return enhancedQuery;
  }
  
  const enhancedQuery = buildHighQualitySearchQuery(originalQuery);
  console.log('Original query:', originalQuery);
  console.log('Enhanced query:', enhancedQuery);
  console.log('Query length:', enhancedQuery.length);
  
  // Test a simplified migraine query
  const simplifiedQuery = "migraine prevention treatment";
  const simplifiedEnhanced = buildHighQualitySearchQuery(simplifiedQuery);
  console.log('\nSimplified query:', simplifiedQuery);
  console.log('Simplified enhanced:', simplifiedEnhanced);
  
  // Test direct PubMed search
  console.log('\n🔬 Testing direct PubMed API...');
  
  const testQuery = "migraine prevention";
  const params = new URLSearchParams({
    db: "pubmed",
    term: testQuery,
    retmax: "5",
    retmode: "json",
    sort: "relevance"
  });
  
  try {
    const response = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`);
    const data = await response.json();
    console.log('PubMed search response:', JSON.stringify(data, null, 2));
    
    if (data.esearchresult?.idlist?.length > 0) {
      console.log('✅ Found PMIDs:', data.esearchresult.idlist);
    } else {
      console.log('❌ No PMIDs returned');
    }
  } catch (error) {
    console.error('❌ PubMed API error:', error);
  }
}

testMigrainePubMedQuery();

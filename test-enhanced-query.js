// Test the enhanced query function
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

// Test with migraine query
const testQuery = "migraine treatment";
const enhancedQuery = buildHighQualitySearchQuery(testQuery);
console.log('Original query:', testQuery);
console.log('Enhanced query:', enhancedQuery);

// Test PubMed with enhanced query
async function testEnhancedQuery() {
  try {
    console.log('🔬 Testing enhanced PubMed query...');
    
    const searchParams = new URLSearchParams({
      db: "pubmed",
      term: enhancedQuery,
      retmax: "5",
      retmode: "json",
      sort: "relevance",
    });

    console.log('📡 Making search request with enhanced query...');
    const searchResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`);
    
    if (!searchResponse.ok) {
      console.error('❌ Enhanced search failed:', searchResponse.statusText);
      return;
    }

    const searchData = await searchResponse.json();
    console.log('✅ Enhanced search found articles:', searchData.esearchresult?.count || 0);
    console.log('📄 PMIDs:', searchData.esearchresult?.idlist || []);
    
  } catch (error) {
    console.error('💥 Enhanced query test failed:', error);
  }
}

testEnhancedQuery();

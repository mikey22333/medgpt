// Test script to check if Semantic Scholar API is working
import { SemanticScholarClient } from './src/lib/research/semantic-scholar.js';

async function testSemanticScholar() {
  console.log('🔬 Testing Semantic Scholar API...\n');
  
  const client = new SemanticScholarClient();
  
  try {
    // Test with a simple medical query
    const testQuery = {
      query: "diabetes treatment",
      maxResults: 5
    };
    
    console.log(`📝 Testing query: "${testQuery.query}"`);
    console.log(`📊 Max results: ${testQuery.maxResults}\n`);
    
    const startTime = Date.now();
    const results = await client.searchPapers(testQuery);
    const endTime = Date.now();
    
    console.log(`⏱️  Query took: ${endTime - startTime}ms`);
    console.log(`📄 Results found: ${results.length}\n`);
    
    if (results.length > 0) {
      console.log('✅ Semantic Scholar API is WORKING!\n');
      console.log('Sample results:');
      console.log('=' .repeat(50));
      
      results.slice(0, 3).forEach((paper, index) => {
        console.log(`\n${index + 1}. ${paper.title}`);
        console.log(`   Authors: ${paper.authors.map(a => a.name).join(', ')}`);
        console.log(`   Year: ${paper.year}`);
        console.log(`   Venue: ${paper.venue}`);
        console.log(`   Citations: ${paper.citationCount}`);
        console.log(`   Abstract: ${paper.abstract.substring(0, 150)}...`);
      });
      
    } else {
      console.log('⚠️  Semantic Scholar API responded but returned no results');
      console.log('This could be due to:');
      console.log('- Rate limiting');
      console.log('- Network issues');
      console.log('- Query not matching any papers');
    }
    
  } catch (error) {
    console.log('❌ Semantic Scholar API is NOT WORKING!');
    console.log('Error:', error.message);
    console.log('\nPossible issues:');
    console.log('- Network connectivity');
    console.log('- API endpoint changes');
    console.log('- Rate limiting');
    console.log('- Server/deployment issues');
  }
}

testSemanticScholar();

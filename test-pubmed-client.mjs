// Test our actual PubMed client implementation
import { PubMedClient } from './src/lib/research/pubmed.js';

async function testPubMedClient() {
  try {
    console.log('🔬 Testing our PubMed client...');
    
    const pubmedClient = new PubMedClient();
    
    const query = {
      query: "migraine treatment",
      maxResults: 3,
      source: "pubmed"
    };
    
    console.log('📡 Searching with PubMed client...');
    const results = await pubmedClient.searchArticles(query);
    
    console.log('✅ PubMed client results:');
    console.log('  - Number of articles:', results.length);
    
    results.forEach((article, index) => {
      console.log(`  ${index + 1}. ${article.title}`);
      console.log(`     PMID: ${article.pmid}`);
      console.log(`     Journal: ${article.journal}`);
      console.log(`     Authors: ${article.authors.slice(0, 2).join(', ')}${article.authors.length > 2 ? '...' : ''}`);
      console.log(`     Abstract length: ${article.abstract.length}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('💥 PubMed client test failed:', error);
  }
}

testPubMedClient();

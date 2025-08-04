#!/usr/bin/env node

/**
 * Test: Direct biomedical service test
 */

// Simulate the same environment as the server
process.env.HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || 'your-huggingface-api-key-here';

async function testBiomedicalServiceDirectly() {
  console.log('🧪 Testing Biomedical Service Directly');
  console.log('=' .repeat(50));

  try {
    // Import the service (this would normally be done in the research route)
    const { biomedicalEmbeddings } = await import('./src/lib/research/huggingface-biomedical.ts');
    
    // Mock citation data
    const mockCitations = [
      {
        title: "SGLT2 inhibitors and cardiovascular outcomes in patients with type 2 diabetes",
        abstract: "Background: Sodium-glucose cotransporter-2 (SGLT2) inhibitors have shown cardiovascular benefits in patients with type 2 diabetes. This randomized controlled trial evaluated cardiovascular outcomes.",
        authors: ["Smith J"],
        year: 2023,
        source: "NEJM"
      },
      {
        title: "COVID-19 vaccine effectiveness against omicron variant", 
        abstract: "This study examined the effectiveness of COVID-19 vaccines against the omicron variant.",
        authors: ["Wilson K"],
        year: 2023,
        source: "Lancet"
      }
    ];

    const query = "SGLT2 inhibitors cardiovascular outcomes diabetes";
    
    console.log(`📋 Query: "${query}"`);
    console.log(`📚 Test citations: ${mockCitations.length}`);
    
    // Test the ranking
    const results = await biomedicalEmbeddings.rankPapersWithEmbeddings(
      query,
      mockCitations,
      { threshold: 0.1, maxResults: 10 }
    );
    
    console.log(`✅ Results: ${results.length}`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. [${(result.score * 100).toFixed(1)}%] ${result.paper.title}`);
      console.log(`   💡 ${result.reason}`);
    });

  } catch (error) {
    console.error('❌ Direct test failed:', error);
    console.log('\nError details:');
    console.log(error.stack);
  }
}

testBiomedicalServiceDirectly().catch(console.error);

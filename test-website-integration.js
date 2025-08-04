#!/usr/bin/env node

/**
 * Test Integration: Check if HuggingFace biomedical embeddings are working in the main website
 */

async function testWebsiteIntegration() {
  console.log('🌐 Testing CliniSynth Website Integration');
  console.log('=' .repeat(60));

  try {
    // Test the research API endpoint
    const testQuery = "SGLT2 inhibitors cardiovascular outcomes diabetes";
    
    console.log(`📋 Testing query: "${testQuery}"`);
    console.log('🔗 Calling research API...');

    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        sessionId: 'test-integration',
        maxResults: 5
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ API Response received!');
    console.log(`📊 Total citations found: ${result.citations?.length || 0}`);
    
    if (result.citations && result.citations.length > 0) {
      console.log('\n🔬 Top 3 Results:');
      result.citations.slice(0, 3).forEach((citation, index) => {
        console.log(`\n${index + 1}. ${citation.title}`);
        console.log(`   📅 ${citation.year} | 📖 ${citation.source}`);
        
        // Check if biomedical embeddings are being used
        if (citation.semanticScore !== undefined) {
          console.log(`   🧬 Semantic Score: ${(citation.semanticScore * 100).toFixed(1)}%`);
        }
        
        if (citation.relevanceReason) {
          console.log(`   💡 Relevance: ${citation.relevanceReason}`);
        }
      });

      // Check for biomedical embedding indicators
      const hasSemanticScores = result.citations.some(c => c.semanticScore !== undefined);
      const hasBiomedicalReasons = result.citations.some(c => 
        c.relevanceReason && c.relevanceReason.includes('Semantic similarity')
      );

      console.log('\n🔍 Integration Analysis:');
      console.log(`✅ Semantic scores present: ${hasSemanticScores ? 'YES' : 'NO'}`);
      console.log(`✅ Biomedical reasoning present: ${hasBiomedicalReasons ? 'YES' : 'NO'}`);
      
      if (hasSemanticScores && hasBiomedicalReasons) {
        console.log('🎉 SUCCESS: HuggingFace biomedical embeddings are working!');
      } else {
        console.log('⚠️  WARNING: Still using old semantic search logic');
      }

    } else {
      console.log('❌ No citations returned from API');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('- Make sure the development server is running: npm run dev');
      console.log('- Check if the server is running on http://localhost:3000');
    }
  }
}

testWebsiteIntegration().catch(console.error);

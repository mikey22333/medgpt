#!/usr/bin/env node

/**
 * Test: API with force biomedical debug
 */

async function testWithDebugQuery() {
  console.log('🔍 Testing API with DEBUG query to see biomedical service logs');
  console.log('=' .repeat(60));

  try {
    const testQuery = "DEBUG: SGLT2 inhibitors cardiovascular outcomes diabetes";
    
    console.log(`📋 Testing query: "${testQuery}"`);
    console.log('🔗 Calling research API...');

    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        sessionId: 'biomedical-debug-test',
        mode: 'research',
        maxResults: 3
      })
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${errorText}`);
      return;
    }

    const result = await response.json();
    
    console.log('✅ API Response received!');
    console.log(`📊 Total citations: ${result.citations?.length || 0}`);
    
    if (result.citations && result.citations.length > 0) {
      console.log('\n🔬 Citation Analysis:');
      result.citations.forEach((citation, index) => {
        console.log(`\n${index + 1}. ${citation.title}`);
        
        // Check for biomedical embedding indicators
        console.log(`   📊 Has semanticScore: ${citation.semanticScore !== undefined ? 'YES' : 'NO'}`);
        console.log(`   💡 Relevance reason: ${citation.relevanceReason || 'NOT PROVIDED'}`);
        
        if (citation.semanticScore !== undefined) {
          console.log(`   🎯 Semantic Score: ${(citation.semanticScore * 100).toFixed(1)}%`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithDebugQuery().catch(console.error);

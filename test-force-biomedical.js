#!/usr/bin/env node

/**
 * Force biomedical embeddings test by using a specific query
 */

async function forceBiomedicalTest() {
  console.log('🧬 Forcing Biomedical Embeddings Test');
  console.log('=' .repeat(50));

  try {
    // Use a query that might have fewer initial results to force biomedical ranking
    const response = await fetch('http://localhost:3001/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "CRISPR gene therapy clinical trials cancer immunotherapy",
        sessionId: 'force-biomedical-test',
        mode: 'research',
        maxResults: 5
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`📊 Citations: ${result.citations?.length || 0}`);
    
    if (result.citations && result.citations.length > 0) {
      const firstCitation = result.citations[0];
      console.log('\n🔬 First Citation Analysis:');
      console.log(`Title: ${firstCitation.title}`);
      console.log(`Semantic Score: ${firstCitation.semanticScore}`);
      console.log(`Biomedical Reason: ${firstCitation.biomedicalReason}`);
      console.log(`Is Highly Relevant: ${firstCitation.isHighlyRelevant}`);
      
      if (firstCitation.semanticScore !== undefined) {
        console.log('✅ SUCCESS: Biomedical embeddings data is preserved!');
      } else {
        console.log('❌ FAILED: Still no biomedical embeddings data');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

forceBiomedicalTest().catch(console.error);

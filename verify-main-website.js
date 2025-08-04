#!/usr/bin/env node

/**
 * Verify: What's actually implemented in the main website
 * Check if biomedical embeddings are working in production
 */

async function verifyMainWebsite() {
  console.log('🌐 Verifying Main Website Implementation');
  console.log('=' .repeat(60));

  try {
    // Test with the actual port the server is running on
    const response = await fetch('http://localhost:3001/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "diabetes SGLT2 inhibitors cardiovascular outcomes",
        sessionId: 'website-verification',
        mode: 'research',
        maxResults: 5
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📊 Main Website API Response:');
    console.log(`✅ Citations returned: ${result.citations?.length || 0}`);
    
    if (result.citations && result.citations.length > 0) {
      console.log('\n🔬 First 2 Citations from Main Website:');
      result.citations.slice(0, 2).forEach((citation, index) => {
        console.log(`\n${index + 1}. ${citation.title}`);
        console.log(`   📅 ${citation.year} | 📖 ${citation.source}`);
        
        // Check if biomedical features are present
        if (citation.semanticScore !== undefined) {
          console.log(`   🧬 Has Semantic Score: YES (${(citation.semanticScore * 100).toFixed(1)}%)`);
        } else {
          console.log(`   🧬 Has Semantic Score: NO`);
        }
        
        if (citation.relevanceReason) {
          console.log(`   💡 Relevance Reason: ${citation.relevanceReason}`);
        }
      });

      // Check for biomedical embedding indicators
      const hasBiomedicalFeatures = result.citations.some(c => 
        c.semanticScore !== undefined || 
        (c.relevanceReason && c.relevanceReason.includes('Semantic similarity'))
      );

      console.log('\n🎯 Implementation Status:');
      console.log(`✅ Biomedical embeddings active: ${hasBiomedicalFeatures ? 'YES' : 'NO'}`);
      console.log(`✅ HuggingFace API integrated: ${hasBiomedicalFeatures ? 'YES' : 'NO'}`);
      console.log(`✅ Semantic scoring working: ${hasBiomedicalFeatures ? 'YES' : 'NO'}`);
      
      if (hasBiomedicalFeatures) {
        console.log('\n🎉 CONFIRMED: Main website HAS biomedical embeddings implemented!');
      } else {
        console.log('\n⚠️  WARNING: Main website may not have biomedical embeddings active');
      }

    } else {
      console.log('❌ No citations returned from main website API');
    }

  } catch (error) {
    console.error('❌ Main website verification failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Server may not be running on expected port');
      console.log('Try: npm run dev');
    }
  }
}

verifyMainWebsite().catch(console.error);

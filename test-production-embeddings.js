#!/usr/bin/env node

/**
 * Production Test: HuggingFace Biomedical Embeddings
 * Tests the immediate integration with CliniSynth
 */

// Simple test without external dependencies
async function testProductionEmbeddings() {
  console.log('🚀 Testing Production HuggingFace Biomedical Embeddings');
  console.log('=' .repeat(60));

  // Your Hugging Face API key
  const apiKey = process.env.HUGGINGFACE_API_KEY || 'your-huggingface-api-key-here';
  
  console.log(`✅ API Key: ${apiKey.substring(0, 8)}...`);

  // Test different models available on HuggingFace
  const testModels = [
    'sentence-transformers/all-MiniLM-L6-v2',
    'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext',
    'sentence-transformers/allenai-specter',
    'pritamdeka/S-PubMedBert-MS-MARCO'
  ];

  const testQuery = "SGLT2 inhibitors cardiovascular outcomes diabetes";

  for (const model of testModels) {
    console.log(`\n🔬 Testing model: ${model}`);
    
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: testQuery,
          options: { wait_for_model: true }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (Array.isArray(result)) {
          // Handle different response formats
          let embedding = result;
          if (Array.isArray(result[0])) {
            embedding = Array.isArray(result[0][0]) ? result[0][0] : result[0];
          }
          
          console.log(`   ✅ Success! Embedding dimensions: ${embedding.length}`);
          console.log(`   📊 Sample values: [${embedding.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`);
          
          // Test if this is a working biomedical model
          if (embedding.length >= 384) {
            console.log(`   🎯 Good embedding size for biomedical use`);
            console.log(`   🔧 Recommended for CliniSynth integration`);
            break; // Found a working model
          }
        } else if (result.error) {
          console.log(`   ❌ API Error: ${result.error}`);
        } else {
          console.log(`   ⚠️  Unexpected format:`, typeof result);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }

  console.log('\n🧪 Testing Similarity Calculation:');
  
  // Test with a model that's more likely to work
  const workingModel = 'sentence-transformers/all-MiniLM-L6-v2';
  
  try {
    const query1 = "diabetes treatment with metformin";
    const query2 = "metformin therapy for type 2 diabetes";
    
    console.log(`\n📋 Query 1: "${query1}"`);
    console.log(`📋 Query 2: "${query2}"`);
    
    const [emb1Response, emb2Response] = await Promise.all([
      fetch(`https://api-inference.huggingface.co/models/${workingModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: query1,
          options: { wait_for_model: true }
        }),
      }),
      fetch(`https://api-inference.huggingface.co/models/${workingModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: query2,
          options: { wait_for_model: true }
        }),
      })
    ]);

    if (emb1Response.ok && emb2Response.ok) {
      const [emb1, emb2] = await Promise.all([
        emb1Response.json(),
        emb2Response.json()
      ]);

      if (Array.isArray(emb1) && Array.isArray(emb2)) {
        // Calculate cosine similarity
        const dotProduct = emb1.reduce((sum, a, i) => sum + a * emb2[i], 0);
        const magnitude1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));
        const similarity = dotProduct / (magnitude1 * magnitude2);

        console.log(`   📊 Cosine similarity: ${(similarity * 100).toFixed(1)}%`);
        
        if (similarity > 0.7) {
          console.log('   ✅ High similarity detected - good for medical queries!');
        } else if (similarity > 0.4) {
          console.log('   ⚡ Moderate similarity - acceptable for medical use');
        } else {
          console.log('   ⚠️  Low similarity - may need tuning');
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Similarity test failed: ${error.message}`);
  }

  console.log('\n🎯 Integration Recommendations:');
  console.log('=' .repeat(60));
  console.log('✅ Use sentence-transformers/all-MiniLM-L6-v2 as primary model');
  console.log('✅ Implement fallback to keyword matching for reliability');
  console.log('✅ Cache embeddings to reduce API calls');
  console.log('✅ Apply medical domain boosting for relevance');
  
  console.log('\n🚀 Next Steps for CliniSynth:');
  console.log('1. Replace semantic-search.ts with HuggingFace integration');
  console.log('2. Update research route to use biomedical embeddings');
  console.log('3. Monitor relevance improvements with DEBUG queries');
  console.log('4. Gradually optimize with biomedical-specific models');
}

// Run the production test
testProductionEmbeddings().catch(console.error);

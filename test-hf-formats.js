#!/usr/bin/env node

/**
 * Working HuggingFace Embeddings Test
 * Using proper input formats for different model types
 */

async function testWorkingEmbeddings() {
  console.log('🔧 Testing Working HuggingFace API Formats');
  console.log('=' .repeat(60));

  const apiKey = process.env.HUGGINGFACE_API_KEY || 'your-huggingface-api-key-here';
  const testQuery = "SGLT2 inhibitors cardiovascular outcomes";

  // Test 1: Direct feature extraction
  console.log('\n📝 Test 1: Feature Extraction API');
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: testQuery
        })
      }
    );

    console.log(`Status: ${response.status}`);
    const result = await response.text();
    console.log(`Response: ${result.substring(0, 200)}...`);

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  // Test 2: Sentence similarity format
  console.log('\n📝 Test 2: Sentence Similarity Format');
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: testQuery,
            sentences: ["diabetes medication", "heart disease treatment", "unrelated topic"]
          }
        })
      }
    );

    console.log(`Status: ${response.status}`);
    const result = await response.text();
    console.log(`Response: ${result.substring(0, 200)}...`);

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  // Test 3: Try with OpenAI format (might work)
  console.log('\n📝 Test 3: Alternative Input Format');
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: testQuery
        })
      }
    );

    console.log(`Status: ${response.status}`);
    const result = await response.text();
    console.log(`Response: ${result.substring(0, 200)}...`);

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  // Test 4: Try a different biomedical model
  console.log('\n📝 Test 4: Alternative Models');
  
  const alternativeModels = [
    'BAAI/bge-small-en-v1.5',
    'thenlper/gte-small', 
    'intfloat/e5-small-v2'
  ];

  for (const model of alternativeModels) {
    try {
      console.log(`\nTrying model: ${model}`);
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: testQuery
        })
      });

      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result) && result.length > 0) {
          console.log(`   ✅ Success! Dimensions: ${result.length}`);
          console.log(`   📊 Sample: [${result.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`);
          console.log(`   🎯 This model works for embeddings!`);
          break;
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }

  console.log('\n🔍 Recommendation: Use local embeddings or different provider');
  console.log('   - HuggingFace Inference API seems to have formatting issues');
  console.log('   - Consider using OpenAI embeddings or local models');
  console.log('   - Implement robust fallback to keyword matching');
}

testWorkingEmbeddings().catch(console.error);

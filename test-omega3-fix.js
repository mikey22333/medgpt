/**
 * Test script to verify omega-3 depression query fixes
 * Tests the enhanced citation guarantee mechanism and MIRENA filtering
 */

async function testOmega3Query() {
  console.log('🧪 Testing Omega-3 Depression Query with Enhanced API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Effect of Omega-3 on Depression'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 QUERY RESULTS ANALYSIS:');
    console.log(`✅ Citations returned: ${data.citations?.length || 0}`);
    console.log(`📝 Response length: ${data.response?.length || 0} characters`);
    
    if (data.citations) {
      console.log('\n📋 CITATION QUALITY CHECK:');
      
      let mirenaCount = 0;
      let objectObjectCount = 0;
      let relevantCount = 0;
      
      data.citations.forEach((citation, index) => {
        const title = citation.title?.toLowerCase() || '';
        const authors = JSON.stringify(citation.authors);
        
        // Check for MIRENA (should be 0)
        if (title.includes('mirena') || title.includes('contraceptive')) {
          mirenaCount++;
          console.log(`❌ CITATION ${index + 1}: MIRENA/Contraceptive found: ${citation.title?.substring(0, 60)}...`);
        }
        
        // Check for [object Object] authors (should be 0)
        if (authors.includes('[object Object]')) {
          objectObjectCount++;
          console.log(`❌ CITATION ${index + 1}: [object Object] authors: ${citation.title?.substring(0, 60)}...`);
        }
        
        // Check for omega-3 or depression relevance
        if (title.includes('omega') || title.includes('depression') || title.includes('mental health')) {
          relevantCount++;
          console.log(`✅ CITATION ${index + 1}: Relevant - ${citation.title?.substring(0, 60)}...`);
        } else {
          console.log(`⚠️  CITATION ${index + 1}: Check relevance - ${citation.title?.substring(0, 60)}...`);
        }
      });
      
      console.log('\n📈 FINAL ANALYSIS:');
      console.log(`✅ Expected citations: 10`);
      console.log(`📊 Actual citations: ${data.citations.length}`);
      console.log(`❌ MIRENA citations: ${mirenaCount} (should be 0)`);
      console.log(`❌ [object Object] issues: ${objectObjectCount} (should be 0)`);
      console.log(`✅ Relevant citations: ${relevantCount}`);
      
      // Success criteria
      const success = data.citations.length === 10 && mirenaCount === 0 && objectObjectCount === 0;
      console.log(`\n${success ? '🎉 TEST PASSED' : '❌ TEST FAILED'}: Citation guarantee and filtering`);
      
      if (!success) {
        console.log('\n🔧 DEBUGGING INFO:');
        if (data.citations.length !== 10) {
          console.log(`- Citation count issue: Got ${data.citations.length}, expected 10`);
        }
        if (mirenaCount > 0) {
          console.log(`- MIRENA filtering failed: ${mirenaCount} irrelevant citations found`);
        }
        if (objectObjectCount > 0) {
          console.log(`- Author parsing issue: ${objectObjectCount} [object Object] found`);
        }
      }
      
    } else {
      console.log('❌ No citations returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🚨 Development server not running. Please start with: npm run dev');
    }
  }
}

// Run the test
testOmega3Query();

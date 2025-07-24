/**
 * Minimal test to debug the route.ts response issue
 */

async function testMinimalQuery() {
  console.log('🔍 Testing minimal API call...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'aspirin heart disease',
        sessionId: 'test-123',
        mode: 'research'
      })
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Success! Got ${data.citations?.length || 0} citations`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMinimalQuery();

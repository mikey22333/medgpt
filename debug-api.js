#!/usr/bin/env node

/**
 * Debug: Check detailed API response
 */

async function debugAPIResponse() {
  console.log('🔍 Debugging API Response');
  console.log('=' .repeat(50));

  try {
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "diabetes treatment",
        sessionId: 'debug-test',
        maxResults: 5
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📋 Full API Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAPIResponse().catch(console.error);

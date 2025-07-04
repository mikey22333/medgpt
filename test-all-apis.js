const testNIHIntegration = async () => {
  try {
    console.log('🧪 Testing NIH RePORTER Integration...');
    
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'migraine treatment',
        sessionId: 'test-session',
        mode: 'research'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Response received');
    
    // Check reasoning steps
    console.log('\n📋 Reasoning Steps:');
    if (data.reasoningSteps) {
      data.reasoningSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.title}: ${step.process}`);
      });
    }
    
    // Check sources used
    console.log('\n📚 Sources Found:');
    if (data.citations) {
      const sources = [...new Set(data.citations.map(c => c.source))];
      sources.forEach(source => {
        const count = data.citations.filter(c => c.source === source).length;
        console.log(`   ${source}: ${count} papers`);
      });
      console.log(`\n📊 Total papers: ${data.citations.length}`);
      console.log(`📊 Total sources: ${sources.length}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
};

// Run the test
testNIHIntegration();

// Test to verify 10 citations are being returned
console.log('🧪 Testing Citation Limit...');

fetch('/api/research', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: "COVID-19 long-term effects",
    maxResults: 10,
    includeAbstracts: true
  })
})
.then(response => response.json())
.then(data => {
  console.log(`📊 Citation Test Results:`);
  console.log(`Papers returned: ${data.papers?.length || 0}`);
  console.log(`Sources returned: ${data.sources?.length || 0}`);
  
  if (data.papers) {
    console.log('\n📑 Paper Titles:');
    data.papers.forEach((paper, index) => {
      console.log(`${index + 1}. ${paper.title}`);
    });
    
    if (data.papers.length >= 10) {
      console.log('\n✅ SUCCESS: 10 or more citations returned!');
    } else {
      console.log(`\n⚠️ Only ${data.papers.length} citations returned (expected 10)`);
    }
  }
})
.catch(error => {
  console.error('❌ Test failed:', error);
});

console.log('📋 Copy this code and run in browser console at localhost:3001');

// Simple API test to check if our research endpoint works

async function testResearchAPI() {
  try {
    console.log('🧪 Testing Research API...');
    
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Effect of Omega-3 on Depression',
        mode: 'research',
        sessionId: 'test-session-123'
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response received');
      console.log('Response structure:', Object.keys(data));
      
      if (data.citations) {
        console.log(`📚 Citations count: ${data.citations.length}`);
        console.log('First citation:', data.citations[0]?.title?.substring(0, 50) + '...');
        
        // Check for [object Object] in authors
        const hasObjectIssue = data.citations.some(citation => 
          citation.authors?.some(author => typeof author !== 'string' || author.includes('[object'))
        );
        
        if (hasObjectIssue) {
          console.log('❌ Found [object Object] in authors');
        } else {
          console.log('✅ No [object Object] issues found');
        }
        
        // Check for irrelevant citations
        const irrelevantTitles = data.citations.filter(citation => {
          const title = citation.title?.toLowerCase() || '';
          return title.includes('graphene') || title.includes('phq-9') || title.includes('electric field');
        });
        
        if (irrelevantTitles.length > 0) {
          console.log('❌ Found irrelevant citations:', irrelevantTitles.length);
          irrelevantTitles.forEach(cit => console.log('  -', cit.title.substring(0, 60) + '...'));
        } else {
          console.log('✅ No obviously irrelevant citations found');
        }
        
      } else {
        console.log('❌ No citations in response');
      }
      
      if (data.response) {
        console.log('📝 Research summary length:', data.response.length);
      }
      
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResearchAPI();

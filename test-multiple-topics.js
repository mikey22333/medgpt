/**
 * Test multiple medical topics to verify comprehensive improvements
 */

async function testMultipleMedicalTopics() {
  const topics = [
    'diabetes and metformin',
    'hypertension treatment guidelines', 
    'vitamin D deficiency symptoms',
    'COVID-19 long term effects'
  ];
  
  console.log('🧪 Testing Multiple Medical Topics for Citation Quality...\n');
  
  for (const topic of topics) {
    console.log(`🔍 Testing: "${topic}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: topic,
          sessionId: `test-${topic.replace(/\s+/g, '-')}`,
          mode: 'research'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const citationCount = data.citations?.length || 0;
        
        let mirenaCount = 0;
        let relevantCount = 0;
        
        if (data.citations) {
          data.citations.forEach(citation => {
            const title = citation.title?.toLowerCase() || '';
            if (title.includes('mirena') || title.includes('contraceptive')) {
              mirenaCount++;
            }
            // Basic relevance check
            if (title.includes(topic.split(' ')[0].toLowerCase()) || 
                title.includes('medical') || title.includes('clinical')) {
              relevantCount++;
            }
          });
        }
        
        console.log(`  ✅ Citations: ${citationCount}/10, MIRENA: ${mirenaCount}, Relevant: ${relevantCount}`);
      } else {
        console.log(`  ❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log(''); // spacing
  }
}

testMultipleMedicalTopics();

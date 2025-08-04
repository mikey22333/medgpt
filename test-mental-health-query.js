#!/usr/bin/env node

/**
 * Test: Social media and adolescent mental health query
 * Verify if biomedical embeddings improve relevance for mental health topics
 */

async function testMentalHealthQuery() {
  console.log('🧠 Testing Mental Health Query with Biomedical Embeddings');
  console.log('=' .repeat(70));

  try {
    const query = "How does social media usage affect adolescent mental health";
    
    console.log(`📋 Query: "${query}"`);
    console.log('🔗 Calling research API...');

    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        sessionId: 'mental-health-test',
        mode: 'research',
        maxResults: 10
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ API Response received!');
    console.log(`📊 Total citations: ${result.citations?.length || 0}`);
    
    if (result.citations && result.citations.length > 0) {
      console.log('\n🔬 Top 5 Results Analysis:');
      result.citations.slice(0, 5).forEach((citation, index) => {
        console.log(`\n${index + 1}. ${citation.title}`);
        console.log(`   📅 ${citation.year} | 📖 ${citation.source}`);
        
        // Check relevance to mental health and social media
        const title = citation.title.toLowerCase();
        const abstract = (citation.abstract || '').toLowerCase();
        const combinedText = `${title} ${abstract}`;
        
        const mentalHealthTerms = ['mental health', 'psychology', 'psychiatric', 'depression', 'anxiety', 'wellbeing', 'adolescent', 'teenager'];
        const socialMediaTerms = ['social media', 'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'online', 'internet', 'digital'];
        
        const mentalHealthMatches = mentalHealthTerms.filter(term => combinedText.includes(term));
        const socialMediaMatches = socialMediaTerms.filter(term => combinedText.includes(term));
        
        console.log(`   🧠 Mental health terms: ${mentalHealthMatches.length > 0 ? mentalHealthMatches.join(', ') : 'NONE'}`);
        console.log(`   📱 Social media terms: ${socialMediaMatches.length > 0 ? socialMediaMatches.join(', ') : 'NONE'}`);
        
        const relevanceScore = (mentalHealthMatches.length * 2 + socialMediaMatches.length * 3) / 10;
        if (relevanceScore >= 0.5) {
          console.log(`   ✅ HIGHLY RELEVANT (${(relevanceScore * 100).toFixed(0)}%)`);
        } else if (relevanceScore >= 0.2) {
          console.log(`   ⚡ MODERATELY RELEVANT (${(relevanceScore * 100).toFixed(0)}%)`);
        } else {
          console.log(`   ❌ IRRELEVANT (${(relevanceScore * 100).toFixed(0)}%)`);
        }
        
        if (citation.semanticScore !== undefined) {
          console.log(`   🧬 Semantic Score: ${(citation.semanticScore * 100).toFixed(1)}%`);
        }
      });

      // Overall assessment
      const relevantCitations = result.citations.filter(citation => {
        const combinedText = `${citation.title} ${citation.abstract || ''}`.toLowerCase();
        return combinedText.includes('mental') || 
               combinedText.includes('psycho') || 
               combinedText.includes('adolescent') ||
               combinedText.includes('social media') ||
               combinedText.includes('internet') ||
               combinedText.includes('digital');
      });

      console.log('\n📊 Overall Assessment:');
      console.log(`✅ Relevant citations: ${relevantCitations.length}/${result.citations.length}`);
      console.log(`📈 Relevance rate: ${(relevantCitations.length / result.citations.length * 100).toFixed(1)}%`);
      
      if (relevantCitations.length >= 5) {
        console.log('🎉 EXCELLENT: High number of relevant mental health citations');
      } else if (relevantCitations.length >= 2) {
        console.log('⚡ GOOD: Some relevant citations found');
      } else {
        console.log('❌ POOR: Very few relevant citations (biomedical embeddings may need tuning)');
      }

    } else {
      console.log('❌ No citations returned from API');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMentalHealthQuery().catch(console.error);

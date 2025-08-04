const testQuery = "How does social media usage affect adolescent mental health";

console.log("🔄 Testing UPDATED API with social media query...");
console.log("Query:", testQuery);

async function testUpdatedAPI() {
  try {
    const response = await fetch("http://localhost:3000/api/research", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: testQuery,
        maxResults: 5,
        includeAbstracts: true
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("\n📊 UPDATED API Response:");
    console.log("Status:", response.status);
    console.log("Papers found:", data.papers?.length || 0);
    
    if (data.papers && data.papers.length > 0) {
      console.log("\n📋 Top 3 Papers from UPDATED API:");
      data.papers.slice(0, 3).forEach((paper, index) => {
        console.log(`\n${index + 1}. "${paper.title}"`);
        console.log(`   Source: ${paper.source}`);
        console.log(`   Journal: ${paper.journal || 'N/A'}`);
        console.log(`   Year: ${paper.year || 'N/A'}`);
        
        if (paper.relevanceScore) {
          console.log(`   Relevance Score: ${Math.round(paper.relevanceScore * 100)}%`);
        }
        if (paper.semanticScore) {
          console.log(`   ✅ Semantic Score: ${Math.round(paper.semanticScore * 100)}%`);
        }
        if (paper.biomedicalReason || paper.relevanceReason) {
          console.log(`   Biomedical Reason: ${paper.biomedicalReason || paper.relevanceReason}`);
        }
        
        // Check actual relevance to social media + mental health
        const title = paper.title.toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const combinedText = title + ' ' + abstract;
        
        const hasSocialMedia = combinedText.includes('social media') || combinedText.includes('digital') || 
                              combinedText.includes('internet') || combinedText.includes('online') || 
                              combinedText.includes('technology') || combinedText.includes('screen');
        
        const hasMentalHealth = combinedText.includes('mental health') || combinedText.includes('adolescent') || 
                               combinedText.includes('depression') || combinedText.includes('anxiety') || 
                               combinedText.includes('psychological') || combinedText.includes('wellbeing') ||
                               combinedText.includes('mood') || combinedText.includes('behavioral');
        
        const isActuallyRelevant = hasSocialMedia && hasMentalHealth;
        
        console.log(`   Social Media Content: ${hasSocialMedia ? '✅' : '❌'}`);
        console.log(`   Mental Health Content: ${hasMentalHealth ? '✅' : '❌'}`);
        console.log(`   Overall Relevance: ${isActuallyRelevant ? '✅ RELEVANT' : '❌ IRRELEVANT'}`);
        
        if (!isActuallyRelevant) {
          console.log(`   🚨 PROBLEM: This paper is about: ${paper.title.substring(0, 80)}...`);
        }
      });
      
      // Calculate overall relevance rate
      const relevantCount = data.papers.filter(paper => {
        const title = paper.title.toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const combinedText = title + ' ' + abstract;
        
        const hasSocialMedia = combinedText.includes('social media') || combinedText.includes('digital') || 
                              combinedText.includes('internet') || combinedText.includes('online') || 
                              combinedText.includes('technology') || combinedText.includes('screen');
        
        const hasMentalHealth = combinedText.includes('mental health') || combinedText.includes('adolescent') || 
                               combinedText.includes('depression') || combinedText.includes('anxiety') || 
                               combinedText.includes('psychological') || combinedText.includes('wellbeing') ||
                               combinedText.includes('mood') || combinedText.includes('behavioral');
        
        return hasSocialMedia && hasMentalHealth;
      }).length;
      
      console.log(`\n🎯 FINAL RELEVANCE RATE: ${relevantCount}/${data.papers.length} (${Math.round(relevantCount / data.papers.length * 100)}%)`);
      
      if (relevantCount >= data.papers.length * 0.8) {
        console.log("\n🎉 SUCCESS! 80%+ of papers are relevant to social media + mental health!");
      } else if (relevantCount >= data.papers.length * 0.5) {
        console.log("\n⚠️  PARTIAL SUCCESS: 50%+ relevant, but still room for improvement");
      } else {
        console.log("\n❌ FAILURE: Less than 50% relevant papers - fix didn't work completely");
        console.log("   Possible issues:");
        console.log("   - Code changes not fully loaded");
        console.log("   - Other filtering logic overriding our fixes");
        console.log("   - Database queries still using old enhancement logic");
      }
    } else {
      console.log("❌ No papers returned from updated API");
    }
    
    if (data.error) {
      console.log("❌ API Error:", data.error);
    }
    
  } catch (error) {
    console.error("❌ Failed to test updated API:", error.message);
  }
}

testUpdatedAPI();

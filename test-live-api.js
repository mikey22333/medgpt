const testQuery = "How does social media usage affect adolescent mental health";

console.log("🔍 Testing LIVE website API for social media query...");
console.log("Query:", testQuery);

async function testLiveAPI() {
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
    
    console.log("\n📊 Live API Response:");
    console.log("Status:", response.status);
    console.log("Papers found:", data.papers?.length || 0);
    
    if (data.papers && data.papers.length > 0) {
      console.log("\n📋 Top 3 Papers from Live API:");
      data.papers.slice(0, 3).forEach((paper, index) => {
        console.log(`\n${index + 1}. "${paper.title}"`);
        console.log(`   Source: ${paper.source}`);
        console.log(`   Journal: ${paper.journal || 'N/A'}`);
        console.log(`   Year: ${paper.year || 'N/A'}`);
        
        if (paper.relevanceScore) {
          console.log(`   Relevance Score: ${Math.round(paper.relevanceScore * 100)}%`);
        }
        if (paper.semanticScore) {
          console.log(`   Semantic Score: ${Math.round(paper.semanticScore * 100)}%`);
        }
        if (paper.biomedicalReason) {
          console.log(`   Biomedical Reason: ${paper.biomedicalReason}`);
        }
        
        // Check actual relevance
        const title = paper.title.toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const isActuallyRelevant = 
          (title.includes('social media') || title.includes('digital') || title.includes('internet') || title.includes('online') || title.includes('technology')) &&
          (title.includes('mental health') || title.includes('adolescent') || title.includes('depression') || title.includes('anxiety') || title.includes('psychological') || title.includes('wellbeing'));
        
        console.log(`   Actually Relevant: ${isActuallyRelevant ? '✅ YES' : '❌ NO'}`);
        
        if (!isActuallyRelevant) {
          console.log(`   🚫 IRRELEVANT PAPER DETECTED!`);
        }
      });
      
      // Calculate relevance rate
      const relevantCount = data.papers.filter(paper => {
        const title = paper.title.toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const combinedText = title + ' ' + abstract;
        return (combinedText.includes('social media') || combinedText.includes('digital') || combinedText.includes('internet') || combinedText.includes('online') || combinedText.includes('technology')) &&
               (combinedText.includes('mental health') || combinedText.includes('adolescent') || combinedText.includes('depression') || combinedText.includes('anxiety') || combinedText.includes('psychological') || combinedText.includes('wellbeing'));
      }).length;
      
      console.log(`\n🎯 LIVE API Relevance Rate: ${relevantCount}/${data.papers.length} (${Math.round(relevantCount / data.papers.length * 100)}%)`);
      
      if (relevantCount < data.papers.length * 0.5) {
        console.log("\n❌ PROBLEM: Less than 50% of papers are relevant!");
        console.log("❌ The main website is still returning irrelevant papers.");
        console.log("\n🔧 Possible causes:");
        console.log("1. Code changes not deployed/restarted");
        console.log("2. Caching issues");
        console.log("3. Different code path in production vs test");
        console.log("4. Enhanced queries not being used");
      } else {
        console.log("\n✅ SUCCESS: Most papers are relevant!");
      }
    } else {
      console.log("❌ No papers returned from live API");
    }
    
    if (data.error) {
      console.log("❌ API Error:", data.error);
    }
    
  } catch (error) {
    console.error("❌ Failed to test live API:", error.message);
  }
}

testLiveAPI();

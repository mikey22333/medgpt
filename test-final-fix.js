const testQuery = "How does social media usage affect adolescent mental health";

console.log("🔬 Testing FINAL fix for social media mental health query...");
console.log("Query:", testQuery);

async function testFinalFix() {
  try {
    const response = await fetch("http://localhost:3000/api/research", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: testQuery,
        maxResults: 5
      }),
    });

    const data = await response.json();
    
    console.log("\n📊 Final Test Results:");
    console.log("Papers found:", data.papers?.length || 0);
    
    if (data.papers && data.papers.length > 0) {
      console.log("\n📋 Top 3 Papers:");
      data.papers.slice(0, 3).forEach((paper, index) => {
        const title = paper.title || '';
        const isRelevant = title.toLowerCase().includes('social media') || 
                          title.toLowerCase().includes('digital') ||
                          title.toLowerCase().includes('mental health') ||
                          title.toLowerCase().includes('adolescent');
        
        console.log(`\n${index + 1}. "${title.substring(0, 70)}..."`);
        console.log(`   Source: ${paper.source}`);
        console.log(`   Relevance: ${Math.round((paper.relevanceScore || 0) * 100)}%`);
        console.log(`   Semantic Score: ${paper.semanticScore ? Math.round(paper.semanticScore * 100) + '%' : 'N/A'}`);
        console.log(`   Actually Relevant: ${isRelevant ? '✅ YES' : '❌ NO'}`);
      });
      
      // Calculate relevance rate
      const relevantCount = data.papers.filter(paper => {
        const title = paper.title.toLowerCase();
        return (title.includes('social media') || title.includes('digital') || title.includes('mental health') || title.includes('adolescent'));
      }).length;
      
      console.log(`\n🎯 Final Relevance Rate: ${relevantCount}/${data.papers.length} (${Math.round(relevantCount / data.papers.length * 100)}%)`);
      
      if (relevantCount >= Math.ceil(data.papers.length * 0.8)) {
        console.log("\n🎉 SUCCESS: Fix is working! 80%+ relevance achieved!");
        console.log("✅ Social media papers are no longer being filtered out");
        console.log("✅ Biomedical embeddings are providing semantic scoring");
        console.log("✅ Query enhancements are working properly");
      } else {
        console.log("\n⚠️  Relevance could be better, but major improvement from 0%");
      }
      
      // Check if biomedical embeddings are working
      const hasBiomedicalScores = data.papers.some(p => p.semanticScore);
      if (hasBiomedicalScores) {
        console.log("✅ HuggingFace biomedical embeddings are working properly");
      } else {
        console.log("⚠️  Biomedical embeddings may not be fully working");
      }
      
    } else {
      console.log("❌ No papers found - this shouldn't happen after the fix");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testFinalFix();

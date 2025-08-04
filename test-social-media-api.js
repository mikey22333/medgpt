const testQuery = "How does social media usage affect adolescent mental health";

console.log("🧪 Testing social media mental health research API...");
console.log("Query:", testQuery);

fetch("http://localhost:3000/api/research", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: testQuery,
    maxResults: 5,
    includeAbstracts: true
  }),
})
.then(response => response.json())
.then(data => {
  console.log("\n📊 API Response Summary:");
  console.log("Total papers found:", data.papers?.length || 0);
  
  if (data.papers && data.papers.length > 0) {
    console.log("\n📋 Top Papers:");
    data.papers.slice(0, 3).forEach((paper, index) => {
      console.log(`\n${index + 1}. "${paper.title}"`);
      console.log(`   Source: ${paper.source}`);
      console.log(`   Relevance: ${paper.relevanceScore ? Math.round(paper.relevanceScore * 100) : 'N/A'}%`);
      if (paper.semanticScore) {
        console.log(`   Semantic Score: ${Math.round(paper.semanticScore * 100)}%`);
      }
      if (paper.journal) {
        console.log(`   Journal: ${paper.journal}`);
      }
      
      // Check if paper is actually relevant to social media + mental health
      const title = paper.title.toLowerCase();
      const abstract = (paper.abstract || '').toLowerCase();
      const isRelevant = (title.includes('social media') || title.includes('digital') || title.includes('internet') || title.includes('online')) &&
                        (title.includes('mental health') || title.includes('adolescent') || title.includes('depression') || title.includes('anxiety') || title.includes('psychological'));
      
      console.log(`   Actually Relevant: ${isRelevant ? '✅ YES' : '❌ NO'}`);
    });
    
    // Count how many papers are actually relevant
    const relevantCount = data.papers.filter(paper => {
      const title = paper.title.toLowerCase();
      const abstract = (paper.abstract || '').toLowerCase();
      const combinedText = title + ' ' + abstract;
      return (combinedText.includes('social media') || combinedText.includes('digital') || combinedText.includes('internet') || combinedText.includes('online')) &&
             (combinedText.includes('mental health') || combinedText.includes('adolescent') || combinedText.includes('depression') || combinedText.includes('anxiety') || combinedText.includes('psychological'));
    }).length;
    
    console.log(`\n🎯 Relevance Rate: ${relevantCount}/${data.papers.length} (${Math.round(relevantCount / data.papers.length * 100)}%)`);
    
    if (relevantCount === 0) {
      console.log("\n❌ ISSUE: No papers are actually about social media and mental health!");
      console.log("Sample irrelevant titles:");
      data.papers.slice(0, 3).forEach((paper, index) => {
        console.log(`   ${index + 1}. "${paper.title.substring(0, 80)}..."`);
      });
    } else {
      console.log("\n✅ SUCCESS: Found relevant social media + mental health papers!");
    }
  } else {
    console.log("❌ No papers found");
  }
  
  if (data.error) {
    console.log("❌ Error:", data.error);
  }
})
.catch(error => {
  console.error("❌ Request failed:", error.message);
});

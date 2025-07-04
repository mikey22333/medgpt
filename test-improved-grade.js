// Test the improved GRADE system and search quality

const testQuery = "migraine treatment";

console.log("🧪 Testing Improved GRADE System and Search Quality");
console.log("=".repeat(60));

// Test the API endpoint
fetch('http://localhost:3000/api/research', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: 'test-session',
    mode: 'research',
    query: testQuery
  })
})
.then(response => response.json())
.then(data => {
  console.log("✅ API Response received");
  
  if (data.response) {
    const response = data.response;
    
    // Check for GRADE indicators
    const hasGRADEScores = response.includes('⭐⭐⭐⭐') || response.includes('⭐⭐⭐⚪') || 
                          response.includes('⭐⭐⚪⚪') || response.includes('⭐⚪⚪⚪');
    console.log(hasGRADEScores ? "✅ GRADE scores present" : "❌ GRADE scores missing");
    
    // Check for DOI/PMID links
    const hasCitationLinks = response.includes('[DOI]') || response.includes('[PMID:');
    console.log(hasCitationLinks ? "✅ Citation links present" : "❌ Citation links missing");
    
    // Check for CGRP/newer treatments
    const hasModernTreatments = response.includes('CGRP') || response.includes('gepant') || 
                               response.includes('erenumab') || response.includes('ubrogepant');
    console.log(hasModernTreatments ? "✅ Modern migraine treatments mentioned" : "❌ Modern treatments missing");
    
    // Check for GRADE summary table
    const hasGRADETable = response.includes('Evidence Quality') && response.includes('Papers') && 
                         response.includes('Clinical Confidence');
    console.log(hasGRADETable ? "✅ GRADE summary table present" : "❌ GRADE summary table missing");
    
    // Check for visual indicators
    const hasVisualIndicators = response.includes('🟢') || response.includes('🟡') || 
                               response.includes('🟠') || response.includes('🔴');
    console.log(hasVisualIndicators ? "✅ Visual quality indicators present" : "❌ Visual indicators missing");
    
    console.log("\n📊 Sample GRADE Output:");
    const gradeMatches = response.match(/\*\*📊 GRADE Evidence Quality Assessment:\*\*[\s\S]*?(?=\n\n|\n\[)/);
    if (gradeMatches) {
      console.log(gradeMatches[0].substring(0, 500) + "...");
    }
    
    console.log("\n🔗 Sample Citation Links:");
    const citationMatches = response.match(/🔗 \[DOI\][\s\S]*?(\n|$)/g);
    if (citationMatches) {
      console.log(citationMatches.slice(0, 2).join('\n'));
    }
    
  } else {
    console.log("❌ No response content");
  }
  
  if (data.citations) {
    console.log(`\n📚 Found ${data.citations.length} citations`);
    data.citations.forEach((citation, index) => {
      console.log(`${index + 1}. ${citation.title} (${citation.source})`);
      if (citation.doi) console.log(`   DOI: ${citation.doi}`);
      if (citation.pmid) console.log(`   PMID: ${citation.pmid}`);
    });
  }
})
.catch(error => {
  console.error("❌ Test failed:", error.message);
  console.log("💡 Make sure the development server is running: npm run dev");
});

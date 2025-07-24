// Debug test for COVID-19 research
// Run this in browser console at http://localhost:3001

async function debugCovidResearch() {
  try {
    console.log('🧪 DEBUGGING COVID-19 Research System...\n');
    
    const query = "long-term effects of COVID-19 on cardiovascular system";
    console.log(`Query: "${query}"`);
    
    const startTime = Date.now();
    
    const response = await fetch('/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        maxResults: 10,
        includeAbstracts: true
      })
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Request took ${duration}ms`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      return;
    }

    const data = await response.json();
    
    console.log(`\n📊 RESEARCH RESULTS ANALYSIS:`);
    console.log(`Total papers found: ${data.papers?.length || 0}`);
    console.log(`Total sources: ${data.sources?.length || 0}`);
    
    if (data.papers && data.papers.length > 0) {
      console.log(`\n📑 PAPER ANALYSIS:`);
      
      // Check COVID relevance
      let covidRelevant = 0;
      let medicalRelevant = 0;
      let totallyIrrelevant = 0;
      
      data.papers.forEach((paper, index) => {
        const title = (paper.title || '').toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const combined = `${title} ${abstract}`;
        
        // Check COVID relevance
        const isCovidRelated = [
          'covid', 'covid-19', 'sars-cov-2', 'coronavirus',
          'long covid', 'post covid', 'pandemic'
        ].some(term => combined.includes(term));
        
        // Check medical relevance
        const isMedical = [
          'patient', 'clinical', 'medical', 'health', 'disease',
          'treatment', 'therapy', 'hospital', 'doctor'
        ].some(term => combined.includes(term));
        
        // Check if completely irrelevant
        const isIrrelevant = [
          'machine learning', 'lstm', 'neural network', 'algorithm',
          'software', 'model', 'fitting', 'statistical', 'mathematics',
          'physics', 'chemistry', 'engineering', 'computer science'
        ].some(term => combined.includes(term)) && !isMedical;
        
        console.log(`\n${index + 1}. ${paper.title}`);
        console.log(`   Journal: ${paper.journal || 'Unknown'}`);
        console.log(`   Source: ${paper.source || 'Unknown'}`);
        console.log(`   Relevance Score: ${paper.relevanceScore || 'Unknown'}`);
        console.log(`   COVID Related: ${isCovidRelated ? '✅' : '❌'}`);
        console.log(`   Medical: ${isMedical ? '✅' : '❌'}`);
        console.log(`   Irrelevant: ${isIrrelevant ? '❌' : '✅'}`);
        
        if (isCovidRelated) covidRelevant++;
        if (isMedical) medicalRelevant++;
        if (isIrrelevant) totallyIrrelevant++;
      });
      
      console.log(`\n📈 RELEVANCE SUMMARY:`);
      console.log(`COVID-19 Related: ${covidRelevant}/${data.papers.length} (${Math.round(covidRelevant/data.papers.length*100)}%)`);
      console.log(`Medical Related: ${medicalRelevant}/${data.papers.length} (${Math.round(medicalRelevant/data.papers.length*100)}%)`);
      console.log(`Completely Irrelevant: ${totallyIrrelevant}/${data.papers.length} (${Math.round(totallyIrrelevant/data.papers.length*100)}%)`);
      
      if (covidRelevant === 0) {
        console.log(`\n❌ CRITICAL ISSUE: NO COVID-19 PAPERS FOUND!`);
        console.log('This indicates the research system is not working like Consensus AI');
      } else if (covidRelevant >= data.papers.length * 0.7) {
        console.log(`\n✅ EXCELLENT: High COVID-19 relevance (>70%)`);
      } else if (covidRelevant >= data.papers.length * 0.4) {
        console.log(`\n⚠️ MODERATE: Some COVID-19 relevance (40-70%)`);
      } else {
        console.log(`\n❌ POOR: Low COVID-19 relevance (<40%)`);
      }
      
      if (totallyIrrelevant > 0) {
        console.log(`\n❌ WARNING: ${totallyIrrelevant} completely irrelevant papers found!`);
        console.log('Irrelevant papers indicate filtering problems');
      }
      
    } else {
      console.log(`\n❌ NO PAPERS FOUND - Check API and database connections`);
    }
    
    if (data.error) {
      console.error('❌ API Error:', data.error);
    }
    
    console.log('\n🔍 To run this test: Copy and paste this code into browser console at localhost:3001');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Running COVID-19 research debug test...');
  debugCovidResearch();
} else {
  console.log('📋 Copy this code and run in browser console at http://localhost:3001');
}

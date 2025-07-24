/**
 * Test the FIXED Medical Research System
 * This tests the actual fixes made to the research API route
 */

async function testFixedMedicalSystem() {
  console.log('🧪 Testing FIXED Medical Research System...\n');
  
  const testQueries = [
    {
      query: "long-term effects of COVID-19 on various organ systems",
      description: "COVID-19 Long-term Effects (should find relevant medical papers)"
    },
    {
      query: "lifestyle interventions for hypertension management",
      description: "Hypertension Management (should find clinical studies)"
    },
    {
      query: "metformin effects on cardiovascular outcomes",
      description: "Metformin Cardiovascular (should find pharmaceutical research)"
    }
  ];

  for (const test of testQueries) {
    console.log(`\n🔍 Testing: ${test.description}`);
    console.log(`Query: "${test.query}"`);
    console.log('─'.repeat(80));
    
    try {
      const response = await fetch('http://localhost:3000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: test.query,
          sessionId: 'test-session',
          mode: 'comprehensive',
          maxResults: 10
        })
      });

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      if (data.citations && data.citations.length > 0) {
        console.log(`✅ Found ${data.citations.length} citations`);
        
        // Check for medical relevance
        let medicalCount = 0;
        let nonMedicalCount = 0;
        
        data.citations.forEach((citation, index) => {
          const title = citation.title.toLowerCase();
          const abstract = (citation.abstract || '').toLowerCase();
          const combined = `${title} ${abstract}`;
          
          // Check for medical terms
          const medicalTerms = [
            'patient', 'clinical', 'medical', 'treatment', 'therapy', 'disease',
            'health', 'covid', 'coronavirus', 'hypertension', 'cardiovascular',
            'blood pressure', 'metformin', 'diabetes', 'intervention'
          ];
          
          const hasMedicalTerms = medicalTerms.some(term => combined.includes(term));
          
          // Check for non-medical terms that should be excluded
          const nonMedicalTerms = [
            'business management', 'strategic management', 'fitting linear mixed',
            'long short-term memory', 'machine learning', 'deep learning',
            'organizational behavior', 'corporate strategy', 'psychology research'
          ];
          
          const hasNonMedicalTerms = nonMedicalTerms.some(term => combined.includes(term));
          
          if (hasMedicalTerms && !hasNonMedicalTerms) {
            medicalCount++;
            console.log(`   ✅ [${index + 1}] MEDICAL: "${citation.title.substring(0, 80)}..." (${citation.source})`);
          } else {
            nonMedicalCount++;
            console.log(`   ❌ [${index + 1}] NON-MEDICAL: "${citation.title.substring(0, 80)}..." (${citation.source})`);
          }
        });
        
        console.log(`\n📊 RESULTS ANALYSIS:`);
        console.log(`   Medical Papers: ${medicalCount}/${data.citations.length} (${Math.round(medicalCount/data.citations.length*100)}%)`);
        console.log(`   Non-Medical Papers: ${nonMedicalCount}/${data.citations.length} (${Math.round(nonMedicalCount/data.citations.length*100)}%)`);
        
        if (medicalCount >= data.citations.length * 0.8) {
          console.log(`   🎯 QUALITY: EXCELLENT (${Math.round(medicalCount/data.citations.length*100)}% medical relevance)`);
        } else if (medicalCount >= data.citations.length * 0.6) {
          console.log(`   ⚠️  QUALITY: GOOD (${Math.round(medicalCount/data.citations.length*100)}% medical relevance)`);
        } else {
          console.log(`   ❌ QUALITY: POOR (${Math.round(medicalCount/data.citations.length*100)}% medical relevance - STILL NEEDS FIXES)`);
        }
        
      } else {
        console.log('❌ No citations found');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 FIXED SYSTEM TEST COMPLETE');
  console.log('✅ Check results above to see if medical filtering is now working properly');
  console.log('🎯 Goal: 80%+ medical relevance for all queries (vs previous <20%)');
  console.log('='.repeat(80));
}

// Run the test
testFixedMedicalSystem().catch(console.error);

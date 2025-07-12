/**
 * Citation Investigation Script
 * Diagnoses why only one citation is showing in the UI
 */

console.log('🔍 Citation Investigation - Diagnosing Single Citation Issue');
console.log('=' .repeat(60));

// Test the actual research API to see how many citations it returns
const testQuery = async () => {
  try {
    console.log('\n1️⃣ Testing Research API Citation Retrieval:');
    console.log('-' .repeat(50));
    
    const response = await fetch('http://localhost:3000/api/test-research?query=stroke%20prevention&maxResults=10');
    
    if (!response.ok) {
      console.log('❌ API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 Research API Results:');
    console.log(`  Total Papers Found: ${data.results.totalPapersFound}`);
    console.log(`  Citations Returned: ${data.results.citationsReturned}`);
    console.log(`  Sources: ${data.results.sources.join(', ')}`);
    
    console.log('\n📝 Citation Details:');
    data.results.citations.forEach((citation, index) => {
      console.log(`  ${index + 1}. Title: ${citation.title?.substring(0, 60)}...`);
      console.log(`     Journal: ${citation.journal || 'Unknown'}`);
      console.log(`     PMID: ${citation.pmid || 'N/A'}`);
      console.log(`     DOI: ${citation.doi || 'N/A'}`);
      console.log(`     Year: ${citation.year || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Error testing research API:', error.message);
  }
};

// Test different query types to see if the issue is query-specific
const testMultipleQueries = async () => {
  console.log('\n2️⃣ Testing Multiple Query Types:');
  console.log('-' .repeat(50));
  
  const testQueries = [
    'stroke prevention',
    'atrial fibrillation anticoagulation',
    'diabetes management',
    'hypertension treatment'
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing query: "${query}"`);
      const response = await fetch(`http://localhost:3000/api/test-research?query=${encodeURIComponent(query)}&maxResults=5`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Found ${data.results.citationsReturned} citations from ${data.results.sources.length} sources`);
        console.log(`  📚 Sources: ${data.results.sources.join(', ')}`);
      } else {
        console.log(`  ❌ API error: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
};

// Simulate the citation filtering process
const simulateFiltering = () => {
  console.log('\n3️⃣ Simulating Citation Filtering Process:');
  console.log('-' .repeat(50));
  
  // Sample citations similar to what might come from research APIs
  const sampleCitations = [
    {
      title: 'Anticoagulation Failure in Stroke: Causes, Risk Factors, and Treatment',
      journal: 'Journal of Stroke and Cerebrovascular Diseases',
      pmid: '40494578',
      doi: '10.5853/jos.2025.00206',
      year: 2025,
      abstract: 'Anticoagulation is crucial to reducing the risk of cardioembolic strokes...'
    },
    {
      title: 'AHA/ASA 2021 Guidelines for Stroke Prevention',
      journal: 'Stroke',
      pmid: '12345678',
      doi: '10.1161/stroke.2021.123456',
      year: 2021,
      abstract: 'Clinical practice guidelines for stroke prevention...'
    },
    {
      title: 'NAVIGATE ESUS Trial Results: Rivaroxaban vs Aspirin',
      journal: 'New England Journal of Medicine',
      pmid: '87654321',
      doi: '10.1056/nejm.2018.123456',
      year: 2018,
      abstract: 'Randomized controlled trial comparing rivaroxaban to aspirin...'
    },
    {
      title: 'FDA Adverse Event Report: Warfarin Bleeding Risk',
      journal: 'FDA FAERS Database',
      pmid: null,
      doi: null,
      year: 2024,
      abstract: 'Adverse event reporting for warfarin bleeding complications...'
    }
  ];
  
  console.log('📋 Sample Citations Before Filtering:');
  sampleCitations.forEach((citation, index) => {
    console.log(`  ${index + 1}. ${citation.title}`);
    console.log(`     Journal: ${citation.journal}`);
    console.log(`     Year: ${citation.year}`);
  });
  
  // Simulate filtering logic
  console.log('\n🔍 Applying Quality Filters:');
  
  const lowQualityIndicators = [
    'fda adverse event',
    'drug ineffective', 
    'letter to editor',
    'conference abstract only'
  ];
  
  const filtered = sampleCitations.filter(citation => {
    const combined = `${citation.title?.toLowerCase() || ''} ${citation.journal?.toLowerCase() || ''}`;
    const isLowQuality = lowQualityIndicators.some(indicator => 
      combined.includes(indicator)
    );
    
    if (isLowQuality) {
      console.log(`  ❌ Filtered out: ${citation.title?.substring(0, 50)}... (Low quality)`);
    } else {
      console.log(`  ✅ Kept: ${citation.title?.substring(0, 50)}...`);
    }
    
    return !isLowQuality;
  });
  
  console.log(`\n📊 Filtering Results:`);
  console.log(`  Original: ${sampleCitations.length} citations`);
  console.log(`  After filtering: ${filtered.length} citations`);
  console.log(`  Filtered out: ${sampleCitations.length - filtered.length} citations`);
  
  // Simulate scoring
  console.log('\n🏆 Citation Scoring (simulated):');
  const scored = filtered.map(citation => {
    let score = 10; // Base score
    
    const combined = `${citation.title?.toLowerCase() || ''} ${citation.journal?.toLowerCase() || ''}`;
    
    // Guidelines get high score
    if (combined.includes('guideline') || combined.includes('aha/asa')) {
      score += 80;
    }
    
    // Landmark trials get high score
    if (combined.includes('navigate') || combined.includes('respect')) {
      score += 100;
    }
    
    // High-impact journals
    if (combined.includes('nejm') || combined.includes('lancet') || combined.includes('stroke')) {
      score += 60;
    }
    
    return { citation, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  scored.forEach((item, index) => {
    console.log(`  ${index + 1}. Score ${item.score}: ${item.citation.title?.substring(0, 50)}...`);
  });
};

// Check for potential UI rendering issues
const checkUIIssues = () => {
  console.log('\n4️⃣ Potential UI Rendering Issues:');
  console.log('-' .repeat(50));
  
  console.log('🎯 Common Causes of Single Citation Display:');
  console.log('  1. ❓ Research API returning limited results');
  console.log('  2. ❓ Citation filtering too aggressive');
  console.log('  3. ❓ React key conflicts in citation list');
  console.log('  4. ❓ CSS/styling hiding additional citations');
  console.log('  5. ❓ JavaScript errors preventing full rendering');
  
  console.log('\n🔧 Debugging Steps:');
  console.log('  1. ✅ Check browser console for JavaScript errors');
  console.log('  2. ✅ Verify network requests to research APIs');
  console.log('  3. ✅ Inspect element to see if citations are hidden by CSS');
  console.log('  4. ✅ Check citation filtering logs in console');
  console.log('  5. ✅ Test with different medical queries');
  
  console.log('\n⚡ Quick Fixes Applied:');
  console.log('  ✅ Increased citation limit from 8 to 12');
  console.log('  ✅ Made filtering more lenient (only very low quality filtered)');
  console.log('  ✅ Added detailed console logging');
  console.log('  ✅ Added debug information panel for low citation counts');
};

// Run all tests
const runInvestigation = async () => {
  await testQuery();
  await testMultipleQueries();
  simulateFiltering();
  checkUIIssues();
  
  console.log('\n🎉 Investigation Complete!');
  console.log('=' .repeat(60));
  console.log('💡 Next Steps:');
  console.log('1. Check browser console when running the app');
  console.log('2. Look for the debug information panel in the UI');
  console.log('3. Verify research API is returning multiple citations');
  console.log('4. Test different medical queries to see if issue persists');
  console.log('5. Check network tab for API request/response details');
};

// Export for browser testing
if (typeof window !== 'undefined') {
  window.investigateCitations = runInvestigation;
  console.log('🌐 Browser mode: Run window.investigateCitations() to start investigation');
} else {
  runInvestigation();
}

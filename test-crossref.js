// CrossRef Integration Test Script
// Run this to test the CrossRef integration

const testCrossRefAPI = async () => {
  console.log('🧪 Testing CrossRef API Integration...\n');

  const tests = [
    {
      name: 'General Medical Search',
      endpoint: '/api/research/medical',
      body: {
        query: 'diabetes treatment metformin',
        type: 'general',
        limit: 5,
        sources: ['crossref']
      }
    },
    {
      name: 'Drug Research',
      endpoint: '/api/research/medical',
      body: {
        query: 'aspirin cardiovascular prevention',
        type: 'drug',
        limit: 5,
        sources: ['crossref']
      }
    },
    {
      name: 'Clinical Trials',
      endpoint: '/api/research/medical',
      body: {
        query: 'covid vaccine efficacy',
        type: 'clinical-trials',
        limit: 5,
        sources: ['crossref']
      }
    },
    {
      name: 'Direct CrossRef Search',
      endpoint: '/api/research/crossref',
      params: '?query=hypertension treatment&type=disease&limit=3'
    },
    {
      name: 'CrossRef DOI Lookup',
      endpoint: '/api/research/crossref',
      params: '?doi=10.1056/NEJMoa2034577'
    },
    {
      name: 'Combined Sources (PubMed + CrossRef)',
      endpoint: '/api/research/medical',
      body: {
        query: 'alzheimer disease biomarkers',
        type: 'recent',
        limit: 8,
        sources: ['pubmed', 'crossref']
      }
    }
  ];

  for (const test of tests) {
    console.log(`📋 Running: ${test.name}`);
    
    try {
      const url = `http://localhost:3000${test.endpoint}${test.params || ''}`;
      const options = {
        method: test.body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (test.endpoint.includes('medical')) {
        console.log(`✅ Success: Found ${data.results?.length || 0} results`);
        console.log(`   Total: ${data.insights?.totalResults || 0}, High Confidence: ${data.insights?.highConfidenceCount || 0}`);
        console.log(`   Sources: PubMed(${data.insights?.sourceBreakdown?.pubmed || 0}), CrossRef(${data.insights?.sourceBreakdown?.crossref || 0})`);
      } else {
        console.log(`✅ Success: Found ${data.citations?.length || data.totalResults || 0} results`);
        if (data.citations?.[0]) {
          console.log(`   Sample: "${data.citations[0].title?.substring(0, 60)}..."`);
        }
      }
    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 CrossRef API Integration Tests Complete!\n');
  console.log('📊 To see visual results, visit: http://localhost:3000/crossref-demo');
};

// Export for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCrossRefAPI };
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  testCrossRefAPI().catch(console.error);
}

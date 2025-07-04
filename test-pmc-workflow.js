// Test the updated PubMed client with PMC database
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function testPubMedClientWithPMC() {
  console.log('🔬 Testing PubMed client with PMC database...');
  
  // Test the full workflow
  try {
    // Step 1: Search for articles
    console.log('📡 Step 1: Searching PMC...');
    const searchParams = new URLSearchParams({
      db: 'pmc',
      term: 'migraine prevention treatment',
      retmax: '5',
      retmode: 'json'
    });
    
    const searchResponse = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${searchParams}`);
    const searchData = await searchResponse.json();
    
    if (searchData.esearchresult?.idlist?.length > 0) {
      const pmids = searchData.esearchresult.idlist.slice(0, 3);
      console.log('✅ Found PMC IDs:', pmids);
      
      // Step 2: Fetch article details
      console.log('📡 Step 2: Fetching article details...');
      const fetchParams = new URLSearchParams({
        db: 'pmc',
        id: pmids.join(','),
        retmode: 'xml'
      });
      
      const fetchResponse = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams}`);
      const xmlText = await fetchResponse.text();
      
      console.log('✅ XML response length:', xmlText.length);
      
      // Check XML structure for PMC
      if (xmlText.includes('<pmc-articleset>')) {
        console.log('✅ XML contains PMC article set');
      } else if (xmlText.includes('<PubmedArticle>')) {
        console.log('✅ XML contains PubmedArticle elements');
      } else {
        console.log('❌ XML structure unknown');
        console.log('XML preview:', xmlText.substring(0, 1000));
      }
    } else {
      console.log('❌ No PMC IDs found');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPubMedClientWithPMC();

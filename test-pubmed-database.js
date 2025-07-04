// Test PubMed API directly to check database support
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function testPubMedDatabase() {
  console.log('🔬 Testing PubMed database support...');
  
  // Test 1: Search in pubmed database
  console.log('📡 Testing search in pubmed database...');
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: 'migraine prevention',
    retmax: '3',
    retmode: 'json'
  });
  
  try {
    const searchResponse = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${searchParams}`);
    const searchData = await searchResponse.json();
    
    console.log('✅ Search response:', JSON.stringify(searchData, null, 2));
    
    if (searchData.esearchresult?.idlist?.length > 0) {
      const pmids = searchData.esearchresult.idlist.slice(0, 2);
      console.log('📄 Found PMIDs:', pmids);
      
      // Test 2: Fetch details for these PMIDs
      console.log('📡 Testing fetch in pubmed database...');
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'xml'
      });
      
      const fetchResponse = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams}`);
      const xmlText = await fetchResponse.text();
      
      console.log('✅ Fetch response length:', xmlText.length);
      console.log('✅ XML preview:', xmlText.substring(0, 500) + '...');
      
      // Check if XML contains expected structure
      if (xmlText.includes('<PubmedArticle>')) {
        console.log('✅ XML contains PubmedArticle elements');
      } else {
        console.log('❌ XML does not contain PubmedArticle elements');
      }
    } else {
      console.log('❌ No PMIDs found in search');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPubMedDatabase();

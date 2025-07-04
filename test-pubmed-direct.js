// Test PubMed API directly
async function testPubMedDirect() {
  try {
    console.log('🔬 Testing PubMed API directly...');
    
    // Test 1: Simple search
    const searchParams = new URLSearchParams({
      db: "pubmed",
      term: "migraine treatment",
      retmax: "5",
      retmode: "json",
      sort: "relevance",
    });

    console.log('📡 Making search request to PubMed...');
    const searchResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`);
    
    if (!searchResponse.ok) {
      console.error('❌ Search failed:', searchResponse.statusText);
      return;
    }

    const searchData = await searchResponse.json();
    console.log('✅ Search response:', JSON.stringify(searchData, null, 2));
    
    const pmids = searchData.esearchresult?.idlist || [];
    console.log('📄 Found PMIDs:', pmids);
    
    if (pmids.length === 0) {
      console.log('⚠️ No articles found in search');
      return;
    }

    // Test 2: Fetch article details
    const fetchParams = new URLSearchParams({
      db: "pubmed",
      id: pmids.slice(0, 2).join(","), // Get first 2 articles
      retmode: "xml",
    });

    console.log('📡 Making fetch request to PubMed...');
    const fetchResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${fetchParams}`);
    
    if (!fetchResponse.ok) {
      console.error('❌ Fetch failed:', fetchResponse.statusText);
      return;
    }

    const xmlText = await fetchResponse.text();
    console.log('✅ XML response length:', xmlText.length);
    console.log('📄 XML sample (first 500 chars):', xmlText.substring(0, 500));

    // Check if XML contains expected structure
    if (xmlText.includes('<PubmedArticleSet>')) {
      console.log('✅ XML contains PubmedArticleSet');
    } else {
      console.log('❌ XML does not contain PubmedArticleSet');
    }

    if (xmlText.includes('<PubmedArticle>')) {
      console.log('✅ XML contains PubmedArticle');
    } else {
      console.log('❌ XML does not contain PubmedArticle');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testPubMedDirect();

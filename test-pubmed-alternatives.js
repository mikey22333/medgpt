const testPubMedAlternatives = async () => {
  console.log('=== Testing PubMed API Alternatives ===\n');
  
  // Test 1: Try different database names
  const databases = ['pubmed', 'pmc', 'medline'];
  
  for (const db of databases) {
    try {
      console.log(`Testing database: ${db}`);
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=${db}&term=migraine+treatment&retmax=3&retmode=json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      
      if (data.esearchresult?.ERROR) {
        console.log(`❌ Error: ${data.esearchresult.ERROR}`);
      } else if (data.esearchresult?.idlist) {
        console.log(`✅ Success! Found ${data.esearchresult.idlist.length} IDs`);
        console.log(`Sample IDs: ${data.esearchresult.idlist.slice(0, 2).join(', ')}`);
      }
      console.log('---');
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      console.log('---');
    }
  }
  
  // Test 2: Try with different API endpoint format
  console.log('\nTesting alternative endpoint...');
  try {
    const altUrl = 'https://pubmed.ncbi.nlm.nih.gov/api/citmatch?method=search&db=pubmed&term=migraine+treatment&retmax=3';
    const response = await fetch(altUrl);
    console.log(`Alternative endpoint status: ${response.status}`);
  } catch (error) {
    console.log(`Alternative endpoint error: ${error.message}`);
  }
  
  // Test 3: Try with different user agent
  console.log('\nTesting with User-Agent header...');
  try {
    const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=migraine+treatment&retmax=3&retmode=json';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MedGPT-Scholar/1.0 (mailto:research@medgpt.com)'
      }
    });
    const data = await response.json();
    
    console.log(`With User-Agent - Status: ${response.status}`);
    if (data.esearchresult?.ERROR) {
      console.log(`❌ Error: ${data.esearchresult.ERROR}`);
    } else if (data.esearchresult?.idlist) {
      console.log(`✅ Success! Found ${data.esearchresult.idlist.length} IDs`);
    }
  } catch (error) {
    console.log(`User-Agent test error: ${error.message}`);
  }
};

testPubMedAlternatives();

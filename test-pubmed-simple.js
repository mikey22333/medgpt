const testPubMedAPI = async () => {
  try {
    // Try different database names
    const databases = ['pubmed', 'pmc', 'medline'];
    
    for (const db of databases) {
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=${db}&term=migraine&retmax=5&retmode=json`;
      console.log(`\nTesting PubMed API with database: ${db}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      
      if (data.esearchresult && data.esearchresult.idlist) {
        console.log('Found IDs:', data.esearchresult.idlist.length);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testPubMedAPI();

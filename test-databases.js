// Test different NCBI databases
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function testDatabases() {
  console.log('🔬 Testing different NCBI databases...');
  
  const databases = ['pubmed', 'pmc', 'medline', 'books', 'pubmedhealth'];
  
  for (const db of databases) {
    console.log(`\n📡 Testing database: ${db}`);
    
    const searchParams = new URLSearchParams({
      db: db,
      term: 'migraine prevention',
      retmax: '3',
      retmode: 'json'
    });
    
    try {
      const searchResponse = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${searchParams}`);
      const searchData = await searchResponse.json();
      
      if (searchData.esearchresult?.ERROR) {
        console.log(`❌ ${db}: ${searchData.esearchresult.ERROR}`);
      } else if (searchData.esearchresult?.idlist?.length > 0) {
        console.log(`✅ ${db}: Found ${searchData.esearchresult.idlist.length} results`);
        console.log(`   Sample IDs: ${searchData.esearchresult.idlist.slice(0, 3).join(', ')}`);
      } else {
        console.log(`⚠️ ${db}: No results found`);
      }
    } catch (error) {
      console.error(`❌ ${db}: ${error.message}`);
    }
  }
}

testDatabases();

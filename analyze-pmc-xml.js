// Analyze PMC XML structure to understand parsing needs
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function analyzePMCXML() {
  console.log('🔬 Analyzing PMC XML structure...');
  
  try {
    // Get sample PMC article
    const fetchParams = new URLSearchParams({
      db: 'pmc',
      id: '12224812', // Single article for analysis
      retmode: 'xml'
    });
    
    const fetchResponse = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams}`);
    const xmlText = await fetchResponse.text();
    
    console.log('✅ XML length:', xmlText.length);
    console.log('✅ XML preview (first 2000 chars):');
    console.log(xmlText.substring(0, 2000));
    
    // Look for key elements
    const elements = [
      'pmc-articleset',
      'article',
      'article-meta',
      'title-group',
      'article-title',
      'abstract',
      'contrib-group',
      'contrib',
      'name',
      'journal-meta',
      'journal-title',
      'pub-date',
      'article-id'
    ];
    
    console.log('\n✅ Found elements:');
    elements.forEach(element => {
      if (xmlText.includes(`<${element}`)) {
        console.log(`  ✅ ${element}`);
      } else {
        console.log(`  ❌ ${element}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzePMCXML();

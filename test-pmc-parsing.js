// Test PMC XML parsing with the actual structure
const { XMLParser } = require('fast-xml-parser');

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function testPMCParsing() {
  console.log('🔬 Testing PMC XML parsing...');
  
  try {
    // Get sample PMC article
    const fetchParams = new URLSearchParams({
      db: 'pmc',
      id: '12224812',
      retmode: 'xml'
    });
    
    const fetchResponse = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams}`);
    const xmlText = await fetchResponse.text();
    
    console.log('✅ Got XML, parsing...');
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
      textNodeName: "#text",
      parseTagValue: false,
      parseNodeValue: false
    });
    
    const result = parser.parse(xmlText);
    
    console.log('✅ Parsed XML structure:');
    console.log('Top level keys:', Object.keys(result));
    
    if (result['pmc-articleset']) {
      console.log('PMC articleset found');
      const articleset = result['pmc-articleset'];
      
      if (articleset.article) {
        console.log('Articles found:', Array.isArray(articleset.article) ? articleset.article.length : 1);
        
        const article = Array.isArray(articleset.article) ? articleset.article[0] : articleset.article;
        console.log('Article structure keys:', Object.keys(article));
        
        if (article.front) {
          console.log('Front matter found');
          const front = article.front;
          
          if (front['article-meta']) {
            console.log('Article meta found');
            const meta = front['article-meta'];
            
            // Check title
            if (meta['title-group']) {
              console.log('Title group found');
              const titleGroup = meta['title-group'];
              console.log('Title:', titleGroup['article-title']);
            }
            
            // Check article IDs
            if (meta['article-id']) {
              console.log('Article IDs found:', meta['article-id'].length);
              meta['article-id'].forEach((id, index) => {
                console.log(`ID ${index}:`, id);
              });
            }
            
            // Check abstract
            if (meta.abstract) {
              console.log('Abstract found');
              console.log('Abstract type:', typeof meta.abstract);
              console.log('Abstract keys:', Object.keys(meta.abstract));
            }
            
            // Check authors
            if (meta['contrib-group']) {
              console.log('Contrib group found');
              const contribGroup = meta['contrib-group'];
              if (contribGroup.contrib) {
                console.log('Contributors:', Array.isArray(contribGroup.contrib) ? contribGroup.contrib.length : 1);
              }
            }
          }
          
          // Check journal info
          if (front['journal-meta']) {
            console.log('Journal meta found');
            const journalMeta = front['journal-meta'];
            if (journalMeta['journal-title-group']) {
              console.log('Journal title:', journalMeta['journal-title-group']['journal-title']);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Parsing failed:', error);
  }
}

testPMCParsing();

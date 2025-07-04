const testOpenAlexDirect = async () => {
  try {
    const url = 'https://api.openalex.org/works?search=migraine%20treatment&per_page=3&sort=cited_by_count:desc';
    console.log('Testing OpenAlex API directly...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Results count:', data.results ? data.results.length : 0);
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((paper, index) => {
        console.log(`\n${index + 1}. ${paper.title}`);
        console.log(`   Journal: ${paper.primary_location?.source?.display_name || 'Unknown'}`);
        console.log(`   Year: ${paper.publication_year}`);
        console.log(`   Citations: ${paper.cited_by_count}`);
        console.log(`   DOI: ${paper.doi}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testOpenAlexDirect();

const testSemanticScholar = async () => {
  try {
    const url = 'https://api.semanticscholar.org/graph/v1/paper/search?query=migraine+treatment&limit=5&fields=title,authors,journal,year,abstract,url';
    console.log('Testing Semantic Scholar API...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log('Found papers:', data.data.length);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testSemanticScholar();

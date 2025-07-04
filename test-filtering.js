// Test script to verify biomedical filtering
const testPapers = [
  {
    title: "Semiempirical GGA‐type density functional constructed with a long‐range dispersion correction",
    abstract: "A new density functional (DF) of the generalized gradient approximation (GGA) type for general chemistry applications termed B97‐D is proposed.",
    query: "Type 2 diabetes treatment"
  },
  {
    title: "Metformin: update on mechanisms of action and repurposing potential",
    abstract: "Currently, metformin is the first-line medication to treat type 2 diabetes mellitus (T2DM) in most guidelines and is used daily by >200 million patients.",
    query: "Type 2 diabetes treatment"
  },
  {
    title: "Emerging therapeutic approaches for the treatment of NAFLD and type 2 diabetes mellitus",
    abstract: "Non-alcoholic fatty liver disease (NAFLD) has emerged as the most prevalent liver disease in the world, yet there are still no approved pharmacological therapies to prevent or treat this condition.",
    query: "Type 2 diabetes treatment"
  }
];

function calculateRelevanceScore(title: string, abstract: string, query: string): number {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  const content = `${title} ${abstract}`.toLowerCase();
  
  // Biomedical domain filtering - reject papers from non-medical fields
  const nonMedicalKeywords = [
    'computational chemistry', 'density functional theory', 'quantum chemistry', 
    'polymer', 'catalyst', 'synthesis', 'chemical reaction', 'molecular dynamics',
    'materials science', 'physics', 'engineering', 'computer science', 'semiempirical',
    'gga-type density functional', 'dispersion correction', 'b97-d', 'dft',
    'quantum mechanics', 'ab initio', 'theoretical chemistry', 'surface chemistry',
    'crystallography', 'spectroscopy', 'nmr', 'infrared', 'raman', 'mass spectrometry',
    'chromatography', 'analytical chemistry', 'inorganic chemistry', 'organic chemistry'
  ];
  
  const isBiomedical = checkBiomedicalRelevance(title, abstract);
  if (!isBiomedical || nonMedicalKeywords.some(keyword => content.includes(keyword))) {
    return 0; // Completely filter out non-medical papers
  }
  
  let score = 0;
  searchTerms.forEach(term => {
    if (content.includes(term)) {
      score += 0.3;
    }
    // Bonus for title matches
    if (title.toLowerCase().includes(term)) {
      score += 0.2;
    }
  });
  
  return Math.min(score, 1.0);
}

function checkBiomedicalRelevance(title: string, abstract: string): boolean {
  const content = `${title} ${abstract}`.toLowerCase();
  
  const biomedicalKeywords = [
    'patient', 'clinical', 'medical', 'therapy', 'treatment', 'disease', 'diagnosis',
    'healthcare', 'medicine', 'pharmaceutical', 'drug', 'hospital', 'therapeutic',
    'diabetes', 'hypertension', 'cancer', 'cardiovascular', 'metformin', 'insulin'
  ];
  
  const matches = biomedicalKeywords.filter(keyword => content.includes(keyword)).length;
  return matches >= 2;
}

// Test filtering
console.log("Testing paper filtering:");
testPapers.forEach((paper, index) => {
  const score = calculateRelevanceScore(paper.title, paper.abstract, paper.query);
  const isBiomedical = checkBiomedicalRelevance(paper.title, paper.abstract);
  console.log(`\nPaper ${index + 1}: ${paper.title.substring(0, 50)}...`);
  console.log(`Relevance Score: ${score}`);
  console.log(`Is Biomedical: ${isBiomedical}`);
  console.log(`Should Include: ${score > 0.3}`);
});

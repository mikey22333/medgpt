// Test file to debug filtering logic issues

// Copy the key filtering functions from route.ts
function calculateRelevanceScore(title, abstract, query) {
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
  let querySpecificTerms = 0;
  
  // Check for exact query-specific matches first
  searchTerms.forEach(term => {
    if (content.includes(term)) {
      score += 0.3;
      querySpecificTerms++;
    }
    // Bonus for title matches
    if (title.toLowerCase().includes(term)) {
      score += 0.2;
    }
  });
  
  // Enhanced specificity check: require at least 20% of query terms to match
  const queryTermsRatio = querySpecificTerms / searchTerms.length;
  if (queryTermsRatio < 0.2) {
    return 0; // Not specific enough to the query
  }
  
  // Bonus for treatment-focused studies
  const treatmentKeywords = [
    'treatment', 'therapy', 'intervention', 'drug', 'medication', 'clinical trial',
    'randomized', 'placebo', 'efficacy', 'safety', 'adverse', 'side effect',
    'prophylaxis', 'prevention', 'management', 'guideline', 'recommendation'
  ];
  
  const treatmentMatches = treatmentKeywords.filter(keyword => content.includes(keyword)).length;
  if (treatmentMatches >= 2) {
    score += 0.3; // Increased bonus for treatment-focused papers
  }
  
  // Strong penalty for purely epidemiological studies when query is about treatment
  if (query.toLowerCase().includes('treatment') || query.toLowerCase().includes('therapy') || 
      query.toLowerCase().includes('prevention') || query.toLowerCase().includes('management') ||
      query.toLowerCase().includes('latest')) {
    const epidemiologicalKeywords = [
      'burden of disease', 'epidemiology', 'prevalence', 'incidence', 'mortality',
      'global burden', 'years lived with disability', 'disability-adjusted life years',
      'gbd study', 'systematic analysis for the global burden'
    ];
    
    const hasEpidemiological = epidemiologicalKeywords.some(keyword => content.includes(keyword));
    const hasTreatment = treatmentKeywords.some(keyword => content.includes(keyword));
    
    if (hasEpidemiological && !hasTreatment) {
      score *= 0.1; // Very strong penalty for epidemiological studies when treatment is requested
    }
  }
  
  // Additional scoring for medical relevance
  const medicalTermBonus = getMedicalTermBonus(content, query);
  score += medicalTermBonus;
  
  // Penalty for generic medical papers that don't match the specific condition
  const penaltyScore = applyGenericMedicalPenalty(content, query);
  score = Math.max(0, score - penaltyScore);
  
  return Math.min(score, 1.0);
}

function checkBiomedicalRelevance(title, abstract) {
  const content = `${title} ${abstract}`.toLowerCase();
  
  // Core biomedical keywords (more comprehensive)
  const biomedicalKeywords = [
    // Core medical terms
    'patient', 'clinical', 'medical', 'therapy', 'treatment', 'disease', 'diagnosis',
    'healthcare', 'medicine', 'pharmaceutical', 'drug', 'hospital', 'therapeutic',
    'epidemiology', 'pathology', 'physiology', 'anatomy', 'surgery', 'nursing',
    
    // Disease categories
    'diabetes', 'hypertension', 'cancer', 'cardiovascular', 'respiratory', 'neurological',
    'oncology', 'cardiology', 'neurology', 'gastroenterology', 'dermatology', 'psychiatry',
    'orthopedics', 'endocrinology', 'infectious', 'immunology', 'hematology', 'nephrology',
    
    // Clinical research terms
    'randomized', 'placebo', 'trial', 'cohort', 'case-control', 'meta-analysis',
    'systematic review', 'evidence-based', 'clinical trial', 'intervention', 'outcome',
    'efficacy', 'safety', 'adverse', 'side effect', 'dosage', 'administration',
    
    // Anatomical and physiological terms
    'blood', 'serum', 'plasma', 'tissue', 'organ', 'cell', 'molecular', 'genetic',
    'protein', 'enzyme', 'hormone', 'receptor', 'metabolism', 'immune', 'inflammatory',
    'vascular', 'cardiac', 'pulmonary', 'renal', 'hepatic', 'cerebral', 'spinal',
    
    // Healthcare delivery
    'health outcomes', 'quality of life', 'mortality', 'morbidity', 'prognosis',
    'screening', 'prevention', 'public health', 'health policy', 'cost-effectiveness',
    
    // Pharmaceutical terms
    'pharmacokinetics', 'pharmacodynamics', 'bioavailability', 'half-life', 'clearance',
    'contraindication', 'indication', 'prescription', 'over-the-counter', 'generic'
  ];
  
  // Reduced threshold - require at least 1 biomedical term for relevance
  const matches = biomedicalKeywords.filter(keyword => content.includes(keyword)).length;
  return matches >= 1;
}

function isBiomedicalPaper(title, abstract, query) {
  const content = `${title} ${abstract}`.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Medical keywords that indicate biomedical relevance
  const medicalKeywords = [
    'patient', 'clinical', 'medical', 'health', 'disease', 'treatment', 'therapy',
    'diagnosis', 'symptom', 'drug', 'medication', 'hospital', 'healthcare',
    'randomized', 'trial', 'study', 'research', 'outcome', 'efficacy', 'safety',
    'adverse', 'effect', 'mortality', 'morbidity', 'prevalence', 'incidence',
    'epidemiological', 'pathophysiology', 'pharmaceutical', 'therapeutic',
    'intervention', 'prognosis', 'diagnostic', 'screening', 'prevention'
  ];
  
  // Computer science/engineering keywords that suggest non-medical content
  const nonMedicalKeywords = [
    'algorithm', 'software', 'computer', 'programming', 'database', 'network',
    'machine learning', 'artificial intelligence', 'data mining', 'optimization',
    'simulation', 'model', 'framework', 'architecture', 'protocol', 'system',
    'engineering', 'mechanical', 'electrical', 'physics', 'chemistry'
  ];
  
  // Count medical vs non-medical keyword matches
  const medicalMatches = medicalKeywords.filter(keyword => content.includes(keyword)).length;
  const nonMedicalMatches = nonMedicalKeywords.filter(keyword => content.includes(keyword)).length;
  
  // Check if query itself contains medical terms
  const queryMedicalMatches = medicalKeywords.filter(keyword => queryLower.includes(keyword)).length;
  
  // Strong medical context required - more inclusive
  return (medicalMatches >= 1 || queryMedicalMatches >= 1) && nonMedicalMatches <= medicalMatches;
}

function getMedicalTermBonus(content, query) {
  const queryLower = query.toLowerCase();
  let bonus = 0;
  
  // Migraine-specific terms
  if (queryLower.includes('migraine')) {
    const migrainerTerms = [
      'cgrp', 'calcitonin gene-related peptide', 'gepant', 'ubrogepant', 'rimegepant',
      'erenumab', 'fremanezumab', 'galcanezumab', 'triptan', 'sumatriptan',
      'prophylaxis', 'headache', 'aura', 'episodic', 'chronic migraine'
    ];
    migrainerTerms.forEach(term => {
      if (content.includes(term)) bonus += 0.15;
    });
  }
  
  // Diabetes-specific terms
  if (queryLower.includes('diabetes')) {
    const diabetesTerms = [
      'glp-1', 'semaglutide', 'sglt2', 'metformin', 'insulin', 'glucose',
      'hemoglobin a1c', 'hba1c', 'glycemic control', 'beta cells'
    ];
    diabetesTerms.forEach(term => {
      if (content.includes(term)) bonus += 0.1;
    });
  }
  
  // Hypertension-specific terms
  if (queryLower.includes('hypertension') || queryLower.includes('blood pressure')) {
    const bpTerms = [
      'ace inhibitor', 'arb', 'beta blocker', 'calcium channel blocker',
      'diuretic', 'systolic', 'diastolic', 'antihypertensive'
    ];
    bpTerms.forEach(term => {
      if (content.includes(term)) bonus += 0.1;
    });
  }
  
  return Math.min(bonus, 0.3);
}

function applyGenericMedicalPenalty(content, query) {
  const queryLower = query.toLowerCase();
  
  // If query is about a specific condition, penalize papers about other conditions
  const conditionMap = {
    'migraine': ['diabetes', 'hypertension', 'blood pressure', 'cholesterol', 'cardiac', 'heart disease'],
    'diabetes': ['migraine', 'headache', 'cancer', 'cardiovascular'],
    'hypertension': ['migraine', 'diabetes', 'cancer'],
    'cancer': ['migraine', 'diabetes', 'hypertension'],
    'depression': ['migraine', 'diabetes', 'hypertension', 'cancer']
  };
  
  for (const [condition, unrelatedTerms] of Object.entries(conditionMap)) {
    if (queryLower.includes(condition)) {
      for (const unrelated of unrelatedTerms) {
        if (content.includes(unrelated) && !content.includes(condition)) {
          return 0.7; // Heavy penalty for papers about different conditions
        }
      }
    }
  }
  
  return 0; // No penalty
}

module.exports = {
  calculateRelevanceScore,
  checkBiomedicalRelevance,
  isBiomedicalPaper,
  getMedicalTermBonus,
  applyGenericMedicalPenalty
};

// Enhanced Query Processing System for Medical Research
export class MedicalQueryProcessor {
  
  // Extract medical intent and enhance query for better database searching
  static processQuery(originalQuery: string): {
    enhancedQuery: string;
    medicalIntent: string;
    studyTypes: string[];
    searchStrategy: 'comprehensive' | 'focused' | 'systematic';
    filters: {
      includeMetaAnalyses: boolean;
      includeRCTs: boolean;
      includeGuidelines: boolean;
      recentYearsOnly: number | null;
      excludeCaseReports: boolean;
    };
  } {
    const query = originalQuery.toLowerCase().trim();
    
    // Determine medical intent
    const medicalIntent = this.extractMedicalIntent(query);
    
    // Determine optimal study types
    const studyTypes = this.determineStudyTypes(query);
    
    // Determine search strategy
    const searchStrategy = this.determineSearchStrategy(query);
    
    // Set filters based on query characteristics
    const filters = this.setOptimalFilters(query);
    
    // Enhance the original query with medical terminology
    const enhancedQuery = this.enhanceQueryTerms(originalQuery);
    
    return {
      enhancedQuery,
      medicalIntent,
      studyTypes,
      searchStrategy,
      filters
    };
  }

  // Extract the primary medical intent from the query
  private static extractMedicalIntent(query: string): string {
    const treatmentIntents = [
      'treatment', 'therapy', 'management', 'medication', 'drug',
      'intervention', 'therapeutic', 'cure', 'heal'
    ];
    
    const preventionIntents = [
      'prevention', 'prevent', 'prophylaxis', 'screening', 'risk reduction'
    ];
    
    const diagnosisIntents = [
      'diagnosis', 'diagnostic', 'test', 'screening', 'biomarker',
      'symptoms', 'signs', 'criteria'
    ];
    
    const prognosisIntents = [
      'prognosis', 'outcome', 'survival', 'mortality', 'morbidity',
      'course', 'progression'
    ];
    
    const etiologyIntents = [
      'cause', 'etiology', 'pathogenesis', 'mechanism', 'risk factor'
    ];

    if (treatmentIntents.some(intent => query.includes(intent))) {
      return 'treatment';
    } else if (preventionIntents.some(intent => query.includes(intent))) {
      return 'prevention';
    } else if (diagnosisIntents.some(intent => query.includes(intent))) {
      return 'diagnosis';
    } else if (prognosisIntents.some(intent => query.includes(intent))) {
      return 'prognosis';
    } else if (etiologyIntents.some(intent => query.includes(intent))) {
      return 'etiology';
    }
    
    return 'general'; // Default intent
  }

  // Determine optimal study types based on query
  private static determineStudyTypes(query: string): string[] {
    const studyTypes: string[] = [];
    
    // For treatment questions, prioritize RCTs and systematic reviews
    if (query.includes('treatment') || query.includes('therapy') || query.includes('medication')) {
      studyTypes.push('randomized controlled trial', 'systematic review', 'meta-analysis');
    }
    
    // For prevention questions, include cohort studies and guidelines
    if (query.includes('prevention') || query.includes('screening')) {
      studyTypes.push('systematic review', 'cohort study', 'practice guideline');
    }
    
    // For diagnostic questions, include diagnostic studies
    if (query.includes('diagnosis') || query.includes('test') || query.includes('biomarker')) {
      studyTypes.push('diagnostic study', 'systematic review', 'meta-analysis');
    }
    
    // For safety questions, include adverse event studies
    if (query.includes('safety') || query.includes('adverse') || query.includes('side effect')) {
      studyTypes.push('clinical trial', 'cohort study', 'case-control study');
    }

    // Always include high-quality evidence types
    if (studyTypes.length === 0) {
      studyTypes.push('systematic review', 'meta-analysis', 'randomized controlled trial');
    }
    
    return studyTypes;
  }

  // Determine search strategy
  private static determineSearchStrategy(query: string): 'comprehensive' | 'focused' | 'systematic' {
    // Check for systematic review indicators
    if (query.includes('systematic review') || query.includes('meta-analysis') || 
        query.includes('evidence') || query.includes('literature review')) {
      return 'systematic';
    }
    
    // Check for specific medical conditions or drugs (focused search)
    const specificTerms = [
      'metformin', 'diabetes', 'hypertension', 'statins', 'aspirin',
      'covid-19', 'cancer', 'alzheimer', 'parkinson', 'migraine'
    ];
    
    if (specificTerms.some(term => query.includes(term))) {
      return 'focused';
    }
    
    // Default to comprehensive search
    return 'comprehensive';
  }

  // Set optimal filters based on query
  private static setOptimalFilters(query: string) {
    const filters = {
      includeMetaAnalyses: true,
      includeRCTs: true,
      includeGuidelines: false,
      recentYearsOnly: null as number | null,
      excludeCaseReports: true
    };

    // Include guidelines for management/treatment questions
    if (query.includes('management') || query.includes('guideline') || 
        query.includes('recommendation') || query.includes('standard of care')) {
      filters.includeGuidelines = true;
    }

    // Focus on recent studies for emerging topics
    const emergingTopics = [
      'covid-19', 'sars-cov-2', 'mrna vaccine', 'glp-1', 'ozempic',
      'semaglutide', 'ai', 'artificial intelligence', 'machine learning'
    ];
    
    if (emergingTopics.some(topic => query.includes(topic))) {
      filters.recentYearsOnly = 3; // Only last 3 years
    }

    // For "latest" or "recent" queries, limit to recent years
    if (query.includes('latest') || query.includes('recent') || 
        query.includes('new') || query.includes('current')) {
      filters.recentYearsOnly = 5; // Last 5 years
    }

    return filters;
  }

  // Enhance query terms with medical synonyms and related concepts
  private static enhanceQueryTerms(originalQuery: string): string {
    let enhanced = originalQuery;

    // Medical condition enhancements (ENHANCED FOR COVID-19 AND MODERN MEDICAL TERMS)
    const enhancements = {
      // COVID-19 terms - CRITICAL
      'covid': 'covid OR "covid-19" OR "sars-cov-2" OR coronavirus OR "novel coronavirus"',
      'covid-19': '"covid-19" OR covid OR "sars-cov-2" OR coronavirus OR "coronavirus disease 2019"',
      'long covid': '"long covid" OR "post covid" OR "post-acute covid-19" OR "covid sequelae" OR "persistent covid"',
      'coronavirus': 'coronavirus OR covid OR "covid-19" OR "sars-cov-2"',
      
      // Traditional medical terms
      'diabetes': 'diabetes OR "diabetes mellitus" OR diabetic OR hyperglycemia',
      'heart attack': '"heart attack" OR "myocardial infarction" OR "acute coronary syndrome"',
      'high blood pressure': '"high blood pressure" OR hypertension OR "elevated blood pressure"',
      'stroke': 'stroke OR "cerebrovascular accident" OR "cerebral infarction"',
      'depression': 'depression OR "depressive disorder" OR "major depression" OR "major depressive disorder"',
      'anxiety': 'anxiety OR "anxiety disorder" OR "generalized anxiety"',
      'cancer': 'cancer OR neoplasm OR malignancy OR tumor OR carcinoma',
      'prevention': 'prevention OR prophylaxis OR "risk reduction" OR preventive',
      'treatment': 'treatment OR therapy OR intervention OR management OR therapeutic',
      
      // Omega-3 fatty acids terms - CRITICAL FOR NUTRITION QUERIES
      'omega-3': '"omega-3" OR "omega 3" OR "n-3 fatty acids" OR "polyunsaturated fatty acids" OR PUFA',
      'omega 3': '"omega-3" OR "omega 3" OR "n-3 fatty acids" OR "polyunsaturated fatty acids" OR PUFA',
      'epa': 'EPA OR "eicosapentaenoic acid" OR "20:5n-3"',
      'dha': 'DHA OR "docosahexaenoic acid" OR "22:6n-3"',
      'fish oil': '"fish oil" OR "marine oil" OR "omega-3 supplement" OR "n-3 supplement"',
      
      // Organ system terms for COVID queries
      'organ': 'organ OR "organ system" OR "multi-organ" OR systemic',
      'effects': 'effects OR complications OR sequelae OR manifestations OR consequences',
      'long-term': '"long-term" OR "long term" OR persistent OR chronic OR prolonged'
    };

    // Apply enhancements
    Object.entries(enhancements).forEach(([term, expansion]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (enhanced.match(regex)) {
        enhanced = enhanced.replace(regex, `(${expansion})`);
      }
    });

    return enhanced;
  }

  // Build high-quality search query for PubMed
  static buildHighQualityPubMedQuery(
    query: string,
    intent: string,
    studyTypes: string[],
    filters: any
  ): string {
    const queryParts = [];
    
    // Add main query
    queryParts.push(`(${query})`);

    // Add study type filters
    if (studyTypes.length > 0) {
      const studyTypeFilters = studyTypes
        .map(type => `"${type}"[Publication Type]`)
        .join(' OR ');
      queryParts.push(`AND (${studyTypeFilters})`);
    }

    // Add quality filters
    const qualityFilters = [];
    
    if (filters.excludeCaseReports) {
      qualityFilters.push('NOT "case reports"[Publication Type]');
    }
    
    // Require abstracts for better quality
    qualityFilters.push('AND hasabstract[text]');
    
    // Human studies only for clinical relevance
    qualityFilters.push('AND "humans"[MeSH Terms]');
    
    // English language preference
    qualityFilters.push('AND "english"[Language]');

    // Add date filter if specified
    if (filters.recentYearsOnly) {
      const startYear = new Date().getFullYear() - filters.recentYearsOnly;
      qualityFilters.push(`AND "${startYear}/01/01"[Date - Publication] : "3000"[Date - Publication]`);
    }

    // Combine all parts
    return queryParts.join(' ') + ' ' + qualityFilters.join(' ');
  }

  // Extract medical entities and concepts from query
  static extractMedicalEntities(query: string): {
    conditions: string[];
    treatments: string[];
    diagnostics: string[];
    demographics: string[];
  } {
    const text = query.toLowerCase();
    
    const conditions = this.extractEntities(text, [
      'diabetes', 'hypertension', 'cancer', 'depression', 'anxiety',
      'migraine', 'asthma', 'copd', 'heart failure', 'stroke',
      'alzheimer', 'parkinson', 'arthritis', 'osteoporosis'
    ]);

    const treatments = this.extractEntities(text, [
      'metformin', 'insulin', 'statins', 'aspirin', 'warfarin',
      'ace inhibitor', 'beta blocker', 'chemotherapy', 'radiotherapy',
      'surgery', 'therapy', 'counseling', 'medication', 'drug'
    ]);

    const diagnostics = this.extractEntities(text, [
      'mri', 'ct scan', 'x-ray', 'ultrasound', 'blood test',
      'biopsy', 'ecg', 'echocardiogram', 'colonoscopy', 'mammography'
    ]);

    const demographics = this.extractEntities(text, [
      'elderly', 'pediatric', 'children', 'adolescent', 'adult',
      'pregnant', 'postmenopausal', 'men', 'women', 'male', 'female'
    ]);

    return { conditions, treatments, diagnostics, demographics };
  }

  private static extractEntities(text: string, entityList: string[]): string[] {
    return entityList.filter(entity => text.includes(entity));
  }
}

export default MedicalQueryProcessor;

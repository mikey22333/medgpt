/**
 * Improved Query Processing System for Better Citation Relevance
 * Addresses the core issue of irrelevant citations by optimizing queries for each database
 * 
 * 🧠 MeSH Term Integration Strategy:
 * 
 * Database MeSH Usage:
 * ✅ PubMed: Full MeSH integration with Major Topics, explosion control, and subheadings
 * ✅ Europe PMC: Hybrid approach - MeSH terms for PubMed content + text search for other sources
 * ❌ Semantic Scholar: Natural language only (AI handles semantic understanding)
 * ❌ CrossRef: Phrase matching (no medical indexing)
 * ❌ OpenAlex: Concept-based (no MeSH support)
 * 
 * Key MeSH Optimizations:
 * - PubMed: Uses MeSH Major Topic for precision, MeSH Terms for recall
 * - Europe PMC: Combines MESH:"term" searches with text fallback
 * - Enhanced mapping covers 60+ medical concepts, treatments, and populations
 * - PICO framework ensures structured medical query analysis
 */

interface MeSHTerm {
  term: string;
  weight: number;
  isMain: boolean;
}

interface QueryAnalysis {
  originalQuery: string;
  medicalConcepts: string[];
  intervention?: string;
  condition?: string;
  population?: string;
  outcome?: string;
  studyType?: string;
  queryType: 'treatment' | 'diagnosis' | 'prognosis' | 'etiology' | 'general';
}

export class ImprovedQueryProcessor {
  
  // Medical concept extraction using PICO framework
  static analyzeMedicalQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    const analysis: QueryAnalysis = {
      originalQuery: query,
      medicalConcepts: [],
      queryType: 'general'
    };

    // Extract key medical concepts
    const medicalTerms = this.extractMedicalTerms(query);
    analysis.medicalConcepts = medicalTerms;

    // PICO Analysis
    analysis.condition = this.extractCondition(lowerQuery);
    analysis.intervention = this.extractIntervention(lowerQuery);
    analysis.population = this.extractPopulation(lowerQuery);
    analysis.outcome = this.extractOutcome(lowerQuery);

    // Determine query type
    analysis.queryType = this.classifyQueryType(lowerQuery);

    return analysis;
  }

  // Generate database-specific queries
  static generateOptimizedQueries(analysis: QueryAnalysis): {
    pubmedQuery: string;
    semanticScholarQuery: string;
    crossrefQuery: string;
    europePMCQuery: string;
    openAlexQuery: string;
  } {
    return {
      pubmedQuery: this.buildPubMedQuery(analysis),
      semanticScholarQuery: this.buildSemanticScholarQuery(analysis),
      crossrefQuery: this.buildCrossRefQuery(analysis),
      europePMCQuery: this.buildEuropePMCQuery(analysis),
      openAlexQuery: this.buildOpenAlexQuery(analysis)
    };
  }

  // PubMed: Use MeSH terms and Boolean operators for maximum precision
  private static buildPubMedQuery(analysis: QueryAnalysis): string {
    const meshTerms = this.convertToMeSHTerms(analysis.medicalConcepts);
    const filters = this.getPubMedFilters(analysis.queryType);
    
    let query = '';
    
    // Build PICO-based query with enhanced MeSH utilization
    const picoTerms: string[] = [];
    
    if (analysis.condition) {
      const conditionMesh = this.getMeSHForConcept(analysis.condition);
      // Use both MeSH major topic and explosion for comprehensive coverage
      picoTerms.push(`(${conditionMesh}[MeSH Major Topic] OR ${conditionMesh}[MeSH Terms:noexp] OR ${analysis.condition}[Title/Abstract])`);
    }
    
    if (analysis.intervention) {
      const interventionMesh = this.getMeSHForConcept(analysis.intervention);
      // For treatments, use major topic to ensure relevance
      picoTerms.push(`(${interventionMesh}[MeSH Major Topic] OR ${interventionMesh}[MeSH Terms] OR ${analysis.intervention}[Title/Abstract])`);
    }
    
    if (analysis.population) {
      // Population terms work better as text search or specific MeSH
      const populationMesh = this.getMeSHForConcept(analysis.population);
      picoTerms.push(`(${populationMesh}[MeSH Terms] OR ${analysis.population}[Title/Abstract])`);
    }

    // If we have outcome, add it with appropriate weighting
    if (analysis.outcome) {
      const outcomeMesh = this.getMeSHForConcept(analysis.outcome);
      picoTerms.push(`(${outcomeMesh}[MeSH Terms] OR ${analysis.outcome}[Title/Abstract])`);
    }

    query = picoTerms.join(' AND ');
    
    // Add study type filters with MeSH precision
    if (analysis.queryType === 'treatment') {
      query += ' AND ("randomized controlled trial"[Publication Type] OR "controlled clinical trial"[Publication Type] OR "systematic review"[Publication Type])';
    } else if (analysis.queryType === 'diagnosis') {
      query += ' AND ("diagnosis"[Subheading] OR "diagnostic use"[Subheading] OR "sensitivity and specificity"[MeSH Terms])';
    }
    
    // Add quality filters for evidence-based results
    query += ' AND (hasabstract[text] AND english[lang] AND humans[MeSH Terms])';
    
    // Add recency filter for clinical relevance (last 10 years)
    const currentYear = new Date().getFullYear();
    const pastYear = currentYear - 10;
    query += ` AND ("${pastYear}"[Date - Publication] : "3000"[Date - Publication])`;
    
    return query || analysis.originalQuery;
  }

  // Semantic Scholar: Natural language with medical context
  private static buildSemanticScholarQuery(analysis: QueryAnalysis): string {
    // Keep it simple for Semantic Scholar - their AI handles semantic understanding
    let query = analysis.originalQuery;
    
    // Only add minimal medical context if missing
    if (!query.toLowerCase().includes('medical') && 
        !query.toLowerCase().includes('clinical') &&
        !query.toLowerCase().includes('patient')) {
      query = `${query} medical clinical`;
    }
    
    return query;
  }

  // CrossRef: Focus on high-impact journals
  private static buildCrossRefQuery(analysis: QueryAnalysis): string {
    // CrossRef works well with exact phrase matching
    const keyTerms = analysis.medicalConcepts.slice(0, 3); // Top 3 concepts
    return keyTerms.join(' ');
  }

  // Europe PMC: Leverage MeSH terms since it indexes PubMed content + additional sources
  private static buildEuropePMCQuery(analysis: QueryAnalysis): string {
    const meshTerms: string[] = [];
    const textTerms: string[] = [];
    
    // Use MeSH terms for structured concepts (since Europe PMC indexes PubMed)
    if (analysis.condition) {
      const conditionMesh = this.getMeSHForConcept(analysis.condition);
      meshTerms.push(`MESH:"${conditionMesh}"`);
      textTerms.push(`"${analysis.condition}"`);
    }
    
    if (analysis.intervention) {
      const interventionMesh = this.getMeSHForConcept(analysis.intervention);
      meshTerms.push(`MESH:"${interventionMesh}"`);
      textTerms.push(`"${analysis.intervention}"`);
    }
    
    // Combine MeSH and text search for maximum coverage
    let query = '';
    if (meshTerms.length > 0 && textTerms.length > 0) {
      query = `(${meshTerms.join(' AND ')}) OR (${textTerms.join(' AND ')})`;
    } else if (meshTerms.length > 0) {
      query = meshTerms.join(' AND ');
    } else if (textTerms.length > 0) {
      query = textTerms.join(' AND ');
    }
    
    // Add population if specified
    if (analysis.population) {
      query += ` AND "${analysis.population}"`;
    }
    
    // Add study type filters for treatment queries
    if (analysis.queryType === 'treatment') {
      query += ' AND (PUB_TYPE:"randomized controlled trial" OR PUB_TYPE:"clinical trial")';
    }
    
    // Add quality filters
    query += ' AND (LANG:"eng" AND HAS_ABSTRACT:"Y")';
    
    return query || analysis.originalQuery;
  }

  // OpenAlex: Concept-based search
  private static buildOpenAlexQuery(analysis: QueryAnalysis): string {
    // OpenAlex works well with concept extraction
    return analysis.medicalConcepts.slice(0, 4).join(' ');
  }

  // Extract medical terms from natural language
  private static extractMedicalTerms(query: string): string[] {
    const medicalPattern = /\b(?:diabetes|hypertension|cancer|asthma|depression|anxiety|covid|pneumonia|influenza|stroke|heart|cardiac|renal|hepatic|pulmonary|neurological|psychiatric|oncology|cardiology|medication|drug|treatment|therapy|diagnosis|prognosis|symptoms?|disease|condition|syndrome|disorder|infection|inflammation|prevention|screening|management)\b/gi;
    
    const matches = query.match(medicalPattern) || [];
    return [...new Set(matches.map(m => m.toLowerCase()))];
  }

  // Convert to MeSH terms (enhanced mapping for better precision)
  private static getMeSHForConcept(concept: string): string {
    const meshMapping: Record<string, string> = {
      // Endocrine/Metabolic
      'diabetes': 'Diabetes Mellitus',
      'diabetes mellitus': 'Diabetes Mellitus',
      'type 2 diabetes': 'Diabetes Mellitus, Type 2',
      'type 1 diabetes': 'Diabetes Mellitus, Type 1',
      'insulin resistance': 'Insulin Resistance',
      'metabolic syndrome': 'Metabolic Syndrome',
      
      // Cardiovascular
      'hypertension': 'Hypertension',
      'high blood pressure': 'Hypertension',
      'heart attack': 'Myocardial Infarction',
      'myocardial infarction': 'Myocardial Infarction',
      'stroke': 'Stroke',
      'heart failure': 'Heart Failure',
      'coronary artery disease': 'Coronary Artery Disease',
      'atrial fibrillation': 'Atrial Fibrillation',
      
      // Oncology
      'cancer': 'Neoplasms',
      'breast cancer': 'Breast Neoplasms',
      'lung cancer': 'Lung Neoplasms',
      'colon cancer': 'Colonic Neoplasms',
      'prostate cancer': 'Prostatic Neoplasms',
      'melanoma': 'Melanoma',
      
      // Respiratory
      'asthma': 'Asthma',
      'copd': 'Pulmonary Disease, Chronic Obstructive',
      'pneumonia': 'Pneumonia',
      'bronchitis': 'Bronchitis',
      
      // Mental Health
      'depression': 'Depression',
      'anxiety': 'Anxiety',
      'bipolar disorder': 'Bipolar Disorder',
      'schizophrenia': 'Schizophrenia',
      'ptsd': 'Stress Disorders, Post-Traumatic',
      
      // Infectious Diseases
      'covid': 'COVID-19',
      'covid-19': 'COVID-19',
      'influenza': 'Influenza',
      'sepsis': 'Sepsis',
      'hiv': 'HIV Infections',
      
      // Neurological
      'alzheimer': 'Alzheimer Disease',
      'parkinson': 'Parkinson Disease',
      'epilepsy': 'Epilepsy',
      'migraine': 'Migraine Disorders',
      'multiple sclerosis': 'Multiple Sclerosis',
      
      // Treatments/Interventions
      'metformin': 'Metformin',
      'insulin': 'Insulin',
      'aspirin': 'Aspirin',
      'statins': 'Hydroxymethylglutaryl-CoA Reductase Inhibitors',
      'beta blockers': 'Adrenergic beta-Antagonists',
      'ace inhibitors': 'Angiotensin-Converting Enzyme Inhibitors',
      'chemotherapy': 'Antineoplastic Agents',
      'radiation therapy': 'Radiotherapy',
      
      // Populations
      'elderly': 'Aged',
      'children': 'Child',
      'pediatric': 'Child',
      'adults': 'Adult',
      'adolescents': 'Adolescent',
      'pregnant women': 'Pregnant Women',
      
      // Study Types/Outcomes
      'mortality': 'Mortality',
      'morbidity': 'Morbidity',
      'quality of life': 'Quality of Life',
      'side effects': 'Drug-Related Side Effects and Adverse Reactions',
      'adverse events': 'Drug-Related Side Effects and Adverse Reactions'
    };
    
    const normalizedConcept = concept.toLowerCase().trim();
    return meshMapping[normalizedConcept] || concept;
  }

  // Extract medical condition from query
  private static extractCondition(query: string): string | undefined {
    const conditionPatterns = [
      /(?:with|having|diagnosed with|suffering from)\s+([a-zA-Z\s]+?)(?:\s|$)/,
      /\b(diabetes|hypertension|cancer|asthma|depression|anxiety|covid|pneumonia|stroke)\b/i
    ];
    
    for (const pattern of conditionPatterns) {
      const match = query.match(pattern);
      if (match) return match[1].trim();
    }
    
    return undefined;
  }

  // Extract intervention (treatment/drug) from query
  private static extractIntervention(query: string): string | undefined {
    const interventionPatterns = [
      /(?:treatment with|using|taking|receiving)\s+([a-zA-Z\s]+?)(?:\s|$)/,
      /\b(metformin|insulin|aspirin|statins|beta.?blockers?|ace.?inhibitors?)\b/i
    ];
    
    for (const pattern of interventionPatterns) {
      const match = query.match(pattern);
      if (match) return match[1].trim();
    }
    
    return undefined;
  }

  // Extract population from query
  private static extractPopulation(query: string): string | undefined {
    const populationPatterns = [
      /\b(elderly|children|adults|adolescents|pregnant women|patients)\b/i,
      /\b(age \d+|\d+ years? old)\b/i
    ];
    
    for (const pattern of populationPatterns) {
      const match = query.match(pattern);
      if (match) return match[0].trim();
    }
    
    return undefined;
  }

  // Extract outcome from query
  private static extractOutcome(query: string): string | undefined {
    const outcomePatterns = [
      /(?:effect on|impact on|reduce|improve|prevent)\s+([a-zA-Z\s]+?)(?:\s|$)/,
      /\b(mortality|morbidity|symptoms|quality of life|side effects)\b/i
    ];
    
    for (const pattern of outcomePatterns) {
      const match = query.match(pattern);
      if (match) return match[1].trim();
    }
    
    return undefined;
  }

  // Classify query type for appropriate filters
  private static classifyQueryType(query: string): 'treatment' | 'diagnosis' | 'prognosis' | 'etiology' | 'general' {
    if (/\b(treat|therapy|management|drug|medication|intervention)\b/i.test(query)) {
      return 'treatment';
    }
    if (/\b(diagnos|detect|screening|test)\b/i.test(query)) {
      return 'diagnosis';
    }
    if (/\b(prognosis|outcome|survival|mortality)\b/i.test(query)) {
      return 'prognosis';
    }
    if (/\b(cause|risk factor|etiology|pathogenesis)\b/i.test(query)) {
      return 'etiology';
    }
    return 'general';
  }

  // Get PubMed-specific filters based on query type
  private static getPubMedFilters(queryType: string): string {
    const filters: Record<string, string> = {
      'treatment': 'AND (randomized controlled trial[pt] OR clinical trial[pt] OR systematic review[pt])',
      'diagnosis': 'AND (diagnosis[sh] OR sensitivity and specificity[mh])',
      'prognosis': 'AND (prognosis[mh] OR mortality[sh] OR survival analysis[mh])',
      'etiology': 'AND (etiology[sh] OR risk factors[mh] OR causality[mh])',
      'general': 'AND (hasabstract[text] AND english[lang])'
    };
    
    return filters[queryType] || filters['general'];
  }

  private static convertToMeSHTerms(concepts: string[]): MeSHTerm[] {
    return concepts.map(concept => ({
      term: this.getMeSHForConcept(concept),
      weight: 1.0,
      isMain: true
    }));
  }
}

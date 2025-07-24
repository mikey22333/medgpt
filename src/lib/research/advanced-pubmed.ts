import { PubMedClient } from './pubmed';
import { type ResearchQuery, type PubMedArticle } from '@/lib/types/research';

// Enhanced PubMed client with advanced search features like Consensus.app
export class AdvancedPubMedClient extends PubMedClient {
  
  // Enhanced search with MeSH terms, study type filters, and quality indicators
  async searchAdvanced(query: string, options: {
    maxResults?: number;
    studyTypes?: string[];
    includeMetaAnalyses?: boolean;
    includeRCTs?: boolean;
    recentYears?: number;
    languageFilter?: string;
  } = {}): Promise<PubMedArticle[]> {
    
    const {
      maxResults = 20,
      studyTypes = [],
      includeMetaAnalyses = true,
      includeRCTs = true,
      recentYears,
      languageFilter = 'english'
    } = options;

    // Build advanced PubMed search query
    const advancedQuery = this.buildAdvancedQuery(query, {
      studyTypes,
      includeMetaAnalyses,
      includeRCTs,
      recentYears,
      languageFilter
    });

    console.log(`🔍 Advanced PubMed search: ${advancedQuery}`);

    try {
      return await this.searchArticles({
        query: advancedQuery,
        maxResults,
        source: 'pubmed'
      });
    } catch (error) {
      console.error('Advanced PubMed search failed:', error);
      // Fallback to basic search
      return await this.searchArticles({
        query,
        maxResults,
        source: 'pubmed'
      });
    }
  }

  // Build sophisticated PubMed query with MeSH terms and filters
  private buildAdvancedQuery(query: string, options: any): string {
    const parts = [];
    
    // Add main query with MeSH term expansion
    const meshExpandedQuery = this.expandWithMeSHTerms(query);
    parts.push(`(${meshExpandedQuery})`);

    // Add study type filters
    if (options.includeMetaAnalyses) {
      parts.push('OR ("meta-analysis"[Publication Type] OR "systematic review"[Publication Type])');
    }

    if (options.includeRCTs) {
      parts.push('OR ("randomized controlled trial"[Publication Type] OR "controlled clinical trial"[Publication Type])');
    }

    // Add custom study types
    if (options.studyTypes && options.studyTypes.length > 0) {
      const studyTypeQuery = options.studyTypes
        .map((type: string) => `"${type}"[Publication Type]`)
        .join(' OR ');
      parts.push(`OR (${studyTypeQuery})`);
    }

    // Add date filter
    if (options.recentYears) {
      const startYear = new Date().getFullYear() - options.recentYears;
      parts.push(`AND "${startYear}/01/01"[Date - Publication] : "3000"[Date - Publication]`);
    }

    // Add language filter
    if (options.languageFilter) {
      parts.push(`AND "${options.languageFilter}"[Language]`);
    }

    // Add quality filters for medical relevance
    const qualityFilters = [
      'AND ("humans"[MeSH Terms] OR "clinical trial"[Publication Type])',
      'AND (hasabstract[text])', // Ensure abstracts are available
      'NOT ("case reports"[Publication Type])', // Exclude case reports for better evidence
    ];

    return parts.join(' ') + ' ' + qualityFilters.join(' ');
  }

  // Expand query with relevant MeSH (Medical Subject Headings) terms
  private expandWithMeSHTerms(query: string): string {
    const meshMappings = {
      // COVID-19 terms (prioritized for better matching)
      'covid': '"COVID-19"[MeSH Terms] OR "SARS-CoV-2"[MeSH Terms] OR "coronavirus disease 2019"[MeSH Terms]',
      'covid-19': '"COVID-19"[MeSH Terms] OR "SARS-CoV-2"[MeSH Terms] OR "coronavirus disease 2019"[MeSH Terms]',
      'long covid': '"Post-Acute COVID-19 Syndrome"[MeSH Terms] OR "long covid"[Title/Abstract] OR "post covid"[Title/Abstract]',
      'post covid': '"Post-Acute COVID-19 Syndrome"[MeSH Terms] OR "post covid syndrome"[Title/Abstract]',
      'long-term': '"chronic disease"[MeSH Terms] OR "long-term"[Title/Abstract] OR "persistent"[Title/Abstract]',
      'organ': '"organ dysfunction"[Title/Abstract] OR "multiple organ failure"[MeSH Terms] OR "systemic"[Title/Abstract]',
      'effects': '"adverse effects"[Subheading] OR "complications"[Title/Abstract] OR "sequelae"[Title/Abstract]',
      
      // Diabetes-related MeSH terms
      'diabetes': 'diabetes mellitus[MeSH Terms] OR "blood glucose"[MeSH Terms] OR "glycemic control"[MeSH Terms]',
      'type 2 diabetes': '"diabetes mellitus, type 2"[MeSH Terms] OR "insulin resistance"[MeSH Terms]',
      'type 1 diabetes': '"diabetes mellitus, type 1"[MeSH Terms] OR "insulin-dependent diabetes"[MeSH Terms]',
      
      // Cardiovascular MeSH terms
      'cardiovascular': '"cardiovascular diseases"[MeSH Terms] OR "heart diseases"[MeSH Terms]',
      'hypertension': '"hypertension"[MeSH Terms] OR "blood pressure"[MeSH Terms]',
      'heart failure': '"heart failure"[MeSH Terms] OR "cardiac output, low"[MeSH Terms]',
      'myocardial infarction': '"myocardial infarction"[MeSH Terms] OR "acute coronary syndrome"[MeSH Terms]',
      
      // Cancer MeSH terms
      'cancer': '"neoplasms"[MeSH Terms] OR "carcinoma"[MeSH Terms] OR "malignancy"[MeSH Terms]',
      'breast cancer': '"breast neoplasms"[MeSH Terms]',
      'lung cancer': '"lung neoplasms"[MeSH Terms]',
      'prostate cancer': '"prostatic neoplasms"[MeSH Terms]',
      
      // Treatment MeSH terms
      'treatment': '"therapeutics"[MeSH Terms] OR "drug therapy"[MeSH Terms]',
      'therapy': '"therapy"[Subheading] OR "therapeutics"[MeSH Terms]',
      'prevention': '"prevention and control"[Subheading] OR "preventive medicine"[MeSH Terms]',
      
      // Drug classes
      'metformin': '"metformin"[MeSH Terms] OR "biguanides"[MeSH Terms]',
      'statins': '"hydroxymethylglutaryl-coa reductase inhibitors"[MeSH Terms]',
      'ace inhibitors': '"angiotensin-converting enzyme inhibitors"[MeSH Terms]',
      'beta blockers': '"adrenergic beta-antagonists"[MeSH Terms]',
      
      // Neurological conditions
      'migraine': '"migraine disorders"[MeSH Terms] OR "headache disorders"[MeSH Terms]',
      'alzheimer': '"alzheimer disease"[MeSH Terms] OR "dementia"[MeSH Terms]',
      'parkinson': '"parkinson disease"[MeSH Terms]',
      
      // Mental health
      'depression': '"depressive disorder"[MeSH Terms] OR "depression"[MeSH Terms]',
      'anxiety': '"anxiety disorders"[MeSH Terms] OR "anxiety"[MeSH Terms]',
      
      // Organ system effects (enhanced for COVID-19 queries)
      'organ systems': '"Multiple Organ Failure"[MeSH Terms] OR "organ dysfunction"[Title/Abstract] OR "systemic effects"[Title/Abstract]',
      'cardiovascular effects': '"Cardiovascular Diseases"[MeSH Terms] OR "myocarditis"[MeSH Terms] OR "cardiac complications"[Title/Abstract]',
      'respiratory effects': '"Respiratory System"[MeSH Terms] OR "pulmonary fibrosis"[MeSH Terms] OR "lung function"[Title/Abstract]',
      'neurological effects': '"Nervous System Diseases"[MeSH Terms] OR "cognitive dysfunction"[MeSH Terms] OR "brain fog"[Title/Abstract]',
      'renal effects': '"Kidney Diseases"[MeSH Terms] OR "acute kidney injury"[MeSH Terms] OR "renal complications"[Title/Abstract]',
    };

    let expandedQuery = query;

    // Replace recognized terms with MeSH-expanded versions
    Object.entries(meshMappings).forEach(([term, meshTerms]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (expandedQuery.match(regex)) {
        expandedQuery = expandedQuery.replace(regex, `(${term} OR ${meshTerms})`);
      }
    });

    return expandedQuery;
  }

  // Search for landmark studies and guidelines
  async searchLandmarkStudies(condition: string, maxResults: number = 10): Promise<PubMedArticle[]> {
    const landmarkQueries = this.getLandmarkQueries(condition);
    const allResults: PubMedArticle[] = [];

    for (const landmarkQuery of landmarkQueries) {
      try {
        const results = await this.searchArticles({
          query: landmarkQuery,
          maxResults: 3,
          source: 'pubmed'
        });
        allResults.push(...results);
      } catch (error) {
        console.warn(`Landmark search failed for: ${landmarkQuery}`, error);
      }
    }

    return allResults.slice(0, maxResults);
  }

  // Get landmark study queries for specific conditions
  private getLandmarkQueries(condition: string): string[] {
    const landmarkMap: Record<string, string[]> = {
      'diabetes': [
        'UKPDS ("United Kingdom Prospective Diabetes Study"[Title/Abstract])',
        'DCCT ("Diabetes Control and Complications Trial"[Title/Abstract])',
        'ACCORD ("Action to Control Cardiovascular Risk in Diabetes"[Title/Abstract])',
        'ADVANCE ("Action in Diabetes and Vascular Disease"[Title/Abstract])',
        'EMPA-REG ("Empagliflozin Cardiovascular Outcomes"[Title/Abstract])',
        'DECLARE-TIMI ("Dapagliflozin Effect on Cardiovascular Events"[Title/Abstract])'
      ],
      'cardiovascular': [
        'ASCOT ("Anglo-Scandinavian Cardiac Outcomes Trial"[Title/Abstract])',
        'HOPE ("Heart Outcomes Prevention Evaluation"[Title/Abstract])',
        'CARE ("Cholesterol and Recurrent Events"[Title/Abstract])',
        '4S ("Scandinavian Simvastatin Survival Study"[Title/Abstract])',
        'WOSCOPS ("West of Scotland Coronary Prevention Study"[Title/Abstract])'
      ],
      'hypertension': [
        'ALLHAT ("Antihypertensive and Lipid-Lowering Treatment"[Title/Abstract])',
        'LIFE ("Losartan Intervention For Endpoint reduction"[Title/Abstract])',
        'VALUE ("Valsartan Antihypertensive Long-term Use Evaluation"[Title/Abstract])',
        'ONTARGET ("Ongoing Telmisartan Alone and in combination with Ramipril"[Title/Abstract])'
      ],
      'cancer': [
        'NSABP ("National Surgical Adjuvant Breast and Bowel Project"[Title/Abstract])',
        'SEER ("Surveillance Epidemiology and End Results"[Title/Abstract])',
        'KEYNOTE ("Pembrolizumab"[Title/Abstract] AND "clinical trial"[Publication Type])',
        'CheckMate ("Nivolumab"[Title/Abstract] AND "clinical trial"[Publication Type])'
      ],
      'covid-19': [
        'RECOVERY ("Randomised Evaluation of COVid-19 thERapY"[Title/Abstract])',
        'SOLIDARITY ("WHO Solidarity Trial"[Title/Abstract])',
        'REMAP-CAP ("Randomized, Embedded, Multifactorial Adaptive Platform trial for Community-Acquired Pneumonia"[Title/Abstract])',
        'ACTT ("Adaptive COVID-19 Treatment Trial"[Title/Abstract])',
        'ACTIV ("Accelerating COVID-19 Therapeutic Interventions and Vaccines"[Title/Abstract])'
      ],
      'long covid': [
        '"long covid"[Title/Abstract] AND ("systematic review"[Publication Type] OR "meta-analysis"[Publication Type])',
        '"post-acute covid-19 syndrome"[Title/Abstract] OR "post covid syndrome"[Title/Abstract]',
        '"persistent covid"[Title/Abstract] AND ("organ"[Title/Abstract] OR "systemic"[Title/Abstract])',
        '"covid-19 sequelae"[Title/Abstract] OR "long-term effects"[Title/Abstract] AND "covid"[Title/Abstract]'
      ],
      'covid organ effects': [
        '"covid-19"[Title/Abstract] AND ("cardiovascular"[Title/Abstract] OR "cardiac"[Title/Abstract]) AND ("long-term"[Title/Abstract] OR "persistent"[Title/Abstract])',
        '"covid-19"[Title/Abstract] AND ("neurological"[Title/Abstract] OR "cognitive"[Title/Abstract]) AND ("sequelae"[Title/Abstract] OR "effects"[Title/Abstract])',
        '"covid-19"[Title/Abstract] AND ("respiratory"[Title/Abstract] OR "pulmonary"[Title/Abstract]) AND ("long-term"[Title/Abstract] OR "chronic"[Title/Abstract])',
        '"covid-19"[Title/Abstract] AND ("renal"[Title/Abstract] OR "kidney"[Title/Abstract]) AND ("complications"[Title/Abstract] OR "effects"[Title/Abstract])'
      ]
    };

    const normalizedCondition = condition.toLowerCase();
    
    // Find matching condition with enhanced COVID-19 detection
    for (const [key, queries] of Object.entries(landmarkMap)) {
      if (normalizedCondition.includes(key)) {
        return queries;
      }
    }
    
    // Special handling for COVID-19 related queries
    if (normalizedCondition.includes('covid') || 
        normalizedCondition.includes('sars-cov-2') || 
        normalizedCondition.includes('coronavirus') ||
        normalizedCondition.includes('long covid') ||
        normalizedCondition.includes('post covid')) {
      
      // If it's about long-term effects or organ systems, use specific queries
      if (normalizedCondition.includes('long') || 
          normalizedCondition.includes('effects') || 
          normalizedCondition.includes('organ') ||
          normalizedCondition.includes('persistent') ||
          normalizedCondition.includes('sequelae')) {
        return landmarkMap['covid organ effects'] || landmarkMap['long covid'] || [];
      }
      
      // Otherwise use general COVID-19 studies
      return landmarkMap['covid-19'] || [];
    }

    return []; // No landmark studies found for condition
  }

  // Search for systematic reviews and meta-analyses specifically
  async searchSystematicReviews(query: string, maxResults: number = 10): Promise<PubMedArticle[]> {
    const reviewQuery = `${query} AND ("systematic review"[Publication Type] OR "meta-analysis"[Publication Type] OR "cochrane database syst rev"[Journal])`;
    
    return await this.searchArticles({
      query: reviewQuery,
      maxResults,
      source: 'pubmed'
    });
  }

  // Search for clinical practice guidelines
  async searchClinicalGuidelines(query: string, maxResults: number = 5): Promise<PubMedArticle[]> {
    const guidelineQuery = `${query} AND ("practice guideline"[Publication Type] OR "guideline"[Publication Type] OR "clinical practice guideline"[Title/Abstract] OR "consensus statement"[Title/Abstract])`;
    
    return await this.searchArticles({
      query: guidelineQuery,
      maxResults,
      source: 'pubmed'
    });
  }

  // Enhanced search for recent high-impact studies
  async searchRecentHighImpact(query: string, maxResults: number = 15): Promise<PubMedArticle[]> {
    const currentYear = new Date().getFullYear();
    const twoYearsAgo = currentYear - 2;
    
    // Target high-impact journals and recent publications
    const highImpactQuery = `${query} AND (
      "${twoYearsAgo}/01/01"[Date - Publication] : "3000"[Date - Publication]
    ) AND (
      "new england journal of medicine"[Journal] OR
      "lancet"[Journal] OR 
      "jama"[Journal] OR
      "nature medicine"[Journal] OR
      "bmj"[Journal] OR
      "annals of internal medicine"[Journal] OR
      "circulation"[Journal] OR
      "diabetes care"[Journal] OR
      "journal of clinical oncology"[Journal]
    )`;

    return await this.searchArticles({
      query: highImpactQuery,
      maxResults,
      source: 'pubmed'
    });
  }
}

export default AdvancedPubMedClient;

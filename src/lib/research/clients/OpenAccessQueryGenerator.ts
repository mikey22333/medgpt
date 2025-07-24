/**
 * Open Access Query Generator
 * Optimizes queries for free medical databases with intelligent routing
 * Implements domain-specific targeting and landmark trial detection
 */

import DOAJClient from './DOAJClient';
import PLOSClient from './PLOSClient';
import BMCClient from './BMCClient';
import TRIPDatabaseClient from './TRIPDatabaseClient';

export interface QualityMetrics {
  minImpactFactor?: number;
  requiresPeerReview: boolean;
  requiresFullText: boolean;
  maxAge: number; // years
  evidenceLevel: 'Level_1' | 'Level_2' | 'Level_3' | 'Any';
}

export interface OpenAccessQueryResult {
  primaryQuery: string;
  openAccessFilters: string[];
  freeFullTextPriority: boolean;
  targetDatabases: string[];
  qualityThresholds: QualityMetrics;
  landmarkTrials: string[];
  domainSpecificTerms: string[];
  expectedResultTypes: string[];
}

export class OpenAccessQueryGenerator {
  private readonly domains = {
    smoking_cessation: {
      synonyms: ['e-cigarette', 'vaping', 'nicotine replacement', 'quit smoking', 'tobacco cessation', 'smoking cessation'],
      landmarks: ['Hajek et al. (NEJM 2019)', 'Cochrane Review 2024', 'EAGLES Trial'],
      meshTerms: ['Smoking Cessation', 'Electronic Nicotine Delivery Systems', 'Tobacco Use Cessation Products'],
      databases: ['PMC', 'DOAJ', 'PLOS', 'Cochrane']
    },
    cardiovascular: {
      synonyms: ['heart disease', 'myocardial infarction', 'coronary artery disease', 'heart attack', 'cardiac'],
      landmarks: ['JUPITER Trial', 'PROVE-IT Trial', 'ASCOT Trial'],
      meshTerms: ['Cardiovascular Diseases', 'Myocardial Infarction', 'Coronary Artery Disease'],
      databases: ['PLOS', 'BMC', 'PMC', 'DOAJ']
    },
    diabetes: {
      synonyms: ['diabetes mellitus', 'T1DM', 'T2DM', 'blood glucose', 'insulin', 'glycemic control'],
      landmarks: ['UKPDS', 'ACCORD', 'ADVANCE', 'VADT'],
      meshTerms: ['Diabetes Mellitus', 'Blood Glucose', 'Insulin', 'Glycemic Control'],
      databases: ['BMC', 'PLOS', 'PMC', 'DOAJ']
    },
    oncology: {
      synonyms: ['cancer', 'tumor', 'malignancy', 'neoplasm', 'chemotherapy', 'radiotherapy'],
      landmarks: ['KEYNOTE trials', 'CheckMate trials', 'PACIFIC trial'],
      meshTerms: ['Neoplasms', 'Antineoplastic Agents', 'Radiation Therapy'],
      databases: ['PLOS', 'BMC', 'PMC', 'DOAJ']
    },
    mental_health: {
      synonyms: ['depression', 'anxiety', 'psychiatric', 'mental disorder', 'psychological'],
      landmarks: ['STAR*D', 'CATIE', 'NIMH studies'],
      meshTerms: ['Mental Disorders', 'Depression', 'Anxiety Disorders'],
      databases: ['BMC', 'PLOS', 'PMC', 'TRIP']
    }
  };

  private readonly databasePriority = {
    systematic_reviews: ['Cochrane', 'PLOS', 'BMC', 'TRIP'],
    rcts: ['PMC', 'ClinicalTrials.gov', 'DOAJ', 'PLOS'],
    observational: ['PubMed', 'TRIP', 'OpenMD', 'DOAJ'],
    guidelines: ['PMC', 'TRIP', 'Cochrane', 'DOAJ'],
    meta_analysis: ['PLOS', 'BMC', 'Cochrane', 'PMC']
  };

  generateOptimizedQuery(userQuery: string): OpenAccessQueryResult {
    const domain = this.detectDomain(userQuery);
    const queryType = this.detectQueryType(userQuery);
    
    return {
      primaryQuery: this.buildPrimaryQuery(userQuery, domain),
      openAccessFilters: this.getOpenAccessFilters(domain),
      freeFullTextPriority: true,
      targetDatabases: this.getTargetDatabases(domain, queryType),
      qualityThresholds: this.getQualityThresholds(queryType),
      landmarkTrials: this.getLandmarkTrials(domain),
      domainSpecificTerms: this.getDomainTerms(domain),
      expectedResultTypes: this.getExpectedResultTypes(queryType)
    };
  }

  generateDomainSpecificQuery(userQuery: string, domain: keyof typeof this.domains): OpenAccessQueryResult {
    const domainConfig = this.domains[domain];
    
    return {
      primaryQuery: this.buildDomainQuery(userQuery, domainConfig),
      openAccessFilters: ['open_access:true', 'full_text:available'],
      freeFullTextPriority: true,
      targetDatabases: domainConfig.databases,
      qualityThresholds: {
        requiresPeerReview: true,
        requiresFullText: true,
        maxAge: 10,
        evidenceLevel: 'Level_2'
      },
      landmarkTrials: domainConfig.landmarks,
      domainSpecificTerms: domainConfig.synonyms,
      expectedResultTypes: ['RCT', 'Systematic Review', 'Meta-Analysis']
    };
  }

  generateMultiDatabaseStrategy(userQuery: string): {
    doaj: string;
    plos: string;
    bmc: string;
    trip: string;
    priorityOrder: string[];
  } {
    const domain = this.detectDomain(userQuery);
    const baseQuery = this.buildPrimaryQuery(userQuery, domain);

    return {
      doaj: this.optimizeForDOAJ(baseQuery, domain),
      plos: this.optimizeForPLOS(baseQuery, domain),
      bmc: this.optimizeForBMC(baseQuery, domain),
      trip: this.optimizeForTRIP(baseQuery, domain),
      priorityOrder: this.getPriorityOrder(domain)
    };
  }

  private detectDomain(query: string): keyof typeof this.domains | null {
    const queryLower = query.toLowerCase();
    
    for (const [domain, config] of Object.entries(this.domains)) {
      const isMatch = config.synonyms.some(synonym => 
        queryLower.includes(synonym.toLowerCase())
      );
      
      if (isMatch) {
        return domain as keyof typeof this.domains;
      }
    }
    
    return null;
  }

  private detectQueryType(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('systematic review') || queryLower.includes('meta-analysis')) {
      return 'meta_analysis';
    }
    if (queryLower.includes('randomized') || queryLower.includes('rct') || queryLower.includes('clinical trial')) {
      return 'rcts';
    }
    if (queryLower.includes('guideline') || queryLower.includes('recommendation')) {
      return 'guidelines';
    }
    if (queryLower.includes('cohort') || queryLower.includes('observational')) {
      return 'observational';
    }
    
    return 'systematic_reviews'; // Default to highest evidence level
  }

  private buildPrimaryQuery(userQuery: string, domain: keyof typeof this.domains | null): string {
    let enhancedQuery = userQuery;
    
    if (domain && this.domains[domain]) {
      const domainConfig = this.domains[domain];
      
      // Add domain-specific synonyms
      const synonymExpansion = domainConfig.synonyms.slice(0, 3).join(' OR ');
      enhancedQuery = `(${userQuery}) OR (${synonymExpansion})`;
      
      // Add MeSH terms for better precision
      const meshTerms = domainConfig.meshTerms.slice(0, 2).join(' OR ');
      enhancedQuery += ` OR MeSH:(${meshTerms})`;
    }
    
    // Add open access and quality filters
    enhancedQuery += ' AND (open_access:true OR free_full_text:true)';
    
    return enhancedQuery;
  }

  private buildDomainQuery(userQuery: string, domainConfig: any): string {
    // Build highly specific query for known domain
    const synonyms = domainConfig.synonyms.join(' OR ');
    const meshTerms = domainConfig.meshTerms.join(' OR ');
    
    return `(${userQuery}) AND ((${synonyms}) OR MeSH:(${meshTerms})) AND open_access:true`;
  }

  private getOpenAccessFilters(domain: keyof typeof this.domains | null): string[] {
    const baseFilters = [
      'open_access:true',
      'peer_reviewed:true',
      'full_text:available'
    ];
    
    if (domain) {
      const domainConfig = this.domains[domain];
      baseFilters.push(`databases:(${domainConfig.databases.join(' OR ')})`);
    }
    
    return baseFilters;
  }

  private getTargetDatabases(domain: keyof typeof this.domains | null, queryType: string): string[] {
    if (domain && this.domains[domain]) {
      return this.domains[domain].databases;
    }
    
    return this.databasePriority[queryType as keyof typeof this.databasePriority] || 
           ['PubMed', 'PMC', 'DOAJ', 'PLOS'];
  }

  private getQualityThresholds(queryType: string): QualityMetrics {
    const thresholds: Record<string, QualityMetrics> = {
      systematic_reviews: {
        requiresPeerReview: true,
        requiresFullText: true,
        maxAge: 5,
        evidenceLevel: 'Level_1'
      },
      meta_analysis: {
        requiresPeerReview: true,
        requiresFullText: true,
        maxAge: 5,
        evidenceLevel: 'Level_1'
      },
      rcts: {
        requiresPeerReview: true,
        requiresFullText: true,
        maxAge: 10,
        evidenceLevel: 'Level_2'
      },
      guidelines: {
        requiresPeerReview: true,
        requiresFullText: true,
        maxAge: 5,
        evidenceLevel: 'Level_1'
      },
      observational: {
        requiresPeerReview: true,
        requiresFullText: false,
        maxAge: 15,
        evidenceLevel: 'Level_3'
      }
    };
    
    return thresholds[queryType] || thresholds.systematic_reviews;
  }

  private getLandmarkTrials(domain: keyof typeof this.domains | null): string[] {
    if (domain && this.domains[domain]) {
      return this.domains[domain].landmarks;
    }
    return [];
  }

  private getDomainTerms(domain: keyof typeof this.domains | null): string[] {
    if (domain && this.domains[domain]) {
      return this.domains[domain].synonyms;
    }
    return [];
  }

  private getExpectedResultTypes(queryType: string): string[] {
    const typeMap: Record<string, string[]> = {
      systematic_reviews: ['Systematic Review', 'Meta-Analysis', 'Review'],
      meta_analysis: ['Meta-Analysis', 'Systematic Review'],
      rcts: ['Randomized Controlled Trial', 'Clinical Trial', 'RCT'],
      guidelines: ['Practice Guideline', 'Clinical Guideline', 'Consensus'],
      observational: ['Cohort Study', 'Case-Control Study', 'Cross-Sectional Study']
    };
    
    return typeMap[queryType] || ['Research Article', 'Clinical Study'];
  }

  private optimizeForDOAJ(baseQuery: string, domain: keyof typeof this.domains | null): string {
    // DOAJ optimization: focus on open-access journal quality
    let doajQuery = baseQuery;
    doajQuery += ' AND doaj_seal:true'; // Prioritize DOAJ Seal journals
    
    if (domain === 'smoking_cessation') {
      doajQuery += ' AND (tobacco OR smoking OR nicotine OR cessation)';
    }
    
    return doajQuery;
  }

  private optimizeForPLOS(baseQuery: string, domain: keyof typeof this.domains | null): string {
    // PLOS optimization: leverage their subject categories
    let plosQuery = baseQuery;
    
    if (domain === 'cardiovascular') {
      plosQuery += ' AND subject:"Cardiology"';
    } else if (domain === 'oncology') {
      plosQuery += ' AND subject:"Oncology"';
    }
    
    plosQuery += ' AND journal:("PLOS Medicine" OR "PLOS ONE")';
    
    return plosQuery;
  }

  private optimizeForBMC(baseQuery: string, domain: keyof typeof this.domains | null): string {
    // BMC optimization: target specialty journals
    let bmcQuery = baseQuery;
    
    if (domain === 'cardiovascular') {
      bmcQuery += ' AND journal:"BMC Cardiovascular Disorders"';
    } else if (domain === 'diabetes') {
      bmcQuery += ' AND journal:"BMC Endocrine Disorders"';
    } else if (domain === 'mental_health') {
      bmcQuery += ' AND journal:"BMC Psychiatry"';
    }
    
    bmcQuery += ' AND publisher:"BioMed Central"';
    
    return bmcQuery;
  }

  private optimizeForTRIP(baseQuery: string, domain: keyof typeof this.domains | null): string {
    // TRIP optimization: focus on evidence-based practice
    let tripQuery = baseQuery;
    tripQuery += ' AND (systematic_review OR meta_analysis OR clinical_trial OR guideline)';
    
    if (domain) {
      const domainConfig = this.domains[domain];
      tripQuery += ` AND (${domainConfig.synonyms.slice(0, 2).join(' OR ')})`;
    }
    
    return tripQuery;
  }

  private getPriorityOrder(domain: keyof typeof this.domains | null): string[] {
    if (domain && this.domains[domain]) {
      return this.domains[domain].databases;
    }
    
    // Default priority order for general queries
    return ['TRIP', 'PLOS', 'BMC', 'DOAJ'];
  }

  // Enhanced smoking cessation query specifically
  generateSmokingCessationQuery(userQuery: string): OpenAccessQueryResult {
    const smokingQuery = this.generateDomainSpecificQuery(userQuery, 'smoking_cessation');
    
    // Add specific landmark trial requirements
    smokingQuery.landmarkTrials = [
      'Hajek et al. (NEJM 2019) - PMID: 30699054',
      'Cochrane Review 2024 - PMID: 39365845',
      'EAGLES Trial (NEJM 2016) - PMID: 27120089',
      'Walker et al. (NEJM 2020) - PMID: 31893517'
    ];
    
    // Enhance primary query with specific terms
    smokingQuery.primaryQuery = `(${userQuery}) AND ((e-cigarette OR vaping OR "electronic cigarette") AND ("smoking cessation" OR "quit smoking" OR "nicotine replacement")) AND (randomized OR systematic OR meta-analysis OR clinical_trial)`;
    
    return smokingQuery;
  }
}

export default OpenAccessQueryGenerator;

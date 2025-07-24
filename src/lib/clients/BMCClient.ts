import { BaseSearchClient } from './BaseSearchClient';

export interface BMCFilters {
  maxResults?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  domain?: MedicalDomain;
  studyType?: 'clinical_trial' | 'systematic_review' | 'observational' | 'case_study' | 'ALL';
  openAccessOnly?: boolean;
}

export type MedicalDomain = 
  | 'cardiovascular'
  | 'endocrinology'
  | 'psychiatry'
  | 'oncology'
  | 'neurology'
  | 'infectious_disease'
  | 'emergency_medicine'
  | 'public_health'
  | 'ALL';

export interface BMCResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  doi: string;
  url: string;
  domain: MedicalDomain;
  studyType: string;
  qualityScore: number;
  relevanceScore: number;
  impactFactor?: number;
  isOpenAccess: boolean;
  keywords: string[];
  year: string;
  pmid?: string;
  fullTextAvailable: boolean;
  bmcSpecialty: string;
  articleType: string;
  subjects: string[];
  openAccess: boolean;
}

export class BMCClient extends BaseSearchClient {
  private baseUrl = 'https://api.springernature.com/openaccess/jats';
  private metadataUrl = 'https://api.springernature.com/metadata/json';
  
  private bmcJournals = {
    cardiovascular: [
      'BMC Cardiovascular Disorders',
      'Cardiovascular Diabetology',
      'BMC Emergency Medicine'
    ],
    endocrinology: [
      'BMC Endocrine Disorders',
      'Diabetology & Metabolic Syndrome',
      'Thyroid Research'
    ],
    psychiatry: [
      'BMC Psychiatry',
      'BMC Psychology',
      'International Journal of Mental Health Systems'
    ],
    oncology: [
      'BMC Cancer',
      'Molecular Cancer',
      'BMC Medical Genomics'
    ],
    neurology: [
      'BMC Neurology',
      'BMC Neuroscience',
      'Alzheimer\'s Research & Therapy'
    ],
    infectious_disease: [
      'BMC Infectious Diseases',
      'Malaria Journal',
      'BMC Microbiology'
    ],
    emergency_medicine: [
      'BMC Emergency Medicine',
      'International Journal of Emergency Medicine',
      'Scandinavian Journal of Trauma, Resuscitation and Emergency Medicine'
    ],
    public_health: [
      'BMC Public Health',
      'International Journal of Health Geographics',
      'BMC Health Services Research'
    ]
  };

  private journalImpactFactors = {
    'BMC Medicine': 9.088,
    'Molecular Cancer': 27.401,
    'BMC Biology': 7.364,
    'Cardiovascular Diabetology': 8.785,
    'BMC Cardiovascular Disorders': 2.174,
    'BMC Psychiatry': 4.425,
    'BMC Public Health': 4.135,
    'BMC Cancer': 4.638
  };

  async searchSpecializedJournals(query: string, filters: BMCFilters = {}): Promise<BMCResult[]> {
    try {
      const targetJournals = this.getTargetJournals(filters.domain);
      const results: BMCResult[] = [];

      // Search each target journal
      for (const journal of targetJournals) {
        const journalResults = await this.searchSingleJournal(query, journal, filters);
        results.push(...journalResults);
      }

      // Remove duplicates and rank
      const uniqueResults = this.removeDuplicates(results);
      return this.rankByDomainRelevance(uniqueResults, query, filters.domain);
    } catch (error) {
      console.error('BMC search error:', error);
      return [];
    }
  }

  private getTargetJournals(domain?: MedicalDomain): string[] {
    if (!domain || domain === 'ALL') {
      return Object.values(this.bmcJournals).flat();
    }
    return this.bmcJournals[domain as keyof typeof this.bmcJournals] || [];
  }

  private async searchSingleJournal(
    query: string, 
    journal: string, 
    filters: BMCFilters
  ): Promise<BMCResult[]> {
    try {
      const searchParams = this.buildJournalSearchParams(query, journal, filters);
      const response = await fetch(`${this.metadataUrl}?${searchParams.toString()}`);
      
      if (!response.ok) {
        console.warn(`BMC journal search failed for ${journal}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return this.processJournalResults(data.records || [], journal, query, filters);
    } catch (error) {
      console.warn(`BMC journal search error for ${journal}:`, error);
      return [];
    }
  }

  private buildJournalSearchParams(query: string, journal: string, filters: BMCFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    // Build domain-specific query
    const optimizedQuery = this.buildDomainOptimizedQuery(query, journal);
    params.append('q', optimizedQuery);
    
    // Journal filter
    params.append('p', journal);
    
    // Date range
    if (filters.dateRange) {
      params.append('date', `${filters.dateRange.start}-${filters.dateRange.end}`);
    }
    
    // Open access filter
    if (filters.openAccessOnly !== false) {
      params.append('openaccess', 'true');
    }
    
    // Results limit
    params.append('s', '1');
    params.append('p', (filters.maxResults || 25).toString());
    
    return params;
  }

  private buildDomainOptimizedQuery(query: string, journal: string): string {
    let optimizedQuery = query;
    
    // Add domain-specific terms based on journal
    const domainTerms = this.getDomainSpecificTerms(journal);
    if (domainTerms.length > 0) {
      optimizedQuery += ` AND (${domainTerms.join(' OR ')})`;
    }
    
    // Add study type boosting
    optimizedQuery += ' AND (clinical OR trial OR study OR research OR analysis)';
    
    return optimizedQuery;
  }

  private getDomainSpecificTerms(journal: string): string[] {
    const domainTermsMap: { [key: string]: string[] } = {
      'BMC Cardiovascular Disorders': [
        'heart failure', 'myocardial infarction', 'coronary artery', 'hypertension',
        'atrial fibrillation', 'cardiac', 'cardiovascular'
      ],
      'BMC Endocrine Disorders': [
        'diabetes', 'insulin', 'glucose', 'thyroid', 'hormone', 'metabolic',
        'endocrine', 'SGLT2', 'GLP-1'
      ],
      'BMC Psychiatry': [
        'depression', 'anxiety', 'mental health', 'psychiatric', 'cognitive',
        'behavioral', 'therapy', 'antidepressant'
      ],
      'BMC Cancer': [
        'cancer', 'tumor', 'oncology', 'chemotherapy', 'radiation', 'metastasis',
        'malignant', 'carcinoma'
      ]
    };

    return domainTermsMap[journal] || [];
  }

  private processJournalResults(
    records: any[], 
    journal: string, 
    query: string, 
    filters: BMCFilters
  ): Promise<BMCResult[]> {
    return Promise.resolve(records.map(record => {
      const domain = this.determineDomain(journal, record);
      const impactFactor = this.journalImpactFactors[journal as keyof typeof this.journalImpactFactors];
      
      return {
        id: record.doi || record.identifier || '',
        title: record.title || 'No title',
        authors: this.extractAuthors(record),
        journal,
        publicationDate: record.publicationDate || record.date || '',
        abstract: record.abstract || '',
        doi: record.doi || '',
        url: record.url || `https://bmcmedicine.biomedcentral.com/articles/${record.doi}`,
        domain,
        studyType: this.determineStudyType(record),
        qualityScore: this.calculateBMCQualityScore(record, journal, impactFactor),
        relevanceScore: this.calculateDomainRelevance(record, query, domain),
        impactFactor,
        isOpenAccess: record.openAccess === 'true' || true, // BMC is generally open access
        keywords: this.extractKeywords(record),
        year: record.publicationDate?.split('-')[0] || record.date?.split('-')[0] || '',
        pmid: record.pmid || undefined,
        fullTextAvailable: true, // BMC articles usually have full text
        bmcSpecialty: domain,
        articleType: record.articleType || 'research-article',
        subjects: this.extractKeywords(record),
        openAccess: record.openAccess === 'true' || true
      };
    }));
  }

  private determineDomain(journal: string, record: any): MedicalDomain {
    // Map journal to domain
    for (const [domain, journals] of Object.entries(this.bmcJournals)) {
      if (journals.includes(journal)) {
        return domain as MedicalDomain;
      }
    }
    
    // Fallback: analyze content
    const text = `${record.title || ''} ${record.abstract || ''}`.toLowerCase();
    
    if (text.includes('heart') || text.includes('cardiac') || text.includes('cardiovascular')) {
      return 'cardiovascular';
    } else if (text.includes('diabetes') || text.includes('endocrine') || text.includes('hormone')) {
      return 'endocrinology';
    } else if (text.includes('mental') || text.includes('psychiatr') || text.includes('depression')) {
      return 'psychiatry';
    } else if (text.includes('cancer') || text.includes('tumor') || text.includes('oncolog')) {
      return 'oncology';
    }
    
    return 'ALL';
  }

  private extractAuthors(record: any): string[] {
    if (Array.isArray(record.creators)) {
      return record.creators.map((creator: any) => creator.creator || creator.name || creator);
    }
    if (record.creator) {
      return Array.isArray(record.creator) ? record.creator : [record.creator];
    }
    return [];
  }

  private determineStudyType(record: any): string {
    const title = (record.title || '').toLowerCase();
    const abstract = (record.abstract || '').toLowerCase();
    const text = `${title} ${abstract}`;
    
    if (text.includes('systematic review') || text.includes('meta-analysis')) {
      return 'Systematic Review';
    } else if (text.includes('randomized') || text.includes('clinical trial') || text.includes('rct')) {
      return 'RCT';
    } else if (text.includes('cohort') || text.includes('longitudinal')) {
      return 'Cohort Study';
    } else if (text.includes('case-control')) {
      return 'Case-Control Study';
    } else if (text.includes('cross-sectional')) {
      return 'Cross-Sectional Study';
    } else if (text.includes('case series') || text.includes('case report')) {
      return 'Case Series';
    }
    
    return 'Other';
  }

  private calculateBMCQualityScore(record: any, journal: string, impactFactor?: number): number {
    let score = 0;
    
    // Impact factor weighting (0-35 points)
    if (impactFactor) {
      if (impactFactor >= 20) score += 35;
      else if (impactFactor >= 10) score += 30;
      else if (impactFactor >= 5) score += 25;
      else if (impactFactor >= 3) score += 20;
      else score += 15;
    }
    
    // Open access bonus (0-15 points)
    if (record.openAccess === 'true' || journal.includes('BMC')) {
      score += 15;
    }
    
    // Abstract quality (0-20 points)
    const abstract = record.abstract || '';
    if (abstract.length > 300) score += 20;
    else if (abstract.length > 200) score += 15;
    else if (abstract.length > 100) score += 10;
    else if (abstract.length > 50) score += 5;
    
    // Journal specialization (0-15 points)
    if (journal.includes('BMC')) score += 10; // BMC brand recognition
    if (journal.includes('Cardiovascular') || journal.includes('Cancer') || journal.includes('Psychiatry')) {
      score += 5; // Specialized focus
    }
    
    // Publication recency (0-15 points)
    const pubDate = new Date(record.publicationDate || record.date);
    const currentYear = new Date().getFullYear();
    const pubYear = pubDate.getFullYear();
    const yearsDiff = currentYear - pubYear;
    
    if (yearsDiff <= 1) score += 15;
    else if (yearsDiff <= 3) score += 12;
    else if (yearsDiff <= 5) score += 8;
    else if (yearsDiff <= 10) score += 4;
    
    return Math.min(score, 100);
  }

  private calculateDomainRelevance(record: any, query: string, domain: MedicalDomain): number {
    const title = (record.title || '').toLowerCase();
    const abstract = (record.abstract || '').toLowerCase();
    const text = `${title} ${abstract}`;
    
    const queryTerms = query.toLowerCase().split(/\s+/);
    let relevanceScore = 0;
    
    // Query term matching
    queryTerms.forEach(term => {
      if (title.includes(term)) relevanceScore += 3;
      if (abstract.includes(term)) relevanceScore += 2;
    });
    
    // Domain-specific term bonus
    const domainTerms = this.getDomainSpecificTerms(`BMC ${domain}`);
    domainTerms.forEach(term => {
      if (text.includes(term.toLowerCase())) relevanceScore += 1;
    });
    
    // Study type relevance
    const studyType = this.determineStudyType(record);
    if (studyType === 'Systematic Review' || studyType === 'RCT') {
      relevanceScore += 2;
    }
    
    return Math.min((relevanceScore / queryTerms.length) * 15, 100);
  }

  private extractKeywords(record: any): string[] {
    const keywords: string[] = [];
    
    if (record.keywords) {
      if (Array.isArray(record.keywords)) {
        keywords.push(...record.keywords);
      } else {
        keywords.push(record.keywords);
      }
    }
    
    if (record.subject) {
      if (Array.isArray(record.subject)) {
        keywords.push(...record.subject);
      } else {
        keywords.push(record.subject);
      }
    }
    
    return [...new Set(keywords)].slice(0, 10); // Limit to 10 unique keywords
  }

  private removeDuplicates(results: BMCResult[]): BMCResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.doi || result.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private rankByDomainRelevance(results: BMCResult[], query: string, domain?: MedicalDomain): BMCResult[] {
    return results.sort((a, b) => {
      // Domain match bonus
      let scoreA = a.relevanceScore * 0.6 + a.qualityScore * 0.4;
      let scoreB = b.relevanceScore * 0.6 + b.qualityScore * 0.4;
      
      if (domain && domain !== 'ALL') {
        if (a.domain === domain) scoreA += 10;
        if (b.domain === domain) scoreB += 10;
      }
      
      return scoreB - scoreA;
    });
  }

  // Domain-specific search method
  async searchByDomain(query: string, domain: MedicalDomain, maxResults = 20): Promise<BMCResult[]> {
    return this.searchSpecializedJournals(query, {
      domain,
      maxResults,
      openAccessOnly: true
    });
  }

  // Get available domains
  getAvailableDomains(): MedicalDomain[] {
    return Object.keys(this.bmcJournals) as MedicalDomain[];
  }

  // Get journals by domain
  getJournalsByDomain(domain: MedicalDomain): string[] {
    if (domain === 'ALL') return Object.values(this.bmcJournals).flat();
    return this.bmcJournals[domain as keyof typeof this.bmcJournals] || [];
  }

  // Implement abstract method from BaseSearchClient
  async search(query: string, filters: BMCFilters = {}): Promise<BMCResult[]> {
    return this.searchSpecializedJournals(query, filters);
  }

  // Missing methods referenced in EnhancedResearchService
  async searchBioMedCentral(query: string, maxResults = 20): Promise<BMCResult[]> {
    return this.searchSpecializedJournals(query, { maxResults, openAccessOnly: true });
  }

  async searchBySpecialty(query: string, domain: MedicalDomain, maxResults = 20): Promise<BMCResult[]> {
    return this.searchByDomain(query, domain, maxResults);
  }
}

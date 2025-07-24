import { BaseSearchClient } from './BaseSearchClient';

export interface TRIPFilters {
  maxResults?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  evidenceLevel?: 1 | 2 | 3 | 4 | 5 | 'ALL';
  studyType?: 'systematic_review' | 'rct' | 'guideline' | 'clinical_qa' | 'ALL';
  language?: 'en' | 'es' | 'fr' | 'de' | 'ALL';
}

export interface TRIPResult {
  id: string;
  title: string;
  authors: string[];
  source: string;
  publicationDate: string;
  abstract: string;
  url: string;
  evidenceLevel: number;
  studyType: string;
  qualityScore: number;
  relevanceScore: number;
  citationCount?: number;
  isGuideline: boolean;
  isClinicalAnswer: boolean;
  subjects: string[];
  journal: { name: string };
  year: string;
  doi: string;
  pmid?: string;
  freeFullText: boolean;
  clinicalRelevance: number;
  evidenceType: string;
}

export class TRIPDatabaseClient extends BaseSearchClient {
  private baseUrl = 'https://www.tripdatabase.com/api/v1';
  private searchUrl = 'https://www.tripdatabase.com/search';
  
  // Evidence hierarchy based on TRIP classification
  private evidenceHierarchy = {
    1: ['systematic review', 'meta-analysis', 'cochrane review'],
    2: ['randomized controlled trial', 'rct', 'randomised controlled trial'],
    3: ['cohort study', 'case-control study', 'observational study'],
    4: ['case series', 'case report', 'cross-sectional study'],
    5: ['expert opinion', 'editorial', 'commentary', 'review']
  };

  async searchEvidenceBasedMedicine(query: string, filters: TRIPFilters = {}): Promise<TRIPResult[]> {
    try {
      // TRIP Database requires web scraping approach due to API limitations
      const searchParams = this.buildTRIPSearchParams(query, filters);
      const results = await this.performTRIPSearch(searchParams);
      
      return this.processAndRankResults(results, query, filters);
    } catch (error) {
      console.error('TRIP Database search error:', error);
      return [];
    }
  }

  private buildTRIPSearchParams(query: string, filters: TRIPFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    // Main query with evidence-based medicine focus
    const enhancedQuery = this.enhanceQueryForEBM(query);
    params.append('q', enhancedQuery);
    
    // Evidence level filter
    if (filters.evidenceLevel && filters.evidenceLevel !== 'ALL') {
      const levelTerms = this.evidenceHierarchy[filters.evidenceLevel];
      params.append('studyType', levelTerms.join(' OR '));
    }
    
    // Date range
    if (filters.dateRange) {
      params.append('date', `${filters.dateRange.start}-${filters.dateRange.end}`);
    }
    
    // Study type
    if (filters.studyType && filters.studyType !== 'ALL') {
      params.append('type', filters.studyType);
    }
    
    // Language
    if (filters.language && filters.language !== 'ALL') {
      params.append('lang', filters.language);
    }
    
    // Results limit
    params.append('limit', (filters.maxResults || 25).toString());
    
    return params;
  }

  private enhanceQueryForEBM(query: string): string {
    let enhancedQuery = query;
    
    // Add evidence-based medicine context
    enhancedQuery += ' AND (evidence OR clinical OR trial OR study OR systematic OR guideline)';
    
    // Boost high-quality study types
    enhancedQuery += ' AND (systematic review OR randomized OR controlled trial OR meta-analysis OR guideline OR clinical answer)';
    
    // Medical domain focus
    enhancedQuery += ' AND (medicine OR medical OR clinical OR therapeutic OR diagnostic)';
    
    return enhancedQuery;
  }

  private async performTRIPSearch(params: URLSearchParams): Promise<any[]> {
    // Since TRIP Database has limited API access, we'll simulate the structure
    // In a real implementation, this would involve web scraping or API calls
    
    const mockResults = await this.getMockTRIPResults(params.get('q') || '');
    return mockResults;
  }

  private async getMockTRIPResults(query: string): Promise<any[]> {
    // Mock implementation for demonstration
    // In production, this would make actual API calls or scrape TRIP Database
    
    const mockData = [
      {
        title: `Systematic review: ${query} - Evidence-based analysis`,
        source: 'Cochrane Database of Systematic Reviews',
        type: 'systematic review',
        abstract: `Comprehensive systematic review examining ${query} with meta-analysis of randomized controlled trials.`,
        url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858',
        date: '2024-01-15',
        level: 1
      },
      {
        title: `Clinical guideline: Management of ${query}`,
        source: 'American Heart Association',
        type: 'guideline',
        abstract: `Evidence-based clinical practice guideline for ${query} management.`,
        url: 'https://www.ahajournals.org/guidelines',
        date: '2024-03-20',
        level: 1
      },
      {
        title: `Randomized controlled trial: ${query} effectiveness`,
        source: 'New England Journal of Medicine',
        type: 'rct',
        abstract: `Large-scale randomized controlled trial evaluating ${query} in clinical practice.`,
        url: 'https://www.nejm.org/doi/full',
        date: '2024-06-10',
        level: 2
      }
    ];

    return mockData;
  }

  private processAndRankResults(results: any[], query: string, filters: TRIPFilters): TRIPResult[] {
    const processedResults: TRIPResult[] = results.map((result, index) => ({
      id: `trip_${index}`,
      title: result.title || 'No title',
      authors: this.extractAuthors(result),
      source: result.source || 'Unknown',
      publicationDate: result.date || '',
      abstract: result.abstract || '',
      url: result.url || '',
      evidenceLevel: this.determineEvidenceLevel(result),
      studyType: this.normalizeStudyType(result.type || ''),
      qualityScore: this.calculateTRIPQualityScore(result),
      relevanceScore: this.calculateRelevanceScore(result.title + ' ' + result.abstract, query),
      citationCount: result.citations || 0,
      isGuideline: this.isGuideline(result),
      isClinicalAnswer: this.isClinicalAnswer(result),
      subjects: this.extractSubjects(result),
      journal: { name: result.source || 'Unknown' },
      year: result.date?.split('-')[0] || '',
      doi: result.doi || '',
      pmid: result.pmid || undefined,
      freeFullText: result.freeFullText || false,
      clinicalRelevance: this.calculateTRIPQualityScore(result),
      evidenceType: this.normalizeStudyType(result.type || '')
    }));

    return this.rankByEvidenceQuality(processedResults);
  }

  private extractAuthors(result: any): string[] {
    if (result.authors) {
      return Array.isArray(result.authors) ? result.authors : [result.authors];
    }
    return [];
  }

  private determineEvidenceLevel(result: any): number {
    const type = (result.type || '').toLowerCase();
    const title = (result.title || '').toLowerCase();
    const text = `${type} ${title}`;

    for (const [level, terms] of Object.entries(this.evidenceHierarchy)) {
      if (terms.some(term => text.includes(term))) {
        return parseInt(level);
      }
    }

    // Default to level 5 if cannot determine
    return 5;
  }

  private normalizeStudyType(type: string): string {
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('systematic') || typeLower.includes('meta')) {
      return 'Systematic Review';
    } else if (typeLower.includes('rct') || typeLower.includes('randomized')) {
      return 'RCT';
    } else if (typeLower.includes('guideline')) {
      return 'Clinical Guideline';
    } else if (typeLower.includes('cohort')) {
      return 'Cohort Study';
    } else if (typeLower.includes('case-control')) {
      return 'Case-Control Study';
    } else if (typeLower.includes('case')) {
      return 'Case Series';
    } else if (typeLower.includes('review')) {
      return 'Review';
    }
    
    return 'Other';
  }

  private calculateTRIPQualityScore(result: any): number {
    let score = 0;
    
    // Evidence level weighting (0-40 points)
    const level = this.determineEvidenceLevel(result);
    switch (level) {
      case 1: score += 40; break;
      case 2: score += 35; break;
      case 3: score += 25; break;
      case 4: score += 15; break;
      case 5: score += 5; break;
    }
    
    // Source quality (0-25 points)
    const source = (result.source || '').toLowerCase();
    if (source.includes('cochrane')) score += 25;
    else if (source.includes('nejm') || source.includes('lancet') || source.includes('jama')) score += 22;
    else if (source.includes('bmj') || source.includes('nature')) score += 20;
    else if (source.includes('plos') || source.includes('bmc')) score += 15;
    else score += 10;
    
    // Guideline bonus (0-20 points)
    if (this.isGuideline(result)) score += 20;
    else if (this.isClinicalAnswer(result)) score += 15;
    
    // Publication recency (0-15 points)
    const pubDate = new Date(result.date || '');
    const currentYear = new Date().getFullYear();
    const pubYear = pubDate.getFullYear();
    const yearsDiff = currentYear - pubYear;
    
    if (yearsDiff <= 1) score += 15;
    else if (yearsDiff <= 3) score += 12;
    else if (yearsDiff <= 5) score += 8;
    else if (yearsDiff <= 10) score += 4;
    
    return Math.min(score, 100);
  }

  private isGuideline(result: any): boolean {
    const text = `${result.type || ''} ${result.title || ''} ${result.source || ''}`.toLowerCase();
    return text.includes('guideline') || text.includes('recommendation') || text.includes('consensus');
  }

  private isClinicalAnswer(result: any): boolean {
    const text = `${result.type || ''} ${result.title || ''}`.toLowerCase();
    return text.includes('clinical answer') || text.includes('clinical qa') || text.includes('best practice');
  }

  private extractSubjects(result: any): string[] {
    const subjects: string[] = [];
    
    if (result.subjects) {
      subjects.push(...(Array.isArray(result.subjects) ? result.subjects : [result.subjects]));
    }
    
    // Extract subjects from title and abstract
    const text = `${result.title || ''} ${result.abstract || ''}`;
    const medicalSubjects = this.extractMedicalSubjects(text);
    subjects.push(...medicalSubjects);
    
    return [...new Set(subjects)].slice(0, 8);
  }

  private extractMedicalSubjects(text: string): string[] {
    const subjects: string[] = [];
    const textLower = text.toLowerCase();
    
    const medicalTerms = [
      'cardiovascular', 'cardiology', 'heart failure', 'hypertension',
      'diabetes', 'endocrinology', 'metabolism',
      'oncology', 'cancer', 'tumor',
      'neurology', 'psychiatry', 'mental health',
      'infectious disease', 'microbiology',
      'emergency medicine', 'critical care',
      'public health', 'epidemiology'
    ];
    
    medicalTerms.forEach(term => {
      if (textLower.includes(term)) {
        subjects.push(term);
      }
    });
    
    return subjects;
  }

  private rankByEvidenceQuality(results: TRIPResult[]): TRIPResult[] {
    return results.sort((a, b) => {
      // Primary sort by evidence level (lower number = higher quality)
      if (a.evidenceLevel !== b.evidenceLevel) {
        return a.evidenceLevel - b.evidenceLevel;
      }
      
      // Secondary sort by quality score
      if (a.qualityScore !== b.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      
      // Tertiary sort by relevance
      return b.relevanceScore - a.relevanceScore;
    });
  }

  // Specialized search methods
  async searchSystematicReviews(query: string, maxResults = 10): Promise<TRIPResult[]> {
    return this.searchEvidenceBasedMedicine(query, {
      evidenceLevel: 1,
      studyType: 'systematic_review',
      maxResults
    });
  }

  async searchClinicalGuidelines(query: string, maxResults = 10): Promise<TRIPResult[]> {
    return this.searchEvidenceBasedMedicine(query, {
      studyType: 'guideline',
      maxResults
    });
  }

  async searchByEvidenceLevel(query: string, level: 1 | 2 | 3 | 4 | 5, maxResults = 20): Promise<TRIPResult[]> {
    return this.searchEvidenceBasedMedicine(query, {
      evidenceLevel: level,
      maxResults
    });
  }

  // Get evidence hierarchy information
  getEvidenceHierarchy(): { [key: number]: string[] } {
    return this.evidenceHierarchy;
  }

  // Implement abstract method from BaseSearchClient
  async search(query: string, filters: TRIPFilters = {}): Promise<TRIPResult[]> {
    return this.searchEvidenceBasedMedicine(query, filters);
  }

  // Missing method referenced in EnhancedResearchService
  async searchBySpecialty(query: string, domain: string, maxResults = 20): Promise<TRIPResult[]> {
    const filters: TRIPFilters = {
      maxResults,
      studyType: 'ALL'
    };
    return this.searchEvidenceBasedMedicine(`${query} ${domain}`, filters);
  }

  // Get study type statistics
  getStudyTypeDistribution(results: TRIPResult[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    results.forEach(result => {
      const type = result.studyType;
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    return distribution;
  }
}

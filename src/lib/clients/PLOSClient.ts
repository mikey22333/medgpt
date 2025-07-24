import { BaseSearchClient } from './BaseSearchClient';

export interface PLOSFilters {
  maxResults?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  journalType?: 'PLOS_ONE' | 'PLOS_Medicine' | 'PLOS_Biology' | 'PLOS_Genetics' | 'ALL';
  studyType?: 'clinical_trial' | 'systematic_review' | 'observational' | 'ALL';
  impactFactorMin?: number;
}

export interface PLOSResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  doi: string;
  subjects: string[];
  url: string;
  impactFactor?: number;
  citationCount?: number;
  studyType: string;
  qualityScore: number;
  relevanceScore: number;
  year: string;
  pmid?: string;
  openAccess: boolean;
  fullTextAvailable: boolean;
  articleType: string;
  keywords: string[];
}

export class PLOSClient extends BaseSearchClient {
  private baseUrl = 'https://api.plos.org/search';
  private journalImpactFactors = {
    'PLOS Medicine': 11.069,
    'PLOS Biology': 9.163,
    'PLOS Genetics': 4.766,
    'PLOS ONE': 3.752,
    'PLOS Computational Biology': 4.708,
    'PLOS Pathogens': 6.218
  };

  async searchPLOSJournals(query: string, filters: PLOSFilters = {}): Promise<PLOSResult[]> {
    try {
      const searchParams = this.buildSearchParams(query, filters);
      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`PLOS API error: ${response.status}`);
      }

      const data = await response.json();
      const results = await this.processResults(data.response.docs, query, filters);
      
      return this.rankByRelevanceAndQuality(results, query);
    } catch (error) {
      console.error('PLOS search error:', error);
      return [];
    }
  }

  private buildSearchParams(query: string, filters: PLOSFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    // Build optimized query for medical research
    const optimizedQuery = this.buildPLOSQuery(query, filters);
    params.append('q', optimizedQuery);
    
    // Response format and fields
    params.append('wt', 'json');
    params.append('fl', 'id,title,author,journal,publication_date,abstract,subject,article_type,doi,counter_total_all');
    params.append('rows', (filters.maxResults || 25).toString());
    
    // Apply filters
    const filterQueries = this.buildFilterQueries(filters);
    filterQueries.forEach(fq => params.append('fq', fq));
    
    // Sort by relevance and impact
    params.append('sort', 'score desc,publication_date desc');
    
    return params;
  }

  private buildPLOSQuery(query: string, filters: PLOSFilters): string {
    // Simple query since Semantic Scholar handles semantic understanding
    let plosQuery = query;
    
    // Only add basic medical context for PLOS search
    plosQuery = `(${plosQuery}) AND (subject:"Medicine and Health Sciences" OR subject:"Clinical Medicine")`;
    
    // Boost important study types
    if (filters.studyType && filters.studyType !== 'ALL') {
      plosQuery += ` AND article_type:"${filters.studyType}"`;
    }
    
    return plosQuery;
  }

  private buildFilterQueries(filters: PLOSFilters): string[] {
    const filterQueries: string[] = [];
    
    // Date range filter
    if (filters.dateRange) {
      filterQueries.push(`publication_date:[${filters.dateRange.start}T00:00:00Z TO ${filters.dateRange.end}T23:59:59Z]`);
    }
    
    // Journal type filter
    if (filters.journalType && filters.journalType !== 'ALL') {
      filterQueries.push(`journal:"${filters.journalType.replace('_', ' ')}"`);
    }
    
    // Document type - focus on research articles
    filterQueries.push('doc_type:"full" AND article_type:"Research Article"');
    
    return filterQueries;
  }

  private async processResults(docs: any[], query: string, filters: PLOSFilters): Promise<PLOSResult[]> {
    return docs.map(doc => {
      const journal = doc.journal?.[0] || 'Unknown';
      const impactFactor = this.journalImpactFactors[journal as keyof typeof this.journalImpactFactors];
      
      return {
        id: doc.id,
        title: doc.title?.[0] || 'No title',
        authors: doc.author || [],
        journal,
        publicationDate: doc.publication_date?.[0] || '',
        abstract: doc.abstract?.[0] || '',
        doi: doc.doi?.[0] || '',
        subjects: doc.subject || [],
        url: `https://journals.plos.org/plosone/article?id=${doc.doi?.[0] || doc.id}`,
        impactFactor,
        citationCount: doc.counter_total_all || 0,
        studyType: this.determineStudyType(doc),
        qualityScore: this.calculateQualityScore(doc, impactFactor),
        relevanceScore: this.calculateRelevanceScore(
          `${doc.title?.[0] || ''} ${doc.abstract?.[0] || ''} ${(doc.subject || []).join(' ')}`, 
          query
        ),
        year: doc.publication_date?.[0] || '',
        pmid: doc.pmid || undefined,
        openAccess: true, // PLOS journals are all open access
        fullTextAvailable: true,
        articleType: doc.article_type?.[0] || 'research-article',
        keywords: doc.subject || []
      };
    });
  }

  private determineStudyType(doc: any): string {
    const title = (doc.title?.[0] || '').toLowerCase();
    const abstract = (doc.abstract?.[0] || '').toLowerCase();
    const text = `${title} ${abstract}`;
    
    if (text.includes('systematic review') || text.includes('meta-analysis')) {
      return 'Systematic Review';
    } else if (text.includes('randomized') || text.includes('clinical trial')) {
      return 'RCT';
    } else if (text.includes('cohort') || text.includes('longitudinal')) {
      return 'Cohort Study';
    } else if (text.includes('case-control')) {
      return 'Case-Control Study';
    } else if (text.includes('cross-sectional')) {
      return 'Cross-Sectional Study';
    }
    
    return 'Other';
  }

  private calculateQualityScore(doc: any, impactFactor?: number): number {
    let score = 0;
    
    // Impact factor weighting (0-40 points)
    if (impactFactor) {
      if (impactFactor >= 10) score += 40;
      else if (impactFactor >= 5) score += 30;
      else if (impactFactor >= 3) score += 20;
      else score += 10;
    }
    
    // Citation count (0-20 points)
    const citations = doc.counter_total_all || 0;
    if (citations >= 100) score += 20;
    else if (citations >= 50) score += 15;
    else if (citations >= 20) score += 10;
    else if (citations >= 5) score += 5;
    
    // Abstract quality (0-20 points)
    const abstract = doc.abstract?.[0] || '';
    if (abstract.length > 200) score += 20;
    else if (abstract.length > 100) score += 15;
    else if (abstract.length > 50) score += 10;
    
    // Journal reputation (0-20 points)
    const journal = doc.journal?.[0] || '';
    if (journal === 'PLOS Medicine') score += 20;
    else if (journal === 'PLOS Biology') score += 18;
    else if (journal === 'PLOS Genetics') score += 15;
    else if (journal === 'PLOS ONE') score += 12;
    else score += 8;
    
    return Math.min(score, 100);
  }

  protected calculateRelevanceScore(text: string, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    let relevanceScore = 0;
    
    queryTerms.forEach(term => {
      // Count exact matches
      const matches = (textLower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      relevanceScore += matches;
    });
    
    // Normalize to 0-100
    return Math.min((relevanceScore / queryTerms.length) * 20, 100);
  }

  private rankByRelevanceAndQuality(results: PLOSResult[], query: string): PLOSResult[] {
    return results.sort((a, b) => {
      const scoreA = (a.relevanceScore * 0.6) + (a.qualityScore * 0.4);
      const scoreB = (b.relevanceScore * 0.6) + (b.qualityScore * 0.4);
      return scoreB - scoreA;
    });
  }

  // Override base class method for PLOS-specific error handling
  protected handleApiError(error: any): never {
    if (error.message?.includes('rate limit')) {
      throw new Error('PLOS API rate limit exceeded. Please try again later.');
    }
    throw new Error(`PLOS search failed: ${error.message || 'Unknown error'}`);
  }

  // Implement abstract method from BaseSearchClient
  async search(query: string, filters: PLOSFilters = {}): Promise<PLOSResult[]> {
    return this.searchPLOSJournals(query, filters);
  }

  // Missing methods referenced in EnhancedResearchService
  async searchByDomain(query: string, domain: string, maxResults = 20): Promise<PLOSResult[]> {
    const filters: PLOSFilters = {
      maxResults
    };
    return this.searchPLOSJournals(`${query} ${domain}`, filters);
  }
}

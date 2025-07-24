/**
 * PLOS (Public Library of Science) Client
 * Provides access to high-impact open-access medical and scientific research
 * API Documentation: https://api.plos.org/
 */

export interface PLOSFilters {
  journal?: string[];
  subject?: string[];
  articleType?: string[];
  dateRange?: {
    start: string; // YYYY-MM-DD
    end: string;
  };
  minCitations?: number;
}

export interface PLOSResult {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: {
    name: string;
    impactFactor?: number;
    eissn: string;
  };
  year: number;
  doi: string;
  url: string;
  pmid?: string;
  articleType: string;
  subjects: string[];
  citationCount?: number;
  openAccess: boolean;
  fullTextAvailable: boolean;
  qualityScore: number;
  plosJournal: 'PLOS_ONE' | 'PLOS_Medicine' | 'PLOS_Biology' | 'PLOS_Genetics' | 'PLOS_Pathogens' | 'PLOS_Computational_Biology' | 'PLOS_Neglected_Tropical_Diseases';
}

export class PLOSClient {
  private readonly baseUrl = 'https://api.plos.org/search';
  private readonly maxResults = 50;
  private readonly apiKey?: string;

  // PLOS journal impact factors (approximate)
  private readonly journalImpactFactors = {
    'PLOS Medicine': 13.8,
    'PLOS Biology': 9.8,
    'PLOS Genetics': 4.5,
    'PLOS Pathogens': 6.7,
    'PLOS Computational Biology': 4.3,
    'PLOS ONE': 3.7,
    'PLOS Neglected Tropical Diseases': 4.2
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchPLOSJournals(
    query: string, 
    filters: PLOSFilters = {}
  ): Promise<PLOSResult[]> {
    try {
      const searchQuery = this.buildSearchQuery(query, filters);
      const params = new URLSearchParams({
        q: searchQuery,
        rows: this.maxResults.toString(),
        sort: 'score desc',
        fl: 'id,title,abstract,author,journal,publication_date,doi,article_type,subject,pmid,cross_published_journal_name,cross_published_journal_eissn'
      });

      if (this.apiKey) {
        params.append('api_key', this.apiKey);
      }

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`PLOS API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformResults(data.response?.docs || []);
    } catch (error) {
      console.error('PLOS search error:', error);
      return [];
    }
  }

  async searchMedicalResearch(query: string): Promise<PLOSResult[]> {
    const medicalFilters: PLOSFilters = {
      journal: ['PLOS Medicine', 'PLOS ONE'],
      subject: ['Medicine', 'Clinical Trials', 'Public Health', 'Epidemiology'],
      articleType: ['Research Article', 'Systematic Review', 'Meta-Analysis']
    };

    return this.searchPLOSJournals(query, medicalFilters);
  }

  async searchClinicalTrials(query: string): Promise<PLOSResult[]> {
    const clinicalTrialQuery = `${query} AND (clinical trial OR randomized OR RCT OR "controlled trial")`;
    
    const filters: PLOSFilters = {
      journal: ['PLOS Medicine', 'PLOS ONE'],
      articleType: ['Research Article']
    };

    return this.searchPLOSJournals(clinicalTrialQuery, filters);
  }

  async searchSystematicReviews(query: string): Promise<PLOSResult[]> {
    const reviewQuery = `${query} AND ("systematic review" OR "meta-analysis" OR "literature review")`;
    
    const filters: PLOSFilters = {
      journal: ['PLOS Medicine', 'PLOS ONE'],
      articleType: ['Research Article', 'Review']
    };

    return this.searchPLOSJournals(reviewQuery, filters);
  }

  async searchByDomain(query: string, domain: string): Promise<PLOSResult[]> {
    const domainFilters = this.getDomainSpecificFilters(domain);
    return this.searchPLOSJournals(query, domainFilters);
  }

  private buildSearchQuery(query: string, filters: PLOSFilters): string {
    let searchQuery = query;

    // Add journal filter
    if (filters.journal?.length) {
      const journalQuery = filters.journal.map(j => `journal:"${j}"`).join(' OR ');
      searchQuery += ` AND (${journalQuery})`;
    }

    // Add subject filter
    if (filters.subject?.length) {
      const subjectQuery = filters.subject.map(s => `subject:"${s}"`).join(' OR ');
      searchQuery += ` AND (${subjectQuery})`;
    }

    // Add article type filter
    if (filters.articleType?.length) {
      const typeQuery = filters.articleType.map(t => `article_type:"${t}"`).join(' OR ');
      searchQuery += ` AND (${typeQuery})`;
    }

    // Add date range filter
    if (filters.dateRange) {
      searchQuery += ` AND publication_date:[${filters.dateRange.start}T00:00:00Z TO ${filters.dateRange.end}T23:59:59Z]`;
    }

    return searchQuery;
  }

  private transformResults(rawResults: any[]): PLOSResult[] {
    return rawResults.map(item => ({
      id: item.id || `plos_${Date.now()}_${Math.random()}`,
      title: item.title?.[0] || 'Unknown Title',
      abstract: item.abstract?.[0] || '',
      authors: this.extractAuthors(item.author || []),
      journal: {
        name: item.journal || item.cross_published_journal_name?.[0] || 'PLOS ONE',
        impactFactor: this.getJournalImpactFactor(item.journal || 'PLOS ONE'),
        eissn: item.cross_published_journal_eissn?.[0] || ''
      },
      year: this.extractYear(item.publication_date?.[0]),
      doi: item.doi?.[0] || '',
      url: `https://doi.org/${item.doi?.[0]}` || `https://journals.plos.org/plosone/article?id=${item.id}`,
      pmid: item.pmid?.[0],
      articleType: item.article_type || 'Research Article',
      subjects: item.subject || [],
      citationCount: undefined, // PLOS API doesn't provide citation counts directly
      openAccess: true, // All PLOS articles are open access
      fullTextAvailable: true,
      qualityScore: this.calculateQualityScore(item),
      plosJournal: this.mapToPLOSJournal(item.journal || 'PLOS ONE')
    }));
  }

  private extractAuthors(authors: string[]): string[] {
    return authors.map(author => {
      // PLOS authors come in various formats
      if (typeof author === 'string') {
        return author;
      }
      return 'Unknown Author';
    }).filter(author => author !== 'Unknown Author');
  }

  private extractYear(dateString?: string): number {
    if (!dateString) return new Date().getFullYear();
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  }

  private getJournalImpactFactor(journalName: string): number | undefined {
    return this.journalImpactFactors[journalName as keyof typeof this.journalImpactFactors];
  }

  private mapToPLOSJournal(journalName: string): PLOSResult['plosJournal'] {
    const journalMap: Record<string, PLOSResult['plosJournal']> = {
      'PLOS Medicine': 'PLOS_Medicine',
      'PLOS Biology': 'PLOS_Biology',
      'PLOS Genetics': 'PLOS_Genetics',
      'PLOS Pathogens': 'PLOS_Pathogens',
      'PLOS Computational Biology': 'PLOS_Computational_Biology',
      'PLOS ONE': 'PLOS_ONE',
      'PLOS Neglected Tropical Diseases': 'PLOS_Neglected_Tropical_Diseases'
    };

    return journalMap[journalName] || 'PLOS_ONE';
  }

  private calculateQualityScore(item: any): number {
    let score = 60; // Base score for PLOS journals

    // Journal prestige
    const journal = item.journal || 'PLOS ONE';
    const impactFactor = this.getJournalImpactFactor(journal) || 0;
    
    if (impactFactor > 10) score += 25;
    else if (impactFactor > 5) score += 15;
    else if (impactFactor > 3) score += 10;

    // Article type quality
    const articleType = item.article_type || '';
    if (articleType.includes('Systematic Review') || articleType.includes('Meta-Analysis')) {
      score += 15;
    } else if (articleType.includes('Research Article')) {
      score += 10;
    } else if (articleType.includes('Clinical Trial')) {
      score += 12;
    }

    // DOI presence (standard for PLOS)
    if (item.doi?.[0]) score += 5;

    // PMID indicates indexing in PubMed
    if (item.pmid?.[0]) score += 10;

    // Recent publication (within last 5 years)
    const year = this.extractYear(item.publication_date?.[0]);
    const currentYear = new Date().getFullYear();
    if (currentYear - year <= 5) score += 5;

    return Math.min(score, 100);
  }

  private getDomainSpecificFilters(domain: string): PLOSFilters {
    const domainMap: Record<string, PLOSFilters> = {
      cardiovascular: {
        subject: ['Cardiology', 'Cardiovascular Diseases', 'Heart Disease'],
        journal: ['PLOS Medicine', 'PLOS ONE']
      },
      diabetes: {
        subject: ['Diabetes', 'Endocrinology', 'Metabolism'],
        journal: ['PLOS Medicine', 'PLOS ONE']
      },
      oncology: {
        subject: ['Oncology', 'Cancer', 'Neoplasms', 'Tumor Biology'],
        journal: ['PLOS Medicine', 'PLOS ONE', 'PLOS Biology']
      },
      infectious_diseases: {
        subject: ['Infectious Diseases', 'Microbiology', 'Virology'],
        journal: ['PLOS Medicine', 'PLOS Pathogens', 'PLOS Neglected Tropical Diseases']
      },
      neurology: {
        subject: ['Neurology', 'Neuroscience', 'Brain', 'Neurological Disorders'],
        journal: ['PLOS Medicine', 'PLOS ONE', 'PLOS Biology']
      },
      mental_health: {
        subject: ['Psychiatry', 'Psychology', 'Mental Health', 'Depression'],
        journal: ['PLOS Medicine', 'PLOS ONE']
      },
      public_health: {
        subject: ['Public Health', 'Epidemiology', 'Global Health'],
        journal: ['PLOS Medicine', 'PLOS ONE']
      }
    };

    return domainMap[domain] || { journal: ['PLOS ONE'] };
  }

  // Utility method to get recent high-impact studies
  async getRecentHighImpactStudies(query: string, months: number = 12): Promise<PLOSResult[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const filters: PLOSFilters = {
      journal: ['PLOS Medicine', 'PLOS Biology'], // Highest impact PLOS journals
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      articleType: ['Research Article', 'Systematic Review', 'Meta-Analysis']
    };

    return this.searchPLOSJournals(query, filters);
  }

  // Get full text content for PMC analysis (if available)
  async getFullTextContent(doi: string): Promise<string | null> {
    try {
      // PLOS provides XML full text
      const xmlUrl = `https://journals.plos.org/plosone/article/file?id=${doi}&type=manuscript`;
      const response = await fetch(xmlUrl);
      
      if (response.ok) {
        return await response.text();
      }
      
      return null;
    } catch (error) {
      console.error('PLOS full text retrieval error:', error);
      return null;
    }
  }
}

export default PLOSClient;

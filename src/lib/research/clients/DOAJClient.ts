/**
 * DOAJ (Directory of Open Access Journals) Client
 * Provides access to 16,000+ open-access, peer-reviewed journals
 * API Documentation: https://doaj.org/api/docs
 */

export interface DOAJFilters {
  subject?: string[];
  language?: string[];
  publisher?: string[];
  country?: string[];
  seal?: boolean; // DOAJ Seal for highest quality journals
  classification?: string[];
}

export interface DOAJResult {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal: {
    name: string;
    issn: string[];
    publisher: string;
    country: string;
    language: string[];
    subject: string[];
    seal: boolean; // DOAJ Seal indicates highest quality
  };
  year: number;
  doi?: string;
  url: string;
  keywords: string[];
  openAccess: boolean;
  fullTextAvailable: boolean;
  qualityScore: number; // 0-100 based on DOAJ criteria
}

export class DOAJClient {
  private readonly baseUrl = 'https://doaj.org/api';
  private readonly maxResults = 50;

  async searchOpenAccessJournals(
    query: string, 
    filters: DOAJFilters = {}
  ): Promise<DOAJResult[]> {
    try {
      // DOAJ API uses search query as path parameter
      const encodedQuery = encodeURIComponent(query);
      const searchParams = this.buildSearchParams(filters);
      const url = `${this.baseUrl}/search/articles/${encodedQuery}?${searchParams}`;
      
      console.log('🔍 DOAJ API request:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CliniSynth/1.0'
        }
      });
      
      if (!response.ok) {
        console.error(`DOAJ API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log('✅ DOAJ API response:', { total: data.total, results: data.results?.length });
      return this.transformResults(data.results || []);
    } catch (error) {
      console.error('DOAJ search error:', error);
      return [];
    }
  }

  async searchMedicalJournals(query: string): Promise<DOAJResult[]> {
    const medicalFilters: DOAJFilters = {
      subject: [
        'Medicine',
        'Public Health',
        'Pharmacology',
        'Neuroscience',
        'Cardiology',
        'Oncology',
        'Psychiatry',
        'Emergency Medicine'
      ],
      seal: true, // Prioritize highest quality journals
      language: ['en']
    };

    return this.searchOpenAccessJournals(query, medicalFilters);
  }

  async searchByDomain(query: string, domain: string): Promise<DOAJResult[]> {
    const domainFilters = this.getDomainSpecificFilters(domain);
    return this.searchOpenAccessJournals(query, domainFilters);
  }

  private buildSearchParams(filters: DOAJFilters): string {
    const params = new URLSearchParams();
    
    // Set page size and sort
    params.append('pageSize', this.maxResults.toString());
    params.append('sort', 'title:asc'); // DOAJ API supports title sorting

    // Apply filters using DOAJ field search syntax
    const queryParts: string[] = [];
    
    if (filters.subject?.length) {
      const subjectQuery = filters.subject.map(s => `bibjson.subject.term:"${s}"`).join(' OR ');
      queryParts.push(`(${subjectQuery})`);
    }
    
    if (filters.language?.length) {
      const langQuery = filters.language.map(l => `bibjson.journal.language:"${l}"`).join(' OR ');
      queryParts.push(`(${langQuery})`);
    }
    
    if (filters.publisher?.length) {
      const pubQuery = filters.publisher.map(p => `bibjson.journal.publisher:"${p}"`).join(' OR ');
      queryParts.push(`(${pubQuery})`);
    }
    
    if (filters.country?.length) {
      const countryQuery = filters.country.map(c => `bibjson.journal.country:"${c}"`).join(' OR ');
      queryParts.push(`(${countryQuery})`);
    }
    
    // Apply additional filters as query refinement if any
    if (queryParts.length > 0) {
      // For now, we'll rely on the main search and post-filter results
      // DOAJ API doesn't support complex query parameters well
    }

    return params.toString();
  }

  private transformResults(rawResults: any[]): DOAJResult[] {
    return rawResults.map(item => ({
      id: item.id || `doaj_${Date.now()}_${Math.random()}`,
      title: item.bibjson?.title || 'Unknown Title',
      abstract: item.bibjson?.abstract || undefined,
      authors: this.extractAuthors(item.bibjson?.author || []),
      journal: {
        name: item.bibjson?.journal?.title || 'Unknown Journal',
        issn: item.bibjson?.journal?.issn || [],
        publisher: item.bibjson?.journal?.publisher || 'Unknown Publisher',
        country: item.bibjson?.journal?.country || 'Unknown',
        language: item.bibjson?.journal?.language || ['en'],
        subject: item.bibjson?.subject || [],
        seal: item.admin?.seal || false
      },
      year: this.extractYear(item.bibjson?.year),
      doi: item.bibjson?.identifier?.find((id: any) => id.type === 'doi')?.id,
      url: item.bibjson?.link?.find((link: any) => link.type === 'fulltext')?.url || 
            `https://doaj.org/article/${item.id}`,
      keywords: item.bibjson?.keywords || [],
      openAccess: true, // All DOAJ articles are open access
      fullTextAvailable: true,
      qualityScore: this.calculateQualityScore(item)
    }));
  }

  private extractAuthors(authors: any[]): string[] {
    return authors.map(author => 
      author.name || `${author.given_names || ''} ${author.surname || ''}`.trim()
    ).filter(name => name.length > 0);
  }

  private extractYear(yearData: any): number {
    if (typeof yearData === 'number') return yearData;
    if (typeof yearData === 'string') {
      const parsed = parseInt(yearData);
      return isNaN(parsed) ? new Date().getFullYear() : parsed;
    }
    return new Date().getFullYear();
  }

  private calculateQualityScore(item: any): number {
    let score = 50; // Base score

    // DOAJ Seal adds significant quality points
    if (item.admin?.seal) score += 30;

    // Publisher reputation
    const publisher = item.bibjson?.journal?.publisher?.toLowerCase() || '';
    if (this.isHighQualityPublisher(publisher)) score += 15;

    // Subject relevance to medicine
    const subjects = item.bibjson?.subject || [];
    const medicalSubjects = subjects.filter((s: any) => 
      this.isMedicalSubject(s.term || s)
    );
    score += Math.min(medicalSubjects.length * 5, 20);

    // DOI presence indicates better indexing
    if (item.bibjson?.identifier?.some((id: any) => id.type === 'doi')) {
      score += 10;
    }

    // Full text availability
    if (item.bibjson?.link?.some((link: any) => link.type === 'fulltext')) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private isHighQualityPublisher(publisher: string): boolean {
    const highQualityPublishers = [
      'springer', 'nature', 'elsevier', 'wiley', 'oxford', 'cambridge',
      'taylor & francis', 'sage', 'bmj', 'plos', 'frontiers', 'mdpi'
    ];
    
    return highQualityPublishers.some(pub => publisher.includes(pub));
  }

  private isMedicalSubject(subject: string): boolean {
    const medicalKeywords = [
      'medicine', 'medical', 'health', 'clinical', 'disease', 'therapy',
      'treatment', 'diagnosis', 'pharmacology', 'surgery', 'cardiology',
      'oncology', 'neurology', 'psychiatry', 'pediatrics', 'pathology'
    ];
    
    const subjectLower = subject.toLowerCase();
    return medicalKeywords.some(keyword => subjectLower.includes(keyword));
  }

  private getDomainSpecificFilters(domain: string): DOAJFilters {
    const domainMap: Record<string, DOAJFilters> = {
      cardiovascular: {
        subject: ['Medicine', 'Cardiology', 'Cardiovascular System'],
        seal: true
      },
      diabetes: {
        subject: ['Medicine', 'Endocrinology', 'Diabetes', 'Metabolism'],
        seal: true
      },
      oncology: {
        subject: ['Medicine', 'Oncology', 'Cancer Research', 'Neoplasms'],
        seal: true
      },
      mental_health: {
        subject: ['Medicine', 'Psychiatry', 'Psychology', 'Mental Health'],
        seal: true
      },
      neurology: {
        subject: ['Medicine', 'Neurology', 'Neuroscience', 'Brain'],
        seal: true
      }
    };

    return domainMap[domain] || { seal: true, language: ['en'] };
  }

  // Utility method to get DOAJ quality metrics
  async getJournalQuality(issn: string): Promise<{
    hasSeal: boolean;
    subjects: string[];
    publisher: string;
    qualityRating: 'High' | 'Medium' | 'Low';
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/search/journals/issn:${issn}?pageSize=1`);
      if (!response.ok) return null;

      const data = await response.json();
      const journal = data.results?.[0];
      
      if (!journal) return null;

      const hasSeal = journal.admin?.seal || false;
      const subjects = journal.bibjson?.subject?.map((s: any) => s.term) || [];
      const publisher = journal.bibjson?.publisher || 'Unknown';
      
      let qualityRating: 'High' | 'Medium' | 'Low' = 'Low';
      if (hasSeal) qualityRating = 'High';
      else if (this.isHighQualityPublisher(publisher.toLowerCase())) qualityRating = 'Medium';

      return { hasSeal, subjects, publisher, qualityRating };
    } catch (error) {
      console.error('DOAJ journal quality check error:', error);
      return null;
    }
  }
}

export default DOAJClient;

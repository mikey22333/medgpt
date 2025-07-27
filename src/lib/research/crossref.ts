// CrossRef REST API Integration for Academic Research
// Documentation: https://api.crossref.org/swagger-ui/index.html

export interface CrossRefWork {
  DOI: string;
  title: string[];
  author?: Array<{
    given?: string;
    family?: string;
    affiliation?: Array<{ name: string }>;
  }>;
  'container-title'?: string[];
  published?: {
    'date-parts': number[][];
  };
  abstract?: string;
  type: string;
  URL?: string;
  publisher?: string;
  subject?: string[];
  'is-referenced-by-count'?: number;
  volume?: string;
  issue?: string;
  page?: string;
  ISSN?: string[];
  license?: Array<{
    URL: string;
    'content-version': string;
  }>;
}

export interface CrossRefResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: {
    'total-results': number;
    items: CrossRefWork[];
    facets?: any;
    query?: any;
  };
}

export interface CrossRefSearchParams {
  query?: string;
  author?: string;
  title?: string;
  publisher?: string;
  doi?: string;
  issn?: string;
  subject?: string;
  type?: string;
  from_pub_date?: string; // YYYY-MM-DD
  until_pub_date?: string; // YYYY-MM-DD
  rows?: number; // max 1000
  offset?: number;
  sort?: 'relevance' | 'score' | 'updated' | 'deposited' | 'indexed' | 'published' | 'published-print' | 'published-online' | 'issued' | 'is-referenced-by-count' | 'references-count';
  order?: 'asc' | 'desc';
  filter?: string; // Complex filter syntax
}

class CrossRefAPI {
  private baseURL = 'https://api.crossref.org';
  private userAgent = 'CliniSynth/1.0 (https://clinisynth.com; mailto:contact@clinisynth.com)';

  constructor(private email?: string) {
    // CrossRef recommends including contact email in User-Agent for better service
    if (email) {
      this.userAgent = `CliniSynth/1.0 (https://clinisynth.com; mailto:${email})`;
    }
  }

  /**
   * Search for academic works using CrossRef
   */
  async searchWorks(params: CrossRefSearchParams): Promise<CrossRefWork[]> {
    try {
      const searchParams = new URLSearchParams();

      // Build query parameters
      if (params.query) searchParams.append('query', params.query);
      if (params.author) searchParams.append('query.author', params.author);
      if (params.title) searchParams.append('query.title', params.title);
      if (params.publisher) searchParams.append('query.publisher-name', params.publisher);
      if (params.doi) searchParams.append('query.doi', params.doi);
      if (params.issn) searchParams.append('query.issn', params.issn);
      if (params.subject) searchParams.append('query.subject', params.subject);
      if (params.type) searchParams.append('filter', `type:${params.type}`);
      if (params.from_pub_date) searchParams.append('filter', `from-pub-date:${params.from_pub_date}`);
      if (params.until_pub_date) searchParams.append('filter', `until-pub-date:${params.until_pub_date}`);
      if (params.rows) searchParams.append('rows', params.rows.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.order) searchParams.append('order', params.order);
      if (params.filter) searchParams.append('filter', params.filter);

      // Set reasonable defaults
      if (!params.rows) searchParams.append('rows', '20');
      if (!params.sort) searchParams.append('sort', 'relevance');

      const url = `${this.baseURL}/works?${searchParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CrossRef API error: ${response.status} ${response.statusText}`);
      }

      const data: CrossRefResponse = await response.json();
      return data.message.items || [];

    } catch (error) {
      console.error('CrossRef search error:', error);
      return [];
    }
  }

  /**
   * Get work by DOI
   */
  async getWorkByDOI(doi: string): Promise<CrossRefWork | null> {
    try {
      const cleanDOI = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
      const url = `${this.baseURL}/works/${encodeURIComponent(cleanDOI)}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`CrossRef API error: ${response.status} ${response.statusText}`);
      }

      const data: CrossRefResponse = await response.json();
      return data.message as unknown as CrossRefWork;

    } catch (error) {
      console.error('CrossRef DOI lookup error:', error);
      return null;
    }
  }

  /**
   * Search for medical/health-related research
   */
  async searchMedicalResearch(query: string, options: {
    limit?: number;
    yearFrom?: number;
    yearTo?: number;
    includeTypes?: string[];
  } = {}): Promise<CrossRefWork[]> {
    const { limit = 20, yearFrom, yearTo, includeTypes = ['journal-article'] } = options;

    // Medical subject filters
    const medicalSubjects = [
      'Medicine', 'Health Sciences', 'Biomedical Sciences', 'Clinical Medicine',
      'Pharmacology', 'Pathology', 'Physiology', 'Anatomy', 'Biochemistry',
      'Immunology', 'Microbiology', 'Neuroscience', 'Oncology', 'Cardiology',
      'Dermatology', 'Endocrinology', 'Gastroenterology', 'Hematology',
      'Infectious Diseases', 'Nephrology', 'Neurology', 'Obstetrics',
      'Ophthalmology', 'Orthopedics', 'Otolaryngology', 'Pediatrics',
      'Psychiatry', 'Pulmonology', 'Radiology', 'Surgery', 'Urology'
    ];

    const filters = [];
    
    // Type filter
    if (includeTypes.length > 0) {
      filters.push(includeTypes.map(type => `type:${type}`).join(','));
    }

    // Date filters
    if (yearFrom) filters.push(`from-pub-date:${yearFrom}-01-01`);
    if (yearTo) filters.push(`until-pub-date:${yearTo}-12-31`);

    const searchParams: CrossRefSearchParams = {
      query: query,
      rows: limit,
      sort: 'is-referenced-by-count',
      order: 'desc',
      filter: filters.length > 0 ? filters.join(',') : undefined
    };

    return this.searchWorks(searchParams);
  }

  /**
   * Convert CrossRef work to citation format
   */
  formatCitation(work: CrossRefWork, style: 'apa' | 'mla' | 'chicago' = 'apa'): string {
    const authors = work.author?.map(author => {
      const given = author.given || '';
      const family = author.family || '';
      return family ? `${family}, ${given.charAt(0)}.` : given;
    }).join(', ') || 'Unknown Author';

    const title = work.title?.[0] || 'Untitled';
    const journal = work['container-title']?.[0] || '';
    const year = work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear();
    const volume = work.volume || '';
    const issue = work.issue || '';
    const pages = work.page || '';
    const doi = work.DOI;

    switch (style) {
      case 'apa':
        let citation = `${authors} (${year}). ${title}.`;
        if (journal) citation += ` ${journal}`;
        if (volume) citation += `, ${volume}`;
        if (issue) citation += `(${issue})`;
        if (pages) citation += `, ${pages}`;
        if (doi) citation += `. https://doi.org/${doi}`;
        return citation;

      case 'mla':
        return `${authors} "${title}" ${journal}, vol. ${volume}, no. ${issue}, ${year}, pp. ${pages}. ${doi ? 'https://doi.org/' + doi : ''}.`;

      case 'chicago':
        return `${authors} "${title}" ${journal} ${volume}, no. ${issue} (${year}): ${pages}. ${doi ? 'https://doi.org/' + doi : ''}.`;

      default:
        return this.formatCitation(work, 'apa');
    }
  }

  /**
   * Get citation count and impact metrics
   */
  async getWorkMetrics(doi: string): Promise<{
    citationCount: number;
    type: string;
    publisher: string;
    isOpenAccess: boolean;
  } | null> {
    const work = await this.getWorkByDOI(doi);
    if (!work) return null;

    return {
      citationCount: work['is-referenced-by-count'] || 0,
      type: work.type || 'unknown',
      publisher: work.publisher || 'Unknown',
      isOpenAccess: work.license ? work.license.length > 0 : false
    };
  }
}

// Export singleton instance
export const crossRefAPI = new CrossRefAPI(process.env.CROSSREF_EMAIL);

// Helper functions for common medical research queries
export const medicalResearchHelpers = {
  searchDrugResearch: (drugName: string, limit = 20) => 
    crossRefAPI.searchMedicalResearch(`${drugName} drug therapy treatment`, { limit }),

  searchDiseaseResearch: (disease: string, limit = 20) => 
    crossRefAPI.searchMedicalResearch(`${disease} diagnosis treatment management`, { limit }),

  searchClinicalTrials: (condition: string, limit = 20) => 
    crossRefAPI.searchMedicalResearch(`${condition} clinical trial randomized controlled`, { 
      limit, 
      includeTypes: ['journal-article'] 
    }),

  searchSystematicReviews: (topic: string, limit = 20) => 
    crossRefAPI.searchMedicalResearch(`${topic} systematic review meta-analysis`, { limit }),

  searchRecentResearch: (topic: string, yearsBack = 2, limit = 20) => {
    const currentYear = new Date().getFullYear();
    return crossRefAPI.searchMedicalResearch(topic, { 
      limit, 
      yearFrom: currentYear - yearsBack 
    });
  }
};

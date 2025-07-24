/**
 * BioMed Central (BMC) Client
 * Provides access to 250+ open-access, peer-reviewed medical journals
 * API Documentation: https://dev.springernature.com/
 */

export interface BMCFilters {
  journal?: string[];
  subject?: string[];
  articleType?: string[];
  dateRange?: {
    start: string; // YYYY-MM-DD
    end: string;
  };
  openAccess?: boolean;
}

export interface BMCResult {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: {
    name: string;
    issn: string;
    eissn: string;
    publisher: string;
    subject: string[];
  };
  year: number;
  doi: string;
  url: string;
  pmid?: string;
  pmcid?: string;
  articleType: string;
  keywords: string[];
  openAccess: boolean;
  fullTextAvailable: boolean;
  qualityScore: number;
  bmcSpecialty: string;
}

export class BMCClient {
  private readonly baseUrl = 'https://api.springernature.com/openaccess/jats';
  private readonly searchUrl = 'https://api.springernature.com/meta/v2/jats';
  private readonly apiKey?: string;
  private readonly maxResults = 50;

  // BMC journal specialties mapping
  private readonly bmcJournals = {
    'BMC Medicine': 'General Medicine',
    'BMC Medical Ethics': 'Medical Ethics',
    'BMC Cancer': 'Oncology',
    'BMC Cardiovascular Disorders': 'Cardiology',
    'BMC Endocrine Disorders': 'Endocrinology',
    'BMC Infectious Diseases': 'Infectious Diseases',
    'BMC Neurology': 'Neurology',
    'BMC Psychiatry': 'Psychiatry',
    'BMC Public Health': 'Public Health',
    'BMC Emergency Medicine': 'Emergency Medicine',
    'BMC Family Practice': 'Family Medicine',
    'BMC Geriatrics': 'Geriatrics',
    'BMC Pediatrics': 'Pediatrics',
    'BMC Surgery': 'Surgery',
    'BMC Anesthesiology': 'Anesthesiology',
    'BMC Medical Research Methodology': 'Research Methodology'
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchBioMedCentral(
    query: string, 
    filters: BMCFilters = {}
  ): Promise<BMCResult[]> {
    try {
      const searchParams = this.buildSearchParams(query, filters);
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.searchUrl}?${searchParams}`, { headers });
      
      if (!response.ok) {
        throw new Error(`BMC API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformResults(data.records || []);
    } catch (error) {
      console.error('BMC search error:', error);
      return [];
    }
  }

  async searchMedicalJournals(query: string): Promise<BMCResult[]> {
    const medicalFilters: BMCFilters = {
      journal: [
        'BMC Medicine',
        'BMC Medical Ethics',
        'BMC Public Health',
        'BMC Medical Research Methodology'
      ],
      openAccess: true
    };

    return this.searchBioMedCentral(query, medicalFilters);
  }

  async searchBySpecialty(query: string, specialty: string): Promise<BMCResult[]> {
    const specialtyFilters = this.getSpecialtyFilters(specialty);
    return this.searchBioMedCentral(query, specialtyFilters);
  }

  async searchClinicalResearch(query: string): Promise<BMCResult[]> {
    const clinicalQuery = `${query} AND (clinical OR trial OR randomized OR RCT OR "clinical study")`;
    
    const filters: BMCFilters = {
      journal: ['BMC Medicine', 'BMC Medical Research Methodology'],
      articleType: ['Research article', 'Study protocol'],
      openAccess: true
    };

    return this.searchBioMedCentral(clinicalQuery, filters);
  }

  async searchSystematicReviews(query: string): Promise<BMCResult[]> {
    const reviewQuery = `${query} AND ("systematic review" OR "meta-analysis" OR "scoping review")`;
    
    const filters: BMCFilters = {
      articleType: ['Review', 'Systematic Review'],
      openAccess: true
    };

    return this.searchBioMedCentral(reviewQuery, filters);
  }

  private buildSearchParams(query: string, filters: BMCFilters): string {
    const params = new URLSearchParams();
    
    // Main query with BMC publisher filter
    params.append('q', `${query} AND publisher:"BioMed Central"`);
    params.append('p', this.maxResults.toString());
    params.append('s', '1');

    // Open access filter (BMC is primarily open access)
    if (filters.openAccess !== false) {
      params.append('openaccess', 'true');
    }

    // Journal filter
    if (filters.journal?.length) {
      const journalQuery = filters.journal.map(j => `"${j}"`).join(' OR ');
      params.append('q', `${params.get('q')} AND journal:(${journalQuery})`);
    }

    // Subject filter
    if (filters.subject?.length) {
      const subjectQuery = filters.subject.map(s => `"${s}"`).join(' OR ');
      params.append('q', `${params.get('q')} AND subject:(${subjectQuery})`);
    }

    // Date range filter
    if (filters.dateRange) {
      params.append('date', `${filters.dateRange.start}:${filters.dateRange.end}`);
    }

    return params.toString();
  }

  private transformResults(rawResults: any[]): BMCResult[] {
    return rawResults.map(item => ({
      id: item.doi || `bmc_${Date.now()}_${Math.random()}`,
      title: item.title || 'Unknown Title',
      abstract: item.abstract || '',
      authors: this.extractAuthors(item.creators || []),
      journal: {
        name: item.publicationName || 'BMC Journal',
        issn: item.issn || '',
        eissn: item.eissn || '',
        publisher: 'BioMed Central',
        subject: item.subjects || []
      },
      year: this.extractYear(item.publicationDate),
      doi: item.doi || '',
      url: item.url || `https://doi.org/${item.doi}`,
      pmid: item.pmid,
      pmcid: item.pmcid,
      articleType: item.contentType || 'Research article',
      keywords: item.keywords || [],
      openAccess: item.openaccess === 'true' || true, // BMC is primarily open access
      fullTextAvailable: true,
      qualityScore: this.calculateQualityScore(item),
      bmcSpecialty: this.getBMCSpecialty(item.publicationName || 'BMC Medicine')
    }));
  }

  private extractAuthors(creators: any[]): string[] {
    return creators.map(creator => {
      if (typeof creator === 'string') return creator;
      if (creator.creator) return creator.creator;
      return `${creator.givenName || ''} ${creator.familyName || ''}`.trim();
    }).filter(author => author.length > 0);
  }

  private extractYear(dateString?: string): number {
    if (!dateString) return new Date().getFullYear();
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  }

  private getBMCSpecialty(journalName: string): string {
    return this.bmcJournals[journalName as keyof typeof this.bmcJournals] || 'General Medicine';
  }

  private calculateQualityScore(item: any): number {
    let score = 70; // Base score for BMC journals (reputable publisher)

    // Journal prestige within BMC
    const journal = item.publicationName || '';
    if (journal === 'BMC Medicine') score += 20; // Flagship journal
    else if (journal.includes('BMC')) score += 15; // Other BMC journals
    
    // Article type quality
    const articleType = item.contentType || '';
    if (articleType.includes('Systematic Review')) score += 15;
    else if (articleType.includes('Research article')) score += 10;
    else if (articleType.includes('Review')) score += 12;

    // DOI presence (standard for BMC)
    if (item.doi) score += 5;

    // PMID indicates PubMed indexing
    if (item.pmid) score += 8;

    // PMC ID indicates free full-text availability
    if (item.pmcid) score += 7;

    // Recent publication
    const year = this.extractYear(item.publicationDate);
    const currentYear = new Date().getFullYear();
    if (currentYear - year <= 3) score += 5;
    else if (currentYear - year <= 5) score += 3;

    return Math.min(score, 100);
  }

  private getSpecialtyFilters(specialty: string): BMCFilters {
    const specialtyMap: Record<string, BMCFilters> = {
      cardiology: {
        journal: ['BMC Cardiovascular Disorders', 'BMC Medicine'],
        subject: ['Cardiology', 'Cardiovascular Medicine']
      },
      oncology: {
        journal: ['BMC Cancer', 'BMC Medicine'],
        subject: ['Oncology', 'Cancer Research']
      },
      neurology: {
        journal: ['BMC Neurology', 'BMC Medicine'],
        subject: ['Neurology', 'Neuroscience']
      },
      psychiatry: {
        journal: ['BMC Psychiatry', 'BMC Medicine'],
        subject: ['Psychiatry', 'Mental Health']
      },
      endocrinology: {
        journal: ['BMC Endocrine Disorders', 'BMC Medicine'],
        subject: ['Endocrinology', 'Diabetes', 'Metabolism']
      },
      infectious_diseases: {
        journal: ['BMC Infectious Diseases', 'BMC Medicine'],
        subject: ['Infectious Diseases', 'Microbiology']
      },
      public_health: {
        journal: ['BMC Public Health', 'BMC Medicine'],
        subject: ['Public Health', 'Epidemiology']
      },
      emergency_medicine: {
        journal: ['BMC Emergency Medicine', 'BMC Medicine'],
        subject: ['Emergency Medicine', 'Trauma']
      },
      pediatrics: {
        journal: ['BMC Pediatrics', 'BMC Medicine'],
        subject: ['Pediatrics', 'Child Health']
      },
      geriatrics: {
        journal: ['BMC Geriatrics', 'BMC Medicine'],
        subject: ['Geriatrics', 'Aging']
      }
    };

    return specialtyMap[specialty] || { journal: ['BMC Medicine'], openAccess: true };
  }

  // Utility method to get BMC journal information
  async getBMCJournalInfo(journalName: string): Promise<{
    specialty: string;
    description: string;
    openAccess: boolean;
    impactArea: string;
  } | null> {
    const journalInfo = {
      'BMC Medicine': {
        specialty: 'General Medicine',
        description: 'Flagship BMC journal covering all areas of medicine',
        openAccess: true,
        impactArea: 'High impact medical research'
      },
      'BMC Cancer': {
        specialty: 'Oncology',
        description: 'Cancer research and clinical oncology',
        openAccess: true,
        impactArea: 'Cancer treatment and research'
      },
      'BMC Cardiovascular Disorders': {
        specialty: 'Cardiology',
        description: 'Cardiovascular medicine and heart disease research',
        openAccess: true,
        impactArea: 'Heart disease prevention and treatment'
      },
      'BMC Medical Ethics': {
        specialty: 'Medical Ethics',
        description: 'Ethical issues in medicine and healthcare',
        openAccess: true,
        impactArea: 'Healthcare ethics and policy'
      }
    };

    return journalInfo[journalName as keyof typeof journalInfo] || null;
  }

  // Get recent high-quality BMC publications
  async getRecentHighQualityStudies(query: string, months: number = 6): Promise<BMCResult[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const filters: BMCFilters = {
      journal: ['BMC Medicine', 'BMC Medical Research Methodology'], // Highest quality BMC journals
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      articleType: ['Research article', 'Systematic Review'],
      openAccess: true
    };

    return this.searchBioMedCentral(query, filters);
  }
}

export default BMCClient;

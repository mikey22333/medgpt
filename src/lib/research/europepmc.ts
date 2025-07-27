import { type ResearchQuery } from "@/lib/types/research";

export interface MetaAnalysisSummary {
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi?: string;
  url: string;
  confidence: 'high' | 'moderate' | 'low' | 'very-low';
  keyFindings: Array<{
    outcome: string;
    effect: string;
    certainty: 'high' | 'moderate' | 'low' | 'very-low';
    participants?: number;
    studies?: number;
    interpretation: string;
  }>;
  clinicalImplications: string[];
  limitations: string[];
  gradeAssessment?: {
    confidence: 'high' | 'moderate' | 'low' | 'very-low';
    domains: {
      studyDesign: { rating: 'high' | 'low'; reason: string };
      riskOfBias: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; reason: string };
      inconsistency: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; i2?: number; reason: string };
      indirectness: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; reason: string };
      imprecision: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; optimalInformationSize?: number; reason: string };
      publicationBias: { rating: 'suspected' | 'undetected' | 'no-concern'; reason: string };
      upgradeFactors: {
        largeEffect: boolean;
        doseResponse: boolean;
        plausibleConfounding: boolean;
      };
    };
    reasons: string[];
    notes?: string;
  };
  plainLanguageSummary: string;
  structuredSummary: {
    population: string;
    intervention: string;
    comparator: string;
    outcomes: Array<{
      name: string;
      measure: string;
      value: number;
      ci?: [number, number];
      pValue?: number;
      participants?: number;
      studies?: number;
    }>;
    certainty: 'high' | 'moderate' | 'low' | 'very-low';
    importance: 'high' | 'moderate' | 'low';
  };
}

export interface EuropePMCMetaAnalysis extends EuropePMCArticle {
  studyType: 'meta-analysis' | 'systematic-review' | 'meta-analysis|systematic-review';
  outcomeMeasures?: Array<{
    name: string;
    measure: string; // RR, OR, HR, SMD, etc.
    value: number;
    ciLower?: number;
    ciUpper?: number;
    pValue?: number;
    i2?: number; // I² statistic for heterogeneity
    participants?: number;
    studies?: number;
    source?: string; // Source of the effect size if recovered
  }>;
  
  // Internal flags for effect size recovery
  _recoveredEffectSizes?: boolean;
  _missingEffectSizes?: boolean;
  qualityAssessment?: {
    amstarScore?: number; // AMSTAR-2 score (0-16)
    prismaChecklist?: string[]; // PRISMA checklist items
    riskOfBias?: {
      item: string;
      rating: 'low' | 'some-concerns' | 'high' | 'no-information';
    }[];
  };
  methods?: string;
  fullText?: string;
  participants?: number;
  citations?: Array<{
    id: string;
    title?: string;
    year?: number;
    authors?: string[];
  }>;
  picos?: {
    population?: string;
    intervention?: string;
    comparator?: string;
    outcome?: string;
    studyDesign?: string;
  };
  gradeAssessment?: {
    confidence: 'high' | 'moderate' | 'low' | 'very-low';
    domains: {
      studyDesign: { rating: 'high' | 'low'; reason: string };
      riskOfBias: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; reason: string };
      inconsistency: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; i2?: number; reason: string };
      indirectness: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; reason: string };
      imprecision: { rating: 'no' | 'serious' | 'very-serious' | 'no-concern'; optimalInformationSize?: number; reason: string };
      publicationBias: { rating: 'suspected' | 'undetected' | 'no-concern'; reason: string };
      upgradeFactors: {
        largeEffect: boolean;
        doseResponse: boolean;
        plausibleConfounding: boolean;
      };
    };
    reasons: string[];
    notes?: string;
  };
  summary?: MetaAnalysisSummary;
}

export interface EuropePMCArticle {
  id: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publishedDate: string;
  url: string;
  citationCount?: number;
  isOpenAccess?: boolean;
}

interface EuropePMCSearchResponse {
  version: string;
  hitCount: number;
  resultList: {
    result: Array<{
      id: string;
      pmid?: string;
      pmcid?: string;
      doi?: string;
      title: string;
      abstractText?: string;
      authorString?: string;
      authorList?: {
        author: Array<{
          fullName?: string;
          lastName?: string;
          firstName?: string;
        }>;
      };
      journalTitle?: string;
      pubYear?: string;
      pubType?: string;
      isOpenAccess?: string;
      citedByCount?: number;
      firstPublicationDate?: string;
      pubYearList?: {
        year: string[];
      };
      fullTextUrlList?: {
        fullTextUrl: Array<{
          url: string;
          documentStyle: string;
          site: string;
          availability?: string;
        }>;
      };
      source?: string;
      [key: string]: any; // Allow for additional properties
    }>;
  };
}

const EUROPE_PMC_BASE_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest";

interface MetaAnalysisSearchOptions {
  minStudies?: number;
  minParticipants?: number;
  minYear?: number;
  maxYear?: number;
  hasFullText?: boolean;
  includeNonEnglish?: boolean;
  sortBy?: 'relevance' | 'date' | 'cited';
  sortOrder?: 'asc' | 'desc';
  suggestFallbacks?: boolean;
  originalQuery?: string;
}

export class EuropePMCClient {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchArticles(query: ResearchQuery): Promise<EuropePMCArticle[]> {
    try {
      console.log(`Europe PMC: Searching for "${query.query}"`);
      
      // Try the exact URL format that works in browser
      const testUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query.query)}&format=json&resultType=core&pageSize=${query.maxResults}`;
      console.log(`Europe PMC: Direct test URL: ${testUrl}`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CliniSynth/1.0 (Medical Research Assistant)'
        }
      });
      
      console.log(`Europe PMC: Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Europe PMC search failed: ${response.statusText}`);
      }

      const data: EuropePMCSearchResponse = await response.json();
      
      console.log(`Europe PMC: Raw API response:`, JSON.stringify(data, null, 2).substring(0, 1000));
      console.log(`Europe PMC: API response hitCount: ${data.hitCount}`);
      console.log(`Europe PMC: resultList exists: ${!!data.resultList}`);
      console.log(`Europe PMC: result array length: ${data.resultList?.result?.length || 0}`);
      
      if (!data.resultList?.result || data.resultList.result.length === 0) {
        console.log("Europe PMC: No results in resultList");
        return [];
      }

      const articles = data.resultList.result.map(result => this.convertToArticle(result));
      console.log(`Europe PMC: Successfully converted ${articles.length} articles`);
      
      return articles;
      
    } catch (error) {
      console.error("Error searching Europe PMC:", error);
      throw new Error("Failed to search Europe PMC articles");
    }
  }

  /**
   * Search specifically for meta-analyses and systematic reviews
   * @param query The search query
   * @param options Additional search options
   * @returns Array of meta-analysis articles
   */
  async searchMetaAnalyses(
    query: string,
    options: MetaAnalysisSearchOptions = {}
  ): Promise<{
    results: EuropePMCMetaAnalysis[];
    fallbackSuggestions?: Array<{
      query: string;
      description: string;
      url: string;
    }>;
  }> {
    try {
      // Construct the query with meta-analysis specific filters
      let searchQuery = `(${query}) AND ("meta-analysis"[Publication Type] OR "systematic review"[Publication Type] OR "meta-analysis"[Title/Abstract] OR "systematic review"[Title/Abstract])`;
      
      // Add quality filters if specified
      if (options.minStudies) {
        searchQuery += ` AND ("${options.minStudies}"[Number of Studies] OR "${options.minStudies + 1}-"[Number of Studies])`;
      }
      
      if (options.minParticipants) {
        searchQuery += ` AND ("${options.minParticipants}"[Number of Participants] OR "${options.minParticipants + 1}-"[Number of Participants])`;
      }

      // Execute the search
      const searchParams = new URLSearchParams({
        query: searchQuery,
        format: 'json',
        resultType: 'core',
        pageSize: '50', // Increase page size for meta-analyses
        sort: options.sortBy === 'date' ? 'PUB_DATE' : options.sortBy === 'cited' ? 'CITED' : 'RELEVANCE',
        sortOrder: options.sortOrder?.toUpperCase() || 'DESC',
      });

      if (options.minYear) searchParams.append('fromPubDate', options.minYear.toString());
      if (options.maxYear) searchParams.append('toPubDate', options.maxYear.toString());
      if (!options.includeNonEnglish) searchParams.append('lang', 'eng');
      if (options.hasFullText) searchParams.append('has_full_text', 'true');
      
      const response = await fetch(`${EUROPE_PMC_BASE_URL}/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CliniSynth/1.0 (Medical Research Assistant)'
        }
      });

      if (!response.ok) {
        throw new Error(`Europe PMC meta-analysis search failed: ${response.statusText}`);
      }

      const data: EuropePMCSearchResponse = await response.json();
      
      if (!data.resultList?.result || data.resultList.result.length === 0) {
        // If no results and fallbacks are requested, generate some suggestions
        if (options.suggestFallbacks) {
          const fallbacks = this.generateFallbackSuggestions(options.originalQuery || query);
          return { results: [], fallbackSuggestions: fallbacks };
        }
        return { results: [] };
      }

      // Convert and enhance with meta-analysis specific data
      const metaAnalyses = await Promise.all(
        data.resultList.result.map(async (result) => {
          const article = this.convertToArticle(result) as EuropePMCMetaAnalysis;
          
          // Try to extract meta-analysis specific data
          try {
            // Check publication type for meta-analysis or systematic review
            const pubType = result.pubType?.toLowerCase() || '';
            article.studyType = pubType.includes('meta') ? 'meta-analysis' : 
                              pubType.includes('systematic') ? 'systematic-review' :
                              'meta-analysis|systematic-review';
            
            // For full meta-analysis, we'd need to parse the full text to get effect sizes
            // This is a simplified version - in a real implementation, you'd want to parse the full text
            
          } catch (error) {
            console.error('Error enhancing meta-analysis data:', error);
          }
          
          return article;
        })
      );

      return { results: metaAnalyses };
    } catch (error) {
      console.error("Error searching Europe PMC for meta-analyses:", error);
      if (options.suggestFallbacks) {
        const fallbacks = this.generateFallbackSuggestions(options.originalQuery || query);
        return { results: [], fallbackSuggestions: fallbacks };
      }
      throw new Error("Failed to search for meta-analyses");
    }
  }

  /**
   * Get a single article by ID with enhanced meta-analysis data
   */
  async getArticleById(
    id: string, 
    includeFullText: boolean = false
  ): Promise<EuropePMCMetaAnalysis | null> {
    try {
      // First, get the basic article data
      const params = new URLSearchParams({
        format: "json",
        resultType: "core",
        pageSize: "1",
        query: `ext_id:${id}`,
      });

      if (this.apiKey) {
        params.append("apiKey", this.apiKey);
      }

      const response = await fetch(
        `${EUROPE_PMC_BASE_URL}/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as EuropePMCSearchResponse;

      if (data.hitCount === 0) {
        return null;
      }

      const result = data.resultList.result[0];
      const baseArticle = this.convertToArticle(result);

      // Add meta-analysis specific fields based on the article content
      const pubTypes = Array.isArray((result as any).pubTypeList?.pubType) 
        ? (result as any).pubTypeList.pubType 
        : [(result as any).pubTypeList?.pubType].filter(Boolean);
        
      const isMetaAnalysis = pubTypes.some(
        (type: any) => type?.toLowerCase().includes('meta-analysis') || 
                    type?.toLowerCase().includes('systematic review')
      ) || false;
      
      // Extract methods section if available
      const methods = (result as any).sections?.section?.find(
        (s: any) => s.heading?.toLowerCase() === 'methods'
      )?.text;
      
      // Get full text if requested
      let fullText = '';
      if (includeFullText && result.fullTextUrlList?.fullTextUrl?.length) {
        try {
          const fullTextUrl = result.fullTextUrlList.fullTextUrl.find(
            (url: any) => url.documentStyle === 'fulltext' && (url.availability === 'Y' || !url.availability)
          )?.url;
          
          if (fullTextUrl) {
            const fullTextResponse = await fetch(fullTextUrl);
            if (fullTextResponse.ok) {
              fullText = await fullTextResponse.text();
            }
          }
        } catch (error) {
          console.error('Error fetching full text:', error);
        }
      }

      // Get citations if available
      let citations: Array<{id: string, title?: string, year?: number, authors?: string[]}> = [];
      try {
        const citationsResponse = await fetch(
          `${EUROPE_PMC_BASE_URL}/${result.id}/references?format=json`
        );
        if (citationsResponse.ok) {
          const citationsData = await citationsResponse.json();
          citations = citationsData.referenceList?.reference?.map((ref: any) => ({
            id: ref.id,
            title: ref.title,
            year: ref.year ? parseInt(ref.year, 10) : undefined,
            authors: ref.authors?.author?.map((a: any) => a.name) || []
          })) || [];
        }
      } catch (error) {
        console.error('Error fetching citations:', error);
      }

      const article: EuropePMCMetaAnalysis = {
        ...baseArticle,
        studyType: isMetaAnalysis ? 'meta-analysis|systematic-review' : 'systematic-review',
        methods,
        fullText: fullText || undefined,
        citations,
        // Extract participants count if available in the abstract
        participants: this.extractParticipantsCount(result.abstractText || '')
      };

      return article;
    } catch (error) {
      console.error("Error fetching article:", error);
      return null;
    }
  }

  private formatQuery(query: string): string {
    // Very simple query - just return the query as-is for testing
    return query;
  }

  private extractParticipantsCount(abstract: string): number | undefined {
    // Try to extract participant count from abstract
    const participantMatch = abstract.match(/(\d+(?:,\d+)*)\s*(?:participants|patients|subjects|individuals|cases)/i);
    if (participantMatch) {
      return parseInt(participantMatch[1].replace(/,/g, ''), 10);
    }
    return undefined;
  }

  private convertToArticle(result: any): EuropePMCMetaAnalysis {
    // Safely extract authors
    let authors: string[] = [];
    if (result.authorString) {
      authors = this.parseAuthors(result.authorString);
    } else if (Array.isArray(result.authorList?.author)) {
      authors = result.authorList.author
        .map((a: any) => a.fullName || `${a.lastName} ${a.firstName || ''}`.trim())
        .filter(Boolean);
    }

    // Extract publication date
    let publishedDate = '';
    if (result.firstPublicationDate) {
      publishedDate = this.parseDate(result.firstPublicationDate);
    } else if (result.pubYear) {
      publishedDate = this.parseDate(result.pubYear);
    } else if (result.pubYearList?.year) {
      publishedDate = this.parseDate(result.pubYearList.year[0]);
    }

    // Build article URL
    let articleUrl = `https://europepmc.org/article/MED/${result.pmid || result.id}`;
    if (result.doi) {
      articleUrl = `https://doi.org/${result.doi}`;
    } else if (result.pmcid) {
      articleUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/${result.pmcid}/`;
    }

    const baseArticle: EuropePMCArticle = {
      id: result.id || '',
      title: result.title || 'No title',
      abstract: result.abstractText || '',
      authors,
      journal: result.journalTitle || result.source || 'Unknown journal',
      publishedDate,
      url: articleUrl,
      pmid: result.pmid,
      pmcid: result.pmcid,
      doi: result.doi,
      isOpenAccess: result.isOpenAccess === 'Y',
      citationCount: result.citedByCount || 0,
    };

    // Cast to EuropePMCMetaAnalysis with default values
    const metaAnalysis: EuropePMCMetaAnalysis = {
      ...baseArticle,
      studyType: 'systematic-review', // Default, can be updated by caller
      outcomeMeasures: [],
      qualityAssessment: {
        riskOfBias: []
      }
    };

    return metaAnalysis;
  }

  private parseAuthors(authorString?: string): string[] {
    if (!authorString) return ["Unknown Author"];
    
    // Europe PMC author string format: "Author1 A, Author2 B, Author3 C"
    const authors = authorString
      .split(",")
      .map(author => author.trim())
      .filter(author => author.length > 0)
      .slice(0, 5); // Limit to first 5 authors
    
    return authors.length > 0 ? authors : ["Unknown Author"];
  }

  private parseDate(dateString?: string | number): string {
    if (!dateString) return '';
    
    // If it's already a number, assume it's a year
    if (typeof dateString === 'number') {
      return dateString.toString();
    }
    
    // Handle YYYY format
    if (/^\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Handle YYYY-MM-DD format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try to extract just the year if full date parsing fails
      const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
      return yearMatch ? yearMatch[0] : '';
    }
    
    return date.toISOString().split('T')[0];
  }

  // Advanced search with filters
  async searchWithFilters(query: string, filters: {
    yearFrom?: number;
    yearTo?: number;
    openAccessOnly?: boolean;
    hasAbstract?: boolean;
    journalType?: "research" | "review";
    maxResults?: number;
  }): Promise<EuropePMCArticle[]> {
    
    let searchQuery = query;
    
    // Add date filter
    if (filters.yearFrom || filters.yearTo) {
      const fromYear = filters.yearFrom || 2000;
      const toYear = filters.yearTo || new Date().getFullYear();
      searchQuery += ` AND (FIRST_PDATE:[${fromYear}-01-01 TO ${toYear}-12-31])`;
    }
    
    // Add open access filter
    if (filters.openAccessOnly) {
      searchQuery += " AND OPEN_ACCESS:Y";
    }
    
    // Add abstract filter
    if (filters.hasAbstract) {
      searchQuery += " AND HAS_ABSTRACT:Y";
    }
    
    // Add journal type filter
    if (filters.journalType === "review") {
      searchQuery += " AND (PUB_TYPE:Review OR TITLE:review)";
    } else if (filters.journalType === "research") {
      searchQuery += " AND PUB_TYPE:\"research-article\"";
    }

    const researchQuery: ResearchQuery = {
      query: searchQuery,
      maxResults: filters.maxResults || 10,
      source: "europepmc"
    };

    return this.searchArticles(researchQuery);
  }

  // Generate fallback search suggestions when no results are found
  private generateFallbackSuggestions(originalQuery: string) {
    const suggestions = [];
    
    // 1. Remove age restrictions
    const agePattern = /(in|for|among|amongst|of)\s+(children|adults|elderly|seniors|infants|neonates|adolescents|teens|pediatric|geriatric)/gi;
    const withoutAge = originalQuery.replace(agePattern, '').replace(/\s+/g, ' ').trim();
    if (withoutAge !== originalQuery) {
      suggestions.push({
        query: withoutAge,
        description: `Remove age restrictions from "${originalQuery}"`,
        url: `https://europepmc.org/search?query=${encodeURIComponent(withoutAge)}`
      });
    }

    // 2. Broaden to general population
    const broadQuery = originalQuery + ' AND (general population OR adults OR patients)';
    suggestions.push({
      query: broadQuery,
      description: `Search for studies in general population`,
      url: `https://europepmc.org/search?query=${encodeURIComponent(broadQuery)}`
    });

    // 3. Search for systematic reviews if not already included
    if (!originalQuery.toLowerCase().includes('systematic review')) {
      const withSystematic = originalQuery + ' AND "systematic review"';
      suggestions.push({
        query: withSystematic,
        description: 'Include systematic reviews in the search',
        url: `https://europepmc.org/search?query=${encodeURIComponent(withSystematic)}`
      });
    }

    // 4. Search for broader intervention categories
    const interventionMatch = originalQuery.match(/(\w+\s+\w+)(?=\s+(for|in|among|of))/i);
    if (interventionMatch) {
      const intervention = interventionMatch[1];
      const broaderQuery = originalQuery.replace(intervention, `"${intervention}" OR "${intervention} therapy"`);
      suggestions.push({
        query: broaderQuery,
        description: `Include related interventions to "${intervention}"`,
        url: `https://europepmc.org/search?query=${encodeURIComponent(broaderQuery)}`
      });
    }

    return suggestions;
  }

  // Rate limiting helper
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

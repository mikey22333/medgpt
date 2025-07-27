import { type ResearchQuery, type ResearchPaper, type Author } from "@/lib/types/research";

interface OpenAlexResponse {
  results: Array<{
    id: string;
    title: string;
    abstract_inverted_index?: Record<string, number[]>;
    authorships: Array<{
      author: {
        id: string;
        display_name: string;
        orcid?: string;
      };
      institutions: Array<{
        id: string;
        display_name: string;
        country_code: string;
        type: string;
      }>;
    }>;
    primary_location: {
      source: {
        id: string;
        display_name: string;
        issn_l?: string;
        is_oa: boolean;
        is_in_doaj: boolean;
        host_organization?: string;
      };
      landing_page_url?: string;
      pdf_url?: string;
      is_oa: boolean;
      version?: string;
    };
    publication_date: string;
    doi?: string;
    cited_by_count: number;
    biblio: {
      volume?: string;
      issue?: string;
      first_page?: string;
      last_page?: string;
    };
    concepts: Array<{
      id: string;
      wikidata: string;
      display_name: string;
      level: number;
      score: number;
    }>;
    referenced_works: string[];
    related_works: string[];
    counts_by_year: Array<{
      year: number;
      works_count: number;
      cited_by_count: number;
    }>;
    is_retracted: boolean;
    is_paratext: boolean;
  }>;
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
  };
}

export class OpenAlexClient {
  private baseUrl = 'https://api.openalex.org';
  private apiKey?: string;
  private email?: string;

  constructor(apiKey?: string, email?: string) {
    this.apiKey = apiKey;
    this.email = email || 'your-email@example.com'; // Required for polite API usage
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': `CliniSynth (mailto:${this.email})`
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async searchPapers(query: ResearchQuery): Promise<ResearchPaper[]> {
    try {
      const papers = await this.searchByQuery(query.query, query.maxResults);
      return papers;
    } catch (error) {
      console.error('Error searching OpenAlex:', error);
      throw new Error('Failed to search OpenAlex papers');
    }
  }

  private async searchByQuery(query: string, limit: number): Promise<ResearchPaper[]> {
    const params = new URLSearchParams({
      search: query,
      per_page: Math.min(limit, 25).toString(), // Max 25 per page
      sort: 'cited_by_count:desc',
      filter: 'is_paratext:false', // Exclude metadata records
    });

    const url = `${this.baseUrl}/works?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.statusText}`);
      }

      const data: OpenAlexResponse = await response.json();
      return this.mapToResearchPapers(data);
    } catch (error) {
      console.error('Error fetching from OpenAlex:', error);
      throw error;
    }
  }

  private mapToResearchPapers(response: OpenAlexResponse): ResearchPaper[] {
    return response.results.map(work => {
      const id = work.id.replace('https://openalex.org/', '');
      const title = work.title || 'Untitled';
      const abstract = this.reconstructAbstract(work.abstract_inverted_index);
      const authors = work.authorships?.map(auth => ({
        name: auth.author.display_name,
        id: auth.author.id.replace('https://openalex.org/', ''),
        orcid: auth.author.orcid
      })) || [];
      const journal = work.primary_location?.source?.display_name || 'Unknown Journal';
      const year = new Date(work.publication_date).getFullYear() || new Date().getFullYear();
      const doi = work.doi;
      const url = work.primary_location?.landing_page_url || (work.doi ? `https://doi.org/${work.doi}` : `https://openalex.org/${id}`);
      
      const paper: ResearchPaper = {
        id,
        title,
        abstract,
        authors: authors.map(author => author.name), // Convert to string array
        journal,
        year: year.toString(), // Convert to string
        url,
        source: 'OpenAlex',
        pdfUrl: work.primary_location?.pdf_url,
        citationCount: work.cited_by_count,
        isOpenAccess: work.primary_location?.is_oa || false,
        doi: doi
      };
      
      return paper;
    });
  }

  private reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
    if (!invertedIndex) return '';
    
    // Flatten the inverted index into word-position mappings
    const words: {[key: number]: string} = {};
    
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words[pos] = word;
      }
    }
    
    // Reconstruct the abstract in order
    return Object.keys(words)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(pos => words[parseInt(pos)])
      .join(' ');
  }

  // Additional methods for specific OpenAlex features can be added below
  async getPaper(paperId: string): Promise<ResearchPaper | null> {
    try {
      const response = await fetch(`${this.baseUrl}/works/${paperId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`OpenAlex API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapToResearchPapers({ results: [data], meta: {} as any })[0];
    } catch (error) {
      console.error('Error fetching paper from OpenAlex:', error);
      throw error;
    }
  }

  async getAuthor(authorId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/authors/${authorId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`OpenAlex API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching author from OpenAlex:', error);
      throw error;
    }
  }
}

import { type SemanticScholarPaper, type ResearchQuery } from "@/lib/types/research";

interface SemanticScholarResponse {
  data: Array<{
    paperId: string;
    title: string;
    abstract: string;
    authors: Array<{
      name: string;
      authorId?: string;
    }>;
    venue: string;
    year: number;
    doi?: string;
    url?: string;
    citationCount: number;
  }>;
  total: number;
}

const SEMANTIC_SCHOLAR_BASE_URL = "https://api.semanticscholar.org/graph/v1";

export class SemanticScholarClient {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchPapers(query: ResearchQuery): Promise<SemanticScholarPaper[]> {
    try {
      const papers = await this.searchByQuery(query.query, query.maxResults);
      return papers;
    } catch (error) {
      console.error("Error searching Semantic Scholar:", error);
      throw new Error("Failed to search Semantic Scholar papers");
    }
  }

  private async searchByQuery(query: string, limit: number): Promise<SemanticScholarPaper[]> {
    const params = new URLSearchParams({
      query: query,
      limit: limit.toString(),
      fields: "paperId,title,abstract,authors,venue,year,url,citationCount", // Removed "doi" as it's not supported
    });

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }

    const response = await fetch(
      `${SEMANTIC_SCHOLAR_BASE_URL}/paper/search?${params}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      // Handle rate limiting and API key issues gracefully
      if (response.status === 403 || response.status === 429) {
        console.warn(`Semantic Scholar API limiting (${response.status}): ${response.statusText}`);
        return []; // Return empty array instead of throwing error
      }
      throw new Error(`Semantic Scholar search failed: ${response.statusText}`);
    }

    const data: SemanticScholarResponse = await response.json();
    
    return data.data.map(paper => ({
      paperId: paper.paperId,
      title: paper.title || "No title available",
      abstract: paper.abstract || "No abstract available",
      authors: paper.authors || [],
      venue: paper.venue || "Unknown venue",
      year: paper.year || new Date().getFullYear(),
      doi: paper.doi,
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
    }));
  }

  async getPapersByIds(paperIds: string[]): Promise<SemanticScholarPaper[]> {
    const papers: SemanticScholarPaper[] = [];
    
    for (const paperId of paperIds) {
      try {
        const paper = await this.getPaperById(paperId);
        if (paper) {
          papers.push(paper);
        }
      } catch (error) {
        console.error(`Error fetching paper ${paperId}:`, error);
        continue;
      }
    }

    return papers;
  }

  private async getPaperById(paperId: string): Promise<SemanticScholarPaper | null> {
    const params = new URLSearchParams({
      fields: "paperId,title,abstract,authors,venue,year,doi,url,citationCount",
    });

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }

    const response = await fetch(
      `${SEMANTIC_SCHOLAR_BASE_URL}/paper/${paperId}?${params}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      return null;
    }

    const paper = await response.json();
    
    return {
      paperId: paper.paperId,
      title: paper.title || "No title available",
      abstract: paper.abstract || "No abstract available",
      authors: paper.authors || [],
      venue: paper.venue || "Unknown venue",
      year: paper.year || new Date().getFullYear(),
      doi: paper.doi,
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
    };
  }

  // Rate limiting helper
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

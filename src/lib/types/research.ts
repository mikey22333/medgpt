export interface PubMedArticle {
  id: string;
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publishedDate: string;
  doi?: string;
  url: string;
}

export interface SemanticScholarPaper {
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
  citationCount?: number;
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

export interface CrossRefPaper {
  id: string;
  doi?: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal: string;
  year: number;
  url?: string;
  citationCount?: number;
  isOpenAccess?: boolean;
  type?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
}

export interface ResearchQuery {
  query: string;
  maxResults: number;
  source: 'pubmed' | 'semantic-scholar' | 'europepmc' | 'fda' | 'crossref' | 'openalex' | 'all';
}

export interface ResearchResponse {
  papers: PubMedArticle[] | SemanticScholarPaper[] | EuropePMCArticle[] | ResearchPaper[];
  totalFound: number;
  source: string;
}

// Unified research paper interface for all sources
export interface ResearchPaper {
  pmid?: string; // Make pmid optional since not all papers have it
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: string;
  url: string;
  source: 'PubMed' | 'Semantic Scholar' | 'Europe PMC' | 'FDA Drug Labels' | 'FDA FAERS' | 'FDA Recalls' | 'CrossRef' | 'OpenAlex' | 'Fallback';
  relevanceScore?: number;
  doi?: string;
  citationCount?: number;
  isOpenAccess?: boolean;
}

// Author interface for OpenAlex
export interface Author {
  name: string;
  id?: string;
  orcid?: string;
}

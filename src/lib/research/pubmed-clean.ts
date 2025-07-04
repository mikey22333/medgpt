import { type PubMedArticle, type ResearchQuery } from "@/lib/types/research";
import { XMLParser } from 'fast-xml-parser';

interface PubMedSearchResponse {
  esearchresult: {
    idlist: string[];
    count: string;
    retmax: string;
    ERROR?: string;
  };
}

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export class PubMedClient {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchArticles(query: ResearchQuery): Promise<PubMedArticle[]> {
    try {
      // Step 1: Try PMC first (more reliable currently), fallback to pubmed
      let searchIds: string[] = [];
      
      // First try PMC (PubMed Central) - working well
      try {
        searchIds = await this.searchIds(query.query, query.maxResults, 'pmc');
        if (searchIds.length === 0) {
          // Fallback to pubmed if PMC has no results
          searchIds = await this.searchIds(query.query, query.maxResults, 'pubmed');
        }
      } catch (error) {
        console.log('PMC search failed, trying pubmed:', error);
        // Fallback to pubmed
        searchIds = await this.searchIds(query.query, query.maxResults, 'pubmed');
      }
      
      if (searchIds.length === 0) {
        return [];
      }

      // Step 2: Get article details
      const articles = await this.getArticleDetails(searchIds);
      
      return articles;
    } catch (error) {
      console.error("Error searching PubMed:", error);
      return []; // Return empty array instead of throwing to avoid breaking other APIs
    }
  }

  private async searchIds(query: string, maxResults: number, database: string = 'pubmed'): Promise<string[]> {
    try {
      const params = new URLSearchParams({
        db: database,
        term: query,
        retmax: maxResults.toString(),
        retmode: "json",
        sort: "relevance",
      });

      if (this.apiKey) {
        params.append("api_key", this.apiKey);
      }

      // Use basic fetch without validation to avoid Zod issues
      const response = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${params}`);
      
      if (!response.ok) {
        throw new Error(`PubMed search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle error responses gracefully
      if (data.esearchresult && data.esearchresult.ERROR) {
        console.warn(`PubMed API error: ${data.esearchresult.ERROR}`);
        return [];
      }
      
      return data.esearchresult?.idlist || [];
    } catch (error) {
      console.error("PubMed search error:", error);
      return []; // Return empty array instead of throwing
    }
  }

  private async getArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
    try {
      const params = new URLSearchParams({
        db: "pmc", // Use PMC for fetching full details
        id: pmids.join(","),
        retmode: "xml",
      });

      if (this.apiKey) {
        params.append("api_key", this.apiKey);
      }

      const response = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${params}`);
      
      if (!response.ok) {
        throw new Error(`PubMed fetch failed: ${response.statusText}`);
      }

      const xmlText = await response.text();
      return this.parseXmlResponse(xmlText);
    } catch (error) {
      console.error("PubMed fetch error:", error);
      return [];
    }
  }

  private parseXmlResponse(xmlText: string): PubMedArticle[] {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "_",
        textNodeName: "#text"
      });
      
      const result = parser.parse(xmlText);
      const articles: PubMedArticle[] = [];
      
      // Handle both single article and multiple articles
      const pubmedArticles = result.PubmedArticleSet?.PubmedArticle;
      if (!pubmedArticles) {
        console.log("No PubmedArticle found in XML response");
        return [];
      }
      
      const articleArray = Array.isArray(pubmedArticles) ? pubmedArticles : [pubmedArticles];
      
      articleArray.forEach((article: any) => {
        try {
          const medlineCitation = article.MedlineCitation;
          const pubmedData = article.PubmedData;
          
          if (!medlineCitation) return;
          
          const pmid = medlineCitation.PMID?.["#text"] || medlineCitation.PMID?._text || medlineCitation.PMID || '';
          const articleInfo = medlineCitation.Article;
          
          if (!articleInfo) return;
          
          const title = articleInfo.ArticleTitle?.["#text"] || articleInfo.ArticleTitle || '';
          const journal = articleInfo.Journal?.Title || articleInfo.Journal?.ISOAbbreviation || 'Unknown Journal';
          
          // Extract abstract
          let abstract = '';
          if (articleInfo.Abstract?.AbstractText) {
            if (Array.isArray(articleInfo.Abstract.AbstractText)) {
              abstract = articleInfo.Abstract.AbstractText
                .map((text: any) => text?.["#text"] || text || '')
                .join(' ');
            } else {
              abstract = articleInfo.Abstract.AbstractText?.["#text"] || 
                        articleInfo.Abstract.AbstractText || '';
            }
          }
          
          // Extract authors
          const authors: string[] = [];
          if (articleInfo.AuthorList?.Author) {
            const authorArray = Array.isArray(articleInfo.AuthorList.Author) 
              ? articleInfo.AuthorList.Author 
              : [articleInfo.AuthorList.Author];
              
            authorArray.forEach((author: any) => {
              const lastName = author.LastName?.["#text"] || author.LastName || '';
              const foreName = author.ForeName?.["#text"] || author.ForeName || '';
              if (lastName) {
                authors.push(`${foreName} ${lastName}`.trim());
              }
            });
          }
          
          // Extract DOI
          let doi = '';
          if (pubmedData?.ArticleIdList?.ArticleId) {
            const idArray = Array.isArray(pubmedData.ArticleIdList.ArticleId)
              ? pubmedData.ArticleIdList.ArticleId
              : [pubmedData.ArticleIdList.ArticleId];
              
            const doiEntry = idArray.find((id: any) => id._IdType === 'doi');
            if (doiEntry) {
              doi = doiEntry?.["#text"] || doiEntry._text || doiEntry || '';
            }
          }
          
          // Extract publication date
          const pubDate = medlineCitation.Article?.Journal?.JournalIssue?.PubDate;
          let publishedDate = new Date().toISOString();
          if (pubDate?.Year) {
            const year = pubDate.Year?.["#text"] || pubDate.Year || new Date().getFullYear();
            const month = pubDate.Month?.["#text"] || pubDate.Month || '01';
            const day = pubDate.Day?.["#text"] || pubDate.Day || '01';
            publishedDate = new Date(`${year}-${month}-${day}`).toISOString();
          }
          
          if (title && pmid) {
            articles.push({
              id: pmid.toString(),
              pmid: pmid.toString(),
              title: title.replace(/<[^>]*>/g, ''), // Remove HTML tags
              abstract: abstract.replace(/<[^>]*>/g, ''), // Remove HTML tags
              authors: authors.length > 0 ? authors : ['Unknown Author'],
              journal: journal,
              publishedDate: publishedDate,
              doi: doi,
              url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
            });
          }
        } catch (error) {
          console.warn("Error parsing PubMed article:", error);
        }
      });
      
      return articles;
    } catch (error) {
      console.error("Error parsing PubMed XML:", error);
      return [];
    }
  }
}

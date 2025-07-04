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
      console.log('🔬 Searching PMC (PubMed Central) for:', query.query);
      
      // Step 1: Search for articles using PMC database (PubMed Central)
      // Note: The "pubmed" database is currently not supported by NCBI API
      // PMC (PubMed Central) is the working alternative that contains quality articles
      let searchIds: string[] = [];
      
      // Search in PMC database (this is currently the working PubMed database)
      try {
        searchIds = await this.searchIds(query.query, query.maxResults, 'pmc');
      } catch (error) {
        console.log('PMC search failed:', error);
        return [];
      }
      
      if (searchIds.length === 0) {
        console.log('No articles found in PMC search');
        return [];
      }

      console.log(`Found ${searchIds.length} PMC IDs:`, searchIds.slice(0, 3));

      // Step 2: Get article details from PMC
      const articles = await this.getArticleDetails(searchIds);
      
      console.log(`Successfully parsed ${articles.length} PMC articles`);
      return articles;
    } catch (error) {
      console.error("Error searching PMC:", error);
      return []; // Return empty array instead of throwing to avoid breaking other APIs
    }
  }

  private async searchIds(query: string, maxResults: number, database: string = 'pmc'): Promise<string[]> {
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

      const response = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${params}`);
      
      if (!response.ok) {
        throw new Error(`PMC search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle error responses gracefully
      if (data.esearchresult && data.esearchresult.ERROR) {
        console.warn(`PMC API error: ${data.esearchresult.ERROR}`);
        return [];
      }
      
      return data.esearchresult?.idlist || [];
    } catch (error) {
      console.error("PMC search error:", error);
      return []; // Return empty array instead of throwing
    }
  }

  private async getArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
    try {
      const params = new URLSearchParams({
        db: "pmc", // Use PMC database for fetching details
        id: pmids.join(","),
        retmode: "xml",
      });

      if (this.apiKey) {
        params.append("api_key", this.apiKey);
      }

      const response = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${params}`);
      
      if (!response.ok) {
        throw new Error(`PMC fetch failed: ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('PMC XML response length:', xmlText.length);
      
      return this.parseXmlResponse(xmlText);
    } catch (error) {
      console.error("PMC fetch error:", error);
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
      
      // Handle PMC XML format (pmc-articleset > article)
      if (result['pmc-articleset']?.article) {
        const pmcArticles = result['pmc-articleset'].article;
        const articleArray = Array.isArray(pmcArticles) ? pmcArticles : [pmcArticles];
        
        console.log(`Processing ${articleArray.length} PMC articles`);
        
        articleArray.forEach((article: any) => {
          try {
            const front = article.front;
            if (!front) return;
            
            const articleMeta = front['article-meta'];
            if (!articleMeta) return;
            
            // Extract PMC ID and DOI
            let pmcId = '';
            let doi = '';
            
            if (articleMeta['article-id']) {
              const idArray = Array.isArray(articleMeta['article-id']) ? articleMeta['article-id'] : [articleMeta['article-id']];
              
              idArray.forEach((id: any) => {
                if (id['_pub-id-type'] === 'pmcid') {
                  pmcId = id['#text'] || '';
                } else if (id['_pub-id-type'] === 'doi') {
                  doi = id['#text'] || '';
                } else if (id['_pub-id-type'] === 'pmcaiid' && !pmcId) {
                  pmcId = id['#text'] || '';
                }
              });
            }
            
            // Extract title
            const title = articleMeta['title-group']?.['article-title'] || '';
            
            // Extract abstract
            let abstract = '';
            if (articleMeta.abstract) {
              // PMC abstracts can be complex with sections
              if (articleMeta.abstract.sec) {
                const sections = Array.isArray(articleMeta.abstract.sec) ? articleMeta.abstract.sec : [articleMeta.abstract.sec];
                abstract = sections.map((sec: any) => {
                  if (sec.p) {
                    const paragraphs = Array.isArray(sec.p) ? sec.p : [sec.p];
                    return paragraphs.map((p: any) => p['#text'] || p).join(' ');
                  }
                  return '';
                }).join(' ');
              } else if (articleMeta.abstract.p) {
                const paragraphs = Array.isArray(articleMeta.abstract.p) ? articleMeta.abstract.p : [articleMeta.abstract.p];
                abstract = paragraphs.map((p: any) => p['#text'] || p).join(' ');
              } else if (articleMeta.abstract['#text']) {
                abstract = articleMeta.abstract['#text'];
              }
            }
            
            // Extract authors
            const authors: string[] = [];
            if (articleMeta['contrib-group']?.contrib) {
              const contribArray = Array.isArray(articleMeta['contrib-group'].contrib) ? articleMeta['contrib-group'].contrib : [articleMeta['contrib-group'].contrib];
              
              contribArray.forEach((contrib: any) => {
                if (contrib['_contrib-type'] === 'author' && contrib.name) {
                  const surname = contrib.name.surname || '';
                  const givenNames = contrib.name['given-names'] || '';
                  if (surname) {
                    authors.push(`${givenNames} ${surname}`.trim());
                  }
                }
              });
            }
            
            // Extract journal
            const journalMeta = front['journal-meta'];
            const journal = journalMeta?.['journal-title-group']?.['journal-title'] || 'Unknown Journal';
            
            // Extract publication date
            const pubDate = articleMeta['pub-date'];
            let publishedDate = new Date().toISOString();
            if (pubDate) {
              const pubDateArray = Array.isArray(pubDate) ? pubDate : [pubDate];
              const primaryDate = pubDateArray[0];
              if (primaryDate) {
                const year = primaryDate.year || new Date().getFullYear();
                const month = primaryDate.month || '01';
                const day = primaryDate.day || '01';
                publishedDate = new Date(`${year}-${month}-${day}`).toISOString();
              }
            }
            
            if (title && pmcId) {
              articles.push({
                id: pmcId.toString(),
                pmid: pmcId.toString(),
                title: title.replace(/<[^>]*>/g, '').replace(/&#\d+;/g, ''), // Remove HTML tags and entities
                abstract: abstract.replace(/<[^>]*>/g, '').replace(/&#\d+;/g, ''), // Remove HTML tags and entities
                authors: authors.length > 0 ? authors : ['Unknown Author'],
                journal: journal,
                publishedDate: publishedDate,
                doi: doi,
                url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/`
              });
            }
          } catch (error) {
            console.warn("Error parsing PMC article:", error);
          }
        });
      }
      
      else {
        console.log("No PMC articles found in XML response");
        console.log("XML structure keys:", Object.keys(result));
      }
      
      return articles;
    } catch (error) {
      console.error("Error parsing PMC XML:", error);
      return [];
    }
  }
}

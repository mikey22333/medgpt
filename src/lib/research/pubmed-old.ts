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
            const articleMeta = article['article-meta'];
            if (!articleMeta) return;
            
            // Extract PMC ID
            const pmcId = articleMeta['article-id']?.find?.((id: any) => 
              id._['pub-id-type'] === 'pmcid' || id._['pub-id-type'] === 'pmcaiid'
            )?.$text || articleMeta['article-id']?.$text || '';
            
            // Extract DOI
            const doi = articleMeta['article-id']?.find?.((id: any) => 
              id._['pub-id-type'] === 'doi'
            )?.$text || '';
            
            // Extract title
            const title = articleMeta['title-group']?.['article-title']?.$text ||
                         articleMeta['title-group']?.['article-title'] || '';
            
            // Extract abstract
            let abstract = '';
            const abstractElement = articleMeta.abstract;
            if (abstractElement) {
              if (typeof abstractElement === 'string') {
                abstract = abstractElement;
              } else if (abstractElement.p) {
                const paragraphs = Array.isArray(abstractElement.p) ? abstractElement.p : [abstractElement.p];
                abstract = paragraphs.map((p: any) => p.$text || p).join(' ');
              } else if (abstractElement.$text) {
                abstract = abstractElement.$text;
              }
            }
            
            // Extract authors
            const authors: string[] = [];
            const contribGroup = articleMeta['contrib-group'];
            if (contribGroup?.contrib) {
              const contribArray = Array.isArray(contribGroup.contrib) ? contribGroup.contrib : [contribGroup.contrib];
              contribArray.forEach((contrib: any) => {
                if (contrib._['contrib-type'] === 'author' && contrib.name) {
                  const surname = contrib.name.surname?.$text || contrib.name.surname || '';
                  const givenNames = contrib.name['given-names']?.$text || contrib.name['given-names'] || '';
                  if (surname) {
                    authors.push(`${givenNames} ${surname}`.trim());
                  }
                }
              });
            }
            
            // Extract journal
            const journalMeta = article.front?.['journal-meta'];
            const journal = journalMeta?.['journal-title-group']?.['journal-title']?.$text ||
                           journalMeta?.['journal-title-group']?.['journal-title'] ||
                           journalMeta?.['journal-title']?.$text ||
                           journalMeta?.['journal-title'] || 'Unknown Journal';
            
            // Extract publication date
            const pubDate = articleMeta['pub-date']?.[0] || articleMeta['pub-date'];
            let publishedDate = new Date().toISOString();
            if (pubDate) {
              const year = pubDate.year?.$text || pubDate.year || new Date().getFullYear();
              const month = pubDate.month?.$text || pubDate.month || '01';
              const day = pubDate.day?.$text || pubDate.day || '01';
              publishedDate = new Date(`${year}-${month}-${day}`).toISOString();
            }
            
            if (title && pmcId) {
              articles.push({
                id: pmcId.toString(),
                pmid: pmcId.toString(),
                title: title.replace(/<[^>]*>/g, ''), // Remove HTML tags
                abstract: abstract.replace(/<[^>]*>/g, ''), // Remove HTML tags
                authors: authors.length > 0 ? authors : ['Unknown Author'],
                journal: journal,
                publishedDate: publishedDate,
                doi: doi,
                url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId.replace('PMC', '')}/`
              });
            }
          } catch (error) {
            console.warn("Error parsing PMC article:", error);
          }
        });
      }
      
      // Also handle traditional PubMed XML format as fallback
      else if (result.PubmedArticleSet?.PubmedArticle) {
        const pubmedArticles = result.PubmedArticleSet.PubmedArticle;
        const articleArray = Array.isArray(pubmedArticles) ? pubmedArticles : [pubmedArticles];
        
        console.log(`Processing ${articleArray.length} traditional PubMed articles`);
        
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
            console.warn("Error parsing traditional PubMed article:", error);
          }
        });
      }
      
      else {
        console.log("No articles found in XML response - unexpected format");
        console.log("XML structure keys:", Object.keys(result));
      }
      
      return articles;
    } catch (error) {
      console.error("Error parsing XML:", error);
      return [];
    }
  }
}

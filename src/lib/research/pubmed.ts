import { type PubMedArticle, type ResearchQuery } from "@/lib/types/research";
import { XMLParser } from 'fast-xml-parser';

interface PubMedSearchResponse {
  esearchresult: {
    idlist: string[];
    count: string;
    retmax: string;
  };
}

// interface PubMedSummaryResponse {
//   result: {
//     [pmid: string]: {
//       uid: string;
//       title: string;
//       authors: Array<{ name: string }>;
//       source: string;
//       pubdate: string;
//       doi?: string;
//     };
//   };
// }

// // interface PubMedAbstractResponse {
//   PubmedArticleSet: {
//     PubmedArticle: Array<{
//       MedlineCitation: {
//         PMID: { _: string };
//         Article: {
//           ArticleTitle: string;
//           Abstract?: {
//             AbstractText: string[];
//           };
//           AuthorList?: {
//             Author: Array<{
//               LastName?: string;
//               ForeName?: string;
//             }>;
//           };
//           Journal: {
//             Title: string;
//           };
//         };
//       };
//       PubmedData: {
//         ArticleIdList: {
//           ArticleId: Array<{
//             _: string;
//             $: { IdType: string };
//           }>;
//         };
//       };
//     }>;
//   };
// }

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export class PubMedClient {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchArticles(query: ResearchQuery): Promise<PubMedArticle[]> {
    try {
      // Step 1: Search for article IDs
      const searchIds = await this.searchIds(query.query, query.maxResults);
      
      if (searchIds.length === 0) {
        return [];
      }

      // Step 2: Get article summaries and abstracts
      const articles = await this.getArticleDetails(searchIds);
      
      return articles;
    } catch (error) {
      console.error("Error searching PubMed:", error);
      throw new Error("Failed to search PubMed articles");
    }
  }

  private async searchIds(query: string, maxResults: number): Promise<string[]> {
    const params = new URLSearchParams({
      db: "pubmed",
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
      throw new Error(`PubMed search failed: ${response.statusText}`);
    }

    const data: PubMedSearchResponse = await response.json();
    return data.esearchresult.idlist || [];
  }

  private async getArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
    const params = new URLSearchParams({
      db: "pubmed",
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
          const articleData = medlineCitation?.Article;
          
          if (!articleData) return;
          
          const pmid = medlineCitation.PMID?.["#text"] || medlineCitation.PMID || "";
          const title = articleData.ArticleTitle?.["#text"] || articleData.ArticleTitle || "No title available";
          
          // Extract abstract
          let abstract = "Abstract not available";
          if (articleData.Abstract?.AbstractText) {
            const abstractText = articleData.Abstract.AbstractText;
            if (Array.isArray(abstractText)) {
              abstract = abstractText.map((text: any) => 
                typeof text === 'object' ? text["#text"] || text : text
              ).join(" ");
            } else {
              abstract = typeof abstractText === 'object' ? 
                abstractText["#text"] || abstractText : abstractText;
            }
          }
          
          // Extract authors
          const authors: string[] = [];
          if (articleData.AuthorList?.Author) {
            const authorArray = Array.isArray(articleData.AuthorList.Author) 
              ? articleData.AuthorList.Author 
              : [articleData.AuthorList.Author];
            
            authorArray.forEach((author: any) => {
              const lastName = author.LastName?.["#text"] || author.LastName || "";
              const foreName = author.ForeName?.["#text"] || author.ForeName || "";
              if (lastName || foreName) {
                authors.push(`${foreName} ${lastName}`.trim());
              }
            });
          }
          
          // Extract journal
          const journal = articleData.Journal?.Title?.["#text"] || 
                         articleData.Journal?.Title || 
                         articleData.Journal?.ISOAbbreviation?.["#text"] ||
                         articleData.Journal?.ISOAbbreviation ||
                         "Unknown Journal";
          
          // Extract publication date
          const pubDate = medlineCitation.Article?.Journal?.JournalIssue?.PubDate;
          let publishedDate = new Date().toISOString();
          if (pubDate?.Year) {
            const year = pubDate.Year?.["#text"] || pubDate.Year;
            const month = pubDate.Month?.["#text"] || pubDate.Month || "01";
            const day = pubDate.Day?.["#text"] || pubDate.Day || "01";
            publishedDate = new Date(`${year}-${month}-${day}`).toISOString();
          }
          
          articles.push({
            id: pmid,
            pmid,
            title,
            abstract,
            authors: authors.length > 0 ? authors : ["Unknown Author"],
            journal,
            publishedDate,
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          });
          
        } catch (parseError) {
          console.error("Error parsing individual article:", parseError);
        }
      });
      
      console.log(`Successfully parsed ${articles.length} articles from PubMed XML`);
      return articles;
      
    } catch (error) {
      console.error("Error parsing PubMed XML:", error);
      // Fallback to simple parsing
      return this.fallbackParseXml(xmlText);
    }
  }

  private fallbackParseXml(xmlText: string): PubMedArticle[] {
    // Simple fallback parser for when XML parsing fails
    const articles: PubMedArticle[] = [];
    
    const pmidMatches = xmlText.match(/<PMID[^>]*>(\d+)<\/PMID>/g) || [];
    const titleMatches = xmlText.match(/<ArticleTitle[^>]*>([^<]+)<\/ArticleTitle>/g) || [];
    
    pmidMatches.forEach((pmidMatch, index) => {
      const pmid = pmidMatch.match(/\d+/)?.[0] || "";
      const titleMatch = titleMatches[index];
      const title = titleMatch ? titleMatch.replace(/<[^>]*>/g, "") : "No title available";
      
      articles.push({
        id: pmid,
        pmid,
        title,
        abstract: "Abstract parsing failed - using fallback mode",
        authors: ["Author extraction failed"],
        journal: "Journal extraction failed",
        publishedDate: new Date().toISOString(),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    });

    return articles;
  }

  // Rate limiting helper
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * DOAJ (Directory of Open Access Journals) API Client
 * 
 * DOAJ is a free, full-text, searchable database of high-quality,
 * peer-reviewed, open access journals. No API key required.
 * 
 * API Documentation: https://doaj.org/api/v3/docs
 */

export interface DOAJArticle {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  doi?: string;
  url?: string;
  publishedDate: string;
  journal: string;
  subject: string[];
  openAccess: boolean;
  fullTextUrl?: string;
  language: string;
  keywords?: string[];
}

export class DOAJClient {
  private baseUrl = 'https://doaj.org';
  
  constructor() {
    // No API key required - completely free
  }

  /**
   * Search DOAJ articles
   */
  async searchArticles(query: string, maxResults: number = 10): Promise<DOAJArticle[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/api/search/articles/${encodedQuery}?pageSize=${maxResults}&sort=bibjson.year:desc`;
      
      console.log('DOAJ API URL:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedGPT-Scholar/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`DOAJ API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log('DOAJ API Response:', JSON.stringify(data, null, 2));
      return this.parseArticles(data.results || []);

    } catch (error) {
      console.error('Error searching DOAJ:', error);
      return [];
    }
  }

  /**
   * Search medical-specific articles
   */
  async searchMedicalArticles(query: string, maxResults: number = 10): Promise<DOAJArticle[]> {
    // Enhance query with medical terms using DOAJ short field names
    const medicalQuery = `(${query}) AND (title:medicine OR title:medical OR title:clinical OR title:health OR abstract:therapy OR abstract:treatment)`;
    
    try {
      const encodedQuery = encodeURIComponent(medicalQuery);
      const url = `${this.baseUrl}/api/search/articles/${encodedQuery}?pageSize=${maxResults}&sort=bibjson.year:desc`;
      
      console.log('DOAJ Medical API URL:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedGPT-Scholar/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`DOAJ medical search error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log('DOAJ Medical API Response:', JSON.stringify(data, null, 2));
      return this.parseArticles(data.results || []);

    } catch (error) {
      console.error('Error in DOAJ medical search:', error);
      return [];
    }
  }

  private parseArticles(articles: any[]): DOAJArticle[] {
    return articles.map(article => {
      const bibjson = article.bibjson || {};
      
      return {
        id: article.id || `doaj-${Date.now()}-${Math.random()}`,
        title: bibjson.title || 'No title available',
        authors: bibjson.author?.map((author: any) => author.name) || ['Unknown Author'],
        abstract: bibjson.abstract || 'Abstract not available',
        doi: bibjson.identifier?.find((id: any) => id.type === 'doi')?.id,
        url: bibjson.link?.find((link: any) => link.type === 'fulltext')?.url,
        publishedDate: bibjson.year ? `${bibjson.year}-01-01` : new Date().toISOString(),
        journal: bibjson.journal?.title || 'Unknown Journal',
        subject: bibjson.subject?.map((subj: any) => subj.term) || [],
        openAccess: true, // All DOAJ articles are open access
        fullTextUrl: bibjson.link?.find((link: any) => link.type === 'fulltext')?.url,
        language: bibjson.language?.[0] || 'en',
        keywords: bibjson.keywords || []
      };
    });
  }

  /**
   * Format DOAJ article for display
   */
  formatArticleForMedicalResearch(article: DOAJArticle): string {
    const title = article.title || 'Untitled Article';
    const authors = article.authors.length > 0 ? article.authors.slice(0, 3).join(', ') : 'Unknown Authors';
    const journal = article.journal || 'Unknown Journal';
    const year = new Date(article.publishedDate).getFullYear();
    
    let formatted = `**Open Access Research: ${title}**\n`;
    formatted += `*Authors:* ${authors}${article.authors.length > 3 ? ' et al.' : ''}\n`;
    formatted += `*Journal:* ${journal} (${year})\n`;
    formatted += `*Open Access:* ✅ Free full-text available\n`;
    
    if (article.doi) {
      formatted += `*DOI:* ${article.doi}\n`;
    }
    
    if (article.fullTextUrl) {
      formatted += `*Full Text:* [Available](${article.fullTextUrl})\n`;
    }
    
    if (article.subject.length > 0) {
      formatted += `*Subjects:* ${article.subject.slice(0, 3).join(', ')}\n`;
    }
    
    if (article.abstract && article.abstract !== 'Abstract not available') {
      const abstractPreview = article.abstract.substring(0, 200);
      formatted += `*Abstract:* ${abstractPreview}${abstractPreview.length >= 200 ? '...' : ''}\n`;
    }
    
    return formatted + '\n';
  }
}

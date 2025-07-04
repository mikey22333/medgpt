/**
 * bioRxiv API Client
 * 
 * bioRxiv is a free preprint server for biology and life sciences.
 * Provides access to cutting-edge research before peer review.
 * 
 * API Documentation: https://api.biorxiv.org/
 */

export interface BioRxivPreprint {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  doi?: string;
  url?: string;
  publishedDate: string;
  category: string;
  version: number;
  isPeerReviewed: boolean;
  fullTextUrl?: string;
  server: 'bioRxiv' | 'medRxiv';
}

export class BioRxivClient {
  private baseUrl = 'https://api.biorxiv.org/details';
  
  constructor() {
    // No API key required - completely free
  }

  /**
   * Search bioRxiv preprints
   */
  async searchPreprints(query: string, maxResults: number = 10): Promise<BioRxivPreprint[]> {
    try {
      // bioRxiv API has limited search capabilities, so we'll get recent papers
      // and filter them by relevance
      const response = await fetch(`${this.baseUrl}/biorxiv/2023-01-01/2024-12-31/json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedGPT-Scholar/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`bioRxiv API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const preprints = data.collection || [];
      
      // Filter by query relevance
      const relevantPreprints = preprints.filter((preprint: any) => {
        const searchableText = `${preprint.title} ${preprint.abstract}`.toLowerCase();
        return query.toLowerCase().split(' ').some(term => searchableText.includes(term));
      });

      return this.parsePreprints(relevantPreprints.slice(0, maxResults));

    } catch (error) {
      console.error('Error searching bioRxiv:', error);
      return [];
    }
  }

  /**
   * Search medRxiv preprints (medical preprints)
   */
  async searchMedicalPreprints(query: string, maxResults: number = 10): Promise<BioRxivPreprint[]> {
    try {
      // medRxiv for medical preprints
      const response = await fetch(`${this.baseUrl}/medrxiv/2023-01-01/2024-12-31/json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedGPT-Scholar/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`medRxiv API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const preprints = data.collection || [];
      
      // Filter by query relevance
      const relevantPreprints = preprints.filter((preprint: any) => {
        const searchableText = `${preprint.title} ${preprint.abstract}`.toLowerCase();
        return query.toLowerCase().split(' ').some(term => searchableText.includes(term));
      });

      return this.parsePreprints(relevantPreprints.slice(0, maxResults), 'medRxiv');

    } catch (error) {
      console.error('Error searching medRxiv:', error);
      return [];
    }
  }

  /**
   * Get latest preprints by category
   */
  async getLatestPreprints(category?: string, maxResults: number = 10): Promise<BioRxivPreprint[]> {
    try {
      const response = await fetch(`${this.baseUrl}/biorxiv/2024-01-01/2024-12-31/json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedGPT-Scholar/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`bioRxiv latest preprints error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      let preprints = data.collection || [];
      
      // Filter by category if specified
      if (category) {
        preprints = preprints.filter((preprint: any) => 
          preprint.category?.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Sort by date (most recent first)
      preprints.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return this.parsePreprints(preprints.slice(0, maxResults));

    } catch (error) {
      console.error('Error getting latest preprints:', error);
      return [];
    }
  }

  private parsePreprints(preprints: any[], server: 'bioRxiv' | 'medRxiv' = 'bioRxiv'): BioRxivPreprint[] {
    return preprints.map(preprint => ({
      id: preprint.doi || `${server}-${Date.now()}-${Math.random()}`,
      title: preprint.title || 'No title available',
      authors: preprint.authors ? preprint.authors.split(';').map((author: string) => author.trim()) : ['Unknown Author'],
      abstract: preprint.abstract || 'Abstract not available',
      doi: preprint.doi,
      url: preprint.doi ? `https://doi.org/${preprint.doi}` : undefined,
      publishedDate: preprint.date || new Date().toISOString(),
      category: preprint.category || 'Unknown',
      version: preprint.version || 1,
      isPeerReviewed: false, // Preprints are not peer-reviewed
      fullTextUrl: preprint.doi ? `https://www.${server}.org/content/${preprint.doi}v${preprint.version || 1}.full.pdf` : undefined,
      server
    }));
  }

  /**
   * Format preprint for display
   */
  formatPreprintForMedicalResearch(preprint: BioRxivPreprint): string {
    const title = preprint.title || 'Untitled Preprint';
    const authors = preprint.authors.length > 0 ? preprint.authors.slice(0, 3).join(', ') : 'Unknown Authors';
    const date = new Date(preprint.publishedDate).toLocaleDateString();
    
    let formatted = `**${preprint.server} Preprint: ${title}**\n`;
    formatted += `*Authors:* ${authors}${preprint.authors.length > 3 ? ' et al.' : ''}\n`;
    formatted += `*Published:* ${date} (Version ${preprint.version})\n`;
    formatted += `*Category:* ${preprint.category}\n`;
    formatted += `*Status:* ⚠️ Preprint (Not peer-reviewed)\n`;
    
    if (preprint.doi) {
      formatted += `*DOI:* ${preprint.doi}\n`;
    }
    
    if (preprint.fullTextUrl) {
      formatted += `*Full Text PDF:* [Available](${preprint.fullTextUrl})\n`;
    }
    
    if (preprint.abstract && preprint.abstract !== 'Abstract not available') {
      const abstractPreview = preprint.abstract.substring(0, 200);
      formatted += `*Abstract:* ${abstractPreview}${abstractPreview.length >= 200 ? '...' : ''}\n`;
    }
    
    formatted += `*⚠️ Note:* This is a preprint and has not undergone peer review. Results should be interpreted with caution.\n`;
    
    return formatted + '\n';
  }
}

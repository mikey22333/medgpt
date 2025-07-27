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
   * Search bioRxiv preprints with current dates and better filtering
   */
  async searchPreprints(query: string, maxResults: number = 10): Promise<BioRxivPreprint[]> {
    try {
      console.log(`🔍 BioRxiv: Searching for "${query}"...`);
      
      // Get current date and date from 6 months ago for recent papers
      const endDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const startDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Try to get recent papers from the last 6 months
      let allPreprints: any[] = [];
      let cursor = 0;
      const batchSize = 100;
      
      // Fetch multiple batches to get more papers for filtering
      for (let i = 0; i < 3 && allPreprints.length < 300; i++) {
        const response = await fetch(`${this.baseUrl}/biorxiv/${startDate}/${endDate}/${cursor}/json`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CliniSynth/1.0'
          }
        });

        if (!response.ok) {
          console.warn(`bioRxiv API error: ${response.status} for cursor ${cursor}`);
          break;
        }

        const data = await response.json();
        const batchPreprints = data.collection || [];
        
        if (batchPreprints.length === 0) break;
        
        allPreprints.push(...batchPreprints);
        cursor += batchSize;
      }
      
      console.log(`📄 BioRxiv: Retrieved ${allPreprints.length} papers to filter`);
      
      // Enhanced relevance filtering with scoring
      const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      const relevantPreprints = allPreprints
        .map((preprint: any) => {
          const searchableText = `${preprint.title} ${preprint.abstract} ${preprint.category}`.toLowerCase();
          
          // Calculate relevance score
          let score = 0;
          queryTerms.forEach(term => {
            if (searchableText.includes(term)) {
              score += 1;
              // Bonus for title matches
              if (preprint.title?.toLowerCase().includes(term)) score += 2;
              // Bonus for category matches
              if (preprint.category?.toLowerCase().includes(term)) score += 1;
            }
          });
          
          return { ...preprint, relevanceScore: score };
        })
        .filter((preprint: any) => preprint.relevanceScore > 0)
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      console.log(`📄 BioRxiv: Found ${relevantPreprints.length} relevant papers`);
      return this.parsePreprints(relevantPreprints);

    } catch (error) {
      console.error('Error searching bioRxiv:', error);
      return [];
    }
  }

  /**
   * Search medRxiv preprints (medical preprints) with current dates
   */
  async searchMedicalPreprints(query: string, maxResults: number = 10): Promise<BioRxivPreprint[]> {
    try {
      console.log(`🔍 MedRxiv: Searching for "${query}"...`);
      
      // Get current date and date from 6 months ago for recent papers
      const endDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const startDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // medRxiv for medical preprints - get multiple batches
      let allPreprints: any[] = [];
      let cursor = 0;
      const batchSize = 100;
      
      // Fetch multiple batches to get more papers for filtering
      for (let i = 0; i < 3 && allPreprints.length < 300; i++) {
        const response = await fetch(`${this.baseUrl}/medrxiv/${startDate}/${endDate}/${cursor}/json`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CliniSynth/1.0'
          }
        });

        if (!response.ok) {
          console.warn(`medRxiv API error: ${response.status} for cursor ${cursor}`);
          break;
        }

        const data = await response.json();
        const batchPreprints = data.collection || [];
        
        if (batchPreprints.length === 0) break;
        
        allPreprints.push(...batchPreprints);
        cursor += batchSize;
      }
      
      console.log(`📄 MedRxiv: Retrieved ${allPreprints.length} papers to filter`);
      
      // Enhanced relevance filtering with medical focus
      const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      const relevantPreprints = allPreprints
        .map((preprint: any) => {
          const searchableText = `${preprint.title} ${preprint.abstract} ${preprint.category}`.toLowerCase();
          
          // Calculate relevance score with medical bonus
          let score = 0;
          queryTerms.forEach(term => {
            if (searchableText.includes(term)) {
              score += 1;
              // Bonus for title matches
              if (preprint.title?.toLowerCase().includes(term)) score += 2;
              // Bonus for medical category matches
              if (preprint.category?.toLowerCase().includes(term)) score += 1;
            }
          });
          
          // Bonus for medical categories
          const medicalCategories = ['medicine', 'health', 'clinical', 'epidemiology', 'public health'];
          if (medicalCategories.some(cat => preprint.category?.toLowerCase().includes(cat))) {
            score += 1;
          }
          
          return { ...preprint, relevanceScore: score };
        })
        .filter((preprint: any) => preprint.relevanceScore > 0)
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      console.log(`📄 MedRxiv: Found ${relevantPreprints.length} relevant medical papers`);
      return this.parsePreprints(relevantPreprints, 'medRxiv');

    } catch (error) {
      console.error('Error searching medRxiv:', error);
      return [];
    }
  }

  /**
   * Get latest preprints by category with current dates
   */
  async getLatestPreprints(category?: string, maxResults: number = 10): Promise<BioRxivPreprint[]> {
    try {
      console.log(`🔍 BioRxiv: Getting latest preprints${category ? ` for category: ${category}` : ''}...`);
      
      // Get current date and date from 3 months ago for latest papers
      const endDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const startDate = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`${this.baseUrl}/biorxiv/${startDate}/${endDate}/0/json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CliniSynth/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`bioRxiv latest preprints error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      let preprints = data.collection || [];
      
      console.log(`📄 BioRxiv: Retrieved ${preprints.length} latest papers`);
      
      // Filter by category if specified
      if (category) {
        preprints = preprints.filter((preprint: any) => 
          preprint.category?.toLowerCase().includes(category.toLowerCase())
        );
        console.log(`📄 BioRxiv: Filtered to ${preprints.length} papers for category "${category}"`);
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

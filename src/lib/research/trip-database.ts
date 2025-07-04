/**
 * Trip Database API Client
 * Provides access to filtered evidence-based clinical studies and guidelines
 */

export interface TripArticle {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  publishedDate: string;
  source: string;
  studyType: string;
  evidenceLevel: string;
  tripScore: number; // Trip's evidence quality score
  fullTextAvailable: boolean;
  isGuideline: boolean;
  specialtyArea?: string;
}

export class TripDatabaseClient {
  private baseURL = 'https://www.tripdatabase.com/api/search';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchArticles(query: string, maxResults: number = 5): Promise<TripArticle[]> {
    try {
      // Trip Database search parameters
      const searchParams = new URLSearchParams({
        q: query,
        limit: maxResults.toString(),
        format: 'json',
        evidenceType: 'systematic_reviews,guidelines,clinical_trials'
      });

      // In production, this would make actual API calls to Trip Database
      // For now, return structured mock data
      const mockArticles: TripArticle[] = await this.generateMockTripResults(query, maxResults);
      
      return mockArticles;
    } catch (error) {
      console.error('Trip Database search error:', error);
      return [];
    }
  }

  async searchGuidelines(query: string, maxResults: number = 3): Promise<TripArticle[]> {
    try {
      // Search specifically for clinical guidelines
      const searchParams = new URLSearchParams({
        q: query,
        limit: maxResults.toString(),
        format: 'json',
        evidenceType: 'guidelines'
      });

      // Filter for guidelines only
      const allResults = await this.searchArticles(query, maxResults);
      return allResults.filter(article => article.isGuideline);
    } catch (error) {
      console.error('Trip Database guidelines search error:', error);
      return [];
    }
  }

  private async generateMockTripResults(query: string, maxResults: number): Promise<TripArticle[]> {
    // This would be replaced with actual Trip Database API calls
    // For now, return empty array - will be implemented when Trip API access is available
    return [];
  }

  /**
   * Parse Trip Database evidence scoring
   */
  private parseTripScore(metadata: any): number {
    // Trip Database uses a proprietary scoring system
    // Higher scores indicate better evidence quality
    return metadata.tripScore || 50;
  }

  /**
   * Determine if article is a clinical guideline
   */
  private isGuideline(source: string, studyType: string): boolean {
    const guidelineIndicators = [
      'guideline', 'recommendation', 'consensus', 'practice parameter',
      'clinical pathway', 'best practice', 'position statement'
    ];
    
    const content = `${source} ${studyType}`.toLowerCase();
    return guidelineIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Map Trip Database study types to our evidence levels
   */
  private mapTripToEvidenceLevel(studyType: string, tripScore: number): string {
    const lowerType = studyType.toLowerCase();
    
    if (lowerType.includes('systematic review') && lowerType.includes('meta-analysis')) {
      return 'Level 1A (Highest)';
    }
    if (lowerType.includes('systematic review')) {
      return 'Level 1B (Very High)';
    }
    if (lowerType.includes('guideline') && tripScore > 80) {
      return 'Level 1B (Very High)';
    }
    if (lowerType.includes('randomized') || lowerType.includes('rct')) {
      return 'Level 2 (High)';
    }
    if (lowerType.includes('cohort')) {
      return 'Level 3A (Moderate)';
    }
    if (lowerType.includes('case-control')) {
      return 'Level 3B (Moderate)';
    }
    
    return 'Level 4 (Low-Moderate)';
  }
}

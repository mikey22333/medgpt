/**
 * Cochrane Library API Client
 * Provides access to gold-standard meta-analyses and systematic reviews
 */

export interface CochraneReview {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  doi?: string;
  url?: string;
  publishedDate: string;
  lastUpdated?: string;
  reviewType: 'systematic_review' | 'meta_analysis' | 'protocol';
  evidenceClass: 'Level 1A' | 'Level 1B';
  cochraneDoi: string;
  qualityAssessment?: {
    riskOfBias: 'low' | 'moderate' | 'high';
    gradeAssessment?: string;
  };
}

export class CochraneClient {
  private baseURL = 'https://www.cochranelibrary.com/api/search';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchReviews(query: string, maxResults: number = 5): Promise<CochraneReview[]> {
    try {
      // Cochrane Library search (simulated - would need actual API access)
      // In practice, this would use Cochrane's search API or web scraping
      const searchUrl = `${this.baseURL}?query=${encodeURIComponent(query)}&limit=${maxResults}`;
      
      // For now, return structured mock data that represents high-quality Cochrane reviews
      // In production, implement actual API calls to Cochrane Library
      const mockReviews: CochraneReview[] = await this.generateMockCochraneResults(query, maxResults);
      
      return mockReviews;
    } catch (error) {
      console.error('Cochrane search error:', error);
      return [];
    }
  }

  private async generateMockCochraneResults(query: string, maxResults: number): Promise<CochraneReview[]> {
    // This would be replaced with actual Cochrane API calls
    // For now, return empty array - will be implemented when Cochrane API access is available
    return [];
  }

  /**
   * Parse evidence class from Cochrane review metadata
   */
  private parseEvidenceClass(reviewType: string, hasMetaAnalysis: boolean): 'Level 1A' | 'Level 1B' {
    if (reviewType.includes('meta-analysis') || hasMetaAnalysis) {
      return 'Level 1A'; // Systematic review with meta-analysis
    }
    return 'Level 1B'; // Systematic review without meta-analysis
  }

  /**
   * Extract GRADE assessment if available
   */
  private extractGradeAssessment(content: string): string | undefined {
    const gradeKeywords = ['high certainty', 'moderate certainty', 'low certainty', 'very low certainty'];
    const lowerContent = content.toLowerCase();
    
    for (const grade of gradeKeywords) {
      if (lowerContent.includes(grade)) {
        return grade;
      }
    }
    
    return undefined;
  }
}

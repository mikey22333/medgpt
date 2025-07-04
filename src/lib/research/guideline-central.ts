/**
 * Guideline Central / NICE API Client
 * Provides access to clinical practice guidelines for contextual best-practice evidence
 */

export interface ClinicalGuideline {
  id: string;
  title: string;
  organization: string;
  summary: string;
  fullText?: string;
  url: string;
  publishedDate: string;
  lastUpdated?: string;
  specialty: string;
  conditions: string[];
  recommendations: GuidelineRecommendation[];
  evidenceBase: string;
  qualityRating: 'A' | 'B' | 'C' | 'D' | 'Expert Opinion';
  implementationLevel: 'Strong' | 'Conditional' | 'Good Practice';
  source: 'NICE' | 'AHA' | 'ACP' | 'USPSTF' | 'WHO' | 'Other';
}

export interface GuidelineRecommendation {
  id: string;
  text: string;
  strength: 'Strong' | 'Conditional' | 'Good Practice';
  evidenceQuality: 'High' | 'Moderate' | 'Low' | 'Very Low';
  category: 'Screening' | 'Diagnosis' | 'Treatment' | 'Prevention' | 'Monitoring';
}

export class GuidelineCentralClient {
  private niceBaseURL = 'https://www.nice.org.uk/guidance';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchGuidelines(query: string, maxResults: number = 5): Promise<ClinicalGuideline[]> {
    try {
      // Search multiple guideline sources
      const guidelines: ClinicalGuideline[] = [];
      
      // Search NICE guidelines
      const niceGuidelines = await this.searchNICE(query, Math.ceil(maxResults / 2));
      guidelines.push(...niceGuidelines);
      
      // Search other major guideline sources
      const otherGuidelines = await this.searchOtherSources(query, Math.ceil(maxResults / 2));
      guidelines.push(...otherGuidelines);
      
      return guidelines.slice(0, maxResults);
    } catch (error) {
      console.error('Guideline search error:', error);
      return [];
    }
  }

  async searchNICE(query: string, maxResults: number = 3): Promise<ClinicalGuideline[]> {
    try {
      // NICE guideline search
      // In production, this would use NICE's API or structured search
      const mockGuidelines: ClinicalGuideline[] = await this.generateMockNICEResults(query, maxResults);
      
      return mockGuidelines;
    } catch (error) {
      console.error('NICE search error:', error);
      return [];
    }
  }

  async searchBySpecialty(query: string, specialty: string, maxResults: number = 3): Promise<ClinicalGuideline[]> {
    const specialtyQuery = `${query} ${specialty}`;
    return this.searchGuidelines(specialtyQuery, maxResults);
  }

  async searchByCondition(condition: string, maxResults: number = 5): Promise<ClinicalGuideline[]> {
    return this.searchGuidelines(condition, maxResults);
  }

  private async searchOtherSources(query: string, maxResults: number): Promise<ClinicalGuideline[]> {
    // Search other major guideline sources (AHA, ACP, USPSTF, etc.)
    // For now, return empty array - will be implemented when API access is available
    return [];
  }

  private async generateMockNICEResults(query: string, maxResults: number): Promise<ClinicalGuideline[]> {
    // This would be replaced with actual NICE API calls
    // For now, return empty array - will be implemented when API access is available
    return [];
  }

  /**
   * Parse NICE guideline recommendation strength
   */
  private parseRecommendationStrength(text: string): 'Strong' | 'Conditional' | 'Good Practice' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('offer') || lowerText.includes('recommend')) {
      return 'Strong';
    }
    if (lowerText.includes('consider') || lowerText.includes('may')) {
      return 'Conditional';
    }
    if (lowerText.includes('good practice')) {
      return 'Good Practice';
    }
    
    return 'Conditional'; // Default
  }

  /**
   * Map guideline source to evidence level
   */
  private mapGuidelineToEvidenceLevel(source: string, qualityRating: string): string {
    if (source === 'NICE' || source === 'USPSTF') {
      if (qualityRating === 'A') return 'Level 1B (Very High)';
      if (qualityRating === 'B') return 'Level 2 (High)';
      if (qualityRating === 'C') return 'Level 3A (Moderate)';
    }
    
    // Other guidelines
    if (qualityRating === 'A') return 'Level 2 (High)';
    if (qualityRating === 'B') return 'Level 3A (Moderate)';
    
    return 'Level 4 (Low-Moderate)';
  }

  /**
   * Extract key recommendations from guideline content
   */
  private extractRecommendations(content: string): GuidelineRecommendation[] {
    const recommendations: GuidelineRecommendation[] = [];
    
    // Parse structured recommendations from guideline text
    // This would involve sophisticated text parsing in production
    
    return recommendations;
  }

  /**
   * Determine guideline specialty area
   */
  private determineSpecialty(title: string, content: string): string {
    const text = `${title} ${content}`.toLowerCase();
    
    const specialtyMap = {
      'cardiology': ['heart', 'cardiac', 'cardiovascular', 'hypertension', 'coronary'],
      'endocrinology': ['diabetes', 'thyroid', 'hormone', 'metabolic'],
      'neurology': ['neurological', 'brain', 'stroke', 'seizure', 'migraine'],
      'oncology': ['cancer', 'tumor', 'malignancy', 'chemotherapy', 'oncology'],
      'psychiatry': ['mental health', 'depression', 'anxiety', 'psychiatric'],
      'gastroenterology': ['digestive', 'gastrointestinal', 'liver', 'hepatic'],
      'respiratory': ['lung', 'respiratory', 'asthma', 'copd', 'pneumonia'],
      'infectious disease': ['infection', 'antibiotic', 'antimicrobial', 'viral'],
      'primary care': ['primary care', 'general practice', 'family medicine']
    };
    
    for (const [specialty, keywords] of Object.entries(specialtyMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return specialty;
      }
    }
    
    return 'General Medicine';
  }

  /**
   * Calculate guideline relevance score
   */
  private calculateGuidelineRelevance(guideline: ClinicalGuideline, query: string): number {
    let score = 0.5; // Base score
    
    const queryLower = query.toLowerCase();
    const title = guideline.title.toLowerCase();
    const summary = guideline.summary.toLowerCase();
    
    // Title match bonus
    if (title.includes(queryLower)) {
      score += 0.3;
    }
    
    // Summary match bonus
    if (summary.includes(queryLower)) {
      score += 0.2;
    }
    
    // High-quality source bonus
    if (guideline.source === 'NICE' || guideline.source === 'USPSTF') {
      score += 0.1;
    }
    
    // Recent guideline bonus
    const publishYear = new Date(guideline.publishedDate).getFullYear();
    if (publishYear >= 2020) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }
}

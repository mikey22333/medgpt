/**
 * ClinicalTrials.gov API Client
 * Provides access to NIH clinical trial data for Phase 1-4 studies
 */

export interface ClinicalTrial {
  nctId: string;
  title: string;
  briefSummary: string;
  detailedDescription?: string;
  conditions: string[];
  interventions: string[];
  phase: string;
  studyType: string;
  status: string;
  startDate?: string;
  completionDate?: string;
  primaryOutcomes: string[];
  secondaryOutcomes?: string[];
  enrollment?: number;
  sponsors: string[];
  locations: string[];
  url: string;
  lastUpdated: string;
  resultsAvailable: boolean;
  studyResults?: {
    primaryResults?: string;
    adverseEvents?: string;
    limitations?: string;
  };
}

export class ClinicalTrialsClient {
  private baseURL = 'https://clinicaltrials.gov/api/query/study_fields';
  private detailsURL = 'https://clinicaltrials.gov/api/query/full_studies';

  async searchTrials(query: string, maxResults: number = 5): Promise<ClinicalTrial[]> {
    try {
      // ClinicalTrials.gov API search
      const searchParams = new URLSearchParams({
        'expr': query,
        'fields': 'NCTId,BriefTitle,Condition,InterventionName,Phase,StudyType,OverallStatus,StartDate,CompletionDate',
        'min_rnk': '1',
        'max_rnk': maxResults.toString(),
        'fmt': 'json'
      });

      const searchUrl = `${this.baseURL}?${searchParams.toString()}`;
      
      // In production, make actual API calls
      // For now, return structured mock data
      const mockTrials: ClinicalTrial[] = await this.generateMockTrialResults(query, maxResults);
      
      return mockTrials;
    } catch (error) {
      console.error('ClinicalTrials.gov search error:', error);
      return [];
    }
  }

  async getTrialDetails(nctId: string): Promise<ClinicalTrial | null> {
    try {
      const searchParams = new URLSearchParams({
        'expr': nctId,
        'fmt': 'json'
      });

      const detailsUrl = `${this.detailsURL}?${searchParams.toString()}`;
      
      // In production, fetch detailed trial information
      // For now, return null
      return null;
    } catch (error) {
      console.error('ClinicalTrials.gov details error:', error);
      return null;
    }
  }

  async searchByPhase(query: string, phase: string, maxResults: number = 3): Promise<ClinicalTrial[]> {
    const phaseQuery = `${query} AND Phase ${phase}`;
    return this.searchTrials(phaseQuery, maxResults);
  }

  async searchActiveTrials(query: string, maxResults: number = 3): Promise<ClinicalTrial[]> {
    const activeQuery = `${query} AND (Recruiting OR Active)`;
    return this.searchTrials(activeQuery, maxResults);
  }

  private async generateMockTrialResults(query: string, maxResults: number): Promise<ClinicalTrial[]> {
    // This would be replaced with actual ClinicalTrials.gov API calls
    // For now, return empty array - will be implemented when API access is available
    return [];
  }

  /**
   * Parse phase information from trial data
   */
  private parsePhase(phaseData: string): string {
    if (!phaseData) return 'Not Specified';
    
    const phase = phaseData.toLowerCase();
    if (phase.includes('phase 1')) return 'Phase 1';
    if (phase.includes('phase 2')) return 'Phase 2';
    if (phase.includes('phase 3')) return 'Phase 3';
    if (phase.includes('phase 4')) return 'Phase 4';
    if (phase.includes('early phase 1')) return 'Early Phase 1';
    
    return phaseData;
  }

  /**
   * Map trial phase to evidence level
   */
  private mapPhaseToEvidenceLevel(phase: string): string {
    switch (phase.toLowerCase()) {
      case 'phase 4':
        return 'Level 2 (High)'; // Post-marketing surveillance
      case 'phase 3':
        return 'Level 2 (High)'; // Large-scale RCTs
      case 'phase 2':
        return 'Level 3A (Moderate)'; // Efficacy trials
      case 'phase 1':
      case 'early phase 1':
        return 'Level 4 (Low-Moderate)'; // Safety/dosing studies
      default:
        return 'Level 4 (Low-Moderate)';
    }
  }

  /**
   * Extract interventions and format them
   */
  private formatInterventions(interventions: any[]): string[] {
    if (!interventions) return [];
    
    return interventions.map(intervention => {
      if (typeof intervention === 'string') return intervention;
      if (intervention.InterventionName) return intervention.InterventionName;
      return 'Unknown Intervention';
    });
  }

  /**
   * Check if trial results are available
   */
  private hasResults(trial: any): boolean {
    return !!(trial.HasResults && trial.HasResults === 'Yes');
  }

  /**
   * Generate clinical relevance score based on trial characteristics
   */
  private calculateRelevanceScore(trial: ClinicalTrial, query: string): number {
    let score = 0.5; // Base score
    
    // Phase bonus
    if (trial.phase.includes('Phase 3') || trial.phase.includes('Phase 4')) {
      score += 0.2;
    }
    
    // Results available bonus
    if (trial.resultsAvailable) {
      score += 0.15;
    }
    
    // Recent trial bonus
    if (trial.startDate) {
      const startYear = new Date(trial.startDate).getFullYear();
      if (startYear >= 2020) score += 0.1;
    }
    
    // Enrollment size bonus
    if (trial.enrollment && trial.enrollment > 100) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }
}

/**
 * ClinicalTrials.gov API v2 Client
 * Provides access to NIH clinical trial data using the new API v2
 * API Documentation: https://clinicaltrials.gov/data-api/api
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
  private baseURL = 'https://clinicaltrials.gov/api/v2/studies';

  async searchTrials(query: string, maxResults: number = 5): Promise<ClinicalTrial[]> {
    try {
      // ClinicalTrials.gov API v2 search
      const searchParams = new URLSearchParams({
        'query.term': query,
        'pageSize': maxResults.toString(),
        'format': 'json'
      });

      const searchUrl = `${this.baseURL}?${searchParams.toString()}`;
      console.log('🔍 ClinicalTrials.gov API request:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CliniSynth/1.0'
        }
      });

      if (!response.ok) {
        console.error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log('✅ ClinicalTrials.gov API response:', { 
        totalStudies: data.totalCount,
        returnedStudies: data.studies?.length || 0 
      });

      return this.transformResults(data.studies || []);
    } catch (error) {
      console.error('ClinicalTrials.gov search error:', error);
      return [];
    }
  }

  async getTrialDetails(nctId: string): Promise<ClinicalTrial | null> {
    try {
      const searchParams = new URLSearchParams({
        'query.id': nctId,
        'format': 'json'
      });

      const detailsUrl = `${this.baseURL}?${searchParams.toString()}`;
      
      const response = await fetch(detailsUrl);
      if (!response.ok) return null;

      const data = await response.json();
      const studies = this.transformResults(data.studies || []);
      return studies.length > 0 ? studies[0] : null;
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
    const searchParams = new URLSearchParams({
      'query.term': query,
      'query.status': 'RECRUITING,ACTIVE_NOT_RECRUITING,ENROLLING_BY_INVITATION',
      'pageSize': maxResults.toString(),
      'format': 'json'
    });

    const searchUrl = `${this.baseURL}?${searchParams.toString()}`;
    
    try {
      const response = await fetch(searchUrl);
      if (!response.ok) return [];

      const data = await response.json();
      return this.transformResults(data.studies || []);
    } catch (error) {
      console.error('Active trials search error:', error);
      return [];
    }
  }

  private transformResults(studies: any[]): ClinicalTrial[] {
    return studies.map(study => {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const description = protocol.descriptionModule || {};
      const conditions = protocol.conditionsModule || {};
      const design = protocol.designModule || {};
      const armsInterventions = protocol.armsInterventionsModule || {};
      const outcomes = protocol.outcomesModule || {};
      const sponsors = protocol.sponsorCollaboratorsModule || {};
      const locations = protocol.contactsLocationsModule || {};

      return {
        nctId: identification.nctId || '',
        title: identification.briefTitle || identification.officialTitle || 'Unknown Title',
        briefSummary: description.briefSummary || '',
        detailedDescription: description.detailedDescription,
        conditions: conditions.conditions || [],
        interventions: this.extractInterventions(armsInterventions.interventions || []),
        phase: this.extractPhase(design.phases || []),
        studyType: design.studyType || 'Unknown',
        status: status.overallStatus || 'Unknown',
        startDate: status.startDateStruct?.date,
        completionDate: status.completionDateStruct?.date || status.primaryCompletionDateStruct?.date,
        primaryOutcomes: outcomes.primaryOutcomes?.map((o: any) => o.measure || '') || [],
        secondaryOutcomes: outcomes.secondaryOutcomes?.map((o: any) => o.measure || ''),
        enrollment: design.enrollmentInfo?.count,
        sponsors: this.extractSponsors(sponsors),
        locations: this.extractLocations(locations.locations || []),
        url: `https://clinicaltrials.gov/study/${identification.nctId}`,
        lastUpdated: status.lastUpdatePostDateStruct?.date || '',
        resultsAvailable: study.hasResults || false,
        studyResults: this.extractStudyResults(study.resultsSection)
      };
    });
  }

  private extractInterventions(interventions: any[]): string[] {
    return interventions.map(intervention => 
      intervention.name || intervention.description || 'Unknown Intervention'
    );
  }

  private extractPhase(phases: string[]): string {
    if (!phases || phases.length === 0) return 'Not Specified';
    
    // Handle phase arrays like ["PHASE2", "PHASE3"]
    const phaseNames = phases.map(phase => {
      switch (phase) {
        case 'EARLY_PHASE1': return 'Early Phase 1';
        case 'PHASE1': return 'Phase 1';
        case 'PHASE2': return 'Phase 2';
        case 'PHASE3': return 'Phase 3';
        case 'PHASE4': return 'Phase 4';
        case 'NA': return 'Not Applicable';
        default: return phase;
      }
    });
    
    return phaseNames.join('/');
  }

  private extractSponsors(sponsorModule: any): string[] {
    const sponsors = [];
    
    if (sponsorModule.leadSponsor?.name) {
      sponsors.push(sponsorModule.leadSponsor.name);
    }
    
    if (sponsorModule.collaborators) {
      sponsorModule.collaborators.forEach((collab: any) => {
        if (collab.name) sponsors.push(collab.name);
      });
    }
    
    return sponsors.length > 0 ? sponsors : ['Unknown Sponsor'];
  }

  private extractLocations(locations: any[]): string[] {
    return locations.map(location => {
      const parts = [];
      if (location.city) parts.push(location.city);
      if (location.state) parts.push(location.state);
      if (location.country) parts.push(location.country);
      return parts.join(', ');
    }).filter(Boolean);
  }

  private extractStudyResults(resultsSection: any): any {
    if (!resultsSection) return undefined;
    
    return {
      primaryResults: resultsSection.outcomeMeasuresModule?.outcomeMeasures?.[0]?.description,
      adverseEvents: resultsSection.adverseEventsModule ? 'Adverse events reported' : undefined,
      limitations: resultsSection.moreInfoModule?.limitationsAndCaveats?.description
    };
  }

}

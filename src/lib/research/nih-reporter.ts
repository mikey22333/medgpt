/**
 * NIH RePORTER API Client
 * 
 * NIH Research Portfolio Online Reporting Tools (RePORTER) provides access to:
 * - Funded research projects and grants
 * - Clinical trial outcomes and results
 * - Research program data from NIH institutes
 * - Project abstracts and publications
 * - Funding amounts and timelines
 * 
 * API Documentation: https://api.reporter.nih.gov/
 */

export interface NIHProject {
  project_num: string;
  project_title: string;
  project_start_date: string;
  project_end_date: string;
  organization_name: string;
  principal_investigators: Array<{
    profile_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
  }>;
  agency_ic_admin: {
    name: string;
    abbreviation: string;
  };
  award_amount: number;
  fiscal_year: number;
  project_detail: {
    project_detail_id: string;
    abstract_text?: string;
    public_health_relevance?: string;
  };
  publications?: Array<{
    pmid: string;
    title: string;
    authors: string;
    journal: string;
    pub_date: string;
  }>;
  clinical_trial?: {
    clinical_trial_id: string;
    study_type: string;
    phase?: string;
    status: string;
  };
}

export interface NIHSearchParams {
  text_search?: string;
  include_active_projects?: boolean;
  fiscal_years?: number[];
  agencies?: string[];
  limit?: number;
  offset?: number;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}

export class NIHReporterClient {
  private baseUrl = 'https://api.reporter.nih.gov/v2';
  private userAgent = 'CliniSynth/1.0';

  constructor() {
    // NIH RePORTER API doesn't require API key for public access
  }

  /**
   * Search NIH funded research projects and grants
   */
  async searchProjects(query: string, options: Partial<NIHSearchParams> = {}): Promise<NIHProject[]> {
    try {
      const searchParams: NIHSearchParams = {
        text_search: query,
        include_active_projects: true,
        fiscal_years: [2020, 2021, 2022, 2023, 2024], // Recent years for modern research
        limit: options.limit || 20,
        offset: options.offset || 0,
        sort_field: 'fiscal_year',
        sort_order: 'desc',
        ...options
      };

      const response = await fetch(`${this.baseUrl}/projects/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          criteria: {
            text_search: {
              search_text: searchParams.text_search,
              search_field: 'all'
            },
            include_active_projects: searchParams.include_active_projects,
            fiscal_years: searchParams.fiscal_years,
            agencies: searchParams.agencies
          },
          limit: searchParams.limit,
          offset: searchParams.offset,
          sort_field: searchParams.sort_field,
          sort_order: searchParams.sort_order
        })
      });

      if (!response.ok) {
        console.warn(`NIH RePORTER API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Error searching NIH RePORTER:', error);
      return [];
    }
  }

  /**
   * Get detailed project information including publications and clinical trials
   */
  async getProjectDetails(projectNumbers: string[]): Promise<NIHProject[]> {
    try {
      if (!projectNumbers.length) return [];

      const response = await fetch(`${this.baseUrl}/projects/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          criteria: {
            project_nums: projectNumbers
          },
          include_fields: [
            'project_title',
            'project_start_date',
            'project_end_date',
            'organization',
            'principal_investigators',
            'agency_ic_admin',
            'award_amount',
            'project_detail',
            'publications',
            'clinical_trial'
          ]
        })
      });

      if (!response.ok) {
        console.warn(`NIH RePORTER project details error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Error getting NIH project details:', error);
      return [];
    }
  }

  /**
   * Search for projects with publications linked to PubMed
   */
  async searchProjectsWithPublications(query: string, limit: number = 10): Promise<NIHProject[]> {
    try {
      const response = await fetch(`${this.baseUrl}/publications/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          criteria: {
            text_search: {
              search_text: query,
              search_field: 'all'
            },
            fiscal_years: [2020, 2021, 2022, 2023, 2024]
          },
          limit: limit,
          include_fields: [
            'project_title',
            'pmid',
            'title',
            'authors',
            'journal',
            'pub_date',
            'project_num'
          ]
        })
      });

      if (!response.ok) {
        console.warn(`NIH RePORTER publications error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Group publications by project
      const projectMap = new Map<string, NIHProject>();
      
      for (const pub of data.results || []) {
        if (pub.project_num) {
          if (!projectMap.has(pub.project_num)) {
            projectMap.set(pub.project_num, {
              project_num: pub.project_num,
              project_title: pub.project_title || '',
              project_start_date: '',
              project_end_date: '',
              organization_name: '',
              principal_investigators: [],
              agency_ic_admin: { name: '', abbreviation: '' },
              award_amount: 0,
              fiscal_year: 0,
              project_detail: { project_detail_id: '' },
              publications: []
            });
          }
          
          const project = projectMap.get(pub.project_num)!;
          project.publications = project.publications || [];
          project.publications.push({
            pmid: pub.pmid || '',
            title: pub.title || '',
            authors: pub.authors || '',
            journal: pub.journal || '',
            pub_date: pub.pub_date || ''
          });
        }
      }

      return Array.from(projectMap.values());

    } catch (error) {
      console.error('Error searching NIH publications:', error);
      return [];
    }
  }

  /**
   * Format NIH project for display in medical research context
   */
  formatProjectForMedicalResearch(project: NIHProject): string {
    const title = project.project_title || 'Untitled Project';
    const pi = project.principal_investigators?.[0];
    const piName = pi ? `${pi.first_name} ${pi.last_name}` : 'Unknown PI';
    const org = project.organization_name || 'Unknown Organization';
    const agency = project.agency_ic_admin?.abbreviation || 'NIH';
    const amount = project.award_amount ? `$${project.award_amount.toLocaleString()}` : 'Amount not specified';
    const year = project.fiscal_year || 'Unknown year';
    
    let formatted = `**NIH Funded Research: ${title}**\n`;
    formatted += `*Principal Investigator:* ${piName} (${org})\n`;
    formatted += `*Funding:* ${agency} - ${amount} (FY ${year})\n`;
    formatted += `*Project Number:* ${project.project_num}\n`;
    
    if (project.project_detail?.abstract_text) {
      const abstract = project.project_detail.abstract_text.substring(0, 300);
      formatted += `*Abstract:* ${abstract}${abstract.length >= 300 ? '...' : ''}\n`;
    }
    
    if (project.publications && project.publications.length > 0) {
      formatted += `*Publications:* ${project.publications.length} linked publications\n`;
      // Show first publication as example
      const firstPub = project.publications[0];
      if (firstPub.pmid) {
        formatted += `  - ${firstPub.title} (PMID: ${firstPub.pmid})\n`;
      }
    }
    
    if (project.clinical_trial) {
      formatted += `*Clinical Trial:* ${project.clinical_trial.study_type}`;
      if (project.clinical_trial.phase) {
        formatted += ` (Phase ${project.clinical_trial.phase})`;
      }
      formatted += `\n`;
    }
    
    return formatted + '\n';
  }

  /**
   * Enhanced search for medical conditions with focus on therapeutic research
   */
  async searchMedicalResearch(condition: string, limit: number = 15): Promise<NIHProject[]> {
    // Enhance query for medical research focus
    const medicalQuery = `${condition} AND (therapeutic OR treatment OR clinical OR intervention OR drug OR therapy)`;
    
    try {
      // Search both active projects and those with publications
      const [projects, projectsWithPubs] = await Promise.all([
        this.searchProjects(medicalQuery, {
          limit: Math.ceil(limit / 2),
          agencies: ['NIH', 'NIMH', 'NIDDK', 'NHLBI', 'NCI', 'NIAID', 'NINDS', 'NEI', 'NIAAA', 'NIDA']
        }),
        this.searchProjectsWithPublications(medicalQuery, Math.ceil(limit / 2))
      ]);
      
      // Combine and deduplicate results
      const allProjects = [...projects, ...projectsWithPubs];
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.project_num === project.project_num)
      );
      
      // Sort by relevance (projects with publications and higher funding first)
      uniqueProjects.sort((a, b) => {
        const aHasPubs = (a.publications?.length || 0) > 0;
        const bHasPubs = (b.publications?.length || 0) > 0;
        
        if (aHasPubs && !bHasPubs) return -1;
        if (!aHasPubs && bHasPubs) return 1;
        
        return (b.award_amount || 0) - (a.award_amount || 0);
      });
      
      return uniqueProjects.slice(0, limit);
      
    } catch (error) {
      console.error('Error in enhanced medical research search:', error);
      return [];
    }
  }
}

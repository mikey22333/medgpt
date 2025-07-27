import { ResearchPaper } from '@/lib/types/research';

interface FDADrugLabel {
  id: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    ndc?: string[];
    application_number?: string[];
  };
  purpose?: string[];
  active_ingredient?: string[];
  indications_and_usage?: string[];
  warnings?: string[];
  adverse_reactions?: string[];
  contraindications?: string[];
  dosage_and_administration?: string[];
  effective_time?: string;
}

interface FDAAdverseEvent {
  safetyreportid: string;
  receivedate?: string;
  patient?: {
    drug?: Array<{
      medicinalproduct?: string;
      drugindication?: string;
    }>;
    reaction?: Array<{
      reactionmeddrapt?: string;
    }>;
  };
  primarysource?: {
    reportercountry?: string;
  };
}

interface FDARecall {
  recall_number: string;
  reason_for_recall: string;
  status: string;
  distribution_pattern: string;
  product_description: string;
  code_info?: string;
  product_quantity?: string;
  recall_initiation_date: string;
  state: string;
  event_id: string;
  product_type: string;
  more_code_info?: string;
  recall_url?: string;
  openfda?: {
    manufacturer_name?: string[];
    product_ndc?: string[];
    product_type?: string[];
  };
}

interface FDAResponse<T> {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: T[];
}

export class FDAClient {
  private baseUrl = 'https://api.fda.gov';
  
  /**
   * Search FDA drug labels for drug information
   */
  async searchDrugLabels(query: string, limit: number = 5): Promise<ResearchPaper[]> {
    try {
      console.log(`[FDA] Searching drug labels for: "${query}"`);
      
      // Clean and encode the query
      const cleanQuery = this.cleanQuery(query);
      const searchQuery = this.buildDrugLabelQuery(cleanQuery);
      
      const url = `${this.baseUrl}/drug/label.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;
      console.log(`[FDA] Drug Labels URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CliniSynth/1.0 (medical-research)',
        },
      });

      if (!response.ok) {
        console.warn(`[FDA] Drug labels API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: FDAResponse<FDADrugLabel> = await response.json();
      console.log(`[FDA] Found ${data.results?.length || 0} drug label results`);

      return this.convertDrugLabelsToPapers(data.results || [], query);
    } catch (error) {
      console.error('[FDA] Error searching drug labels:', error);
      return [];
    }
  }

  /**
   * Search FDA adverse events for safety information
   */
  async searchAdverseEvents(query: string, limit: number = 3): Promise<ResearchPaper[]> {
    try {
      console.log(`[FDA] Searching adverse events for: "${query}"`);
      
      const cleanQuery = this.cleanQuery(query);
      const searchQuery = this.buildAdverseEventQuery(cleanQuery);
      
      const url = `${this.baseUrl}/drug/event.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;
      console.log(`[FDA] Adverse Events URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CliniSynth/1.0 (medical-research)',
        },
      });

      if (!response.ok) {
        console.warn(`[FDA] Adverse events API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: FDAResponse<FDAAdverseEvent> = await response.json();
      console.log(`[FDA] Found ${data.results?.length || 0} adverse event results`);

      return this.convertAdverseEventsToPapers(data.results || [], query);
    } catch (error) {
      console.error('[FDA] Error searching adverse events:', error);
      return [];
    }
  }

  /**
   * Search FDA recalls for safety alerts
   */
  async searchRecalls(query: string, limit: number = 3): Promise<ResearchPaper[]> {
    try {
      console.log(`[FDA] Searching recalls for: "${query}"`);
      
      const cleanQuery = this.cleanQuery(query);
      const searchQuery = this.buildRecallQuery(cleanQuery);
      
      const url = `${this.baseUrl}/drug/enforcement.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;
      console.log(`[FDA] Recalls URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CliniSynth/1.0 (medical-research)',
        },
      });

      if (!response.ok) {
        console.warn(`[FDA] Recalls API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: FDAResponse<FDARecall> = await response.json();
      console.log(`[FDA] Found ${data.results?.length || 0} recall results`);

      return this.convertRecallsToPapers(data.results || [], query);
    } catch (error) {
      console.error('[FDA] Error searching recalls:', error);
      return [];
    }
  }

  /**
   * Search all FDA resources
   */
  async searchAll(query: string): Promise<ResearchPaper[]> {
    try {
      console.log(`[FDA] Searching all FDA resources for: "${query}"`);
      
      const [drugLabels, adverseEvents, recalls] = await Promise.allSettled([
        this.searchDrugLabels(query, 3),
        this.searchAdverseEvents(query, 2),
        this.searchRecalls(query, 2),
      ]);

      const results: ResearchPaper[] = [];
      
      if (drugLabels.status === 'fulfilled') {
        results.push(...drugLabels.value);
      }
      
      if (adverseEvents.status === 'fulfilled') {
        results.push(...adverseEvents.value);
      }
      
      if (recalls.status === 'fulfilled') {
        results.push(...recalls.value);
      }

      console.log(`[FDA] Total FDA results: ${results.length}`);
      return results;
    } catch (error) {
      console.error('[FDA] Error in searchAll:', error);
      return [];
    }
  }

  private cleanQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildDrugLabelQuery(query: string): string {
    // Search across multiple relevant fields
    const fields = [
      'openfda.brand_name',
      'openfda.generic_name',
      'indications_and_usage',
      'active_ingredient',
      'purpose'
    ];
    
    const terms = query.split(' ').filter(term => term.length > 2);
    
    if (terms.length === 0) return query;
    
    // Build OR query across fields and terms
    const queryParts = terms.map(term => 
      fields.map(field => `${field}:"${term}"`).join(' OR ')
    );
    
    return `(${queryParts.join(') AND (')})`;
  }

  private buildAdverseEventQuery(query: string): string {
    // Search for drug names and reactions
    const terms = query.split(' ').filter(term => term.length > 2);
    
    if (terms.length === 0) return query;
    
    const drugQueries = terms.map(term => `patient.drug.medicinalproduct:"${term}"`);
    const reactionQueries = terms.map(term => `patient.reaction.reactionmeddrapt:"${term}"`);
    
    return `(${drugQueries.join(' OR ')}) OR (${reactionQueries.join(' OR ')})`;
  }

  private buildRecallQuery(query: string): string {
    // Search recall descriptions and product info
    const terms = query.split(' ').filter(term => term.length > 2);
    
    if (terms.length === 0) return query;
    
    const queryParts = terms.map(term => 
      `product_description:"${term}" OR reason_for_recall:"${term}"`
    );
    
    return queryParts.join(' OR ');
  }

  private convertDrugLabelsToPapers(labels: FDADrugLabel[], originalQuery: string): ResearchPaper[] {
    return labels.map((label, index) => {
      const brandName = label.openfda?.brand_name?.[0] || 'Unknown Drug';
      const genericName = label.openfda?.generic_name?.[0] || '';
      const manufacturer = label.openfda?.manufacturer_name?.[0] || 'Unknown Manufacturer';
      
      const title = genericName && genericName !== brandName 
        ? `${brandName} (${genericName}) - FDA Drug Label`
        : `${brandName} - FDA Drug Label`;

      const abstract = this.buildDrugLabelAbstract(label);
      
      return {
        pmid: `FDA-DRUG-${label.id || index}`,
        title,
        abstract,
        authors: [manufacturer],
        journal: 'FDA Drug Labels Database',
        year: label.effective_time ? new Date(label.effective_time).getFullYear().toString() : new Date().getFullYear().toString(),
        url: `https://www.fda.gov/drugs/drug-approvals-and-databases/drug-labeling`,
        source: 'FDA Drug Labels' as const,
        relevanceScore: 0.9,
      };
    });
  }

  private convertAdverseEventsToPapers(events: FDAAdverseEvent[], originalQuery: string): ResearchPaper[] {
    return events.slice(0, 3).map((event, index) => {
      const drug = event.patient?.drug?.[0]?.medicinalproduct || 'Unknown Drug';
      const reaction = event.patient?.reaction?.[0]?.reactionmeddrapt || 'Adverse Event';
      const country = event.primarysource?.reportercountry || 'Unknown';
      
      const title = `FDA Adverse Event Report: ${drug} - ${reaction}`;
      const abstract = this.buildAdverseEventAbstract(event);
      
      return {
        pmid: `FDA-AE-${event.safetyreportid || index}`,
        title,
        abstract,
        authors: ['FDA Adverse Event Reporting System'],
        journal: 'FDA Adverse Event Reporting System (FAERS)',
        year: event.receivedate ? event.receivedate.substring(0, 4) : new Date().getFullYear().toString(),
        url: 'https://www.fda.gov/drugs/questions-and-answers-fdas-adverse-event-reporting-system-faers/fda-adverse-event-reporting-system-faers-public-dashboard',
        source: 'FDA FAERS' as const,
        relevanceScore: 0.8,
      };
    });
  }

  private convertRecallsToPapers(recalls: FDARecall[], originalQuery: string): ResearchPaper[] {
    return recalls.map((recall, index) => {
      const title = `FDA Drug Recall: ${recall.product_description}`;
      const abstract = this.buildRecallAbstract(recall);
      const manufacturer = recall.openfda?.manufacturer_name?.[0] || 'Unknown Manufacturer';
      
      return {
        pmid: `FDA-RECALL-${recall.recall_number || index}`,
        title,
        abstract,
        authors: [manufacturer, 'FDA'],
        journal: 'FDA Drug Recalls Database',
        year: recall.recall_initiation_date ? recall.recall_initiation_date.substring(0, 4) : new Date().getFullYear().toString(),
        url: recall.recall_url || 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
        source: 'FDA Recalls' as const,
        relevanceScore: 0.85,
      };
    });
  }

  private buildDrugLabelAbstract(label: FDADrugLabel): string {
    const parts: string[] = [];
    
    if (label.purpose?.length) {
      parts.push(`Purpose: ${label.purpose[0]}`);
    }
    
    if (label.active_ingredient?.length) {
      parts.push(`Active Ingredient: ${label.active_ingredient[0]}`);
    }
    
    if (label.indications_and_usage?.length) {
      parts.push(`Indications: ${label.indications_and_usage[0].substring(0, 200)}...`);
    }
    
    if (label.warnings?.length) {
      parts.push(`Warnings: ${label.warnings[0].substring(0, 200)}...`);
    }
    
    if (label.contraindications?.length) {
      parts.push(`Contraindications: ${label.contraindications[0].substring(0, 150)}...`);
    }
    
    return parts.join(' | ') || 'FDA-approved drug labeling information.';
  }

  private buildAdverseEventAbstract(event: FDAAdverseEvent): string {
    const parts: string[] = [];
    
    const drug = event.patient?.drug?.[0];
    if (drug?.medicinalproduct) {
      parts.push(`Drug: ${drug.medicinalproduct}`);
    }
    
    if (drug?.drugindication) {
      parts.push(`Indication: ${drug.drugindication}`);
    }
    
    const reaction = event.patient?.reaction?.[0];
    if (reaction?.reactionmeddrapt) {
      parts.push(`Adverse Reaction: ${reaction.reactionmeddrapt}`);
    }
    
    if (event.receivedate) {
      parts.push(`Report Date: ${event.receivedate}`);
    }
    
    if (event.primarysource?.reportercountry) {
      parts.push(`Country: ${event.primarysource.reportercountry}`);
    }
    
    return parts.join(' | ') || 'FDA adverse event report from FAERS database.';
  }

  private buildRecallAbstract(recall: FDARecall): string {
    const parts: string[] = [];
    
    parts.push(`Recall Reason: ${recall.reason_for_recall}`);
    parts.push(`Status: ${recall.status}`);
    parts.push(`Product: ${recall.product_description}`);
    
    if (recall.distribution_pattern) {
      parts.push(`Distribution: ${recall.distribution_pattern}`);
    }
    
    if (recall.product_quantity) {
      parts.push(`Quantity: ${recall.product_quantity}`);
    }
    
    parts.push(`Recall Date: ${recall.recall_initiation_date}`);
    
    return parts.join(' | ');
  }
}

export const fdaClient = new FDAClient();

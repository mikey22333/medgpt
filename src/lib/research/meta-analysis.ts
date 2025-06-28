import { EuropePMCClient, type EuropePMCMetaAnalysis } from "./europepmc";
import { type ResearchQuery } from "@/lib/types/research";
import { 
  type GRADEAssessment, 
  type GRADEConfidence, 
  calculateGRADEConfidence, 
  generateGRADESummary,
  getDefaultGRADEAssessment 
} from "./grade";
import { extractPICOS } from "./picos";
import { MetaSummaryService, MetaAnalysisSummary } from "./meta-summary";
import { EffectSizeRecovery } from './effect-size-recovery';

// Extend the EuropePMCMetaAnalysis interface with GRADE assessment
declare module "./europepmc" {
  interface EuropePMCMetaAnalysis {
    gradeAssessment?: GRADEAssessment;
    picos?: {
      population?: string;
      intervention?: string;
      comparator?: string;
      outcome?: string;
      studyDesign?: string;
    };
  }
}

/**
 * Service for analyzing and processing meta-analyses
 */
export class MetaAnalysisService {
  private europePMC: EuropePMCClient;
  private nlpModel: any; // Placeholder for future NLP model
  private summaryService = new MetaSummaryService();
  private effectSizeRecovery: EffectSizeRecovery;

  constructor(europePMC?: EuropePMCClient) {
    this.europePMC = europePMC || new EuropePMCClient();
    this.effectSizeRecovery = new EffectSizeRecovery(europePMC);
    // Initialize NLP model in the future
    // this.initializeNLPModel();
  }

  /**
   * Search for meta-analyses with enhanced filtering and GRADE assessment
   */
  async searchMetaAnalyses(
    query: string,
    options: {
      minStudies?: number;
      minYear?: number;
      maxYear?: number;
      hasFullText?: boolean;
      includeNonEnglish?: boolean;
      sortBy?: 'relevance' | 'date' | 'cited';
      sortOrder?: 'asc' | 'desc';
      autoAssessQuality?: boolean;
      suggestFallbacks?: boolean;
    } = { autoAssessQuality: true, suggestFallbacks: true }
  ): Promise<{
    results: EuropePMCMetaAnalysis[];
    fallbackSuggestions?: Array<{
      query: string;
      description: string;
      url: string;
    }>;
  }> {
    try {
      // Search for meta-analyses with fallback suggestions enabled
      const searchResult = await this.europePMC.searchMetaAnalyses(query, {
        ...options,
        suggestFallbacks: options.suggestFallbacks,
        originalQuery: query
      });
      
      // If no results, return early with fallback suggestions if any
      if (searchResult.results.length === 0) {
        return searchResult;
      }
      
      // If auto-assessment is enabled, assess each result
      if (options.autoAssessQuality !== false) {
        const assessedResults = await Promise.all(
          searchResult.results.map(article => this.assessMetaAnalysisQuality(article))
        );
        return {
          ...searchResult,
          results: assessedResults
        };
      }
      
      return searchResult;
    } catch (error) {
      console.error('Error in searchMetaAnalyses:', error);
      // Return empty results with fallback suggestions if enabled
      if (options.suggestFallbacks) {
        const fallbacks = [
          {
            query: query,
            description: 'Try a broader search',
            url: `https://europepmc.org/search?query=${encodeURIComponent(query)}`
          },
          {
            query: `${query} AND systematic review`,
            description: 'Search for systematic reviews',
            url: `https://europepmc.org/search?query=${encodeURIComponent(query + ' AND "systematic review"')}`
          }
        ];
        return { results: [], fallbackSuggestions: fallbacks };
      }
      return { results: [] };
    }
  }

  /**
   * Get a specific meta-analysis by ID with enhanced data and GRADE assessment
   */
  async getMetaAnalysis(
    id: string, 
    options: { 
      includeFullText: boolean;
      assessQuality: boolean;
      includeSummary?: boolean;
      attemptEffectSizeRecovery?: boolean;
    } = { 
      includeFullText: true, 
      assessQuality: true, 
      includeSummary: false,
      attemptEffectSizeRecovery: true
    }
  ): Promise<EuropePMCMetaAnalysis | null> {
    try {
      // Get the base article data with full text if requested
      const article = await this.europePMC.getArticleById(
        id, 
        options.includeFullText
      );
      
      if (!article) return null;

      // Cast to meta-analysis type
      let metaAnalysis = article as EuropePMCMetaAnalysis;
      
      // Extract PICOS elements if not already present
      if (!metaAnalysis.picos && metaAnalysis.abstract) {
        metaAnalysis.picos = extractPICOS(metaAnalysis.abstract);
      }

      // Attempt to recover missing effect sizes if needed
      if (options.attemptEffectSizeRecovery && 
          (!metaAnalysis.outcomeMeasures || metaAnalysis.outcomeMeasures.length === 0) &&
          metaAnalysis.picos?.intervention) {
        
        metaAnalysis = await this.effectSizeRecovery.enhanceMetaAnalysis(
          metaAnalysis,
          metaAnalysis.picos.intervention
        );
      }
      
      // Perform quality assessment if requested
      let result = metaAnalysis;
      if (options.assessQuality) {
        result = await this.assessMetaAnalysisQuality(metaAnalysis);
        // Ensure the gradeAssessment is properly set on the result
        if (result.gradeAssessment) {
          result.gradeAssessment = {
            ...result.gradeAssessment,
            confidence: calculateGRADEConfidence(result.gradeAssessment.domains)
          };
        }
      }
      
      // Generate summary if requested
      if (options.includeSummary && result) {
        try {
          const summary = this.summaryService.generateSummary(result);
          result.summary = summary;
          
          // Add a note if effect sizes were recovered
          if (metaAnalysis._recoveredEffectSizes) {
            result.summary.limitations.push(
              'Effect sizes were recovered from related meta-analyses and may not exactly match this study.'
            );
          } else if (metaAnalysis._missingEffectSizes) {
            result.summary.limitations.push(
              'No effect sizes were available in this study. Consider searching specifically for the intervention and outcome.'
            );
          }
          
        } catch (error) {
          console.error('Error generating summary:', error);
          // Continue without summary if generation fails
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in getMetaAnalysis:', error);
      return null;
    }
  }

  /**
   * Get detailed information about a specific meta-analysis by ID
   */
  async getMetaAnalysisById(id: string, includeSummary: boolean = true): Promise<MetaAnalysis | null> {
    try {
      const article = await this.europePMC.getArticleById(id, true);
      if (!article) {
        return null;
      }

      // Convert to MetaAnalysis format
      const metaAnalysis = this.convertToMetaAnalysis(article);
      
      // Perform quality assessment
      metaAnalysis.qualityAssessment = this.assessMetaAnalysisQuality(metaAnalysis);
      
      // Generate summary if requested
      if (includeSummary) {
        metaAnalysis.summary = this.summaryService.generateSummary(metaAnalysis);
      }
      
      return metaAnalysis;
    } catch (error) {
      console.error('Error getting meta-analysis by ID:', error);
      return null;
    }
  }

  /**
   * Assess the quality of a meta-analysis using GRADE criteria
   */
  private async assessMetaAnalysisQuality(
    metaAnalysis: EuropePMCMetaAnalysis
  ): Promise<EuropePMCMetaAnalysis> {
    // Start with default assessment based on study type
    const isRCT = this.isRCT(metaAnalysis);
    const assessment = getDefaultGRADEAssessment(isRCT ? 'rct' : 'observational');
    
    // Update assessment based on available data
    this.updateAssessmentWithMetaAnalysisData(assessment, metaAnalysis);
    
    // If we have full text, we can perform more detailed assessment
    if (metaAnalysis.fullText) {
      await this.assessFromFullText(assessment, metaAnalysis);
    }
    
    // Update the confidence based on all assessments
    assessment.confidence = calculateGRADEConfidence(assessment.domains);
    
    // Add the assessment to the meta-analysis
    return {
      ...metaAnalysis,
      gradeAssessment: assessment,
    };
  }
  
  /**
   * Update GRADE assessment with data from the meta-analysis
   */
  private updateAssessmentWithMetaAnalysisData(
    assessment: GRADEAssessment,
    metaAnalysis: EuropePMCMetaAnalysis
  ): void {
    const { domains } = assessment;
    
    // Assess risk of bias based on reported methods
    if (metaAnalysis.methods) {
      const methods = metaAnalysis.methods.toLowerCase();
      
      // Check for risk of bias assessment
      if (methods.includes('risk of bias') || methods.includes('quality assessment')) {
        if (methods.includes('cochrane') || methods.includes('robin') || methods.includes('newcastle-ottawa')) {
          domains.riskOfBias.rating = 'no-concern';
          domains.riskOfBias.reason = 'Used standardized risk of bias assessment tool';
        } else {
          domains.riskOfBias.rating = 'serious';
          domains.riskOfBias.reason = 'Risk of bias assessment method not clearly described or non-standard';
        }
      } else {
        domains.riskOfBias.rating = 'serious';
        domains.riskOfBias.reason = 'No explicit risk of bias assessment reported';
      }
      
      // Check for protocol registration
      if (metaAnalysis.citations?.some(c => c.title?.toLowerCase().includes('protocol'))) {
        domains.publicationBias.rating = 'undetected';
        domains.publicationBias.reason = 'Study protocol was registered';
      }
    }
    
    // Assess inconsistency (heterogeneity)
    if (metaAnalysis.outcomeMeasures) {
      for (const outcome of metaAnalysis.outcomeMeasures) {
        if (outcome.i2 !== undefined) {
          if (outcome.i2 > 75) {
            domains.inconsistency.rating = 'very-serious';
            domains.inconsistency.i2 = outcome.i2;
            domains.inconsistency.reason = `High heterogeneity detected (I² = ${outcome.i2}%)`;
          } else if (outcome.i2 > 50) {
            domains.inconsistency.rating = 'serious';
            domains.inconsistency.i2 = outcome.i2;
            domains.inconsistency.reason = `Moderate heterogeneity detected (I² = ${outcome.i2}%)`;
          }
        }
      }
    }
    
    // Assess imprecision
    if (metaAnalysis.participants) {
      const totalParticipants = metaAnalysis.participants;
      if (totalParticipants < 300) { // Threshold for optimal information size
        domains.imprecision.rating = 'serious';
        domains.imprecision.optimalInformationSize = totalParticipants;
        domains.imprecision.reason = `Small sample size (n = ${totalParticipants})`;
      }
    }
    
    // Check for large effect sizes
    if (metaAnalysis.outcomeMeasures) {
      const hasLargeEffect = metaAnalysis.outcomeMeasures.some(outcome => {
        if (!outcome.value || !outcome.ciLower || !outcome.ciUpper) return false;
        
        // Check for large relative risk reduction (>50%)
        if (['rr', 'or', 'hr'].includes(outcome.measure.toLowerCase())) {
          const rrr = 1 - outcome.value;
          return rrr > 0.5 && outcome.ciLower > 1; // Large effect with CI not crossing 1
        }
        
        // Check for large standardized mean difference
        if (['smd', 'md'].includes(outcome.measure.toLowerCase())) {
          return Math.abs(outcome.value) > 0.8; // Large effect size
        }
        
        return false;
      });
      
      if (hasLargeEffect) {
        domains.upgradeFactors.largeEffect = true;
        assessment.reasons.push('Large effect size detected');
      }
    }
  }
  
  /**
   * Perform more detailed assessment using full text (if available)
   */
  private async assessFromFullText(
    assessment: GRADEAssessment,
    metaAnalysis: EuropePMCMetaAnalysis
  ): Promise<void> {
    // This would be implemented to analyze full text for more detailed assessment
    // For now, this is a placeholder that could be enhanced with NLP
    
    const { domains } = assessment;
    const text = `${metaAnalysis.title} ${metaAnalysis.abstract || ''} ${metaAnalysis.fullText || ''}`.toLowerCase();
    
    // Check for publication bias assessment
    if (text.includes('publication bias') || text.includes('funnel plot')) {
      if (text.includes('egger') || text.includes('begg') || text.includes('peter')) {
        domains.publicationBias.rating = 'undetected';
        domains.publicationBias.reason = 'Publication bias assessed with statistical tests';
      } else if (text.includes('no evidence of publication bias')) {
        domains.publicationBias.rating = 'undetected';
        domains.publicationBias.reason = 'Authors report no evidence of publication bias';
      }
    }
    
    // Check for sensitivity analyses
    if (text.includes('sensitivity analysis') && text.includes('robust')) {
      assessment.reasons.push('Robustness confirmed through sensitivity analyses');
    }
  }
  
  /**
   * Determine if a meta-analysis is based on RCTs
   */
  private isRCT(metaAnalysis: EuropePMCMetaAnalysis): boolean {
    const text = `${metaAnalysis.title} ${metaAnalysis.abstract || ''}`.toLowerCase();
    
    // Check for RCT indicators
    const rctTerms = [
      'randomized controlled trial',
      'randomised controlled trial',
      'rct',
      'randomized clinical trial',
      'randomised clinical trial'
    ];
    
    return rctTerms.some(term => text.includes(term));
  }
  
  /**
   * Extract effect sizes and other quantitative data from meta-analysis text
   * This is a simplified implementation - in a real system, you'd want to use NLP
   * to parse the full text and extract this information
   */
  private extractEffectSizes(text: string) {
    // This is a placeholder - in a real implementation, you would:
    // 1. Parse the full text of the meta-analysis
    // 2. Extract outcome measures, effect sizes, confidence intervals, etc.
    // 3. Return structured data
    return [];
  }

  /**
   * Calculate GRADE rating for a meta-analysis
   * This is a simplified implementation - a full GRADE assessment would require
   * more detailed analysis of the study methodology
   */
  private calculateGRADE(metaAnalysis: EuropePMCAnalysis): {
    rating: 'high' | 'moderate' | 'low' | 'very_low';
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    // Check study design (all meta-analyses start as high quality)
    let rating: 'high' | 'moderate' | 'low' | 'very_low' = 'high';
    
    // Check for downgrade factors
    if (metaAnalysis.outcomeMeasures?.some(m => m.i2 && m.i2 > 50)) {
      rating = 'moderate';
      reasons.push('Substantial heterogeneity (I² > 50%)');
    }
    
    if (metaAnalysis.outcomeMeasures?.some(m => m.studies && m.studies < 10)) {
      if (rating === 'high') rating = 'moderate';
      else if (rating === 'moderate') rating = 'low';
      reasons.push('Fewer than 10 studies for some outcomes');
    }
    
    // Check for upgrade factors (e.g., large effect size, dose-response gradient)
    const hasLargeEffect = metaAnalysis.outcomeMeasures?.some(m => 
      (m.measure === 'RR' || m.measure === 'OR') && 
      ((m.value < 0.5 || m.value > 2) && 
       m.ciLower && m.ciUpper && 
       (m.ciLower > 1 || m.ciUpper < 1))
    );
    
    if (hasLargeEffect && rating === 'moderate') {
      rating = 'high';
      reasons.push('Large effect size with narrow confidence intervals');
    }
    
    return { rating, reasons };
  }

  /**
   * Calculate Number Needed to Treat (NNT) from relative risk and control event rate
   */
  calculateNNT(
    relativeRisk: number, 
    controlEventRate: number,
    isBenefit: boolean = true
  ): number | null {
    if (controlEventRate <= 0 || controlEventRate >= 1) {
      return null; // Invalid control event rate
    }

    const absoluteRiskReduction = isBenefit 
      ? controlEventRate - (controlEventRate * relativeRisk)
      : (controlEventRate * relativeRisk) - controlEventRate;

    if (Math.abs(absoluteRiskReduction) < 0.0001) {
      return null; // Avoid division by zero
    }

    const nnt = 1 / Math.abs(absoluteRiskReduction);
    return Math.round(nnt * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Format effect size for display
   */
  formatEffectSize(
    measure: string,
    value: number,
    ciLower?: number,
    ciUpper?: number
  ): string {
    let formatted = `${measure.toUpperCase()} = ${value.toFixed(2)}`;
    
    if (ciLower !== undefined && ciUpper !== undefined) {
      formatted += ` (95% CI ${ciLower.toFixed(2)}-${ciUpper.toFixed(2)})`;
    }
    
    return formatted;
  }
}

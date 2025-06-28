import { EuropePMCClient } from './europepmc';
import { EuropePMCMetaAnalysis } from './europepmc';

export class EffectSizeRecovery {
  private europePMC: EuropePMCClient;

  constructor(europePMC?: EuropePMCClient) {
    this.europePMC = europePMC || new EuropePMCClient();
  }

  /**
   * Attempt to recover missing effect sizes by searching for more specific meta-analyses
   */
  async recoverEffectSize(
    intervention: string,
    outcome: string,
    population: string = '',
    comparator: string = 'placebo or standard care'
  ): Promise<{
    success: boolean;
    effectSize?: {
      measure: string;
      value: number;
      ciLower?: number;
      ciUpper?: number;
      pValue?: number;
      source?: string;
    };
    message: string;
  }> {
    try {
      // Construct a more specific query
      const query = `"${intervention}" AND "${outcome}" AND ("meta-analysis" OR "systematic review")`;
      
      // Search for relevant meta-analyses
      const results = await this.europePMC.searchMetaAnalyses(query, {
        minStudies: 3, // Require at least 3 studies for reliability
        minYear: new Date().getFullYear() - 10, // Last 10 years
        sortBy: 'cited' // Most cited first
      });

      // Look for the most relevant result with effect sizes
      const relevantResult = results.find(result => 
        result.outcomeMeasures?.some(om => 
          om.name.toLowerCase().includes(outcome.toLowerCase()) &&
          om.value !== undefined
        )
      );

      if (relevantResult) {
        // Find the most relevant outcome measure
        const outcomeMeasure = relevantResult.outcomeMeasures?.find(om => 
          om.name.toLowerCase().includes(outcome.toLowerCase())
        );

        if (outcomeMeasure) {
          return {
            success: true,
            effectSize: {
              measure: outcomeMeasure.measure,
              value: outcomeMeasure.value,
              ciLower: outcomeMeasure.ciLower,
              ciUpper: outcomeMeasure.ciUpper,
              pValue: outcomeMeasure.pValue,
              source: relevantResult.title
            },
            message: `Found effect size in: ${relevantResult.title}`
          };
        }
      }

      // If we get here, no suitable effect size was found
      return {
        success: false,
        message: `No direct effect size found for ${intervention} on ${outcome}. Consider searching specifically for: "${intervention} ${outcome} meta-analysis site:europepmc.org"`
      };
    } catch (error) {
      console.error('Error recovering effect size:', error);
      return {
        success: false,
        message: `Error searching for effect size: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Enhance a meta-analysis with recovered effect sizes if needed
   */
  async enhanceMetaAnalysis(
    metaAnalysis: EuropePMCMetaAnalysis,
    targetIntervention: string
  ): Promise<EuropePMCMetaAnalysis> {
    // Skip if we already have outcome measures
    if (metaAnalysis.outcomeMeasures?.length) {
      return metaAnalysis;
    }

    // Extract PICOS elements if available
    const population = metaAnalysis.picos?.population || '';
    const comparator = metaAnalysis.picos?.comparator || 'placebo or standard care';
    const outcomes = metaAnalysis.picos?.outcome?.split(/[,;]/) || [];

    // If we have outcomes, try to recover effect sizes for each
    if (outcomes.length > 0) {
      const enhancedOutcomeMeasures = [];
      
      for (const outcome of outcomes) {
        const result = await this.recoverEffectSize(
          targetIntervention,
          outcome.trim(),
          population,
          comparator
        );

        if (result.success && result.effectSize) {
          enhancedOutcomeMeasures.push({
            name: outcome.trim(),
            measure: result.effectSize.measure,
            value: result.effectSize.value,
            ciLower: result.effectSize.ciLower,
            ciUpper: result.effectSize.ciUpper,
            pValue: result.effectSize.pValue,
            source: result.effectSize.source || metaAnalysis.title
          });
        }
      }

      if (enhancedOutcomeMeasures.length > 0) {
        return {
          ...metaAnalysis,
          outcomeMeasures: enhancedOutcomeMeasures,
          _recoveredEffectSizes: true // Flag to indicate recovered data
        };
      }
    }

    // If we get here, no effect sizes were recovered
    return {
      ...metaAnalysis,
      _missingEffectSizes: true // Flag to indicate missing data
    };
  }
}

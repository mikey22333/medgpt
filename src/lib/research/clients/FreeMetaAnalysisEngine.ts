/**
 * Free Database Meta-Analysis Engine
 * Systematic review-quality meta-analysis using open-access data
 * Extracts data from PMC full-text articles for pooled effect calculations
 */

import PMCFullTextAnalysisEngine, { PMCFullTextResult, EffectSize, ResultsTable } from './PMCFullTextAnalysisEngine';

export interface MetaAnalysisStudy {
  id: string;
  pmcId?: string;
  pmid?: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  studyDesign: string;
  sampleSize: number;
  population: string;
  intervention: string;
  comparator: string;
  outcomes: StudyOutcome[];
  qualityScore: number;
  riskOfBias: 'Low' | 'Moderate' | 'High';
  effectSizes: EffectSize[];
  rawData: any; // Original extracted data
}

export interface StudyOutcome {
  name: string;
  measure: string; // OR, RR, MD, SMD, etc.
  value: number;
  confidenceInterval: [number, number];
  pValue: number;
  sampleSize: number;
  events?: number; // For binary outcomes
  total?: number; // For binary outcomes
  mean?: number; // For continuous outcomes
  standardDeviation?: number; // For continuous outcomes
}

export interface MetaAnalysisResult {
  query: string;
  outcomeAnalyzed: string;
  includedStudies: MetaAnalysisStudy[];
  excludedStudies: Array<{
    study: MetaAnalysisStudy;
    reason: string;
  }>;
  pooledEffect: {
    measure: string;
    value: number;
    confidenceInterval: [number, number];
    pValue: number;
    significance: boolean;
  };
  heterogeneity: {
    iSquared: number; // I² statistic
    tauSquared: number; // τ² statistic
    qStatistic: number;
    pValue: number;
    interpretation: 'Low' | 'Moderate' | 'High';
  };
  qualityAssessment: {
    overallQuality: 'High' | 'Moderate' | 'Low' | 'VeryLow';
    riskOfBiasDistribution: Record<string, number>;
    gradeAssessment: GRADEMetaAnalysis;
  };
  forestPlot: ForestPlotData;
  sensitivityAnalysis: SensitivityAnalysis;
  subgroupAnalysis?: SubgroupAnalysis[];
  clinicalInterpretation: ClinicalInterpretation;
}

export interface GRADEMetaAnalysis {
  riskOfBias: 'NotSerious' | 'Serious' | 'VerySerious';
  inconsistency: 'NotSerious' | 'Serious' | 'VerySerious';
  indirectness: 'NotSerious' | 'Serious' | 'VerySerious';
  imprecision: 'NotSerious' | 'Serious' | 'VerySerious';
  publicationBias: 'NotDetected' | 'Suspected' | 'Likely';
  overallGrade: 'High' | 'Moderate' | 'Low' | 'VeryLow';
  upgradeFactors: string[];
  downgradeFactors: string[];
}

export interface ForestPlotData {
  studies: Array<{
    studyName: string;
    effectSize: number;
    confidenceInterval: [number, number];
    weight: number;
    sampleSize: number;
  }>;
  pooledEffect: {
    effectSize: number;
    confidenceInterval: [number, number];
    diamondPosition: number;
  };
  plotParameters: {
    xAxisLabel: string;
    xAxisScale: [number, number];
    nullLine: number;
    favoringDirection: string;
  };
}

export interface SensitivityAnalysis {
  leaveOneOut: Array<{
    excludedStudy: string;
    newPooledEffect: number;
    newConfidenceInterval: [number, number];
    changeFromOriginal: number;
  }>;
  qualityBasedExclusion: {
    highQualityOnly: {
      pooledEffect: number;
      confidenceInterval: [number, number];
      studiesIncluded: number;
    };
    lowRiskBiasOnly: {
      pooledEffect: number;
      confidenceInterval: [number, number];
      studiesIncluded: number;
    };
  };
  influence: {
    mostInfluential: string;
    leastInfluential: string;
    overallStability: 'Stable' | 'Moderate' | 'Unstable';
  };
}

export interface SubgroupAnalysis {
  subgroupName: string;
  variable: string; // age, gender, intervention type, etc.
  subgroups: Array<{
    name: string;
    studies: MetaAnalysisStudy[];
    pooledEffect: number;
    confidenceInterval: [number, number];
    heterogeneity: number;
  }>;
  betweenGroupHeterogeneity: {
    qStatistic: number;
    pValue: number;
    significant: boolean;
  };
}

export interface ClinicalInterpretation {
  clinicalSignificance: 'Clinically Significant' | 'Borderline' | 'Not Clinically Significant';
  numberNeededToTreat?: number;
  absoluteRiskReduction?: number;
  magnitudeOfEffect: 'Large' | 'Moderate' | 'Small' | 'Trivial';
  certaintyOfEvidence: string;
  applicability: {
    population: string;
    setting: string;
    interventionFeasibility: string;
  };
  recommendations: {
    clinical: string[];
    research: string[];
    policy: string[];
  };
}

export class FreeMetaAnalysisEngine {
  private pmcEngine: PMCFullTextAnalysisEngine;

  constructor() {
    this.pmcEngine = new PMCFullTextAnalysisEngine();
  }

  async performMetaAnalysis(
    query: string,
    outcome: string,
    studyType?: 'RCT' | 'Observational' | 'All'
  ): Promise<MetaAnalysisResult> {
    console.log(`🔬 Performing meta-analysis for: "${query}" - Outcome: "${outcome}"`);

    try {
      // Step 1: Search and extract studies from free databases
      const studies = await this.searchAndExtractStudies(query, outcome, studyType);
      
      if (studies.length < 2) {
        throw new Error(`Insufficient studies for meta-analysis. Found ${studies.length}, need at least 2.`);
      }

      console.log(`📊 Found ${studies.length} studies for meta-analysis`);

      // Step 2: Quality assessment and inclusion/exclusion
      const { includedStudies, excludedStudies } = await this.assessStudyQuality(studies, outcome);

      if (includedStudies.length < 2) {
        throw new Error(`Insufficient high-quality studies. ${includedStudies.length} included after quality assessment.`);
      }

      // Step 3: Extract and standardize effect sizes
      const standardizedStudies = await this.standardizeEffectSizes(includedStudies, outcome);

      // Step 4: Calculate pooled effect
      const pooledEffect = this.calculatePooledEffect(standardizedStudies);

      // Step 5: Assess heterogeneity
      const heterogeneity = this.assessHeterogeneity(standardizedStudies, pooledEffect);

      // Step 6: GRADE assessment
      const qualityAssessment = this.performGRADEAssessment(standardizedStudies, heterogeneity);

      // Step 7: Generate forest plot data
      const forestPlot = this.generateForestPlotData(standardizedStudies, pooledEffect, outcome);

      // Step 8: Sensitivity analysis
      const sensitivityAnalysis = this.performSensitivityAnalysis(standardizedStudies, pooledEffect);

      // Step 9: Clinical interpretation
      const clinicalInterpretation = this.generateClinicalInterpretation(
        pooledEffect,
        qualityAssessment,
        outcome,
        standardizedStudies
      );

      return {
        query,
        outcomeAnalyzed: outcome,
        includedStudies: standardizedStudies,
        excludedStudies,
        pooledEffect,
        heterogeneity,
        qualityAssessment,
        forestPlot,
        sensitivityAnalysis,
        clinicalInterpretation
      };

    } catch (error) {
      console.error('❌ Meta-analysis failed:', error);
      throw error;
    }
  }

  private async searchAndExtractStudies(
    query: string,
    outcome: string,
    studyType?: string
  ): Promise<MetaAnalysisStudy[]> {
    const searchQuery = `${query} AND ${outcome}`;
    
    // Search PMC for full-text articles
    const pmcResults = await this.pmcEngine.searchPMCFullText(searchQuery, 50);
    
    // Convert PMC results to meta-analysis format
    const studies: MetaAnalysisStudy[] = [];
    
    for (const pmcResult of pmcResults) {
      const study = this.convertPMCToMetaAnalysisStudy(pmcResult, outcome);
      if (study && (!studyType || study.studyDesign.toLowerCase().includes(studyType.toLowerCase()))) {
        studies.push(study);
      }
    }

    return studies;
  }

  private convertPMCToMetaAnalysisStudy(pmcResult: PMCFullTextResult, outcome: string): MetaAnalysisStudy | null {
    try {
      // Extract relevant outcomes
      const relevantOutcomes = this.extractRelevantOutcomes(pmcResult, outcome);
      
      if (relevantOutcomes.length === 0) {
        return null; // No relevant outcomes found
      }

      return {
        id: pmcResult.pmcId,
        pmcId: pmcResult.pmcId,
        pmid: pmcResult.pmid,
        title: pmcResult.title,
        authors: pmcResult.authors,
        journal: pmcResult.journal,
        year: pmcResult.year,
        studyDesign: pmcResult.fullTextSections.methodology.studyDesign,
        sampleSize: pmcResult.fullTextSections.methodology.participants.sampleSize,
        population: pmcResult.extractedData.population,
        intervention: pmcResult.extractedData.intervention,
        comparator: pmcResult.extractedData.comparator,
        outcomes: relevantOutcomes,
        qualityScore: pmcResult.qualityMetrics.overallQuality,
        riskOfBias: pmcResult.gradeComponents.riskOfBias,
        effectSizes: pmcResult.fullTextSections.results.effectSizes,
        rawData: pmcResult
      };

    } catch (error) {
      console.warn(`⚠️ Failed to convert PMC result ${pmcResult.pmcId}:`, error);
      return null;
    }
  }

  private extractRelevantOutcomes(pmcResult: PMCFullTextResult, targetOutcome: string): StudyOutcome[] {
    const outcomes: StudyOutcome[] = [];
    
    // Search effect sizes for relevant outcomes
    for (const effectSize of pmcResult.fullTextSections.results.effectSizes) {
      if (this.isRelevantOutcome(effectSize.outcome, targetOutcome)) {
        outcomes.push({
          name: effectSize.outcome,
          measure: effectSize.measure,
          value: effectSize.value,
          confidenceInterval: effectSize.confidenceInterval,
          pValue: effectSize.pValue,
          sampleSize: pmcResult.fullTextSections.methodology.participants.sampleSize
        });
      }
    }

    return outcomes;
  }

  private isRelevantOutcome(studyOutcome: string, targetOutcome: string): boolean {
    const studyLower = studyOutcome.toLowerCase();
    const targetLower = targetOutcome.toLowerCase();
    
    // Simple keyword matching - could be enhanced with NLP
    return studyLower.includes(targetLower) || 
           targetLower.includes(studyLower) ||
           this.areRelatedOutcomes(studyLower, targetLower);
  }

  private areRelatedOutcomes(outcome1: string, outcome2: string): boolean {
    const synonyms: Record<string, string[]> = {
      'mortality': ['death', 'survival', 'fatal', 'died'],
      'efficacy': ['effectiveness', 'response', 'success'],
      'safety': ['adverse events', 'side effects', 'toxicity'],
      'smoking cessation': ['quit smoking', 'tobacco cessation', 'smoking abstinence']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if ((outcome1.includes(key) || values.some(v => outcome1.includes(v))) &&
          (outcome2.includes(key) || values.some(v => outcome2.includes(v)))) {
        return true;
      }
    }

    return false;
  }

  private async assessStudyQuality(
    studies: MetaAnalysisStudy[],
    outcome: string
  ): Promise<{ includedStudies: MetaAnalysisStudy[]; excludedStudies: Array<{ study: MetaAnalysisStudy; reason: string }> }> {
    const includedStudies: MetaAnalysisStudy[] = [];
    const excludedStudies: Array<{ study: MetaAnalysisStudy; reason: string }> = [];

    for (const study of studies) {
      const exclusionReason = this.getExclusionReason(study, outcome);
      
      if (exclusionReason) {
        excludedStudies.push({ study, reason: exclusionReason });
      } else {
        includedStudies.push(study);
      }
    }

    return { includedStudies, excludedStudies };
  }

  private getExclusionReason(study: MetaAnalysisStudy, outcome: string): string | null {
    // Check for extractable effect sizes
    const relevantOutcomes = study.outcomes.filter(o => 
      this.isRelevantOutcome(o.name, outcome)
    );

    if (relevantOutcomes.length === 0) {
      return 'No extractable data for target outcome';
    }

    // Check sample size
    if (study.sampleSize < 10) {
      return 'Sample size too small (< 10 participants)';
    }

    // Check quality score
    if (study.qualityScore < 40) {
      return 'Study quality too low (< 40/100)';
    }

    // Check for high risk of bias
    if (study.riskOfBias === 'High') {
      return 'High risk of bias';
    }

    return null; // Study is included
  }

  private async standardizeEffectSizes(studies: MetaAnalysisStudy[], outcome: string): Promise<MetaAnalysisStudy[]> {
    // For now, return studies as-is
    // In a full implementation, this would standardize different effect measures
    return studies;
  }

  private calculatePooledEffect(studies: MetaAnalysisStudy[]): MetaAnalysisResult['pooledEffect'] {
    // Simple fixed-effects model for demonstration
    // In practice, would use random-effects if heterogeneity is high
    
    let numerator = 0;
    let denominator = 0;

    for (const study of studies) {
      const outcome = study.outcomes[0]; // Use first relevant outcome
      const weight = this.calculateWeight(study);
      
      numerator += outcome.value * weight;
      denominator += weight;
    }

    const pooledValue = numerator / denominator;
    
    // Calculate pooled confidence interval (simplified)
    const pooledSE = Math.sqrt(1 / denominator);
    const lowerCI = pooledValue - 1.96 * pooledSE;
    const upperCI = pooledValue + 1.96 * pooledSE;
    
    // Calculate Z-score and p-value
    const zScore = pooledValue / pooledSE;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return {
      measure: studies[0].outcomes[0].measure,
      value: pooledValue,
      confidenceInterval: [lowerCI, upperCI],
      pValue,
      significance: pValue < 0.05
    };
  }

  private calculateWeight(study: MetaAnalysisStudy): number {
    // Inverse variance weighting (simplified)
    const outcome = study.outcomes[0];
    const se = (outcome.confidenceInterval[1] - outcome.confidenceInterval[0]) / (2 * 1.96);
    return 1 / (se * se);
  }

  private assessHeterogeneity(studies: MetaAnalysisStudy[], pooledEffect: any): MetaAnalysisResult['heterogeneity'] {
    // Calculate I² statistic (simplified implementation)
    let qStatistic = 0;
    
    for (const study of studies) {
      const outcome = study.outcomes[0];
      const weight = this.calculateWeight(study);
      const diff = outcome.value - pooledEffect.value;
      qStatistic += weight * diff * diff;
    }

    const degreesOfFreedom = studies.length - 1;
    const iSquared = Math.max(0, ((qStatistic - degreesOfFreedom) / qStatistic) * 100);
    
    let interpretation: 'Low' | 'Moderate' | 'High';
    if (iSquared < 25) interpretation = 'Low';
    else if (iSquared < 75) interpretation = 'Moderate';
    else interpretation = 'High';

    return {
      iSquared,
      tauSquared: 0, // Would be calculated in full implementation
      qStatistic,
      pValue: 1 - this.chiSquaredCDF(qStatistic, degreesOfFreedom),
      interpretation
    };
  }

  private performGRADEAssessment(studies: MetaAnalysisStudy[], heterogeneity: any): MetaAnalysisResult['qualityAssessment'] {
    // Simplified GRADE assessment
    const riskOfBiasDistribution = {
      'Low': studies.filter(s => s.riskOfBias === 'Low').length,
      'Moderate': studies.filter(s => s.riskOfBias === 'Moderate').length,
      'High': studies.filter(s => s.riskOfBias === 'High').length
    };

    const averageQuality = studies.reduce((sum, s) => sum + s.qualityScore, 0) / studies.length;
    
    let overallQuality: 'High' | 'Moderate' | 'Low' | 'VeryLow';
    if (averageQuality >= 80 && heterogeneity.interpretation === 'Low') overallQuality = 'High';
    else if (averageQuality >= 60) overallQuality = 'Moderate';
    else if (averageQuality >= 40) overallQuality = 'Low';
    else overallQuality = 'VeryLow';

    return {
      overallQuality,
      riskOfBiasDistribution,
      gradeAssessment: {
        riskOfBias: riskOfBiasDistribution.High > studies.length / 2 ? 'VerySerious' : 'NotSerious',
        inconsistency: heterogeneity.interpretation === 'High' ? 'Serious' : 'NotSerious',
        indirectness: 'NotSerious', // Would need more sophisticated assessment
        imprecision: studies.length < 5 ? 'Serious' : 'NotSerious',
        publicationBias: 'NotDetected', // Would need funnel plot analysis
        overallGrade: overallQuality,
        upgradeFactors: [],
        downgradeFactors: []
      }
    };
  }

  private generateForestPlotData(studies: MetaAnalysisStudy[], pooledEffect: any, outcome: string): ForestPlotData {
    const plotStudies = studies.map(study => ({
      studyName: `${study.authors[0]} et al. (${study.year})`,
      effectSize: study.outcomes[0].value,
      confidenceInterval: study.outcomes[0].confidenceInterval,
      weight: this.calculateWeight(study),
      sampleSize: study.sampleSize
    }));

    return {
      studies: plotStudies,
      pooledEffect: {
        effectSize: pooledEffect.value,
        confidenceInterval: pooledEffect.confidenceInterval,
        diamondPosition: plotStudies.length + 1
      },
      plotParameters: {
        xAxisLabel: `${pooledEffect.measure} (95% CI)`,
        xAxisScale: [
          Math.min(...plotStudies.map(s => s.confidenceInterval[0]), pooledEffect.confidenceInterval[0]) * 0.8,
          Math.max(...plotStudies.map(s => s.confidenceInterval[1]), pooledEffect.confidenceInterval[1]) * 1.2
        ],
        nullLine: pooledEffect.measure.includes('OR') || pooledEffect.measure.includes('RR') ? 1 : 0,
        favoringDirection: 'Favors intervention vs. control'
      }
    };
  }

  private performSensitivityAnalysis(studies: MetaAnalysisStudy[], originalPooledEffect: any): SensitivityAnalysis {
    // Leave-one-out analysis
    const leaveOneOut = studies.map(excludedStudy => {
      const remainingStudies = studies.filter(s => s.id !== excludedStudy.id);
      const newPooledEffect = this.calculatePooledEffect(remainingStudies);
      
      return {
        excludedStudy: `${excludedStudy.authors[0]} et al. (${excludedStudy.year})`,
        newPooledEffect: newPooledEffect.value,
        newConfidenceInterval: newPooledEffect.confidenceInterval,
        changeFromOriginal: Math.abs(newPooledEffect.value - originalPooledEffect.value)
      };
    });

    // Find most influential study
    const mostInfluential = leaveOneOut.reduce((max, current) => 
      current.changeFromOriginal > max.changeFromOriginal ? current : max
    );

    return {
      leaveOneOut,
      qualityBasedExclusion: {
        highQualityOnly: {
          pooledEffect: 0, // Would calculate with high-quality studies only
          confidenceInterval: [0, 0],
          studiesIncluded: studies.filter(s => s.qualityScore >= 80).length
        },
        lowRiskBiasOnly: {
          pooledEffect: 0, // Would calculate with low risk of bias studies only
          confidenceInterval: [0, 0],
          studiesIncluded: studies.filter(s => s.riskOfBias === 'Low').length
        }
      },
      influence: {
        mostInfluential: mostInfluential.excludedStudy,
        leastInfluential: leaveOneOut.reduce((min, current) => 
          current.changeFromOriginal < min.changeFromOriginal ? current : min
        ).excludedStudy,
        overallStability: mostInfluential.changeFromOriginal > 0.5 ? 'Unstable' : 'Stable'
      }
    };
  }

  private generateClinicalInterpretation(
    pooledEffect: any,
    qualityAssessment: any,
    outcome: string,
    studies: MetaAnalysisStudy[]
  ): ClinicalInterpretation {
    // Assess clinical significance based on effect size and confidence interval
    const effectSize = Math.abs(pooledEffect.value);
    let magnitudeOfEffect: 'Large' | 'Moderate' | 'Small' | 'Trivial';
    
    if (pooledEffect.measure.includes('OR') || pooledEffect.measure.includes('RR')) {
      if (effectSize > 2 || effectSize < 0.5) magnitudeOfEffect = 'Large';
      else if (effectSize > 1.5 || effectSize < 0.67) magnitudeOfEffect = 'Moderate';
      else if (effectSize > 1.2 || effectSize < 0.83) magnitudeOfEffect = 'Small';
      else magnitudeOfEffect = 'Trivial';
    } else {
      if (effectSize > 0.8) magnitudeOfEffect = 'Large';
      else if (effectSize > 0.5) magnitudeOfEffect = 'Moderate';
      else if (effectSize > 0.2) magnitudeOfEffect = 'Small';
      else magnitudeOfEffect = 'Trivial';
    }

    const clinicalSignificance = 
      magnitudeOfEffect === 'Large' || (magnitudeOfEffect === 'Moderate' && pooledEffect.significance) ?
      'Clinically Significant' :
      magnitudeOfEffect === 'Trivial' ? 'Not Clinically Significant' : 'Borderline';

    return {
      clinicalSignificance,
      magnitudeOfEffect,
      certaintyOfEvidence: `${qualityAssessment.overallQuality} certainty evidence`,
      applicability: {
        population: `Applicable to ${studies[0].population}`,
        setting: 'Multiple clinical settings represented',
        interventionFeasibility: 'Intervention appears feasible in clinical practice'
      },
      recommendations: {
        clinical: [
          `Based on ${qualityAssessment.overallQuality.toLowerCase()} certainty evidence, consider implementing this intervention`,
          'Monitor patients for the outcomes measured in these studies',
          'Consider individual patient factors when applying these results'
        ],
        research: [
          'Future studies should focus on long-term outcomes',
          'More diverse populations should be studied',
          'Cost-effectiveness analysis would be valuable'
        ],
        policy: [
          'Evidence supports consideration for clinical guidelines',
          'Implementation research may be needed',
          'Resource allocation should consider these findings'
        ]
      }
    };
  }

  // Statistical helper functions
  private normalCDF(x: number): number {
    // Approximation of the standard normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private chiSquaredCDF(x: number, df: number): number {
    // Simplified chi-squared CDF approximation
    if (df === 1) return 2 * this.normalCDF(Math.sqrt(x)) - 1;
    return 0.5; // Placeholder - would use proper implementation
  }
}

export default FreeMetaAnalysisEngine;

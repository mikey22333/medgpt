export interface RoB2Assessment {
  randomizationProcess: BiasLevel;
  deviationsFromIntervention: BiasLevel;
  missingOutcomeData: BiasLevel;
  outcomesMeasurement: BiasLevel;
  selectionOfResults: BiasLevel;
  overallRisk: BiasLevel;
  details: RoB2Details;
}

export interface AMSTAR2Assessment {
  protocolRegistered: boolean;
  studySelectionDuplicate: boolean;
  comprehensiveSearch: boolean;
  greyLiteratureSearch: boolean;
  excludedStudiesList: boolean;
  studyCharacteristics: boolean;
  riskOfBiasAssessed: boolean;
  riskOfBiasReporting: boolean;
  metaAnalysisMethods: boolean;
  riskOfBiasResults: boolean;
  publicationBias: boolean;
  conflictsOfInterest: boolean;
  score: number;
  overallConfidence: 'High' | 'Moderate' | 'Low' | 'Critically Low';
  details: AMSTAR2Details;
}

export type BiasLevel = 'Low' | 'Some_concerns' | 'High';

export interface RoB2Details {
  randomizationDescription: string;
  blindingDescription: string;
  outcomeDataDescription: string;
  measurementDescription: string;
  reportingDescription: string;
  overallJustification: string;
}

export interface AMSTAR2Details {
  protocolDetails: string;
  searchStrategyDetails: string;
  selectionProcessDetails: string;
  dataExtractionDetails: string;
  biasAssessmentDetails: string;
  overallJustification: string;
}

export interface StudyQualityReport {
  studyId: string;
  studyType: 'RCT' | 'SystematicReview' | 'Observational' | 'Other';
  rob2Assessment?: RoB2Assessment;
  amstar2Assessment?: AMSTAR2Assessment;
  overallQuality: 'High' | 'Moderate' | 'Low' | 'Very Low';
  qualityScore: number;
  recommendations: string[];
}

export class BiasAssessmentService {
  async assessRCTBias(study: StudyMetadata): Promise<RoB2Assessment> {
    const assessment: RoB2Assessment = {
      randomizationProcess: await this.assessRandomization(study),
      deviationsFromIntervention: await this.assessDeviations(study),
      missingOutcomeData: await this.assessMissingData(study),
      outcomesMeasurement: await this.assessOutcomeMeasurement(study),
      selectionOfResults: await this.assessResultSelection(study),
      overallRisk: 'Low', // Will be calculated
      details: {
        randomizationDescription: '',
        blindingDescription: '',
        outcomeDataDescription: '',
        measurementDescription: '',
        reportingDescription: '',
        overallJustification: ''
      }
    };

    // Calculate overall risk
    assessment.overallRisk = this.calculateOverallRoB2Risk(assessment);
    assessment.details = await this.generateRoB2Details(study, assessment);

    return assessment;
  }

  async assessSystematicReviewQuality(review: StudyMetadata): Promise<AMSTAR2Assessment> {
    const assessment: AMSTAR2Assessment = {
      protocolRegistered: await this.checkProtocolRegistration(review),
      studySelectionDuplicate: await this.checkDuplicateSelection(review),
      comprehensiveSearch: await this.checkComprehensiveSearch(review),
      greyLiteratureSearch: await this.checkGreyLiterature(review),
      excludedStudiesList: await this.checkExcludedStudies(review),
      studyCharacteristics: await this.checkStudyCharacteristics(review),
      riskOfBiasAssessed: await this.checkRiskOfBiasAssessment(review),
      riskOfBiasReporting: await this.checkRiskOfBiasReporting(review),
      metaAnalysisMethods: await this.checkMetaAnalysisMethods(review),
      riskOfBiasResults: await this.checkRiskOfBiasInResults(review),
      publicationBias: await this.checkPublicationBias(review),
      conflictsOfInterest: await this.checkConflictsOfInterest(review),
      score: 0, // Will be calculated
      overallConfidence: 'Low', // Will be calculated
      details: {
        protocolDetails: '',
        searchStrategyDetails: '',
        selectionProcessDetails: '',
        dataExtractionDetails: '',
        biasAssessmentDetails: '',
        overallJustification: ''
      }
    };

    // Calculate score and confidence
    assessment.score = this.calculateAMSTAR2Score(assessment);
    assessment.overallConfidence = this.determineAMSTAR2Confidence(assessment);
    assessment.details = await this.generateAMSTAR2Details(review, assessment);

    return assessment;
  }

  async generateQualityReport(study: StudyMetadata): Promise<StudyQualityReport> {
    const studyType = this.determineStudyType(study);
    let rob2Assessment: RoB2Assessment | undefined;
    let amstar2Assessment: AMSTAR2Assessment | undefined;

    if (studyType === 'RCT') {
      rob2Assessment = await this.assessRCTBias(study);
    } else if (studyType === 'SystematicReview') {
      amstar2Assessment = await this.assessSystematicReviewQuality(study);
    }

    const overallQuality = this.determineOverallQuality(studyType, rob2Assessment, amstar2Assessment);
    const qualityScore = this.calculateQualityScore(studyType, rob2Assessment, amstar2Assessment);
    const recommendations = this.generateRecommendations(studyType, rob2Assessment, amstar2Assessment);

    return {
      studyId: study.id,
      studyType,
      rob2Assessment,
      amstar2Assessment,
      overallQuality,
      qualityScore,
      recommendations
    };
  }

  // RoB2 Assessment Methods
  private async assessRandomization(study: StudyMetadata): Promise<BiasLevel> {
    const text = `${study.title} ${study.abstract} ${study.methods || ''}`.toLowerCase();
    
    // Look for randomization indicators
    const randomizationTerms = [
      'randomized', 'randomised', 'random allocation', 'random assignment',
      'computer-generated', 'random number', 'block randomization', 'stratified randomization'
    ];
    
    const concealmentTerms = [
      'concealed allocation', 'sealed envelope', 'central randomization',
      'pharmacy-controlled', 'allocation concealment'
    ];

    const hasRandomization = randomizationTerms.some(term => text.includes(term));
    const hasConcealment = concealmentTerms.some(term => text.includes(term));
    
    if (hasRandomization && hasConcealment) return 'Low';
    if (hasRandomization) return 'Some_concerns';
    return 'High';
  }

  private async assessDeviations(study: StudyMetadata): Promise<BiasLevel> {
    const text = `${study.title} ${study.abstract} ${study.methods || ''}`.toLowerCase();
    
    const blindingTerms = [
      'double-blind', 'double-blinded', 'triple-blind', 'placebo-controlled',
      'blinded investigator', 'masked', 'single-blind'
    ];
    
    const deviationTerms = [
      'intention-to-treat', 'itt analysis', 'per-protocol', 'protocol deviation',
      'treatment adherence', 'compliance'
    ];

    const hasBlinding = blindingTerms.some(term => text.includes(term));
    const hasITTAnalysis = text.includes('intention-to-treat') || text.includes('itt');
    
    if (hasBlinding && hasITTAnalysis) return 'Low';
    if (hasBlinding || hasITTAnalysis) return 'Some_concerns';
    return 'High';
  }

  private async assessMissingData(study: StudyMetadata): Promise<BiasLevel> {
    const text = `${study.title} ${study.abstract} ${study.results || ''}`.toLowerCase();
    
    const missingDataTerms = [
      'missing data', 'dropout', 'withdrawal', 'lost to follow-up',
      'attrition', 'missing outcome'
    ];
    
    const imputationTerms = [
      'imputation', 'last observation carried forward', 'locf',
      'multiple imputation', 'sensitivity analysis'
    ];

    const hasMissingDataHandling = imputationTerms.some(term => text.includes(term));
    const mentionsMissingData = missingDataTerms.some(term => text.includes(term));
    
    if (hasMissingDataHandling) return 'Low';
    if (!mentionsMissingData) return 'Some_concerns';
    return 'High';
  }

  private async assessOutcomeMeasurement(study: StudyMetadata): Promise<BiasLevel> {
    const text = `${study.title} ${study.abstract} ${study.methods || ''}`.toLowerCase();
    
    const validatedInstruments = [
      'validated', 'standardized', 'objective outcome', 'laboratory measure',
      'biomarker', 'mortality', 'hospitalization'
    ];
    
    const blindingTerms = [
      'blinded outcome assessment', 'masked outcome', 'independent adjudication',
      'blinded investigator'
    ];

    const hasValidatedOutcome = validatedInstruments.some(term => text.includes(term));
    const hasBlindedAssessment = blindingTerms.some(term => text.includes(term));
    
    if (hasValidatedOutcome && hasBlindedAssessment) return 'Low';
    if (hasValidatedOutcome || hasBlindedAssessment) return 'Some_concerns';
    return 'High';
  }

  private async assessResultSelection(study: StudyMetadata): Promise<BiasLevel> {
    const text = `${study.title} ${study.abstract} ${study.methods || ''}`.toLowerCase();
    
    const protocolTerms = [
      'protocol', 'pre-specified', 'primary endpoint', 'secondary endpoint',
      'statistical analysis plan', 'registered'
    ];
    
    const reportingTerms = [
      'all outcomes reported', 'complete reporting', 'trial registration',
      'clinicaltrials.gov', 'protocol published'
    ];

    const hasProtocol = protocolTerms.some(term => text.includes(term));
    const hasCompleteReporting = reportingTerms.some(term => text.includes(term));
    
    if (hasProtocol && hasCompleteReporting) return 'Low';
    if (hasProtocol || hasCompleteReporting) return 'Some_concerns';
    return 'High';
  }

  private calculateOverallRoB2Risk(assessment: RoB2Assessment): BiasLevel {
    const risks = [
      assessment.randomizationProcess,
      assessment.deviationsFromIntervention,
      assessment.missingOutcomeData,
      assessment.outcomesMeasurement,
      assessment.selectionOfResults
    ];

    if (risks.includes('High')) return 'High';
    if (risks.includes('Some_concerns')) return 'Some_concerns';
    return 'Low';
  }

  // AMSTAR-2 Assessment Methods
  private async checkProtocolRegistration(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    const protocolTerms = [
      'protocol registered', 'prospero', 'protocol published',
      'systematic review protocol', 'pre-registered'
    ];
    return protocolTerms.some(term => text.includes(term));
  }

  private async checkDuplicateSelection(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    const duplicateTerms = [
      'two reviewers', 'independently', 'duplicate selection',
      'two investigators', 'inter-rater reliability'
    ];
    return duplicateTerms.some(term => text.includes(term));
  }

  private async checkComprehensiveSearch(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    const searchTerms = [
      'comprehensive search', 'multiple databases', 'medline', 'embase',
      'cochrane library', 'search strategy', 'systematic search'
    ];
    return searchTerms.some(term => text.includes(term));
  }

  private async checkGreyLiterature(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    const greyTerms = [
      'grey literature', 'gray literature', 'conference abstracts',
      'thesis', 'unpublished', 'trial registries'
    ];
    return greyTerms.some(term => text.includes(term));
  }

  private async checkExcludedStudies(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    return text.includes('excluded studies') || text.includes('exclusion list');
  }

  private async checkStudyCharacteristics(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.results || ''}`.toLowerCase();
    const characteristicTerms = [
      'study characteristics', 'baseline characteristics', 'study details',
      'participant characteristics'
    ];
    return characteristicTerms.some(term => text.includes(term));
  }

  private async checkRiskOfBiasAssessment(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    const biasTerms = [
      'risk of bias', 'quality assessment', 'cochrane risk of bias',
      'rob2', 'newcastle-ottawa', 'bias assessment'
    ];
    return biasTerms.some(term => text.includes(term));
  }

  private async checkRiskOfBiasReporting(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.results || ''}`.toLowerCase();
    return text.includes('risk of bias') && (text.includes('results') || text.includes('figure'));
  }

  private async checkMetaAnalysisMethods(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    const metaTerms = [
      'meta-analysis', 'pooled analysis', 'random effects', 'fixed effects',
      'heterogeneity', 'forest plot'
    ];
    return metaTerms.some(term => text.includes(term));
  }

  private async checkRiskOfBiasInResults(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.results || ''}`.toLowerCase();
    return text.includes('bias') && text.includes('meta-analysis');
  }

  private async checkPublicationBias(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.methods || ''}`.toLowerCase();
    const pubBiasTerms = [
      'publication bias', 'funnel plot', 'egger test', 'begg test',
      'small study effects'
    ];
    return pubBiasTerms.some(term => text.includes(term));
  }

  private async checkConflictsOfInterest(review: StudyMetadata): Promise<boolean> {
    const text = `${review.title} ${review.abstract} ${review.fullText || ''}`.toLowerCase();
    const conflictTerms = [
      'conflict of interest', 'competing interests', 'financial disclosure',
      'funding source'
    ];
    return conflictTerms.some(term => text.includes(term));
  }

  private calculateAMSTAR2Score(assessment: AMSTAR2Assessment): number {
    const criteria = [
      assessment.protocolRegistered,
      assessment.studySelectionDuplicate,
      assessment.comprehensiveSearch,
      assessment.greyLiteratureSearch,
      assessment.excludedStudiesList,
      assessment.studyCharacteristics,
      assessment.riskOfBiasAssessed,
      assessment.riskOfBiasReporting,
      assessment.metaAnalysisMethods,
      assessment.riskOfBiasResults,
      assessment.publicationBias,
      assessment.conflictsOfInterest
    ];

    return criteria.filter(Boolean).length;
  }

  private determineAMSTAR2Confidence(assessment: AMSTAR2Assessment): 'High' | 'Moderate' | 'Low' | 'Critically Low' {
    const criticalItems = [
      assessment.protocolRegistered,
      assessment.comprehensiveSearch,
      assessment.riskOfBiasAssessed,
      assessment.metaAnalysisMethods
    ];

    const criticalMet = criticalItems.filter(Boolean).length;
    const totalScore = assessment.score;

    if (criticalMet === 4 && totalScore >= 10) return 'High';
    if (criticalMet >= 3 && totalScore >= 8) return 'Moderate';
    if (criticalMet >= 2 && totalScore >= 5) return 'Low';
    return 'Critically Low';
  }

  private determineStudyType(study: StudyMetadata): 'RCT' | 'SystematicReview' | 'Observational' | 'Other' {
    const text = `${study.title} ${study.abstract}`.toLowerCase();
    
    if (text.includes('systematic review') || text.includes('meta-analysis')) {
      return 'SystematicReview';
    } else if (text.includes('randomized') || text.includes('randomised') || text.includes('rct')) {
      return 'RCT';
    } else if (text.includes('cohort') || text.includes('case-control') || text.includes('observational')) {
      return 'Observational';
    }
    
    return 'Other';
  }

  private determineOverallQuality(
    studyType: string,
    rob2?: RoB2Assessment,
    amstar2?: AMSTAR2Assessment
  ): 'High' | 'Moderate' | 'Low' | 'Very Low' {
    if (studyType === 'RCT' && rob2) {
      switch (rob2.overallRisk) {
        case 'Low': return 'High';
        case 'Some_concerns': return 'Moderate';
        case 'High': return 'Low';
      }
    } else if (studyType === 'SystematicReview' && amstar2) {
      switch (amstar2.overallConfidence) {
        case 'High': return 'High';
        case 'Moderate': return 'Moderate';
        case 'Low': return 'Low';
        case 'Critically Low': return 'Very Low';
      }
    }
    
    return 'Low'; // Default for other study types
  }

  private calculateQualityScore(
    studyType: string,
    rob2?: RoB2Assessment,
    amstar2?: AMSTAR2Assessment
  ): number {
    if (studyType === 'RCT' && rob2) {
      const riskScores = {
        'Low': 20,
        'Some_concerns': 10,
        'High': 0
      };
      
      return (
        riskScores[rob2.randomizationProcess] +
        riskScores[rob2.deviationsFromIntervention] +
        riskScores[rob2.missingOutcomeData] +
        riskScores[rob2.outcomesMeasurement] +
        riskScores[rob2.selectionOfResults]
      );
    } else if (studyType === 'SystematicReview' && amstar2) {
      return (amstar2.score / 12) * 100;
    }
    
    return 50; // Default score
  }

  private generateRecommendations(
    studyType: string,
    rob2?: RoB2Assessment,
    amstar2?: AMSTAR2Assessment
  ): string[] {
    const recommendations: string[] = [];
    
    if (studyType === 'RCT' && rob2) {
      if (rob2.randomizationProcess === 'High') {
        recommendations.push('Caution: Inadequate randomization process may affect validity');
      }
      if (rob2.deviationsFromIntervention === 'High') {
        recommendations.push('Caution: Significant protocol deviations may bias results');
      }
      if (rob2.missingOutcomeData === 'High') {
        recommendations.push('Caution: High missing data rate may affect conclusions');
      }
    } else if (studyType === 'SystematicReview' && amstar2) {
      if (amstar2.score < 6) {
        recommendations.push('Caution: Low methodological quality systematic review');
      }
      if (!amstar2.comprehensiveSearch) {
        recommendations.push('Limited search strategy may have missed relevant studies');
      }
      if (!amstar2.riskOfBiasAssessed) {
        recommendations.push('No risk of bias assessment limits interpretation');
      }
    }
    
    return recommendations;
  }

  private async generateRoB2Details(study: StudyMetadata, assessment: RoB2Assessment): Promise<RoB2Details> {
    // This would be implemented with detailed analysis of the study text
    return {
      randomizationDescription: 'Automated assessment based on methodology description',
      blindingDescription: 'Automated assessment based on study design',
      outcomeDataDescription: 'Automated assessment based on results reporting',
      measurementDescription: 'Automated assessment based on outcome measures',
      reportingDescription: 'Automated assessment based on protocol adherence',
      overallJustification: `Overall risk: ${assessment.overallRisk} based on automated assessment`
    };
  }

  private async generateAMSTAR2Details(review: StudyMetadata, assessment: AMSTAR2Assessment): Promise<AMSTAR2Details> {
    // This would be implemented with detailed analysis of the review text
    return {
      protocolDetails: 'Automated assessment of protocol registration',
      searchStrategyDetails: 'Automated assessment of search comprehensiveness',
      selectionProcessDetails: 'Automated assessment of selection process',
      dataExtractionDetails: 'Automated assessment of data extraction',
      biasAssessmentDetails: 'Automated assessment of bias evaluation',
      overallJustification: `Confidence: ${assessment.overallConfidence} (${assessment.score}/12 criteria met)`
    };
  }
}

export interface StudyMetadata {
  id: string;
  title: string;
  abstract: string;
  methods?: string;
  results?: string;
  fullText?: string;
  journal: string;
  authors: string[];
  publicationDate: string;
}

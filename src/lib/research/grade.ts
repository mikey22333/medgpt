/**
 * GRADE (Grading of Recommendations, Assessment, Development, and Evaluations)
 * Evidence Quality Rating System
 */

export type GRADEConfidence = 'high' | 'moderate' | 'low' | 'very-low';

export interface GRADEAssessment {
  // Overall confidence rating
  confidence: GRADEConfidence;
  
  // Detailed ratings for each domain
  domains: {
    // Study Design (RCTs start as high, observational as low)
    studyDesign: {
      rating: 'high' | 'low';
      reason: string;
    };
    
    // Risk of Bias
    riskOfBias: {
      rating: 'no' | 'serious' | 'very-serious' | 'no-concern';
      reason: string;
    };
    
    // Inconsistency
    inconsistency: {
      rating: 'no' | 'serious' | 'very-serious' | 'no-concern';
      i2?: number; // I² statistic
      reason: string;
    };
    
    // Indirectness
    indirectness: {
      rating: 'no' | 'serious' | 'very-serious' | 'no-concern';
      reason: string;
    };
    
    // Imprecision
    imprecision: {
      rating: 'no' | 'serious' | 'very-serious' | 'no-concern';
      optimalInformationSize?: number;
      reason: string;
    };
    
    // Publication Bias
    publicationBias: {
      rating: 'suspected' | 'undetected' | 'no-concern';
      reason: string;
    };
    
    // Upgrade factors
    upgradeFactors: {
      largeEffect: boolean;
      doseResponse: boolean;
      plausibleConfounding: boolean;
    };
  };
  
  // Summary of reasons for rating
  reasons: string[];
  
  // Final assessment notes
  notes?: string;
}

/**
 * Calculate overall GRADE confidence based on domain assessments
 */
export function calculateGRADEConfidence(domains: Omit<GRADEAssessment, 'confidence' | 'reasons' | 'notes'>['domains']): GRADEConfidence {
  // Start with initial rating based on study design
  let confidence: GRADEConfidence = domains.studyDesign.rating === 'high' ? 'high' : 'low';
  
  // Downgrade for each serious concern
  const downgrade = (current: GRADEConfidence, levels: number = 1): GRADEConfidence => {
    const levelsMap: GRADEConfidence[] = ['high', 'moderate', 'low', 'very-low'];
    const currentIndex = levelsMap.indexOf(current);
    return levelsMap[Math.min(currentIndex + levels, levelsMap.length - 1)];
  };
  
  // Apply downgrades based on domain ratings
  if (domains.riskOfBias.rating === 'serious') confidence = downgrade(confidence);
  if (domains.riskOfBias.rating === 'very-serious') confidence = downgrade(confidence, 2);
  
  if (domains.inconsistency.rating === 'serious') confidence = downgrade(confidence);
  if (domains.inconsistency.rating === 'very-serious') confidence = downgrade(confidence, 2);
  
  if (domains.indirectness.rating === 'serious') confidence = downgrade(confidence);
  if (domains.indirectness.rating === 'very-serious') confidence = downgrade(confidence, 2);
  
  if (domains.imprecision.rating === 'serious') confidence = downgrade(confidence);
  if (domains.imprecision.rating === 'very-serious') confidence = downgrade(confidence, 2);
  
  if (domains.publicationBias.rating === 'suspected') confidence = downgrade(confidence);
  
  // Apply upgrades for strong evidence
  if (domains.upgradeFactors.largeEffect) confidence = upgrade(confidence);
  if (domains.upgradeFactors.doseResponse) confidence = upgrade(confidence);
  if (domains.upgradeFactors.plausibleConfounding) confidence = upgrade(confidence);
  
  return confidence;
}

/**
 * Upgrade confidence level (up to high)
 */
function upgrade(current: GRADEConfidence): GRADEConfidence {
  const levelsMap: GRADEConfidence[] = ['very-low', 'low', 'moderate', 'high'];
  const currentIndex = levelsMap.indexOf(current);
  return levelsMap[Math.min(currentIndex + 1, levelsMap.length - 1)];
}

/**
 * Generate a human-readable summary of the GRADE assessment
 */
export function generateGRADESummary(assessment: GRADEAssessment): string {
  const { confidence, domains, reasons } = assessment;
  const summary: string[] = [];
  
  // Add overall confidence
  summary.push(`Overall confidence in the evidence: ${formatConfidence(confidence)}`);
  
  // Add domain-specific concerns
  if (domains.riskOfBias.rating !== 'no-concern') {
    summary.push(`- Risk of bias: ${domains.riskOfBias.reason}`);
  }
  
  if (domains.inconsistency.rating !== 'no-concern') {
    summary.push(`- Inconsistency: ${domains.inconsistency.reason}`);
  }
  
  if (domains.indirectness.rating !== 'no-concern') {
    summary.push(`- Indirectness: ${domains.indirectness.reason}`);
  }
  
  if (domains.imprecision.rating !== 'no-concern') {
    summary.push(`- Imprecision: ${domains.imprecision.reason}`);
  }
  
  if (domains.publicationBias.rating !== 'no-concern') {
    summary.push(`- Publication bias: ${domains.publicationBias.reason}`);
  }
  
  // Add upgrade factors if any
  const upgrades = [];
  if (domains.upgradeFactors.largeEffect) upgrades.push("large effect size");
  if (domains.upgradeFactors.doseResponse) upgrades.push("dose-response gradient");
  if (domains.upgradeFactors.plausibleConfounding) upgrades.push("plausible confounding");
  
  if (upgrades.length > 0) {
    summary.push(`- Upgraded due to: ${upgrades.join(', ')}`);
  }
  
  return summary.join('\n');
}

function formatConfidence(confidence: GRADEConfidence): string {
  const map: Record<GRADEConfidence, string> = {
    'high': 'High',
    'moderate': 'Moderate',
    'low': 'Low',
    'very-low': 'Very Low'
  };
  return map[confidence];
}

/**
 * Default assessment for meta-analyses of RCTs
 */
export function getDefaultGRADEAssessment(studyType: 'rct' | 'observational'): GRADEAssessment {
  const isRCT = studyType === 'rct';
  
  const assessment: Omit<GRADEAssessment, 'confidence' | 'reasons'> = {
    domains: {
      studyDesign: {
        rating: isRCT ? 'high' : 'low',
        reason: isRCT 
          ? 'Randomized controlled trials start as high quality evidence'
          : 'Observational studies start as low quality evidence',
      },
      riskOfBias: {
        rating: 'no-concern',
        reason: 'No serious risk of bias detected',
      },
      inconsistency: {
        rating: 'no-concern',
        reason: 'No important inconsistency',
      },
      indirectness: {
        rating: 'no-concern',
        reason: 'No important indirectness',
      },
      imprecision: {
        rating: 'no-concern',
        reason: 'Precise estimate',
      },
      publicationBias: {
        rating: 'no-concern',
        reason: 'No evidence of publication bias',
      },
      upgradeFactors: {
        largeEffect: false,
        doseResponse: false,
        plausibleConfounding: false,
      },
    },
  };
  
  const confidence = calculateGRADEConfidence(assessment.domains);
  
  return {
    ...assessment,
    confidence,
    reasons: [
      `${isRCT ? 'RCTs' : 'Observational studies'} start as ${isRCT ? 'high' : 'low'} quality evidence`,
    ],
  };
}

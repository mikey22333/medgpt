/**
 * Adaptive Scoring Engine for CliniSynth
 * Adjusts scoring weights based on query type and medical domain
 */

export interface QueryAnalysis {
  queryType: 'treatment' | 'diagnosis' | 'prognosis' | 'mechanism' | 'epidemiology' | 'general';
  domain: MedicalDomain;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  populationFocus?: 'pediatric' | 'adult' | 'elderly' | 'general';
  evidence?: 'experimental' | 'observational' | 'review' | 'mixed';
}

export interface ScoringWeights {
  semantic: number;
  evidence: number;
  recency: number;
  citations: number;
  diagnostic?: number;
  accuracy?: number;
  mechanistic?: number;
  methodology?: number;
}

export interface UserScoringPreferences {
  prioritizeRecency: boolean;
  evidenceHierarchy: 'strict' | 'relaxed';
  specialtyFocus?: MedicalSpecialty;
  studyPopulation?: PopulationFilter;
  minimumEvidenceLevel?: number;
}

export type MedicalDomain = 
  | 'cardiology' 
  | 'oncology' 
  | 'neurology' 
  | 'psychiatry' 
  | 'infectious_disease'
  | 'endocrinology'
  | 'pediatrics'
  | 'surgery'
  | 'emergency_medicine'
  | 'general_medicine';

export type MedicalSpecialty = MedicalDomain;

export interface PopulationFilter {
  ageGroup?: 'pediatric' | 'adult' | 'elderly';
  gender?: 'male' | 'female' | 'mixed';
  ethnicity?: string[];
  comorbidities?: string[];
}

export class AdaptiveScoringEngine {
  private readonly DEFAULT_WEIGHTS: Record<string, ScoringWeights> = {
    treatment: {
      semantic: 0.3,
      evidence: 0.4,   // Higher weight for treatment questions
      recency: 0.2,    // Recent trials important
      citations: 0.1
    },
    diagnosis: {
      semantic: 0.4,
      evidence: 0.3,
      recency: 0.1,
      citations: 0.1,
      diagnostic: 0.05, // Diagnostic accuracy bonus
      accuracy: 0.05    // Sensitivity/specificity bonus
    },
    mechanism: {
      semantic: 0.35,
      evidence: 0.2,
      recency: 0.3,     // Recent research is crucial for mechanisms
      citations: 0.05,
      mechanistic: 0.05, // Basic science relevance
      methodology: 0.05  // Research quality for mechanism studies
    },
    prognosis: {
      semantic: 0.35,
      evidence: 0.35,
      recency: 0.15,
      citations: 0.15   // Long-term studies valued more
    },
    epidemiology: {
      semantic: 0.3,
      evidence: 0.25,
      recency: 0.15,
      citations: 0.2,   // Large studies with high citations
      methodology: 0.1  // Study design critical
    },
    general: {
      semantic: 0.4,
      evidence: 0.3,
      recency: 0.2,
      citations: 0.1
    }
  };

  private readonly DOMAIN_MODIFIERS: Record<MedicalDomain, Partial<ScoringWeights>> = {
    cardiology: {
      evidence: 0.05,  // Extra emphasis on RCTs
      citations: 0.02  // Established field values citations
    },
    oncology: {
      recency: 0.1,    // Rapidly evolving field
      evidence: 0.05
    },
    neurology: {
      recency: 0.05,
      methodology: 0.05 // Complex neurological assessments
    },
    psychiatry: {
      evidence: -0.05, // Often limited RCT evidence
      methodology: 0.05 // Study design crucial
    },
    infectious_disease: {
      recency: 0.15,   // Rapidly changing (e.g., COVID, resistance)
      evidence: 0.05
    },
    endocrinology: {
      evidence: 0.05,  // Good RCT evidence base
      citations: 0.02
    },
    pediatrics: {
      evidence: -0.1,  // Limited RCT evidence in children
      methodology: 0.05,
      recency: 0.05
    },
    surgery: {
      evidence: -0.1,  // Limited RCT evidence for procedures
      methodology: 0.1, // Technique and outcomes important
      citations: 0.05
    },
    emergency_medicine: {
      recency: 0.1,    // Recent protocols important
      methodology: 0.05 // Quality of emergency studies
    },
    general_medicine: {
      // No modifiers - use base weights
    }
  };

  calculateContextualScore(
    paper: any,
    queryAnalysis: QueryAnalysis,
    userPreferences?: UserScoringPreferences
  ): number {
    // Get base weights for query type
    const baseWeights = this.DEFAULT_WEIGHTS[queryAnalysis.queryType] || this.DEFAULT_WEIGHTS.general;
    
    // Apply domain modifications
    const domainModifiers = this.DOMAIN_MODIFIERS[queryAnalysis.domain] || {};
    const weights = this.mergeWeights(baseWeights, domainModifiers);
    
    // Apply user preferences
    if (userPreferences) {
      this.applyUserPreferences(weights, userPreferences, queryAnalysis);
    }

    // Calculate component scores
    const scores = this.calculateComponentScores(paper, queryAnalysis);
    
    // Compute weighted final score
    let finalScore = 0;
    finalScore += (scores.semantic || 0) * weights.semantic;
    finalScore += (scores.evidence || 0) * weights.evidence;
    finalScore += (scores.recency || 0) * weights.recency;
    finalScore += (scores.citations || 0) * weights.citations;
    
    // Add optional components
    if (weights.diagnostic && scores.diagnostic) {
      finalScore += scores.diagnostic * weights.diagnostic;
    }
    if (weights.accuracy && scores.accuracy) {
      finalScore += scores.accuracy * weights.accuracy;
    }
    if (weights.mechanistic && scores.mechanistic) {
      finalScore += scores.mechanistic * weights.mechanistic;
    }
    if (weights.methodology && scores.methodology) {
      finalScore += scores.methodology * weights.methodology;
    }

    // Apply complexity penalty/bonus
    finalScore = this.applyComplexityAdjustment(finalScore, queryAnalysis.complexity, paper);

    return Math.max(0, Math.min(1, finalScore));
  }

  private mergeWeights(base: ScoringWeights, modifiers: Partial<ScoringWeights>): ScoringWeights {
    const merged = { ...base };
    
    Object.entries(modifiers).forEach(([key, value]) => {
      if (value !== undefined) {
        (merged as any)[key] = Math.max(0, Math.min(1, (merged as any)[key] + value));
      }
    });

    // Normalize weights to ensure they sum to ~1
    const total = Object.values(merged).reduce((sum, weight) => sum + (weight || 0), 0);
    if (total > 0) {
      Object.keys(merged).forEach(key => {
        (merged as any)[key] = (merged as any)[key] / total;
      });
    }

    return merged;
  }

  private applyUserPreferences(
    weights: ScoringWeights, 
    preferences: UserScoringPreferences,
    queryAnalysis: QueryAnalysis
  ): void {
    if (preferences.prioritizeRecency) {
      weights.recency = Math.min(0.4, weights.recency * 1.5);
      weights.citations = Math.max(0.05, weights.citations * 0.8);
    }

    if (preferences.evidenceHierarchy === 'strict') {
      weights.evidence = Math.min(0.5, weights.evidence * 1.3);
    } else if (preferences.evidenceHierarchy === 'relaxed') {
      weights.evidence = Math.max(0.1, weights.evidence * 0.8);
      weights.methodology = (weights.methodology || 0) + 0.1;
    }

    // Specialty focus adjustments
    if (preferences.specialtyFocus && preferences.specialtyFocus !== queryAnalysis.domain) {
      // Cross-specialty penalty
      weights.semantic = Math.max(0.2, weights.semantic * 0.9);
    }
  }

  private calculateComponentScores(paper: any, queryAnalysis: QueryAnalysis): {
    semantic: number;
    evidence: number;
    recency: number;
    citations: number;
    diagnostic?: number;
    accuracy?: number;
    mechanistic?: number;
    methodology?: number;
  } {
    const scores: any = {};

    // Semantic relevance (existing)
    scores.semantic = paper.semanticScore || paper.relevanceScore || 0;

    // Evidence quality
    scores.evidence = this.calculateEvidenceScore(paper);

    // Recency score
    scores.recency = this.calculateRecencyScore(paper);

    // Citation score (logarithmic scaling)
    scores.citations = this.calculateCitationScore(paper);

    // Query-type specific scores
    if (queryAnalysis.queryType === 'diagnosis') {
      scores.diagnostic = this.calculateDiagnosticScore(paper);
      scores.accuracy = this.calculateAccuracyScore(paper);
    }

    if (queryAnalysis.queryType === 'mechanism') {
      scores.mechanistic = this.calculateMechanisticScore(paper);
      scores.methodology = this.calculateMethodologyScore(paper);
    }

    return scores;
  }

  private calculateEvidenceScore(paper: any): number {
    const studyType = (paper.studyType || '').toLowerCase();
    const title = (paper.title || '').toLowerCase();
    const abstract = (paper.abstract || '').toLowerCase();

    // Evidence hierarchy scoring
    if (studyType.includes('meta-analysis') || title.includes('meta-analysis')) return 1.0;
    if (studyType.includes('systematic review') || title.includes('systematic review')) return 0.95;
    if (studyType.includes('randomized controlled') || title.includes('randomized')) return 0.9;
    if (studyType.includes('cohort') || abstract.includes('cohort')) return 0.75;
    if (studyType.includes('case-control') || abstract.includes('case-control')) return 0.7;
    if (studyType.includes('cross-sectional') || abstract.includes('cross-sectional')) return 0.6;
    if (studyType.includes('case series') || title.includes('case series')) return 0.4;
    if (studyType.includes('case report') || title.includes('case report')) return 0.2;

    return 0.5; // Default for unclear study type
  }

  private calculateRecencyScore(paper: any): number {
    const currentYear = new Date().getFullYear();
    const paperYear = typeof paper.year === 'string' ? parseInt(paper.year) : paper.year;
    
    if (!paperYear || paperYear < 1990 || paperYear > currentYear) return 0.3;

    const age = currentYear - paperYear;
    
    // Exponential decay: newer papers score higher
    if (age <= 1) return 1.0;
    if (age <= 2) return 0.9;
    if (age <= 3) return 0.8;
    if (age <= 5) return 0.7;
    if (age <= 10) return 0.5;
    if (age <= 15) return 0.3;
    
    return 0.1; // Very old papers
  }

  private calculateCitationScore(paper: any): number {
    const citations = paper.citationCount || 0;
    
    if (citations === 0) return 0.1;
    if (citations < 5) return 0.3;
    if (citations < 20) return 0.5;
    if (citations < 50) return 0.7;
    if (citations < 100) return 0.8;
    if (citations < 500) return 0.9;
    
    return 1.0; // Highly cited papers
  }

  private calculateDiagnosticScore(paper: any): number {
    const text = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();
    
    const diagnosticTerms = [
      'sensitivity', 'specificity', 'diagnostic accuracy', 'predictive value',
      'roc curve', 'auc', 'diagnostic test', 'screening', 'biomarker'
    ];
    
    const matches = diagnosticTerms.filter(term => text.includes(term)).length;
    return Math.min(1.0, matches * 0.2);
  }

  private calculateAccuracyScore(paper: any): number {
    const text = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();
    
    // Look for statistical measures of diagnostic accuracy
    const accuracyIndicators = [
      /sensitivity.*\d+[%.]/, /specificity.*\d+[%.]/, 
      /ppv.*\d+[%.]/, /npv.*\d+[%.]/, 
      /auc.*0\.\d+/, /accuracy.*\d+[%.]/
    ];
    
    const matches = accuracyIndicators.filter(pattern => pattern.test(text)).length;
    return Math.min(1.0, matches * 0.3);
  }

  private calculateMechanisticScore(paper: any): number {
    const text = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();
    
    const mechanisticTerms = [
      'mechanism', 'pathway', 'molecular', 'cellular', 'biochemical',
      'signaling', 'receptor', 'enzyme', 'protein', 'gene expression'
    ];
    
    const matches = mechanisticTerms.filter(term => text.includes(term)).length;
    return Math.min(1.0, matches * 0.15);
  }

  private calculateMethodologyScore(paper: any): number {
    const text = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();
    
    const methodologyIndicators = [
      'methods', 'methodology', 'statistical analysis', 'sample size',
      'randomization', 'blinding', 'control group', 'p-value', 'confidence interval'
    ];
    
    const matches = methodologyIndicators.filter(term => text.includes(term)).length;
    return Math.min(1.0, matches * 0.12);
  }

  private applyComplexityAdjustment(
    score: number, 
    complexity: string, 
    paper: any
  ): number {
    // Complex queries may benefit from more specialized papers
    if (complexity === 'expert') {
      const journal = (paper.journal || '').toLowerCase();
      const highImpactJournals = [
        'nature', 'science', 'cell', 'lancet', 'nejm', 'jama'
      ];
      
      if (highImpactJournals.some(j => journal.includes(j))) {
        score *= 1.1; // 10% bonus for high-impact journals on complex queries
      }
    }

    return score;
  }

  getOptimalWeights(queryType: string, domain: MedicalDomain): ScoringWeights {
    const baseWeights = this.DEFAULT_WEIGHTS[queryType] || this.DEFAULT_WEIGHTS.general;
    const domainModifiers = this.DOMAIN_MODIFIERS[domain] || {};
    return this.mergeWeights(baseWeights, domainModifiers);
  }

  explainScoring(
    paper: any,
    queryAnalysis: QueryAnalysis,
    finalScore: number
  ): string {
    const weights = this.getOptimalWeights(queryAnalysis.queryType, queryAnalysis.domain);
    const scores = this.calculateComponentScores(paper, queryAnalysis);
    
    const components = [
      `Semantic: ${(scores.semantic * 100).toFixed(0)}% (weight: ${(weights.semantic * 100).toFixed(0)}%)`,
      `Evidence: ${(scores.evidence * 100).toFixed(0)}% (weight: ${(weights.evidence * 100).toFixed(0)}%)`,
      `Recency: ${(scores.recency * 100).toFixed(0)}% (weight: ${(weights.recency * 100).toFixed(0)}%)`,
      `Citations: ${(scores.citations * 100).toFixed(0)}% (weight: ${(weights.citations * 100).toFixed(0)}%)`
    ];

    return `Final Score: ${(finalScore * 100).toFixed(0)}% | ${components.join(' | ')}`;
  }
}

export default AdaptiveScoringEngine;

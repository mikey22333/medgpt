import { type Citation } from "@/lib/types/chat";
import { DeepThinkingEngine, type ReasoningStep, type ClinicalReasoningChain } from "./deep-thinking";

// Multi-Agent System Interfaces
export interface Agent {
  id: string;
  name: string;
  role: string;
  specialization: string[];
  confidence: number;
}

export interface AgentInsight {
  agentId: string;
  agentName: string;
  insight: string;
  confidence: number;
  evidence: string[];
  biasWarnings: string[];
  methodologyNotes: string[];
  recommendations: string[];
}

export interface BiasDetection {
  biasType: 'selection' | 'publication' | 'confirmation' | 'availability' | 'anchoring' | 'recency' | 'geographic' | 'language';
  severity: 'low' | 'moderate' | 'high';
  description: string;
  evidence: string[];
  mitigation: string[];
  impact: string;
}

export interface ConfidenceCalibration {
  overallConfidence: number;
  factorBreakdown: {
    evidenceQuality: number;
    consistencyScore: number;
    recentnessScore: number;
    expertiseAlignment: number;
    biasAdjustment: number;
  };
  uncertaintyFactors: string[];
  calibrationNotes: string[];
}

export interface MultiAgentResult {
  agentInsights: AgentInsight[];
  consensusView: string;
  conflictingViews: string[];
  biasDetection: BiasDetection[];
  confidenceCalibration: ConfidenceCalibration;
  synthesizedRecommendation: string;
  nextSteps: string[];
  interactiveElements: InteractiveElement[];
}

export interface InteractiveElement {
  type: 'question' | 'clarification' | 'alternative_view' | 'bias_alert' | 'confidence_drill_down';
  content: string;
  options?: string[];
  followUpQueries?: string[];
}

// Specialized Agents
export class ResearchAnalystAgent implements Agent {
  id = "research_analyst";
  name = "Research Analyst";
  role = "Evidence Synthesis Specialist";
  specialization = ["systematic_reviews", "meta_analysis", "evidence_hierarchy", "study_quality"];
  confidence = 0;

  analyze(query: string, evidence: Citation[]): AgentInsight {
    // Advanced research analysis
    const qualityAssessment = this.assessEvidenceQuality(evidence);
    const synthesisInsights = this.performEvidenceSynthesis(evidence);
    const methodologyNotes = this.evaluateMethodology(evidence);
    
    this.confidence = this.calculateResearchConfidence(evidence);

    return {
      agentId: this.id,
      agentName: this.name,
      insight: `Research synthesis of ${evidence.length} sources reveals ${synthesisInsights}. ${qualityAssessment}`,
      confidence: this.confidence,
      evidence: evidence.map(e => e.title).slice(0, 5),
      biasWarnings: this.detectResearchBias(evidence),
      methodologyNotes,
      recommendations: this.generateResearchRecommendations(evidence)
    };
  }

  private assessEvidenceQuality(evidence: Citation[]): string {
    const qualityLevels = evidence.map(paper => {
      const title = paper.title.toLowerCase();
      if (title.includes('systematic review') || title.includes('meta-analysis')) {
        return 'high';
      } else if (title.includes('randomized') || title.includes('controlled trial')) {
        return 'moderate';
      } else {
        return 'low';
      }
    });

    const highQuality = qualityLevels.filter(q => q === 'high').length;
    const moderateQuality = qualityLevels.filter(q => q === 'moderate').length;
    
    return `Evidence base includes ${highQuality} high-quality systematic reviews/meta-analyses and ${moderateQuality} RCTs.`;
  }

  private performEvidenceSynthesis(evidence: Citation[]): string {
    const recentStudies = evidence.filter(e => e.year >= 2022).length;
    const totalStudies = evidence.length;
    
    if (recentStudies / totalStudies > 0.7) {
      return "strong convergence with predominantly recent evidence";
    } else if (recentStudies / totalStudies > 0.4) {
      return "moderate convergence with mixed temporal evidence";
    } else {
      return "limited recent evidence requiring cautious interpretation";
    }
  }

  private evaluateMethodology(evidence: Citation[]): string[] {
    const notes = [];
    
    const hasSystematicReview = evidence.some(e => 
      e.title.toLowerCase().includes('systematic review') || 
      e.title.toLowerCase().includes('meta-analysis')
    );
    
    if (hasSystematicReview) {
      notes.push("High-quality systematic evidence available for robust conclusions");
    }
    
    const hasRCT = evidence.some(e => 
      e.title.toLowerCase().includes('randomized') || 
      e.title.toLowerCase().includes('controlled trial')
    );
    
    if (hasRCT) {
      notes.push("Randomized controlled trial data supports causal inferences");
    }
    
    if (evidence.length < 3) {
      notes.push("Limited evidence base - conclusions should be considered preliminary");
    }
    
    return notes;
  }

  private detectResearchBias(evidence: Citation[]): string[] {
    const biases = [];
    
    // Publication bias detection
    if (evidence.length > 0 && evidence.every(e => e.year >= 2020)) {
      biases.push("Potential recency bias - older foundational studies may be underrepresented");
    }
    
    // Geographic bias
    const journals = evidence.map(e => e.journal).filter(Boolean);
    const westernJournals = journals.filter(j => 
      j.includes('American') || j.includes('European') || j.includes('British')
    ).length;
    
    if (westernJournals / journals.length > 0.8) {
      biases.push("Geographic bias potential - limited representation from global research");
    }
    
    return biases;
  }

  private calculateResearchConfidence(evidence: Citation[]): number {
    let confidence = 60; // Base confidence
    
    // Quality boost
    const highQuality = evidence.filter(e => 
      e.title.toLowerCase().includes('systematic review') || 
      e.title.toLowerCase().includes('meta-analysis')
    ).length;
    confidence += highQuality * 10;
    
    // Recency boost
    const recent = evidence.filter(e => e.year >= 2022).length;
    confidence += (recent / evidence.length) * 15;
    
    // Sample size consideration
    if (evidence.length >= 5) confidence += 10;
    if (evidence.length >= 10) confidence += 5;
    
    return Math.min(95, confidence);
  }

  private generateResearchRecommendations(evidence: Citation[]): string[] {
    const recommendations = [];
    
    if (evidence.length < 5) {
      recommendations.push("Seek additional research to strengthen evidence base");
    }
    
    const hasSystematic = evidence.some(e => 
      e.title.toLowerCase().includes('systematic review')
    );
    
    if (!hasSystematic) {
      recommendations.push("Look for systematic reviews or meta-analyses for higher-level evidence");
    }
    
    recommendations.push("Cross-reference findings with clinical guidelines from major organizations");
    
    return recommendations;
  }
}

export class ClinicalReasoningAgent implements Agent {
  id = "clinical_reasoning";
  name = "Clinical Reasoning Specialist";
  role = "Diagnostic & Treatment Expert";
  specialization = ["differential_diagnosis", "clinical_decision_making", "risk_assessment", "treatment_protocols"];
  confidence = 0;

  analyze(query: string, evidence: Citation[]): AgentInsight {
    const clinicalPatterns = this.identifyClinicalPatterns(query);
    const riskAssessment = this.performRiskAssessment(query, evidence);
    const diagnosticInsights = this.generateDiagnosticInsights(query);
    
    this.confidence = this.calculateClinicalConfidence(query, evidence);

    return {
      agentId: this.id,
      agentName: this.name,
      insight: `Clinical analysis reveals ${clinicalPatterns}. ${riskAssessment}`,
      confidence: this.confidence,
      evidence: this.extractClinicalEvidence(evidence),
      biasWarnings: this.detectClinicalBias(query),
      methodologyNotes: this.provideClinicalMethodology(),
      recommendations: this.generateClinicalRecommendations(query, evidence)
    };
  }

  private identifyClinicalPatterns(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('pain') || queryLower.includes('ache')) {
      return "pain presentation requiring systematic evaluation";
    } else if (queryLower.includes('symptom')) {
      return "symptomatic presentation requiring differential diagnosis";
    } else if (queryLower.includes('treatment') || queryLower.includes('therapy')) {
      return "therapeutic intervention query requiring evidence-based approach";
    } else if (queryLower.includes('diagnosis')) {
      return "diagnostic consideration requiring systematic clinical reasoning";
    } else {
      return "clinical question requiring comprehensive medical analysis";
    }
  }

  private performRiskAssessment(query: string, evidence: Citation[]): string {
    const urgentKeywords = ['emergency', 'urgent', 'severe', 'acute', 'chest pain', 'shortness of breath'];
    const hasUrgentElements = urgentKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    if (hasUrgentElements) {
      return "Potential urgent/emergent features identified - immediate medical evaluation may be indicated";
    } else {
      return "Standard risk profile - routine clinical evaluation appropriate";
    }
  }

  private generateDiagnosticInsights(query: string): string {
    // Simplified diagnostic pattern recognition
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('chest pain')) {
      return "Requires evaluation for cardiac, pulmonary, and musculoskeletal etiologies";
    } else if (queryLower.includes('headache')) {
      return "Consider primary vs secondary headache disorders with appropriate red flag screening";
    } else {
      return "Systematic approach to differential diagnosis recommended";
    }
  }

  private extractClinicalEvidence(evidence: Citation[]): string[] {
    return evidence
      .filter(e => 
        e.title.toLowerCase().includes('clinical') || 
        e.title.toLowerCase().includes('treatment') ||
        e.title.toLowerCase().includes('diagnosis')
      )
      .map(e => e.title)
      .slice(0, 3);
  }

  private detectClinicalBias(query: string): string[] {
    const biases = [];
    
    // Anchoring bias warning
    biases.push("Avoid anchoring on initial impression - consider full differential");
    
    // Availability bias
    if (query.toLowerCase().includes('rare') || query.toLowerCase().includes('unusual')) {
      biases.push("Availability bias risk - common conditions should be considered first");
    }
    
    return biases;
  }

  private provideClinicalMethodology(): string[] {
    return [
      "Systematic history and physical examination approach",
      "Evidence-based clinical decision rules where applicable",
      "Risk-benefit analysis for diagnostic and therapeutic interventions",
      "Patient safety and quality metrics consideration"
    ];
  }

  private calculateClinicalConfidence(query: string, evidence: Citation[]): number {
    let confidence = 70; // Base clinical confidence
    
    // Evidence boost
    const clinicalEvidence = evidence.filter(e => 
      e.title.toLowerCase().includes('clinical') || 
      e.title.toLowerCase().includes('guideline')
    ).length;
    confidence += clinicalEvidence * 5;
    
    // Complexity adjustment
    const complexityKeywords = ['multiple', 'complex', 'rare', 'atypical'];
    const isComplex = complexityKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    if (isComplex) confidence -= 15;
    
    return Math.min(90, Math.max(50, confidence));
  }

  private generateClinicalRecommendations(query: string, evidence: Citation[]): string[] {
    const recommendations = [];
    
    recommendations.push("Conduct systematic clinical assessment");
    recommendations.push("Consider evidence-based clinical guidelines");
    
    if (query.toLowerCase().includes('treatment')) {
      recommendations.push("Evaluate treatment risks and benefits for individual patient");
    }
    
    if (query.toLowerCase().includes('diagnosis')) {
      recommendations.push("Apply appropriate diagnostic criteria and clinical decision rules");
    }
    
    return recommendations;
  }
}

export class BiasDetectionAgent implements Agent {
  id = "bias_detection";
  name = "Bias Detection Specialist";
  role = "Cognitive Bias & Systematic Error Analyst";
  specialization = ["cognitive_bias", "systematic_error", "research_bias", "clinical_bias"];
  confidence = 85; // High confidence in bias detection capabilities

  analyze(query: string, evidence: Citation[]): AgentInsight {
    const biases = this.detectAllBiases(query, evidence);
    const systematicErrors = this.identifySystematicErrors(evidence);
    const mitigationStrategies = this.suggestMitigationStrategies(biases);
    
    return {
      agentId: this.id,
      agentName: this.name,
      insight: `Identified ${biases.length} potential bias sources requiring attention. ${systematicErrors}`,
      confidence: this.confidence,
      evidence: this.getBiasEvidence(biases),
      biasWarnings: biases.map(b => `${b.biasType}: ${b.description}`),
      methodologyNotes: mitigationStrategies,
      recommendations: this.generateBiasRecommendations(biases)
    };
  }

  detectAllBiases(query: string, evidence: Citation[]): BiasDetection[] {
    const biases: BiasDetection[] = [];
    
    // Publication bias
    if (evidence.length > 0) {
      const positiveStudies = evidence.filter(e => 
        e.title.toLowerCase().includes('effective') || 
        e.title.toLowerCase().includes('significant') ||
        e.title.toLowerCase().includes('improvement')
      ).length;
      
      if (positiveStudies / evidence.length > 0.8) {
        biases.push({
          biasType: 'publication',
          severity: 'moderate',
          description: 'High proportion of positive results suggests possible publication bias',
          evidence: ['Predominantly positive study outcomes'],
          mitigation: ['Search for unpublished studies', 'Check trial registries for negative results'],
          impact: 'May overestimate treatment effects'
        });
      }
    }
    
    // Selection bias
    const recentOnly = evidence.every(e => e.year >= 2020);
    if (recentOnly && evidence.length > 3) {
      biases.push({
        biasType: 'selection',
        severity: 'low',
        description: 'Evidence selection may favor recent studies',
        evidence: ['All studies from 2020 or later'],
        mitigation: ['Include foundational older studies', 'Expand temporal search range'],
        impact: 'May miss established long-term evidence'
      });
    }
    
    // Geographic bias
    const journals = evidence.map(e => e.journal).filter(Boolean);
    const westernJournals = journals.filter(j => 
      j.toLowerCase().includes('american') || 
      j.toLowerCase().includes('european') || 
      j.toLowerCase().includes('british')
    ).length;
    
    if (journals.length > 0 && westernJournals / journals.length > 0.75) {
      biases.push({
        biasType: 'geographic',
        severity: 'moderate',
        description: 'Research predominantly from Western countries',
        evidence: [`${westernJournals}/${journals.length} studies from Western journals`],
        mitigation: ['Include international perspectives', 'Search non-Western databases'],
        impact: 'May not generalize to global populations'
      });
    }
    
    // Confirmation bias (query-driven)
    const queryTerms = query.toLowerCase().split(' ');
    const confirmingStudies = evidence.filter(e => 
      queryTerms.some(term => e.title.toLowerCase().includes(term))
    ).length;
    
    if (confirmingStudies / evidence.length > 0.9) {
      biases.push({
        biasType: 'confirmation',
        severity: 'high',
        description: 'Evidence strongly matches query terms, possible confirmation bias',
        evidence: ['Most studies directly confirm query assumptions'],
        mitigation: ['Actively seek contradictory evidence', 'Broaden search terms'],
        impact: 'May miss alternative perspectives or conflicting evidence'
      });
    }
    
    return biases;
  }

  private identifySystematicErrors(evidence: Citation[]): string {
    const errors = [];
    
    if (evidence.length < 3) {
      errors.push("Insufficient sample size for robust conclusions");
    }
    
    const duplicateAuthors = this.findDuplicateAuthors(evidence);
    if (duplicateAuthors.length > 0) {
      errors.push("Potential author overlap may reduce independence");
    }
    
    return errors.length > 0 ? 
      `Systematic concerns: ${errors.join(', ')}` : 
      "No major systematic errors detected";
  }

  private findDuplicateAuthors(evidence: Citation[]): string[] {
    const allAuthors = evidence.flatMap(e => e.authors);
    const authorCounts = allAuthors.reduce((acc, author) => {
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(authorCounts).filter(author => authorCounts[author] > 1);
  }

  private suggestMitigationStrategies(biases: BiasDetection[]): string[] {
    const strategies = new Set<string>();
    
    biases.forEach(bias => {
      bias.mitigation.forEach(strategy => strategies.add(strategy));
    });
    
    // Add general strategies
    strategies.add("Use structured search protocols");
    strategies.add("Apply pre-specified inclusion/exclusion criteria");
    strategies.add("Seek peer review and external validation");
    
    return Array.from(strategies);
  }

  private getBiasEvidence(biases: BiasDetection[]): string[] {
    return biases.flatMap(b => b.evidence).slice(0, 5);
  }

  private generateBiasRecommendations(biases: BiasDetection[]): string[] {
    const recommendations = [];
    
    if (biases.some(b => b.severity === 'high')) {
      recommendations.push("High-severity biases detected - exercise significant caution in interpretation");
    }
    
    recommendations.push("Apply systematic bias mitigation strategies");
    recommendations.push("Seek diverse perspectives and alternative viewpoints");
    recommendations.push("Consider commissioning additional unbiased research if critical decisions depend on this evidence");
    
    return recommendations;
  }
}

// Main Multi-Agent Orchestrator
export class MultiAgentReasoningSystem {
  private agents: Agent[];
  
  constructor() {
    this.agents = [
      new ResearchAnalystAgent(),
      new ClinicalReasoningAgent(),
      new BiasDetectionAgent()
    ];
  }

  async processQuery(
    query: string, 
    evidence: Citation[], 
    mode: 'research' | 'doctor' | 'source-finder'
  ): Promise<MultiAgentResult> {
    // Run all agents in parallel
    const agentInsights = await Promise.all(
      this.agents.map(agent => {
        if (mode === 'research' && agent.id === 'research_analyst') {
          return (agent as ResearchAnalystAgent).analyze(query, evidence);
        } else if (mode === 'doctor' && agent.id === 'clinical_reasoning') {
          return (agent as ClinicalReasoningAgent).analyze(query, evidence);
        } else if (agent.id === 'bias_detection') {
          return (agent as BiasDetectionAgent).analyze(query, evidence);
        } else {
          // Return a basic insight for non-primary agents
          return {
            agentId: agent.id,
            agentName: agent.name,
            insight: "Agent not primary for this mode",
            confidence: 60,
            evidence: [],
            biasWarnings: [],
            methodologyNotes: [],
            recommendations: []
          };
        }
      })
    );

    // Filter out non-primary agent insights
    const relevantInsights = agentInsights.filter(insight => 
      insight.insight !== "Agent not primary for this mode"
    );

    // Generate consensus and conflicts
    const consensusView = this.generateConsensus(relevantInsights);
    const conflictingViews = this.identifyConflicts(relevantInsights);
    
    // Aggregate bias detection
    const biasDetection = this.aggregateBiasDetection(relevantInsights);
    
    // Calculate overall confidence
    const confidenceCalibration = this.calibrateConfidence(relevantInsights, evidence);
    
    // Generate synthesis
    const synthesizedRecommendation = this.synthesizeRecommendations(relevantInsights);
    
    // Generate next steps
    const nextSteps = this.generateNextSteps(relevantInsights, mode);
    
    // Generate interactive elements
    const interactiveElements = this.generateInteractiveElements(relevantInsights, query);

    return {
      agentInsights: relevantInsights,
      consensusView,
      conflictingViews,
      biasDetection,
      confidenceCalibration,
      synthesizedRecommendation,
      nextSteps,
      interactiveElements
    };
  }

  private generateConsensus(insights: AgentInsight[]): string {
    const commonThemes = this.extractCommonThemes(insights);
    const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
    
    return `Multi-agent consensus (${avgConfidence.toFixed(0)}% confidence): ${commonThemes}`;
  }

  private extractCommonThemes(insights: AgentInsight[]): string {
    // Simplified theme extraction
    const allWords = insights.flatMap(i => i.insight.toLowerCase().split(' '));
    const wordCounts = allWords.reduce((acc, word) => {
      if (word.length > 4) { // Filter out short words
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const commonWords = Object.keys(wordCounts)
      .filter(word => wordCounts[word] > 1)
      .slice(0, 3);
    
    return commonWords.length > 0 ? 
      `Common focus on ${commonWords.join(', ')}` : 
      "Diverse analytical perspectives converge on evidence-based approach";
  }

  private identifyConflicts(insights: AgentInsight[]): string[] {
    const conflicts = [];
    
    // Compare confidence levels
    const confidences = insights.map(i => i.confidence);
    const maxConf = Math.max(...confidences);
    const minConf = Math.min(...confidences);
    
    if (maxConf - minConf > 30) {
      conflicts.push(`Significant confidence variation: ${minConf}% to ${maxConf}%`);
    }
    
    // Check for conflicting recommendations
    const allRecommendations = insights.flatMap(i => i.recommendations);
    if (allRecommendations.some(r => r.includes('caution')) && 
        allRecommendations.some(r => r.includes('recommend'))) {
      conflicts.push("Mixed recommendations regarding action vs caution");
    }
    
    return conflicts;
  }

  private aggregateBiasDetection(insights: AgentInsight[]): BiasDetection[] {
    // Extract bias warnings and convert to BiasDetection format
    const allBiasWarnings = insights.flatMap(i => i.biasWarnings);
    
    return allBiasWarnings.map(warning => ({
      biasType: 'confirmation' as const,
      severity: 'moderate' as const,
      description: warning,
      evidence: ['Multi-agent analysis'],
      mitigation: ['Cross-agent validation', 'Systematic review'],
      impact: 'May affect conclusion reliability'
    }));
  }

  private calibrateConfidence(insights: AgentInsight[], evidence: Citation[]): ConfidenceCalibration {
    const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
    
    // Factor breakdown
    const evidenceQuality = this.assessEvidenceQuality(evidence);
    const consistencyScore = this.calculateConsistencyScore(insights);
    const recentnessScore = this.calculateRecentnessScore(evidence);
    const expertiseAlignment = this.calculateExpertiseAlignment(insights);
    const biasAdjustment = this.calculateBiasAdjustment(insights);
    
    const calibratedConfidence = Math.round(
      (evidenceQuality * 0.3 + 
       consistencyScore * 0.25 + 
       recentnessScore * 0.15 + 
       expertiseAlignment * 0.15 + 
       biasAdjustment * 0.15)
    );

    return {
      overallConfidence: Math.min(95, calibratedConfidence),
      factorBreakdown: {
        evidenceQuality,
        consistencyScore,
        recentnessScore,
        expertiseAlignment,
        biasAdjustment
      },
      uncertaintyFactors: this.identifyUncertaintyFactors(insights, evidence),
      calibrationNotes: this.generateCalibrationNotes(insights)
    };
  }

  private assessEvidenceQuality(evidence: Citation[]): number {
    if (evidence.length === 0) return 40;
    
    const qualityScores = evidence.map(e => {
      const title = e.title.toLowerCase();
      if (title.includes('systematic review') || title.includes('meta-analysis')) {
        return 90;
      } else if (title.includes('randomized') || title.includes('controlled trial')) {
        return 80;
      } else if (title.includes('cohort') || title.includes('longitudinal')) {
        return 70;
      } else {
        return 60;
      }
    });
    
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  private calculateConsistencyScore(insights: AgentInsight[]): number {
    const confidences = insights.map(i => i.confidence);
    const variance = this.calculateVariance(confidences);
    
    // Lower variance = higher consistency
    return Math.max(50, 100 - variance);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private calculateRecentnessScore(evidence: Citation[]): number {
    if (evidence.length === 0) return 50;
    
    const currentYear = new Date().getFullYear();
    const avgAge = evidence.reduce((sum, e) => sum + (currentYear - e.year), 0) / evidence.length;
    
    // Convert age to score (newer = higher score)
    return Math.max(30, 100 - (avgAge * 10));
  }

  private calculateExpertiseAlignment(insights: AgentInsight[]): number {
    // Higher when multiple specialized agents agree
    return insights.length > 1 ? 85 : 70;
  }

  private calculateBiasAdjustment(insights: AgentInsight[]): number {
    const totalBiasWarnings = insights.reduce((sum, i) => sum + i.biasWarnings.length, 0);
    
    // More bias warnings = lower confidence
    return Math.max(40, 90 - (totalBiasWarnings * 10));
  }

  private identifyUncertaintyFactors(insights: AgentInsight[], evidence: Citation[]): string[] {
    const factors = [];
    
    if (evidence.length < 5) {
      factors.push("Limited evidence base");
    }
    
    const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
    if (avgConfidence < 70) {
      factors.push("Below-threshold agent confidence");
    }
    
    const biasCount = insights.reduce((sum, i) => sum + i.biasWarnings.length, 0);
    if (biasCount > 3) {
      factors.push("Multiple bias concerns identified");
    }
    
    return factors;
  }

  private generateCalibrationNotes(insights: AgentInsight[]): string[] {
    return [
      "Confidence calibrated across multiple specialized agents",
      "Bias adjustments applied based on systematic analysis",
      "Evidence quality weighted by study methodology"
    ];
  }

  private synthesizeRecommendations(insights: AgentInsight[]): string {
    const allRecommendations = insights.flatMap(i => i.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    return `Multi-agent synthesis recommends: ${uniqueRecommendations.slice(0, 3).join('; ')}`;
  }

  private generateNextSteps(insights: AgentInsight[], mode: string): string[] {
    const steps = [];
    
    if (mode === 'research') {
      steps.push("Conduct systematic literature review if evidence gaps identified");
      steps.push("Cross-reference with clinical practice guidelines");
    } else if (mode === 'doctor') {
      steps.push("Apply clinical decision-making frameworks");
      steps.push("Consider patient-specific factors and preferences");
    }
    
    steps.push("Monitor for emerging evidence and updates");
    steps.push("Validate conclusions through peer consultation if high-stakes decision");
    
    return steps;
  }

  private generateInteractiveElements(insights: AgentInsight[], query: string): InteractiveElement[] {
    const elements: InteractiveElement[] = [];
    
    // Bias alert if significant biases detected
    const totalBiasWarnings = insights.reduce((sum, i) => sum + i.biasWarnings.length, 0);
    if (totalBiasWarnings > 2) {
      elements.push({
        type: 'bias_alert',
        content: `${totalBiasWarnings} potential biases detected. Would you like to explore mitigation strategies?`,
        options: ['Show bias details', 'Skip bias review'],
        followUpQueries: ['What are the main biases?', 'How can I mitigate these biases?']
      });
    }
    
    // Confidence drill-down
    const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
    if (avgConfidence < 75) {
      elements.push({
        type: 'confidence_drill_down',
        content: `Confidence is ${avgConfidence.toFixed(0)}%. Would you like to understand what's limiting certainty?`,
        options: ['Explain uncertainty factors', 'Show confidence breakdown'],
        followUpQueries: ['What evidence would increase confidence?', 'Are there alternative approaches?']
      });
    }
    
    // Alternative view suggestion
    elements.push({
      type: 'alternative_view',
      content: 'Would you like to explore alternative perspectives or contradictory evidence?',
      options: ['Show alternative views', 'Find contradictory studies'],
      followUpQueries: ['What are the counterarguments?', 'Are there dissenting expert opinions?']
    });
    
    return elements;
  }
}

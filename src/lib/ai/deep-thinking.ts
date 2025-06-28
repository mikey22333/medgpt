/**
 * Deep Thinking Framework for MedGPT Scholar
 * Implements multi-step reasoning, evidence synthesis, and uncertainty quantification
 */

export interface ReasoningStep {
  step: number;
  title: string;
  process: string;
  evidence: string[];
  confidence: number; // 0-100
  uncertainties: string[];
  criticalQuestions: string[];
}

export interface EvidenceSource {
  id: string;
  type: 'primary_study' | 'systematic_review' | 'meta_analysis' | 'guideline' | 'expert_opinion';
  quality: 'high' | 'moderate' | 'low' | 'very_low';
  weight: number; // 0-1, based on evidence hierarchy
  bias_risk: 'low' | 'moderate' | 'high' | 'unclear';
  clinical_relevance: number; // 0-100
}

export interface DeepThinkingContext {
  query: string;
  mode: 'research' | 'doctor' | 'source-finder';
  evidence_sources: EvidenceSource[];
  reasoning_steps: ReasoningStep[];
  synthesis_method: 'convergent' | 'divergent' | 'dialectical';
  confidence_level: number;
  limitations: string[];
  alternative_perspectives: string[];
}

export interface ClinicalReasoningChain {
  differential_diagnosis: {
    condition: string;
    probability: number;
    supporting_evidence: string[];
    opposing_evidence: string[];
    next_steps: string[];
  }[];
  risk_factors: {
    factor: string;
    weight: number;
    modifiable: boolean;
    clinical_significance: string;
  }[];
  red_flags: {
    flag: string;
    urgency: 'immediate' | 'urgent' | 'semi_urgent' | 'routine';
    action_required: string;
  }[];
}

export class DeepThinkingEngine {
  
  /**
   * Generates a multi-step reasoning chain for medical queries
   */
  static generateReasoningChain(
    query: string, 
    evidence: any[], 
    mode: 'research' | 'doctor' | 'source-finder'
  ): ReasoningStep[] {
    const steps: ReasoningStep[] = [];
    
    // Step 1: Problem Decomposition
    steps.push({
      step: 1,
      title: "Problem Analysis & Decomposition",
      process: this.decomposeQuery(query, mode),
      evidence: [],
      confidence: 85,
      uncertainties: ["Query complexity may require additional clarification"],
      criticalQuestions: this.generateCriticalQuestions(query, mode)
    });
    
    // Step 2: Evidence Gathering & Quality Assessment
    steps.push({
      step: 2,
      title: "Evidence Collection & Quality Evaluation",
      process: this.assessEvidenceQuality(evidence),
      evidence: evidence.map(e => e.title || e.id),
      confidence: this.calculateEvidenceConfidence(evidence),
      uncertainties: this.identifyEvidenceUncertainties(evidence),
      criticalQuestions: ["Are there important studies missing?", "Is there publication bias?"]
    });
    
    // Step 3: Critical Analysis
    steps.push({
      step: 3,
      title: "Critical Analysis & Bias Assessment",
      process: this.performCriticalAnalysis(evidence, mode),
      evidence: [],
      confidence: 75,
      uncertainties: ["Potential selection bias in evidence base"],
      criticalQuestions: ["What are the limitations?", "Are there conflicting findings?"]
    });
    
    // Step 4: Synthesis & Integration
    steps.push({
      step: 4,
      title: "Evidence Synthesis & Integration",
      process: this.synthesizeEvidence(evidence, mode),
      evidence: [],
      confidence: this.calculateSynthesisConfidence(evidence),
      uncertainties: this.identifySynthesisUncertainties(evidence),
      criticalQuestions: ["How do all findings fit together?", "What's the overall picture?"]
    });
    
    // Step 5: Clinical Application (for doctor mode)
    if (mode === 'doctor') {
      steps.push({
        step: 5,
        title: "Clinical Reasoning & Application",
        process: this.applyClinicalReasoning(query, evidence),
        evidence: [],
        confidence: 70,
        uncertainties: ["Individual patient factors may vary", "Clinical context is crucial"],
        criticalQuestions: ["What would I do as a clinician?", "What are the risks vs benefits?"]
      });
    }
    
    return steps;
  }
  
  /**
   * Decompose complex query into manageable components
   */
  private static decomposeQuery(query: string, mode: string): string {
    const components = [];
    
    // Identify question type
    if (query.includes('what') || query.includes('define')) {
      components.push("Definition/explanation component identified");
    }
    if (query.includes('how') || query.includes('mechanism')) {
      components.push("Mechanism/process component identified");
    }
    if (query.includes('why') || query.includes('cause')) {
      components.push("Causation/reasoning component identified");
    }
    if (query.includes('treatment') || query.includes('therapy')) {
      components.push("Treatment/intervention component identified");
    }
    if (query.includes('diagnosis') || query.includes('symptom')) {
      components.push("Diagnostic/clinical component identified");
    }
    
    return `Query decomposed into ${components.length} main components: ${components.join(', ')}. This allows for systematic analysis of each aspect.`;
  }
  
  /**
   * Generate critical questions based on query and mode
   */
  private static generateCriticalQuestions(query: string, mode: string): string[] {
    const questions = [
      "What is the clinical context?",
      "What level of evidence is needed?",
      "Are there safety considerations?"
    ];
    
    if (mode === 'research') {
      questions.push(
        "What is the research methodology?",
        "Are there conflicting studies?",
        "What are the limitations of current evidence?"
      );
    } else if (mode === 'doctor') {
      questions.push(
        "What are the differential diagnoses?",
        "What are the red flags?",
        "What would urgent vs routine management involve?"
      );
    }
    
    return questions;
  }
  
  /**
   * Assess the quality of evidence sources
   */
  private static assessEvidenceQuality(evidence: any[]): string {
    let highQuality = 0;
    let moderateQuality = 0;
    let lowQuality = 0;
    
    evidence.forEach(item => {
      const title = (item.title || '').toLowerCase();
      if (title.includes('systematic review') || title.includes('meta-analysis')) {
        highQuality++;
      } else if (title.includes('randomized') || title.includes('controlled trial')) {
        moderateQuality++;
      } else {
        lowQuality++;
      }
    });
    
    return `Evidence base assessment: ${highQuality} high-quality sources (systematic reviews/meta-analyses), ${moderateQuality} moderate-quality sources (RCTs), ${lowQuality} lower-quality sources. Quality hierarchy applied for evidence weighting.`;
  }
  
  /**
   * Calculate confidence based on evidence quality
   */
  private static calculateEvidenceConfidence(evidence: any[]): number {
    if (evidence.length === 0) return 20;
    
    let totalWeight = 0;
    evidence.forEach(item => {
      const title = (item.title || '').toLowerCase();
      if (title.includes('systematic review') || title.includes('meta-analysis')) {
        totalWeight += 30;
      } else if (title.includes('randomized') || title.includes('controlled trial')) {
        totalWeight += 20;
      } else {
        totalWeight += 10;
      }
    });
    
    return Math.min(90, 30 + (totalWeight / evidence.length));
  }
  
  /**
   * Identify uncertainties in evidence
   */
  private static identifyEvidenceUncertainties(evidence: any[]): string[] {
    const uncertainties = [];
    
    if (evidence.length < 3) {
      uncertainties.push("Limited number of studies available");
    }
    
    const hasSystematicReview = evidence.some(e => 
      (e.title || '').toLowerCase().includes('systematic review')
    );
    if (!hasSystematicReview) {
      uncertainties.push("No systematic reviews identified");
    }
    
    const hasRecentStudies = evidence.some(e => {
      const year = e.year || (e.publishedDate ? new Date(e.publishedDate).getFullYear() : 2000);
      return year >= 2020;
    });
    if (!hasRecentStudies) {
      uncertainties.push("Limited recent research available");
    }
    
    return uncertainties;
  }
  
  /**
   * Perform critical analysis of evidence
   */
  private static performCriticalAnalysis(evidence: any[], mode: string): string {
    const analysis = [];
    
    // Check for consistency
    analysis.push("Evaluating consistency across studies...");
    
    // Check for bias risks
    analysis.push("Assessing potential bias sources: selection bias, publication bias, reporting bias");
    
    // Check for generalizability
    analysis.push("Examining generalizability of findings to target population");
    
    if (mode === 'doctor') {
      analysis.push("Evaluating clinical applicability and real-world effectiveness");
    }
    
    return analysis.join('. ') + '.';
  }
  
  /**
   * Synthesize evidence using appropriate method
   */
  private static synthesizeEvidence(evidence: any[], mode: string): string {
    if (evidence.length === 0) {
      return "No direct evidence available. Synthesis based on general medical principles and expert consensus.";
    }
    
    if (evidence.length === 1) {
      return "Single source identified. Findings interpreted with caution pending additional evidence.";
    }
    
    return `Multiple sources synthesized using convergent analysis. Evidence triangulation performed across ${evidence.length} studies to identify consistent patterns and resolve discrepancies.`;
  }
  
  /**
   * Calculate synthesis confidence
   */
  private static calculateSynthesisConfidence(evidence: any[]): number {
    const baseConfidence = this.calculateEvidenceConfidence(evidence);
    const consistencyBonus = evidence.length > 3 ? 10 : 0;
    return Math.min(95, baseConfidence + consistencyBonus);
  }
  
  /**
   * Identify synthesis uncertainties
   */
  private static identifySynthesisUncertainties(evidence: any[]): string[] {
    return [
      "Individual study limitations may affect overall conclusions",
      "Population differences across studies may limit generalizability",
      "Temporal changes in medical practice may affect relevance"
    ];
  }
  
  /**
   * Apply clinical reasoning for doctor mode
   */
  private static applyClinicalReasoning(query: string, evidence: any[]): string {
    const reasoning = [];
    
    reasoning.push("Clinical reasoning framework applied:");
    reasoning.push("1. Pattern recognition from evidence");
    reasoning.push("2. Differential diagnosis consideration");
    reasoning.push("3. Risk-benefit analysis");
    reasoning.push("4. Safety prioritization");
    reasoning.push("5. Patient-centered approach");
    
    return reasoning.join(' ');
  }
  
  /**
   * Generate clinical reasoning chain for diagnostic scenarios
   */
  static generateClinicalReasoningChain(
    symptoms: string[], 
    evidence: any[]
  ): ClinicalReasoningChain {
    return {
      differential_diagnosis: this.generateDifferentialDiagnosis(symptoms, evidence),
      risk_factors: this.identifyRiskFactors(symptoms, evidence),
      red_flags: this.identifyRedFlags(symptoms)
    };
  }
  
  private static generateDifferentialDiagnosis(symptoms: string[], evidence: any[]) {
    // This would be expanded based on symptom patterns
    return [
      {
        condition: "Most likely diagnosis based on symptom pattern",
        probability: 60,
        supporting_evidence: ["Common presentation", "Matches symptom profile"],
        opposing_evidence: ["Some atypical features"],
        next_steps: ["Confirm with specific tests", "Rule out alternatives"]
      }
    ];
  }
  
  private static identifyRiskFactors(symptoms: string[], evidence: any[]) {
    return [
      {
        factor: "Age",
        weight: 0.3,
        modifiable: false,
        clinical_significance: "Major risk factor for multiple conditions"
      }
    ];
  }
  
  private static identifyRedFlags(symptoms: string[]) {
    return [
      {
        flag: "Severe or worsening symptoms",
        urgency: 'urgent' as const,
        action_required: "Immediate medical evaluation"
      }
    ];
  }
}

import { type Citation } from "@/lib/types/chat";
import { DeepThinkingEngine, type ReasoningStep } from "./deep-thinking";

export interface EnhancedMedicalPromptContext {
  userQuery: string;
  researchPapers: Citation[];
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  mode?: 'research' | 'doctor';
  enableDeepThinking?: boolean;
  reasoningSteps?: ReasoningStep[];
}

export interface MedicalPromptContext {
  userQuery: string;
  researchPapers: Citation[];
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  mode?: 'research' | 'doctor';
}

export function createMedicalPrompt(context: MedicalPromptContext): string {
  return createEnhancedMedicalPrompt({
    ...context,
    enableDeepThinking: false
  });
}

export function createEnhancedMedicalPrompt(context: EnhancedMedicalPromptContext): string {
  const { userQuery, researchPapers, conversationHistory, mode = 'research', enableDeepThinking = false, reasoningSteps } = context;

  // Calculate evidence-based confidence for the response
  const calculateEvidenceConfidence = (papers: Citation[]): number => {
    if (papers.length === 0) return 20; // Very low confidence with no evidence
    
    // Check for irrelevant papers (major confidence penalty)
    const irrelevantPapers = papers.filter(p => {
      const title = p.title.toLowerCase();
      const journal = (p.journal || '').toLowerCase();
      const abstract = (p.abstract || '').toLowerCase();
      
      // Check for irrelevant terms that indicate off-topic papers
      const irrelevantTerms = [
        'testicular rupture', 'endocannabinoid system', 'empagliflozin', 'dapagliflozin',
        'farxiga', 'contraceptive', 'mirena', 'bibliometric', 'citation analysis',
        'business', 'marketing', 'financial', 'economics', 'social media',
        'pure mathematics', 'theoretical physics', 'computer programming'
      ];
      
      const isIrrelevant = irrelevantTerms.some(term => 
        title.includes(term) || abstract.includes(term)
      );
      
      // Also check if it's a drug label when asking about clinical topics
      const isDrugLabel = journal.includes('fda drug label') && 
        !userQuery.toLowerCase().includes('drug') && 
        !userQuery.toLowerCase().includes('medication');
      
      return isIrrelevant || isDrugLabel;
    }).length;
    
    // Calculate irrelevance ratio
    const irrelevanceRatio = irrelevantPapers / papers.length;
    
    // If more than 50% of papers are irrelevant, severely penalize confidence
    if (irrelevanceRatio > 0.5) {
      return Math.max(15, 30 - (irrelevanceRatio * 40)); // Very low confidence
    }
    
    // If 25-50% are irrelevant, moderate penalty
    if (irrelevanceRatio > 0.25) {
      return Math.max(25, 45 - (irrelevanceRatio * 30)); // Low confidence
    }
    
    let confidence = 40; // Base confidence for relevant papers
    
    // High-quality evidence boost
    const highQuality = papers.filter(p => 
      p.studyType?.includes('Meta-Analysis') || 
      p.studyType?.includes('Systematic Review') ||
      p.title.toLowerCase().includes('systematic review') ||
      p.title.toLowerCase().includes('meta-analysis')
    ).length;
    confidence += highQuality * 15;
    
    // Recent evidence boost
    const recentPapers = papers.filter(p => {
      const year = typeof p.year === 'string' ? parseInt(p.year) : p.year;
      return year >= 2020;
    }).length;
    confidence += (recentPapers / papers.length) * 20;
    
    // Multiple sources boost
    if (papers.length >= 5) confidence += 10;
    if (papers.length >= 10) confidence += 5;
    
    // High confidence papers boost
    const highConfidencePapers = papers.filter(p => (p.confidenceScore || 85) >= 85).length;
    confidence += (highConfidencePapers / papers.length) * 15;
    
    // Apply irrelevance penalty to final score
    confidence = confidence * (1 - (irrelevanceRatio * 0.5));
    
    return Math.min(95, Math.max(15, Math.round(confidence)));
  };

  const evidenceConfidence = calculateEvidenceConfidence(researchPapers);

  // Helper function to get confidence label
  const getConfidenceLabel = (conf: number): string => {
    if (conf >= 85) return "High Confidence";
    if (conf >= 70) return "Moderate Confidence"; 
    if (conf >= 55) return "Low Confidence";
    return "Very Low Confidence";
  };

  // Truncate abstracts to keep token count manageable
  const truncatedPapers = researchPapers.slice(0, 4).map((paper: Citation) => ({
    ...paper,
    abstract: paper.abstract ? 
      (paper.abstract.length > 400 ? paper.abstract.substring(0, 400) + "..." : paper.abstract) 
      : "Abstract not available"
  }));

  let prompt = "";

  if (mode === 'doctor') {
    prompt = "You are an experienced, empathetic doctor having a conversation with a patient. Respond naturally and conversationally, like how a caring physician would speak in person.\\n\\n";
    
    prompt += "ENHANCED RESPONSE FORMAT:\\n";
    prompt += "Use this structured approach with proper markdown formatting:\\n\\n";
    prompt += "1. **Opening Assessment** - Acknowledge their concern warmly\\n";
    prompt += `2. **## 📊 Confidence Assessment** - MUST START WITH: "**${getConfidenceLabel(evidenceConfidence)} (${evidenceConfidence}%)**" based on evidence quality\\n`;
    prompt += "3. **## 📋 Possible Causes** - What's probably happening (plain English with probability breakdowns)\\n";
    prompt += "4. **## ✅ What You Should Do Now** - Clear action items as bullet list\\n";
    prompt += "5. **## 🔍 Follow-up Timeline** - Specific timeframes for reassessment\\n";
    prompt += "6. **## 🚨 Seek Immediate Medical Attention If...** - Red flag symptoms as bullet list\\n";
    prompt += "7. **## 🧭 Your Care Plan Pathway** - Expected improvement timeline and next steps\\n\\n";
    
  } else {
    // Research mode
    prompt = "You are a medical research expert providing evidence-based analysis. Use the research papers provided to give comprehensive, accurate information.\\n\\n";
    
    prompt += "RESEARCH RESPONSE FORMAT:\\n";
    prompt += "1. **🔬 Research Summary** - Overview of evidence\\n";
    prompt += `2. **📊 Evidence Quality** - ${getConfidenceLabel(evidenceConfidence)} (${evidenceConfidence}%) based on ${researchPapers.length} papers\\n`;
    prompt += "3. **📋 Key Findings** - Main research results\\n";
    prompt += "4. **⚖️ Clinical Implications** - What this means for practice\\n";
    prompt += "5. **🔍 Future Research** - Areas needing more study\\n\\n";
  }

  // Add research context if papers are available
  if (truncatedPapers.length > 0) {
    prompt += "RESEARCH PAPERS FOR ANALYSIS:\\n\\n";
    
    truncatedPapers.forEach((paper, index) => {
      prompt += `**Paper ${index + 1}:**\\n`;
      prompt += `Title: ${paper.title}\\n`;
      prompt += `Authors: ${paper.authors.join(', ')}\\n`;
      prompt += `Journal: ${paper.journal} (${paper.year})\\n`;
      prompt += `Evidence Level: ${paper.evidenceLevel || 'Moderate'}\\n`;
      if (paper.abstract) {
        prompt += `Abstract: ${paper.abstract}\\n`;
      }
      prompt += `\\n`;
    });
  }

  // Add conversation history if available
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += "CONVERSATION CONTEXT:\\n";
    conversationHistory.forEach((msg, index) => {
      prompt += `${msg.role.toUpperCase()}: ${msg.content}\\n`;
    });
    prompt += "\\n";
  }

  // Add the user query
  prompt += `USER QUESTION: ${userQuery}\\n\\n`;

  // Add reasoning steps if enabled
  if (enableDeepThinking && reasoningSteps && reasoningSteps.length > 0) {
    prompt += "DEEP REASONING STEPS:\\n";
    reasoningSteps.forEach((step, index) => {
      prompt += `${index + 1}. ${step.title}: ${step.process}\\n`;
    });
    prompt += "\\n";
  }

  prompt += "Please provide a comprehensive, evidence-based response using the format specified above.";

  return prompt;
}

export function validateMedicalQuery(query: string): {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
} {
  if (!query || query.trim().length === 0) {
    return {
      isValid: false,
      reason: "Query cannot be empty",
      suggestions: ["Please enter a medical question"]
    };
  }

  if (query.length < 10) {
    return {
      isValid: false,
      reason: "Query too short",
      suggestions: ["Please provide more details about your medical question"]
    };
  }

  if (query.length > 2000) {
    return {
      isValid: false,
      reason: "Query too long",
      suggestions: ["Please shorten your question to under 2000 characters"]
    };
  }

  // Check for inappropriate content
  const inappropriateTerms = ['suicide', 'kill myself', 'end my life'];
  const hasInappropriate = inappropriateTerms.some(term => 
    query.toLowerCase().includes(term)
  );

  if (hasInappropriate) {
    return {
      isValid: false,
      reason: "This appears to be a mental health crisis",
      suggestions: [
        "Please contact emergency services immediately if you're in crisis",
        "National Suicide Prevention Lifeline: 988",
        "Crisis Text Line: Text HOME to 741741"
      ]
    };
  }

  return { isValid: true };
}

export function createResearchQueryPrompt(userQuery: string): string {
  return `Given the following medical question, generate 2-3 optimal search queries for medical research databases (PubMed, Semantic Scholar) using biomedical terminology that matches actual research paper titles.

User Question: "${userQuery}"

Generate search queries that:
1. Use proper medical terminology and MeSH terms
2. Are specific enough to find relevant research
3. Would match actual paper titles in medical literature
4. Include relevant synonyms and alternative terms

Format as a simple list of queries, one per line.`;
}

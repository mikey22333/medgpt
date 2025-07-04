export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  reasoningSteps?: ReasoningStep[];
  multiAgentResult?: any; // From Phase 3 - Multi-agent analysis results
  sessionId?: string; // For real-time reasoning sessions
  confidence?: number; // Overall confidence score for the message
}

export interface ReasoningStep {
  step: number;
  title: string;
  process: string;
  evidence: string[];
  confidence: number;
  uncertainties: string[];
  criticalQuestions: string[];
}

export interface Citation {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  // Enhanced citation properties
  studyType?: 'RCT' | 'Meta-Analysis' | 'Systematic Review' | 'Guideline' | 'Observational' | 'Case Study' | 'Review' | 'FDA Label' | 'FAERS Report' | 'FDA Recall';
  confidenceScore?: number; // 0-100 based on recency, study type, journal impact
  evidenceLevel?: 'High' | 'Moderate' | 'Low';
  source?: 'PubMed' | 'Europe PMC' | 'FDA Drug Labels' | 'FDA FAERS' | 'FDA Recalls' | 'Semantic Scholar' | 'CrossRef' | 'Fallback';
  meshTerms?: string[];
  isGuideline?: boolean;
  guidelineOrg?: 'WHO' | 'NICE' | 'FDA' | 'AAP' | 'AHA' | 'ESC' | 'CDC' | 'Other';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error?: string;
}

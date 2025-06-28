import { type Citation } from "@/lib/types/chat";
import { DeepThinkingEngine, type ReasoningStep } from "./deep-thinking";

export interface EnhancedMedicalPromptContext {
  userQuery: string;
  researchPapers: Citation[];
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  mode?: 'research' | 'doctor' | 'source-finder';
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
  mode?: 'research' | 'doctor' | 'source-finder';
}

export function createMedicalPrompt(context: MedicalPromptContext): string {
  // Legacy function - redirect to enhanced version
  return createEnhancedMedicalPrompt({
    ...context,
    enableDeepThinking: false
  });
}

export function createEnhancedMedicalPrompt(context: EnhancedMedicalPromptContext): string {
  const { userQuery, researchPapers, conversationHistory, mode = 'research', enableDeepThinking = false } = context;

  // Generate reasoning steps if deep thinking is enabled
  let reasoningSteps: ReasoningStep[] = [];
  if (enableDeepThinking) {
    reasoningSteps = DeepThinkingEngine.generateReasoningChain(userQuery, researchPapers, mode);
  }

  // Truncate abstracts to keep token count manageable
  const truncatedPapers = researchPapers.slice(0, 4).map((paper: Citation) => ({
    ...paper,
    abstract: paper.abstract ? 
      (paper.abstract.length > 400 ? paper.abstract.substring(0, 400) + "..." : paper.abstract) 
      : "Abstract not available"
  }));

  let prompt = "";

  if (mode === 'doctor') {
    // Doctor Mode - Natural, Conversational Medical Responses
    prompt = "You are an experienced, empathetic doctor having a conversation with a patient. Respond naturally and conversationally, like how a caring physician would speak in person.\n\n";
    
    if (enableDeepThinking) {
      prompt += "You're using sophisticated medical reasoning behind the scenes, but present it naturally.\n\n";
    }
    
    prompt += "YOUR COMMUNICATION STYLE:\n";
    prompt += "- Speak like a real doctor talking to a patient\n";
    prompt += "- Use warm, reassuring, yet honest tone\n";
    prompt += "- Explain medical concepts in everyday language\n";
    prompt += "- Show empathy and understanding\n";
    prompt += "- Be direct about serious concerns but gentle in delivery\n";
    prompt += "- Use 'I' statements ('I'm concerned about...', 'I would recommend...')\n\n";
    
    prompt += "RESPONSE APPROACH:\n";
    prompt += "Start with acknowledgment of their concern, then naturally guide through:\n";
    prompt += "- What might be causing their symptoms (in plain English)\n";
    prompt += "- What they should be worried about vs. what's likely manageable\n";
    prompt += "- Clear next steps and recommendations\n";
    prompt += "- When to seek immediate care (if applicable)\n\n";
    
    prompt += "AVOID:\n";
    prompt += "- Formal clinical section headers\n";
    prompt += "- Medical jargon without explanation\n";
    prompt += "- Overly structured responses\n";
    prompt += "- Academic language\n\n";
    
    prompt += "MAINTAIN:\n";
    prompt += "- Medical accuracy and safety\n";
    prompt += "- Evidence-based recommendations\n";
    prompt += "- Appropriate urgency when needed\n";
    prompt += "- Professional medical standards\n\n";
    
    prompt += "Think like you're sitting across from this person in your office, having a caring conversation about their health concerns.\n\n";
    prompt += "Patient's Question: " + userQuery;
    
  } else if (mode === 'source-finder') {
    // Enhanced Source Finder Mode (handled separately)
    return createSourceFinderPrompt({ textSnippet: userQuery, searchResults: researchPapers, conversationHistory });
  } else {
    // Research Mode
    prompt = "You are MedGPT Scholar, an advanced medical research AI with deep analytical capabilities.\n\n";
    
    if (enableDeepThinking) {
      prompt += "DEEP RESEARCH ANALYSIS MODE ACTIVATED\n\nYou will perform systematic evidence synthesis, critical appraisal, and multi-perspective analysis.\n\n";
    }
    
    prompt += "You analyze medical literature with the rigor of a systematic reviewer, providing evidence-based answers with proper citations and critical evaluation.\n\n";
    prompt += "RESEARCH ANALYSIS FRAMEWORK:\n\n";
    prompt += "1. Evidence Quality Assessment\n";
    prompt += "   - Study types and methodological quality\n";
    prompt += "   - Risk of bias evaluation\n";
    prompt += "   - Evidence hierarchy ranking\n\n";
    prompt += "2. Systematic Evidence Synthesis\n";
    prompt += "   - Convergent findings across studies\n";
    prompt += "   - Conflicting evidence reconciliation\n";
    prompt += "   - Research gaps identification\n\n";
    prompt += "3. Clinical Relevance Analysis\n";
    prompt += "   - Statistical vs clinical significance\n";
    prompt += "   - Real-world applicability\n";
    prompt += "   - Population generalizability\n\n";
    prompt += "4. Critical Appraisal & Limitations\n";
    prompt += "   - Study limitations and biases\n";
    prompt += "   - Confidence in conclusions\n";
    prompt += "   - Areas needing further research\n\n";
    prompt += "5. Evidence-Based Conclusions\n";
    prompt += "   - Strength of recommendations\n";
    prompt += "   - Uncertainty quantification\n";
    prompt += "   - Future research priorities\n\n";
    prompt += "Use ONLY the research provided below. Cite studies by title and PMID/ID. Be transparent about evidence quality and limitations.\n\n";
    prompt += "Research Question: " + userQuery;
  }

  // Add research sources
  if (truncatedPapers.length > 0) {
    if (mode === 'doctor') {
      prompt += "\n\nSupporting Medical Literature:\n";
      truncatedPapers.forEach((paper: Citation, index: number) => {
        const identifier = paper.pmid ? `PMID: ${paper.pmid}` : `ID: ${paper.id}`;
        prompt += `${index + 1}. "${paper.title}" – ${paper.journal}, ${paper.year} (${identifier})\n`;
        prompt += `   Key Points: ${paper.abstract}\n`;
      });
    } else {
      prompt += "\n\nResearch Sources (Academic Papers & FDA Resources):\n";
      truncatedPapers.forEach((paper: Citation, index: number) => {
        const identifier = paper.pmid ? `PMID: ${paper.pmid}` : `ID: ${paper.id}`;
        const evidenceLevel = getEvidenceLevel(paper.title || '');
        prompt += `${index + 1}. [${evidenceLevel}] "${paper.title}" – ${paper.journal}, ${paper.year} (${identifier})\n`;
        prompt += `   Summary: ${paper.abstract}\n`;
        prompt += `   Quality: ${assessStudyQuality(paper)}\n`;
      });
    }
  } else if (mode === 'research') {
    prompt += "\n\nResearch Sources:\n";
    prompt += "⚠️ No directly matching papers found for this specific query. Response will be based on established medical knowledge and general principles. Please search for more specific literature for evidence-based recommendations.";
  }

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += "\n\nPrevious Context:\n";
    conversationHistory.slice(-2).forEach((message: any) => {
      prompt += `${message.role.toUpperCase()}: ${message.content.substring(0, 200)}${message.content.length > 200 ? '...' : ''}\n`;
    });
  }

  // Add response format requirements
  prompt += "\n\n---\n\nRESPONSE FORMAT REQUIRED:\n";

  if (mode === 'doctor') {
    prompt += "\nRespond as a caring doctor having a natural conversation with a patient. Use conversational tone but include clear formatting for important information.\n\n";
    prompt += "YOUR RESPONSE SHOULD INCLUDE:\n";
    prompt += "- Natural, empathetic opening acknowledging their concerns\n";
    prompt += "- Comprehensive explanation of all possible causes\n";
    prompt += "- **📊 COMPREHENSIVE RISK ASSESSMENT:** All relevant risk scenarios\n";
    prompt += "- **HIGHLIGHTED sections for key warnings or important points**\n";
    prompt += "- Bullet points for clear action items and recommendations\n";
    prompt += "- **🚨 SEEK IMMEDIATE CARE IF:** section with specific red flags\n";
    prompt += "- **📋 WHAT TO DO NEXT:** section with clear steps\n";
    prompt += "- Reassuring but honest conclusion\n\n";
    prompt += "FORMATTING GUIDELINES:\n";
    prompt += "- Use **bold** for important warnings and key points\n";
    prompt += "- Use bullet points for lists of symptoms, recommendations, or actions\n";
    prompt += "- Use clear headings like '🚨 SEEK IMMEDIATE CARE IF:' and '📋 WHAT TO DO NEXT:'\n";
    prompt += "- **PROVIDE COMPREHENSIVE ASSESSMENT based on the information given**\n";
    prompt += "- Cover ALL possible causes and scenarios without asking questions\n";
    prompt += "- Include risk assessments for different age groups and conditions\n";
    prompt += "- Present multiple diagnostic possibilities with their likelihood\n\n";
    prompt += "COMPREHENSIVE ASSESSMENT APPROACH:\n";
    prompt += "**For Chest Pain & Shortness of Breath:**\n";
    prompt += "- Cover cardiac causes (MI, angina, pericarditis)\n";
    prompt += "- Cover pulmonary causes (PE, pneumonia, asthma, pneumothorax)\n";
    prompt += "- Cover other causes (GERD, anxiety, musculoskeletal)\n";
    prompt += "- Discuss risk factors for each possibility\n";
    prompt += "- Provide age-stratified risk assessments\n\n";
    prompt += "**For Other Symptoms:**\n";
    prompt += "- Cover all major diagnostic categories\n";
    prompt += "- Discuss urgency levels for each possibility\n";
    prompt += "- Include relevant clinical decision tools and scores\n";
    prompt += "- Provide comprehensive safety netting advice\n\n";
    prompt += "**MEDICATION RECOMMENDATIONS - CRITICAL GUIDELINES:**\n";
    prompt += "- **ONLY recommend medications when absolutely clinically necessary**\n";
    prompt += "- **DO NOT routinely suggest medications for minor symptoms**\n";
    prompt += "- **Focus first on non-pharmacological approaches** (rest, lifestyle, monitoring)\n";
    prompt += "- **Recommend specific medications ONLY if:**\n";
    prompt += "  • Symptoms suggest serious underlying condition requiring treatment\n";
    prompt += "  • Patient safety is at risk without medication\n";
    prompt += "  • Standard medical care clearly indicates medication is warranted\n";
    prompt += "  • Over-the-counter remedies are insufficient for the severity\n";
    prompt += "- **For common symptoms** (headache, mild pain, cold symptoms):\n";
    prompt += "  • Emphasize rest, hydration, monitoring, and OTC options if appropriate\n";
    prompt += "  • Avoid suggesting prescription medications unless truly indicated\n";
    prompt += "- **Always emphasize** that any medication decisions should be made with their doctor\n";
    prompt += "- **Prefer giving general categories** rather than specific drug names when possible\n\n";
    prompt += "- Keep the conversational doctor tone throughout\n";
    prompt += "- Make it easy to scan for important information\n";
    prompt += "- Provide comprehensive analysis without requiring additional patient input\n";
    prompt += "- Cover all scenarios from low-risk to emergency situations";
  } else {
    prompt += "\nYou MUST structure your response in a professional clinical format:\n\n";
    prompt += "## Evidence Quality Assessment\n";
    if (enableDeepThinking) {
      prompt += "Systematic evaluation of study quality, bias risk, and evidence hierarchy\n\n";
    } else {
      prompt += "Brief assessment of available evidence\n\n";
    }
    prompt += "## Research Synthesis\n";
    if (enableDeepThinking) {
      prompt += "Multi-study analysis with convergent and divergent findings\n\n";
    } else {
      prompt += "Summary of key findings from research\n\n";
    }
    prompt += "## Clinical Relevance\n";
    if (enableDeepThinking) {
      prompt += "Translation of research to clinical practice with population considerations\n\n";
    } else {
      prompt += "Practical implications of the research\n\n";
    }
    prompt += "## Critical Analysis\n";
    if (enableDeepThinking) {
      prompt += "Limitations, biases, and areas of uncertainty in the evidence base\n\n";
    } else {
      prompt += "Study limitations and considerations\n\n";
    }
    prompt += "## Evidence-Based Conclusions\n";
    if (enableDeepThinking) {
      prompt += "Graded recommendations with confidence intervals\n\n";
    } else {
      prompt += "Summary conclusions based on evidence\n\n";
    }
    
    if (enableDeepThinking) {
      prompt += "## Research Gaps & Future Directions\n";
      prompt += "Identification of knowledge gaps and research priorities\n\n";
    }
    
    const citationCount = Math.min(2, truncatedPapers.length);
    const idType = truncatedPapers.length > 0 && truncatedPapers[0].pmid ? 'PMID' : 'ID';
    prompt += `- You MUST cite at least ${citationCount} sources using: "[TITLE]" (${idType}: XXXXXXXX)\n`;
    prompt += "- Include evidence quality ratings (High/Moderate/Low/Very Low)\n";
    prompt += "- Be transparent about limitations and uncertainty";
  }

  return prompt;
}

/**
 * Assess evidence level of a study based on title
 */
function getEvidenceLevel(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('meta-analysis') || titleLower.includes('systematic review')) {
    return 'HIGH EVIDENCE';
  } else if (titleLower.includes('randomized') || titleLower.includes('controlled trial')) {
    return 'MODERATE EVIDENCE';
  } else if (titleLower.includes('cohort') || titleLower.includes('longitudinal')) {
    return 'MODERATE EVIDENCE';
  } else if (titleLower.includes('case-control') || titleLower.includes('cross-sectional')) {
    return 'LOW EVIDENCE';
  } else {
    return 'VARIABLE EVIDENCE';
  }
}

/**
 * Assess study quality for display
 */
function assessStudyQuality(paper: Citation): string {
  const title = (paper.title || '').toLowerCase();
  let quality = [];
  
  if (title.includes('systematic review') || title.includes('meta-analysis')) {
    quality.push('High methodological rigor');
  }
  if (title.includes('randomized')) {
    quality.push('RCT design');
  }
  if (title.includes('double-blind') || title.includes('placebo-controlled')) {
    quality.push('Strong blinding');
  }
  if (paper.year && paper.year >= 2020) {
    quality.push('Recent evidence');
  }
  
  return quality.length > 0 ? quality.join(', ') : 'Standard observational study';
}

export function createResearchQueryPrompt(userQuery: string): string {
  return `Given the following medical question, generate 2-3 optimal search queries for medical research databases (PubMed, Semantic Scholar) using biomedical terminology that matches actual research paper titles.

User Question: "${userQuery}"

Generate search queries that:
1. Use appropriate medical terminology and MeSH terms
2. Transform colloquial language into research terminology
3. Focus on finding recent, peer-reviewed research
4. Include alternative phrasings using biomedical synonyms
5. Consider how researchers actually title their papers

Examples of good transformations:
- "dose calculation" → "dose translation animal to human" OR "mg/kg conversion" OR "allometric scaling"
- "side effects" → "adverse effects" OR "drug safety" OR "toxicology profile"
- "how does it work" → "mechanism of action" OR "pharmacodynamics" OR "molecular mechanism"

Format your response as a JSON array of strings:
["query1", "query2", "query3"]

Search queries:`;
}

export function createSummaryPrompt(papers: Citation[]): string {
  if (papers.length === 0) {
    return "No research papers available to summarize.";
  }

  let prompt = `Please provide a brief summary of the key findings from these medical research papers:

`;

  papers.forEach((paper, index) => {
    prompt += `${index + 1}. "${paper.title}" (${paper.journal}, ${paper.year})
   Abstract: ${paper.abstract || "Abstract not available"}

`;
  });

  prompt += `Summary should:
- Highlight the main findings and conclusions
- Note any consensus or conflicting results
- Be concise but informative (2-3 paragraphs)
- Use proper medical terminology
- Focus on clinical relevance

Summary:`;

  return prompt;
}

export function validateMedicalQuery(query: string): {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
} {
  const trimmedQuery = query.trim();

  // Basic validation
  if (trimmedQuery.length < 3) {
    return {
      isValid: false,
      reason: "Query too short",
      suggestions: ["Please provide a more detailed medical question"],
    };
  }

  if (trimmedQuery.length > 500) {
    return {
      isValid: false,
      reason: "Query too long",
      suggestions: ["Please shorten your question to focus on the main topic"],
    };
  }

  // Check for inappropriate content (basic implementation)
  const inappropriatePatterns = [
    /personal medical advice/i,
    /diagnose me/i,
    /what do i have/i,
    /am i dying/i,
    /emergency/i,
  ];

  for (const pattern of inappropriatePatterns) {
    if (pattern.test(trimmedQuery)) {
      return {
        isValid: false,
        reason: "Inappropriate request for personal medical advice",
        suggestions: [
          "This tool is for educational purposes only",
          "Please consult a healthcare professional for personal medical concerns",
          "Try asking about general medical concepts or conditions instead",
        ],
      };
    }
  }

  return { isValid: true };
}

export interface SourceFinderContext {
  textSnippet: string;
  searchResults: any[];
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export function createSourceFinderPrompt(context: SourceFinderContext): string {
  const { textSnippet, searchResults, conversationHistory } = context;

  let prompt = `You are MedGPT Scholar's Source Finder, an expert at identifying the origins of medical and scientific text snippets.

Your task: Analyze the provided text snippet and help identify its most likely sources from the search results below.

TEXT SNIPPET TO ANALYZE:
"${textSnippet}"

SEARCH RESULTS FROM MEDICAL DATABASES:
`;

  if (searchResults && searchResults.length > 0) {
    searchResults.slice(0, 8).forEach((result, index) => {
      prompt += `
${index + 1}. Title: "${result.title || 'No title'}"
   Journal: ${result.journal || result.venue || 'Unknown'}
   Year: ${result.publishedDate || result.year || 'Unknown'}
   Source: ${result.source || 'Unknown'}
   ${result.pmid ? `PMID: ${result.pmid}` : result.paperId ? `Paper ID: ${result.paperId}` : `ID: ${result.id || 'Unknown'}`}
   Abstract: ${result.abstract ? (result.abstract.length > 300 ? result.abstract.substring(0, 300) + "..." : result.abstract) : 'No abstract available'}
   Relevance Score: ${result.relevanceScore || 'N/A'}
`;
    });
  } else {
    prompt += "\nNo matching research papers found in the databases for this text snippet.";
  }

  prompt += `

ANALYSIS INSTRUCTIONS:
1. **Exact Match Detection**: Look for papers that might contain the exact or nearly exact text
2. **Paraphrase Identification**: Identify papers that express the same information in different words
3. **Source Type Analysis**: Determine if this is likely from a primary study, review, guideline, or textbook
4. **Citation Confidence**: Rate likelihood each paper is the actual source (Very High/High/Moderate/Low)
5. **Multiple Source Possibility**: Consider that the statement might appear in multiple publications
6. **Verification Strategy**: Provide specific steps to confirm the source

RESPONSE FORMAT:
Provide a comprehensive analysis in this format:

## Comprehensive Source Analysis

**Primary Source Candidates (Most Likely Origins):**
[List top 3-5 most probable original sources with detailed explanations]

**Secondary Sources (Likely Citations/References):**
[List papers that probably cite or reference the original source]

**Key Claims Breakdown:**
[Extract and analyze each major claim in the text snippet]

**Citation Confidence Levels:**
- **Very High Confidence**: [Papers that almost certainly contain this text]
- **High Confidence**: [Papers very likely to contain similar information]
- **Moderate Confidence**: [Papers that cover the same topic but may not be the source]

**Source Type Assessment:**
[Determine if this appears to be from: Primary research, Meta-analysis, Review article, Clinical guideline, Textbook, etc.]

**Complete Verification Protocol:**
1. [Specific database searches to perform]
2. [Exact phrases to search for in quotation marks]
3. [Author names or institutions to investigate]
4. [Alternative search strategies if initial searches fail]

**Cross-Reference Opportunities:**
[Suggest related papers that might reference the same findings]

**Potential Complications:**
[Note any factors that might make source identification difficult]

Be extremely thorough and consider all possibilities. If multiple papers could be the source, explain the likelihood of each.`;

  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `\n\nCONVERSATION CONTEXT:\n`;
    conversationHistory.slice(-3).forEach((msg, index) => {
      prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
  }

  return prompt;
}

/**
 * Generate deep thinking structure display for prompts
 */
function generateDeepThinkingDisplay(reasoningSteps: ReasoningStep[], mode: string): string {
  if (!reasoningSteps || reasoningSteps.length === 0) return '';
  
  let display = '\n**REASONING PROCESS:**\n';
  
  reasoningSteps.forEach((step, index) => {
    display += `\n**Step ${step.step}: ${step.title}**\n`;
    display += `${step.process}\n`;
    if (step.confidence) {
      display += `Confidence: ${step.confidence}%\n`;
    }
    if (step.uncertainties.length > 0) {
      display += `Uncertainties: ${step.uncertainties.join(', ')}\n`;
    }
    display += '\n';
  });
  
  return display;
}

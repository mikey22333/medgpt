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
    // Enhanced Doctor Mode - Natural, Conversational Medical Responses
    prompt = `You are an experienced, empathetic doctor having a conversation with a patient. Respond naturally and conversationally, like how a caring physician would speak in person.

${enableDeepThinking ? '🧠 **ADVANCED CLINICAL REASONING ACTIVE**\n\nYou\'re using sophisticated medical reasoning behind the scenes, but present it naturally.\n\n' : ''}

**YOUR COMMUNICATION STYLE:**
- Speak like a real doctor talking to a patient
- Use warm, reassuring, yet honest tone
- Explain medical concepts in everyday language
- Show empathy and understanding
- Be direct about serious concerns but gentle in delivery
- Use "I" statements ("I'm concerned about...", "I would recommend...")

**RESPONSE APPROACH:**
Start with acknowledgment of their concern, then naturally guide through:
- What might be causing their symptoms (in plain English)
- What they should be worried about vs. what's likely manageable
- Clear next steps and recommendations
- When to seek immediate care (if applicable)

**AVOID:**
- Formal clinical section headers (🔍, 🧠, ⚠️, etc.)
- Medical jargon without explanation
- Overly structured responses
- Academic language

**MAINTAIN:**
- Medical accuracy and safety
- Evidence-based recommendations
- Appropriate urgency when needed
- Professional medical standards

Think like you're sitting across from this person in your office, having a caring conversation about their health concerns.

---

**Patient's Question:**
${userQuery}`;
  } else if (mode === 'source-finder') {
    // Enhanced Source Finder Mode (handled separately)
    return createSourceFinderPrompt({ textSnippet: userQuery, searchResults: researchPapers, conversationHistory });
  } else {
    // Enhanced Research Mode Prompt with Deep Thinking
    prompt = `You are MedGPT Scholar, an advanced medical research AI with deep analytical capabilities.

${enableDeepThinking ? '🧠 **DEEP RESEARCH ANALYSIS MODE ACTIVATED**\n\nYou will perform systematic evidence synthesis, critical appraisal, and multi-perspective analysis.\n\n' : ''}You analyze medical literature with the rigor of a systematic reviewer, providing evidence-based answers with proper citations and critical evaluation.

${enableDeepThinking ? generateDeepThinkingDisplay(reasoningSteps, 'research') : ''}

**RESEARCH ANALYSIS FRAMEWORK:**

1. 📊 **Evidence Quality Assessment**
   - Study types and methodological quality
   - Risk of bias evaluation
   - Evidence hierarchy ranking

2. 🔬 **Systematic Evidence Synthesis**
   - Convergent findings across studies
   - Conflicting evidence reconciliation
   - Research gaps identification

3. 🎯 **Clinical Relevance Analysis**
   - Statistical vs clinical significance
   - Real-world applicability
   - Population generalizability

4. ⚖️ **Critical Appraisal & Limitations**
   - Study limitations and biases
   - Confidence in conclusions
   - Areas needing further research

5. 📋 **Evidence-Based Conclusions**
   - Strength of recommendations
   - Uncertainty quantification
   - Future research priorities

Use ONLY the research provided below. Cite studies by title and PMID/ID. Be transparent about evidence quality and limitations.

---

📌 **Research Question:**
${userQuery}`;
  }

  if (truncatedPapers.length > 0) {
    if (mode === 'doctor') {
      prompt += `\n\n📚 **Supporting Medical Literature:**`;
      truncatedPapers.forEach((paper: Citation, index: number) => {
        const identifier = paper.pmid ? `PMID: ${paper.pmid}` : `ID: ${paper.id}`;
        prompt += `\n${index + 1}. "${paper.title}" – ${paper.journal}, ${paper.year} (${identifier})
   Key Points: ${paper.abstract}`;
      });
    } else {
      prompt += `\n\n📚 **Research Sources (Academic Papers & FDA Resources):**`;
      truncatedPapers.forEach((paper: Citation, index: number) => {
        const identifier = paper.pmid ? `PMID: ${paper.pmid}` : `ID: ${paper.id}`;
        const evidenceLevel = getEvidenceLevel(paper.title || '');
        prompt += `\n${index + 1}. [${evidenceLevel}] "${paper.title}" – ${paper.journal}, ${paper.year} (${identifier})
   Summary: ${paper.abstract}
   Quality: ${assessStudyQuality(paper)}`;
      });
    }
  } else if (mode === 'research') {
    prompt += `\n\n📚 **Research Sources:**
⚠️ No directly matching papers found for this specific query. Response will be based on established medical knowledge and general principles. Please search for more specific literature for evidence-based recommendations.`;
  }

  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `\n\n💬 **Previous Context:**`;
    conversationHistory.slice(-2).forEach((message: any) => {
      prompt += `\n${message.role.toUpperCase()}: ${message.content.substring(0, 200)}${message.content.length > 200 ? '...' : ''}`;
    });
  }

  prompt += `\n\n---

✅ **RESPONSE FORMAT REQUIRED:**`;

  if (mode === 'doctor') {
    prompt += `
Respond as a caring doctor having a natural conversation with a patient. Write in flowing, conversational prose without formal section headers or structured formatting.

**YOUR NATURAL CONVERSATION SHOULD:**
- Start by acknowledging their concern with empathy
- Explain what might be causing their symptoms in everyday language
- Discuss what they should be worried about vs. what's manageable
- Give clear, actionable recommendations
- Explain when to seek immediate medical attention
- End with appropriate reassurance while being honest

Write as one flowing conversation, like you're talking face-to-face with a patient in your office. Avoid section headers, emojis, bullet points, or formal clinical formatting.`;
  } else {
    prompt += `
You MUST structure your response in a professional clinical format:

## 📊 Evidence Quality Assessment
${enableDeepThinking ? 'Systematic evaluation of study quality, bias risk, and evidence hierarchy' : 'Brief assessment of available evidence'}

## 🔬 Research Synthesis
${enableDeepThinking ? 'Multi-study analysis with convergent and divergent findings' : 'Summary of key findings from research'}

## 🎯 Clinical Relevance
${enableDeepThinking ? 'Translation of research to clinical practice with population considerations' : 'Practical implications of the research'}

## ⚖️ Critical Analysis
${enableDeepThinking ? 'Limitations, biases, and areas of uncertainty in the evidence base' : 'Study limitations and considerations'}

## 📋 Evidence-Based Conclusions
${enableDeepThinking ? 'Graded recommendations with confidence intervals' : 'Summary conclusions based on evidence'}

${enableDeepThinking ? '\n## 🔮 Research Gaps & Future Directions\nIdentification of knowledge gaps and research priorities\n' : ''}

- You MUST cite at least ${Math.min(2, truncatedPapers.length)} sources using: "[TITLE]" (${truncatedPapers.length > 0 && truncatedPapers[0].pmid ? 'PMID' : 'ID'}: XXXXXXXX)
- Include evidence quality ratings (High/Moderate/Low/Very Low)
- Be transparent about limitations and uncertainty`;
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

📝 TEXT SNIPPET TO ANALYZE:
"${textSnippet}"

🔍 SEARCH RESULTS FROM MEDICAL DATABASES:
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

🎯 ANALYSIS INSTRUCTIONS:
1. **Exact Match Detection**: Look for papers that might contain the exact or nearly exact text
2. **Paraphrase Identification**: Identify papers that express the same information in different words
3. **Source Type Analysis**: Determine if this is likely from a primary study, review, guideline, or textbook
4. **Citation Confidence**: Rate likelihood each paper is the actual source (Very High/High/Moderate/Low)
5. **Multiple Source Possibility**: Consider that the statement might appear in multiple publications
6. **Verification Strategy**: Provide specific steps to confirm the source

📋 RESPONSE FORMAT:
Provide a comprehensive analysis in this format:

## 🔍 Comprehensive Source Analysis

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
    prompt += `\n\n📝 CONVERSATION CONTEXT:\n`;
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
  // Reasoning process hidden from user view - users don't want to see technical reasoning
  return '';
}

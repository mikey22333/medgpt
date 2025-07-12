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

  // Create lowercase version of query for condition checking
  const queryLower = userQuery.toLowerCase();

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
    prompt += "**CRITICAL INSTRUCTION FOR INADEQUATE SOURCES:**\n";
    prompt += "If provided sources are unrelated to the research question:\n";
    prompt += "1. **CLEARLY STATE** this limitation at the beginning of your response\n";
    prompt += "2. **IDENTIFY MISSING LANDMARK STUDIES** by name and PMID\n";
    prompt += "3. **USE ESTABLISHED MEDICAL KNOWLEDGE** but explicitly acknowledge this limitation\n";
    prompt += "4. **RECOMMEND SPECIFIC SEARCHES** that would yield better evidence\n";
    prompt += "5. **INCLUDE RELEVANT GUIDELINES** from major organizations (CDC, NICE, AHA, ESC)\n\n";
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
      prompt += "**SOURCE RELEVANCE ASSESSMENT REQUIRED:**\n";
      prompt += "You MUST evaluate each source for direct relevance to the query. If sources are unrelated, explicitly state this.\n\n";
      truncatedPapers.forEach((paper: Citation, index: number) => {
        const identifier = paper.pmid ? `PMID: ${paper.pmid}` : `ID: ${paper.id}`;
        const evidenceLevel = getEvidenceLevel(paper.title || '');
        const gradeConfidence = getGRADEConfidence(paper);
        prompt += `${index + 1}. [${evidenceLevel}] "${paper.title}" – ${paper.journal}, ${paper.year} (${identifier})\n`;
        prompt += `   Summary: ${paper.abstract}\n`;
        prompt += `   Quality: ${assessStudyQuality(paper)}\n`;
        prompt += `   GRADE Confidence: ${gradeConfidence}\n`;
        prompt += `   **RELEVANCE CHECK REQUIRED**: Assess if this source directly addresses the research question\n`;
      });
    }
  } else if (mode === 'research') {
    prompt += "\n\nResearch Sources:\n";
    prompt += "⚠️ **CRITICAL SOURCE QUALITY ASSESSMENT REQUIRED:**\n";
    prompt += "- If provided sources are unrelated to the query, you MUST state this clearly\n";
    prompt += "- You MUST identify what landmark studies are missing from the provided sources\n";
    prompt += "- When sources are irrelevant, rely on established medical knowledge but explicitly state this limitation\n";
    prompt += "- **EXAMPLE**: 'The provided sources (COVID protocols, skin products) do not address smoking cessation. This response is based on established evidence from landmark trials not included in the search results.'\n";
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
    prompt += "\nYou MUST structure your response in a comprehensive clinical research format:\n\n";
    prompt += "🧠 **Research Answer:** [Restate the question clearly]\n\n";
    prompt += "🧾 **Clinical Summary (TL;DR)**\n\n";
    prompt += "• 🧠 **Primary Cause:** [Main finding] → [Confidence level with stars]\n\n";
    prompt += "• 🔬 **Secondary Causes:** [Additional findings with confidence]\n\n";
    prompt += "• 🔎 **Diagnostic Tools:** [Key diagnostic approaches]\n\n";
    prompt += "• ⚠️ **Evidence Gaps:** [Critical limitations in current evidence]\n\n";
    prompt += "🔬 **Evidence Sources and Study Types**\n";
    prompt += "- Total papers screened and selection criteria\n";
    prompt += "- Highlight strongest evidence source with PMID\n";
    prompt += "- Note supporting evidence types (observational, FDA reports, etc.)\n\n";

    // Special handling for CAC vs stress testing queries
    if (queryLower.includes('cac') || queryLower.includes('calcium score') || queryLower.includes('stress test') || 
        (queryLower.includes('coronary') && (queryLower.includes('calcium') || queryLower.includes('stress')))) {
      prompt += "**SPECIAL INSTRUCTIONS FOR CAC vs STRESS TESTING COMPARISON:**\n";
      prompt += "You MUST address the following landmark studies and clinical evidence:\n\n";
      prompt += "**ESSENTIAL LANDMARK TRIALS TO REFERENCE:**\n";
      prompt += "1. **MESA Study (Multi-Ethnic Study of Atherosclerosis)** - PMID: 18305265\n";
      prompt += "   - Established CAC scoring for cardiovascular risk prediction\n";
      prompt += "   - Demonstrated CAC superior to traditional risk factors\n";
      prompt += "   - Key finding: CAC=0 associated with very low event rate\n\n";
      prompt += "2. **PROMISE Trial** - PMID: 25773919\n";
      prompt += "   - Direct RCT comparing anatomical (CAC/CCTA) vs functional testing\n";
      prompt += "   - 10,003 patients with stable chest pain\n";
      prompt += "   - Primary endpoint: Death, MI, hospitalization for unstable angina, major complications\n\n";
      prompt += "3. **SCOT-HEART Trial** - PMID: 30145972\n";
      prompt += "   - CT angiography vs standard care in stable chest pain\n";
      prompt += "   - 5-year outcomes showing reduced MI and cardiac death\n";
      prompt += "   - Demonstrated clinical utility of anatomical testing\n\n";
      prompt += "**REQUIRED CLINICAL CONTEXT:**\n";
      prompt += "- **Patient Population**: Asymptomatic vs symptomatic patients\n";
      prompt += "- **Risk Stratification**: Primary prevention vs known CAD\n";
      prompt += "- **Guidelines**: ACC/AHA 2019 Primary Prevention Guidelines on CAC\n";
      prompt += "- **Cost-Effectiveness**: Screening costs vs downstream testing\n";
      prompt += "- **Radiation Exposure**: CAC (1-3 mSv) vs nuclear stress (9-15 mSv)\n\n";
      prompt += "**EVIDENCE SYNTHESIS REQUIREMENTS:**\n";
      prompt += "- Compare diagnostic accuracy (sensitivity/specificity)\n";
      prompt += "- Discuss prognostic value (risk reclassification)\n";
      prompt += "- Address appropriate use criteria\n";
      prompt += "- Include guideline recommendations (ACC/AHA, ESC)\n";
      prompt += "- Mention real-world implementation considerations\n\n";
    }

    prompt += "🧪 **Top Identified Causes of [Condition]**\n";
    prompt += "**EVIDENCE HIERARCHY - STRICT PRIORITIZATION:**\n";
    prompt += "1. **LANDMARK RANDOMIZED CONTROLLED TRIALS** (Level 1 Evidence - HIGHEST PRIORITY)\n";
    prompt += "2. **Systematic Reviews & Meta-analyses** (Level 1 Evidence)\n";
    prompt += "3. **Large Registry Studies & National Databases** (Level 2 Evidence)\n";
    prompt += "4. **Clinical Guidelines from Major Organizations** (ESC, AHA, ACC, NICE)\n";
    prompt += "5. **Prospective Cohort Studies** (Level 3 Evidence)\n";
    prompt += "6. **Case-Control Studies** (Level 4 Evidence)\n";
    prompt += "7. **FDA/EMA Reports & Case Series** (Level 5 Evidence - SUPPORTING ONLY)\n\n";
    prompt += "**CRITICAL INSTRUCTION:** You MUST prioritize Level 1-2 evidence. Only cite Level 4-5 evidence if higher-quality studies are unavailable, and clearly state this limitation.\n\n";
    prompt += "For each major finding:\n";
    prompt += "1. **[Icon + Cause/Finding Name]**\n";
    prompt += "   - **Primary Study**: [LANDMARK TRIAL NAME if available - e.g., NAVIGATE ESUS, COMPASS, SPARCL]\n";
    prompt += "   - **PMID/Source**: [PMID: XXXXXXX] with publication year\n";
    prompt += "   - **Evidence Level**: [Level 1-5] - MUST justify why this level was assigned\n";
    prompt += "   - **GRADE Confidence**: [HIGH | MODERATE | LOW | VERY LOW] with specific reasoning\n";
    prompt += "   - **Study Design**: [RCT/Meta-analysis/Registry/Observational] - be specific\n";
    prompt += "   - **Clinical Relevance**: [Direct applicability to the question asked]\n";
    prompt += "   - **Limitations**: [Specific study limitations that affect confidence]\n\n";
    prompt += "📊 **ENHANCED GRADE Evidence Table**\n";
    prompt += "**MANDATORY EVIDENCE QUALITY ASSESSMENT:**\n";
    prompt += "For EACH citation, you MUST include:\n";
    prompt += "- **Study Design Justification**: Why this design was chosen and its limitations\n";
    prompt += "- **Confidence Reasoning**: Specific factors affecting GRADE rating\n";
    prompt += "- **Clinical Applicability**: How directly this applies to the question\n";
    prompt += "- **Missing Evidence**: What higher-quality studies are needed\n\n";
    prompt += "| Finding | Landmark Study | Design | GRADE | Confidence Justification | Missing Evidence |\n";
    prompt += "|---------|---------------|--------|-------|-------------------------|------------------|\n";
    prompt += "| Primary Endpoint | [TRIAL NAME + PMID] | RCT/Meta-analysis | HIGH/MOD/LOW | [Specific reasoning] | [What's still needed] |\n\n";
    
    const citationCount = Math.min(2, truncatedPapers.length);
    const idType = truncatedPapers.length > 0 && truncatedPapers[0].pmid ? 'PMID' : 'ID';
    prompt += `**ENHANCED CITATION REQUIREMENTS:**\n`;
    prompt += `- You MUST cite at least ${citationCount} sources using: "[TITLE]" (${idType}: XXXXXXXX)\n`;
    prompt += "- **MANDATORY**: For each citation, explain WHY this evidence level was assigned\n";
    prompt += "- **MANDATORY**: State specific limitations that downgrade confidence\n";
    prompt += "- **MANDATORY**: Identify what higher-quality evidence is missing\n";
    prompt += "- **TRANSPARENCY REQUIREMENT**: If citing observational studies, explicitly state 'This is based on observational evidence only' and explain implications\n";
    prompt += "- **RELEVANCE CHECK**: For each citation, explain how it directly addresses the specific question asked\n";
    prompt += "- Use clinical decision-making language (strong vs. weak recommendations) with justification\n\n";
    prompt += "**EVIDENCE GAP REPORTING MANDATORY:**\n";
    prompt += "You MUST include a section identifying:\n";
    prompt += "- **SOURCE QUALITY ASSESSMENT**: Are the provided sources directly relevant to the research question?\n";
    prompt += "- **MISSING LANDMARK TRIALS**: What major studies are absent from the provided sources?\n";
    prompt += "- **KNOWLEDGE BASE RELIANCE**: When sources are inadequate, clearly state you're using established medical knowledge\n";
    prompt += "- **SPECIFIC MISSING EVIDENCE**: Name the exact trials, reviews, or guidelines that should be included\n";
    prompt += "- **RESEARCH RECOMMENDATIONS**: What specific searches would yield better evidence\n";
    prompt += "- **CLINICAL IMPACT**: How the evidence gaps affect the strength of recommendations\n\n";
    prompt += "**INADEQUATE SOURCE HANDLING:**\n";
    prompt += "When provided sources are unrelated or insufficient:\n";
    prompt += "1. **EXPLICITLY STATE**: 'The provided sources do not adequately address this question'\n";
    prompt += "2. **NAME MISSING STUDIES**: Identify specific landmark trials that should be included\n";
    prompt += "3. **JUSTIFY KNOWLEDGE USE**: Explain why you're using established medical knowledge\n";
    prompt += "4. **LOWER CONFIDENCE**: Appropriately downgrade confidence ratings due to source limitations\n";
    prompt += "5. **RECOMMEND SEARCHES**: Suggest specific database queries that would yield better results\n\n";
  }

  // New section for real-world data integration and cost-effectiveness considerations
  prompt += "💰 **Real-World Implementation & Cost-Effectiveness**\n";
  prompt += "**PRACTICAL CONSIDERATIONS:**\n";
  prompt += "- **Screening Program Costs:** Italy model vs. USA approach - cost per life saved analysis\n";
  prompt += "- **False Positive Rates:** ECG abnormalities in athletes vs. true pathology (5-15% false positive rate)\n";
  prompt += "- **Resource Requirements:** Cardiology specialist availability, equipment needs, training costs\n";
  prompt += "- **Legal and Liability Issues:** Clearance decisions, documentation requirements, malpractice considerations\n";
  prompt += "**REAL-WORLD EFFECTIVENESS DATA:**\n";
  prompt += "- **Italy Experience:** 89% reduction in sudden cardiac death after mandatory ECG screening implementation\n";
  prompt += "- **USA Data:** Variable screening practices, outcomes comparison between screened vs. non-screened populations\n";
  prompt += "- **Sport-Specific Risks:** Basketball, football, soccer highest risk; swimming, track lower risk\n";
  prompt += "- **Age and Gender Patterns:** Peak risk 16-24 years, male predominance (5:1 ratio)\n\n";

  // Add reasoning steps display if deep thinking is enabled
  if (enableDeepThinking && reasoningSteps.length > 0) {
    prompt += generateDeepThinkingDisplay(reasoningSteps, mode);
  }

  // Visual integration recommendations
  prompt += "📈 **Visual Integration Recommendations**\n";
  prompt += "At the end of appropriate sections, suggest data visualization:\n";
  prompt += "- **For Prevalence Data:** 'Recommend pie chart: HCM 35%, ARVC 15%, LQTS 10%, Brugada 8%, Other 32%'\n";
  prompt += "- **For Risk Stratification:** 'Suitable for pyramid diagram: High-risk (family history + symptoms) → Moderate-risk → Low-risk'\n";
  prompt += "- **For Screening Protocols:** 'Flowchart recommended: Pre-participation history → Physical exam → ECG (if indicated) → Echo/stress test'\n";
  prompt += "- **For Geographic Variations:** 'Bar chart suitable: Italy 89% reduction, USA variable results, EU intermediate outcomes'\n";
  prompt += "- **For Temporal Trends:** 'Line graph appropriate: SCA incidence 1980-2024 with screening implementation markers'\n\n";

  // Enhanced citation requirements for specific conditions
  prompt += "**CONDITION-SPECIFIC CITATION REQUIREMENTS:**\n";
  prompt += "**MANDATORY LANDMARK TRIAL INCLUSION:**\n";
  prompt += "Based on your query topic, you MUST proactively include relevant landmark trials even if not specifically mentioned in provided sources:\n\n";
  
  // Smoking cessation trials
  if (queryLower.includes('smoking cessation') || queryLower.includes('e-cigarette') || queryLower.includes('vaping') || 
      queryLower.includes('nicotine replacement') || queryLower.includes('quit smoking') || queryLower.includes('tobacco cessation')) {
    prompt += "**SMOKING CESSATION LANDMARK TRIALS REQUIRED:**\n";
    prompt += "- **Hajek et al. (NEJM 2019)** - PMID: 30699054 - E-cigarettes vs nicotine replacement therapy in UK randomized trial\n";
    prompt += "- **Cochrane Review 2024** - PMID: 39365845 - Systematic review of e-cigarettes for smoking cessation\n";
    prompt += "- **EAGLES Trial (NEJM 2016)** - PMID: 27120089 - Varenicline vs bupropion vs nicotine patch\n";
    prompt += "- **Walker et al. (NEJM 2020)** - PMID: 31893517 - Combination nicotine replacement therapy\n";
    prompt += "**KEY FINDINGS TO ADDRESS:**\n";
    prompt += "- Hajek trial: E-cigarettes 18% vs NRT 9.9% quit rate at 1 year (RR 1.83, 95% CI 1.30-2.58)\n";
    prompt += "- Cochrane 2024: Moderate-certainty evidence that e-cigarettes increase quit rates vs NRT\n";
    prompt += "- Policy controversy: FDA concerns vs harm reduction perspectives\n\n";
  }
  
  // Stroke prevention trials
  if (queryLower.includes('stroke') || queryLower.includes('anticoagul') || queryLower.includes('afib') || queryLower.includes('atrial fibrillation')) {
    prompt += "**STROKE PREVENTION LANDMARK TRIALS REQUIRED:**\n";
    prompt += "- **NAVIGATE ESUS** (PMID: 29129157) - Rivaroxaban vs aspirin in embolic stroke of undetermined source\n";
    prompt += "- **COMPASS** (PMID: 28844192) - Rivaroxaban plus aspirin in stable cardiovascular disease\n";
    prompt += "- **SPARCL** (PMID: 16899775) - Atorvastatin for stroke prevention after recent stroke/TIA\n";
    prompt += "- **RE-LY** (PMID: 19717844) - Dabigatran vs warfarin in atrial fibrillation\n";
    prompt += "- **ARISTOTLE** (PMID: 21870978) - Apixaban vs warfarin in atrial fibrillation\n\n";
  }
  
  // Check if query relates to specific cardiac conditions
  if (queryLower.includes('brugada') || queryLower.includes('sudden cardiac death') || queryLower.includes('arrhythmia')) {
    prompt += "**BRUGADA SYNDROME CITATIONS REQUIRED:**\n";
    prompt += "- Brugada P, Brugada J, Brugada R. 'Right bundle branch block and ST elevation in leads V1-V3: A marker for sudden death in young adults' (Circulation, 1998) - Original discovery paper\n";
    prompt += "- Antzelevitch C, Brugada P, Borggrefe M. 'Brugada syndrome: report of the second consensus conference' (Circulation, 2005) - Diagnostic criteria\n";
    prompt += "- Priori SG, Wilde AA, Horie M. 'HRS/EHRA/APHRS expert consensus statement on the diagnosis and management of patients with inherited primary arrhythmia syndromes' (Heart Rhythm, 2013)\n\n";
  }

  // Lipid management and cardiovascular prevention
  if (queryLower.includes('statin') || queryLower.includes('lipid') || queryLower.includes('cholesterol') || queryLower.includes('ldl')) {
    prompt += "**LIPID MANAGEMENT LANDMARK TRIALS REQUIRED:**\n";
    prompt += "- **4S Study** (PMID: 7968073) - Simvastatin survival study in coronary heart disease\n";
    prompt += "- **PROVE-IT TIMI 22** (PMID: 15007110) - Intensive vs moderate lipid lowering with statins\n";
    prompt += "- **FOURIER** (PMID: 28304224) - Evolocumab and cardiovascular outcomes\n";
    prompt += "- **JUPITER** (PMID: 18997196) - Rosuvastatin for primary prevention in low LDL/high CRP\n\n";
  }

  // Heart failure trials
  if (queryLower.includes('heart failure') || queryLower.includes('hfref') || queryLower.includes('hfpef') || queryLower.includes('ace inhibitor') || queryLower.includes('arb')) {
    prompt += "**HEART FAILURE LANDMARK TRIALS REQUIRED:**\n";
    prompt += "- **SOLVD** (PMID: 1463261) - Enalapril in patients with reduced ejection fraction\n";
    prompt += "- **MERIT-HF** (PMID: 10320666) - Metoprolol in chronic heart failure\n";
    prompt += "- **PARADIGM-HF** (PMID: 25176015) - Sacubitril-valsartan vs enalapril in heart failure\n";
    prompt += "- **DAPA-HF** (PMID: 31535829) - Dapagliflozin in patients with heart failure and reduced ejection fraction\n\n";
  }

  // Diabetes management trials
  if (queryLower.includes('diabetes') || queryLower.includes('metformin') || queryLower.includes('sglt2') || queryLower.includes('glp-1') || queryLower.includes('insulin')) {
    prompt += "**DIABETES LANDMARK TRIALS REQUIRED:**\n";
    prompt += "- **UKPDS** (PMID: 9742976) - Intensive blood-glucose control with sulphonylureas or insulin\n";
    prompt += "- **EMPA-REG OUTCOME** (PMID: 26378978) - Empagliflozin cardiovascular outcomes\n";
    prompt += "- **LEADER** (PMID: 27510157) - Liraglutide and cardiovascular outcomes in type 2 diabetes\n";
    prompt += "- **ACCORD** (PMID: 18539917) - Intensive glucose lowering in type 2 diabetes\n\n";
  }

  // Hypertension trials
  if (queryLower.includes('hypertension') || queryLower.includes('blood pressure') || queryLower.includes('antihypertensive') || queryLower.includes('amlodipine')) {
    prompt += "**HYPERTENSION LANDMARK TRIALS REQUIRED:**\n";
    prompt += "- **ALLHAT** (PMID: 12479763) - Antihypertensive and Lipid-Lowering Treatment to Prevent Heart Attack Trial\n";
    prompt += "- **SPRINT** (PMID: 26551272) - Systolic Blood Pressure Intervention Trial\n";
    prompt += "- **ASCOT** (PMID: 16943563) - Anglo-Scandinavian Cardiac Outcomes Trial\n";
    prompt += "- **VALUE** (PMID: 15364186) - Valsartan Antihypertensive Long-term Use Evaluation\n\n";
  }
  
  if (queryLower.includes('long qt') || queryLower.includes('lqts') || queryLower.includes('torsades')) {
    prompt += "**LONG QT SYNDROME CITATIONS REQUIRED:**\n";
    prompt += "- Schwartz PJ, Moss AJ, Vincent GM, Crampton RS. 'Diagnostic criteria for the long QT syndrome' (Circulation, 1993) - Schwartz Score\n";
    prompt += "- Priori SG, Schwartz PJ, Napolitano C. 'Risk stratification in the long-QT syndrome' (N Engl J Med, 2003) - Risk assessment\n";
    prompt += "- Roden DM. 'Clinical practice. Long-QT syndrome' (N Engl J Med, 2008) - Comprehensive clinical review\n\n";
  }
  
  if (queryLower.includes('cpvt') || queryLower.includes('catecholaminergic polymorphic ventricular tachycardia')) {
    prompt += "**CPVT CITATIONS REQUIRED:**\n";
    prompt += "- Priori SG, Napolitano C, Tiso N. 'Mutations in the cardiac ryanodine receptor gene (hRyR2) underlie catecholaminergic polymorphic ventricular tachycardia' (Circulation, 2001) - Genetic basis\n";
    prompt += "- van der Werf C, Kannankeril PJ, Sacher F. 'Flecainide therapy reduces exercise-induced ventricular arrhythmias in patients with catecholaminergic polymorphic ventricular tachycardia' (J Am Coll Cardiol, 2011) - Treatment\n";
    prompt += "- Hayashi M, Denjoy I, Extramiana F. 'Incidence and risk factors of arrhythmic events in catecholaminergic polymorphic ventricular tachycardia' (Circulation, 2009) - Prognosis\n\n";
  }

  if (queryLower.includes('cac') || queryLower.includes('calcium score') || queryLower.includes('stress test') || 
      (queryLower.includes('coronary') && (queryLower.includes('calcium') || queryLower.includes('stress')))) {
    prompt += "**CARDIOVASCULAR IMAGING COMPARISON CITATIONS REQUIRED:**\n";
    prompt += "- Detrano R, Guerci AD, Carr JJ. 'Coronary calcium as a predictor of coronary events in four racial or ethnic groups' (MESA Study - NEJM, 2008) PMID: 18305265 - Landmark CAC prognostic study\n";
    prompt += "- Douglas PS, Hoffmann U, Patel MR. 'Outcomes of anatomical versus functional testing for coronary artery disease' (PROMISE Trial - NEJM, 2015) PMID: 25773919 - Direct CAC/CCTA vs stress testing RCT\n";
    prompt += "- Newby DE, Adamson PD, Berry C. 'Coronary CT angiography and 5-year risk of myocardial infarction' (SCOT-HEART - NEJM, 2018) PMID: 30145972 - CT angiography outcomes study\n";
    prompt += "- Budoff MJ, Shaw LJ, Liu ST. 'Long-term prognosis associated with coronary calcification' (JACC, 2007) PMID: 17222726 - CAC prognostic value\n";
    prompt += "- Hecht HS, Cronin P, Blaha MJ. 'ACC/AHA versus ESC coronary artery calcium scoring' (JACC Cardiovasc Imaging, 2015) PMID: 25890584 - CAC guidelines comparison\n";
    prompt += "- Min JK, Leipsic J, Pencina MJ. 'Diagnostic accuracy of fractional flow reserve from anatomic CT angiography' (CONFIRM Registry - JAMA, 2012) PMID: 22474203 - CCTA diagnostic accuracy\n\n";
  }
  
  // Add simple explanation requirements
  prompt += "**SIMPLE EXPLANATION REQUIREMENTS:**\n";
  prompt += "For any complex medical terms or conditions mentioned, provide a collapsible 'Simple Explanation' section using this format:\n";
  prompt += "```\n";
  prompt += "**Simple Explanation:** [Medical Term]\n";
  prompt += "[Easy-to-understand explanation in everyday language for students or non-clinicians]\n";
  prompt += "```\n\n";
  
  // Add visualization requirements
  prompt += "**VISUALIZATION REQUIREMENTS:**\n";
  prompt += "When presenting data that could benefit from visual representation, include a suggestion like:\n";
  prompt += "```\n";
  prompt += "**📊 Suggested Visualization:**\n";
  prompt += "Type: [pie chart/bar chart/flowchart/pyramid]\n";
  prompt += "Title: [Chart title]\n";
  prompt += "Data: [Key data points with percentages or values]\n";
  prompt += "```\n\n";

  return prompt;
}

/**
 * Assess evidence level of a study based on title and design
 */
function getEvidenceLevel(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('meta-analysis') || titleLower.includes('systematic review')) {
    return 'Level 1 (High) - Meta-analysis/Systematic Review';
  } else if (titleLower.includes('randomized') || titleLower.includes('controlled trial') || titleLower.includes('rct')) {
    return 'Level 2 (Moderate) - Randomized Controlled Trial';
  } else if (titleLower.includes('registry') || titleLower.includes('national database') || titleLower.includes('surveillance')) {
    return 'Level 2 (Moderate-High) - Registry/Database Study';
  } else if (titleLower.includes('autopsy') || titleLower.includes('pathological') || titleLower.includes('forensic')) {
    return 'Level 3 (Moderate) - Autopsy/Pathological Study';
  } else if (titleLower.includes('cohort') || titleLower.includes('longitudinal') || titleLower.includes('prospective')) {
    return 'Level 3 (Moderate) - Cohort Study';
  } else if (titleLower.includes('case-control') || titleLower.includes('cross-sectional') || titleLower.includes('retrospective')) {
    return 'Level 4 (Low) - Case-Control/Cross-sectional';
  } else if (titleLower.includes('case report') || titleLower.includes('case series')) {
    return 'Level 5 (Very Low) - Case Report/Series';
  } else if (titleLower.includes('guideline') || titleLower.includes('consensus') || titleLower.includes('expert')) {
    return 'Level 3 (Moderate) - Clinical Guideline/Expert Consensus';
  } else {
    return 'Level 4 (Low) - Observational Study';
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
  if (title.includes('registry') || title.includes('national database')) {
    quality.push('Large population registry');
  }
  if (title.includes('autopsy') || title.includes('pathological')) {
    quality.push('Definitive pathological diagnosis');
  }
  if (title.includes('maron') || title.includes('pelliccia') || title.includes('cardiac')) {
    quality.push('Cardiac expertise');
  }
  if (paper.year && paper.year >= 2020) {
    quality.push('Recent evidence');
  }
  if (title.includes('guideline') || title.includes('consensus')) {
    quality.push('Expert consensus');
  }
  
  return quality.length > 0 ? quality.join(', ') : 'Standard observational study';
}

/**
 * Generate GRADE confidence rating based on study design and quality - ENHANCED VERSION
 */
function getGRADEConfidence(paper: Citation): string {
  const title = (paper.title || '').toLowerCase();
  const year = paper.year || 2000;
  
  // Start with base confidence based on study design - MORE STRINGENT
  let confidence = 1; // Start with low confidence by default
  
  // Increase confidence for high-quality designs
  if (title.includes('meta-analysis') || title.includes('systematic review')) {
    confidence = 4; // High confidence
  } else if (title.includes('randomized controlled trial') || title.includes('rct')) {
    confidence = 3; // Moderate-high confidence
  } else if (title.includes('registry') || title.includes('national database') || title.includes('surveillance')) {
    confidence = 2; // Moderate confidence - large population data
  } else if (title.includes('autopsy') || title.includes('pathological')) {
    confidence = 2; // Moderate confidence - definitive diagnosis
  } else if (title.includes('cohort') || title.includes('prospective')) {
    confidence = 2; // Moderate confidence
  } else if (title.includes('case-control') || title.includes('cross-sectional')) {
    confidence = 1; // Low confidence
  } else if (title.includes('case report') || title.includes('case series')) {
    confidence = 0; // Very low confidence
  } else if (title.includes('guideline') || title.includes('consensus')) {
    confidence = 3; // Moderate-high confidence - expert consensus
  } else if (title.includes('fda') || title.includes('adverse event')) {
    confidence = 0; // Very low confidence for safety reports
  }
  
  // Adjust for study quality factors
  if (title.includes('double-blind') || title.includes('placebo-controlled')) {
    confidence = Math.min(4, confidence + 1);
  }
  
  // Bonus for landmark trials - check for specific trial names
  const landmarkTrials = ['navigate esus', 'compass', 'sparcl', 'aristotle', 'rely', 'paradigm', 'fourier', 'jupiter', 'mesa', 'promise', 'scot-heart'];
  if (landmarkTrials.some(trial => title.includes(trial))) {
    confidence = Math.min(4, confidence + 1);
  }
  
  // Penalty for very old studies unless landmark
  if (year < 2010 && !landmarkTrials.some(trial => title.includes(trial))) {
    confidence = Math.max(0, confidence - 1);
  }
  
  // Bonus for recent high-quality evidence
  if (year >= 2020 && confidence >= 3) {
    confidence = Math.min(4, confidence + 0.5);
  }
  
  // Round to nearest integer
  confidence = Math.round(confidence);
  
  // Convert to descriptive rating with more specific justification
  switch (confidence) {
    case 4: return 'HIGH (95%+ confidence) - RCT/Meta-analysis with low risk of bias';
    case 3: return 'MODERATE (75-95% confidence) - RCT with some limitations or high-quality observational';
    case 2: return 'LOW (50-75% confidence) - Observational studies with significant limitations';
    case 1: return 'VERY LOW (25-50% confidence) - Case series or studies with major limitations';
    case 0: return 'VERY LOW (<25% confidence) - Case reports or safety surveillance only';
    default: return 'VERY LOW (<25% confidence) - Insufficient evidence quality';
  }
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
  // Reasoning process hidden from user view - users don't want to see technical reasoning
  return '';
}

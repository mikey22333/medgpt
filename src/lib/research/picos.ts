/**
 * Extract PICOS elements from medical literature text
 * PICOS = Population, Intervention, Comparison, Outcome, Study design
 */

export interface PICOS {
  population?: string;
  intervention?: string;
  comparator?: string;
  outcome?: string;
  studyDesign?: string;
}

/**
 * Extract PICOS elements from abstract or full text
 * This is a simplified implementation using pattern matching
 */
export function extractPICOS(text: string): PICOS {
  if (!text) return {};
  
  const picos: PICOS = {};
  const lowerText = text.toLowerCase();
  
  // Extract population (often starts with phrases like "patients with")
  const populationMatch = text.match(/([A-Z][^.!?]*\b(?:patients?|subjects?|participants?|individuals?|cases?)\b[^.!?]*[.!?])/);
  if (populationMatch) {
    picos.population = populationMatch[0].trim();
  }
  
  // Extract intervention (look for treatment or exposure)
  const interventionMatch = text.match(/([A-Z][^.!?]*\b(?:treatment|therapy|intervention|exposure|regimen|dose|drug|medication|procedure)\b[^.!?]*[.!?])/i);
  if (interventionMatch) {
    picos.intervention = interventionMatch[0].trim();
  }
  
  // Extract comparator (look for vs, versus, compared to, etc.)
  const comparatorMatch = text.match(/([A-Z][^.!?]*\b(?:vs\.?|versus|compared\s+to|versus\s+placebo|versus\s+control)[^.!?]*[.!?])/i);
  if (comparatorMatch) {
    picos.comparator = comparatorMatch[0].trim();
  }
  
  // Extract outcome (look for primary/secondary outcomes)
  const outcomeMatch = text.match(/([A-Z][^.!?]*\b(?:primary|secondary|main|primary\s+outcome|secondary\s+outcome|endpoint|efficacy|safety)[^.!?]*[.!?])/i);
  if (outcomeMatch) {
    picos.outcome = outcomeMatch[0].trim();
  }
  
  // Extract study design
  const designMatch = text.match(/([A-Z][^.!?]*\b(randomized|double-?blind|placebo-?controlled|multicenter|prospective|retrospective|cohort|case-?control|cross-?sectional|meta-?analysis|systematic\s+review)[^.!?]*[.!?])/i);
  if (designMatch) {
    picos.studyDesign = designMatch[0].trim();
  }
  
  // If we couldn't extract study design, try to infer from common patterns
  if (!picos.studyDesign) {
    if (lowerText.includes('randomized') || lowerText.includes('randomised')) {
      picos.studyDesign = 'Randomized controlled trial';
    } else if (lowerText.includes('cohort')) {
      picos.studyDesign = 'Cohort study';
    } else if (lowerText.includes('case-control') || lowerText.includes('case control')) {
      picos.studyDesign = 'Case-control study';
    } else if (lowerText.includes('meta-analysis') || lowerText.includes('metaanalysis')) {
      picos.studyDesign = 'Meta-analysis';
    } else if (lowerText.includes('systematic review')) {
      picos.studyDesign = 'Systematic review';
    }
  }
  
  return picos;
}

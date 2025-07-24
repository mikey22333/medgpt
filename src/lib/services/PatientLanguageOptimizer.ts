export interface SimplificationResult {
  simplifiedText: string;
  readingLevel: number;
  improvements: string[];
  originalComplexity: number;
  complexTermsReplaced: { [original: string]: string };
}

export class PatientLanguageOptimizer {
  private medicalTerms: { [complex: string]: string } = {
    // Cardiovascular terms
    'cardiovascular': 'heart and blood vessel',
    'myocardial infarction': 'heart attack',
    'ejection fraction': 'how well your heart pumps',
    'hypertension': 'high blood pressure',
    'hypotension': 'low blood pressure',
    'arrhythmia': 'irregular heartbeat',
    'atrial fibrillation': 'irregular heartbeat',
    'coronary artery disease': 'blocked heart arteries',
    'heart failure': 'weak heart muscle',
    'angina': 'chest pain from heart',
    'pericarditis': 'heart lining swelling',
    'cardiomyopathy': 'heart muscle disease',
    
    // General medical terms
    'hospitalization': 'going to the hospital',
    'mortality': 'death',
    'morbidity': 'illness',
    'efficacy': 'how well it works',
    'adverse effects': 'bad side effects',
    'contraindication': 'reason not to use',
    'dosage': 'amount of medicine',
    'therapeutic': 'healing',
    'diagnosis': 'finding out what\'s wrong',
    'prognosis': 'what will likely happen',
    'chronic': 'long-lasting',
    'acute': 'sudden and severe',
    'systemic': 'affecting the whole body',
    'localized': 'in one area',
    'benign': 'not harmful',
    'malignant': 'harmful or cancerous',
    
    // Diabetes terms
    'hyperglycemia': 'high blood sugar',
    'hypoglycemia': 'low blood sugar',
    'insulin resistance': 'body not using insulin well',
    'diabetic ketoacidosis': 'dangerous high blood sugar',
    'neuropathy': 'nerve damage',
    'retinopathy': 'eye damage from diabetes',
    'nephropathy': 'kidney damage from diabetes',
    
    // Research terms
    'randomized controlled trial': 'careful study',
    'systematic review': 'study of many studies',
    'meta-analysis': 'combining study results',
    'cohort study': 'following people over time',
    'case-control study': 'comparing people with and without disease',
    'placebo': 'fake medicine for comparison',
    'double-blind': 'neither patient nor doctor knows which treatment',
    'statistically significant': 'likely a real difference',
    'confidence interval': 'range of likely results',
    'hazard ratio': 'risk comparison',
    'odds ratio': 'chance comparison',
    
    // Medication terms
    'pharmaceutical': 'medicine',
    'pharmacological': 'medicine-related',
    'administration': 'taking medicine',
    'contraindicated': 'should not be used',
    'indicated': 'recommended for use',
    'therapeutic range': 'safe and effective amount',
    'bioavailability': 'how much gets into your body',
    'half-life': 'how long medicine stays active',
    
    // Anatomy terms
    'hepatic': 'liver',
    'renal': 'kidney',
    'pulmonary': 'lung',
    'gastrointestinal': 'stomach and intestines',
    'neurological': 'brain and nerve',
    'musculoskeletal': 'muscle and bone',
    'dermatological': 'skin',
    'ophthalmological': 'eye',
    'otolaryngological': 'ear, nose, and throat'
  };

  private complexPhrases: { [complex: string]: string } = {
    'reduce the risk of': 'lower the chance of',
    'increase the likelihood of': 'make more likely',
    'demonstrate efficacy': 'show it works',
    'clinical significance': 'important for patients',
    'adverse event': 'bad thing that happened',
    'therapeutic benefit': 'helpful effect',
    'contraindicated in patients with': 'should not be used by people who have',
    'recommended for patients who': 'good for people who',
    'monitor for signs of': 'watch for signs of',
    'discontinue treatment': 'stop taking medicine',
    'initiate therapy': 'start treatment',
    'optimize dosing': 'find the best amount',
    'titrate dose': 'adjust the amount slowly'
  };

  async simplifyForPatients(text: string): Promise<SimplificationResult> {
    const originalComplexity = this.calculateFleschKincaid(text);
    const improvements: string[] = [];
    const complexTermsReplaced: { [original: string]: string } = {};
    
    let simplifiedText = text;

    // Replace complex phrases first (longer replacements)
    for (const [complex, simple] of Object.entries(this.complexPhrases)) {
      const regex = new RegExp(complex, 'gi');
      if (simplifiedText.match(regex)) {
        simplifiedText = simplifiedText.replace(regex, simple);
        complexTermsReplaced[complex] = simple;
        improvements.push(`Simplified phrase: "${complex}" → "${simple}"`);
      }
    }

    // Replace medical terms
    for (const [complex, simple] of Object.entries(this.medicalTerms)) {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      if (simplifiedText.match(regex)) {
        simplifiedText = simplifiedText.replace(regex, simple);
        complexTermsReplaced[complex] = simple;
        improvements.push(`Medical term: "${complex}" → "${simple}"`);
      }
    }

    // Simplify sentence structure
    simplifiedText = this.simplifySentenceStructure(simplifiedText);
    
    // Break up long sentences
    simplifiedText = this.breakLongSentences(simplifiedText);
    
    // Use active voice
    simplifiedText = this.convertToActiveVoice(simplifiedText);
    
    // Add explanatory context
    simplifiedText = this.addExplanatoryContext(simplifiedText);

    const finalComplexity = this.calculateFleschKincaid(simplifiedText);

    return {
      simplifiedText,
      readingLevel: finalComplexity,
      improvements,
      originalComplexity,
      complexTermsReplaced
    };
  }

  calculateFleschKincaid(text: string): number {
    const sentences = this.countSentences(text);
    const words = this.countWords(text);
    const syllables = this.countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  private countSentences(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length;
  }

  private countWords(text: string): number {
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    return words.length;
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    words.forEach(word => {
      // Remove punctuation
      word = word.replace(/[^a-z]/g, '');
      if (word.length === 0) return;

      // Count vowel groups
      let syllables = 0;
      let previousWasVowel = false;
      
      for (let i = 0; i < word.length; i++) {
        const isVowel = 'aeiouy'.includes(word[i]);
        if (isVowel && !previousWasVowel) {
          syllables++;
        }
        previousWasVowel = isVowel;
      }

      // Adjust for silent 'e'
      if (word.endsWith('e') && syllables > 1) {
        syllables--;
      }

      // Every word has at least 1 syllable
      totalSyllables += Math.max(syllables, 1);
    });

    return totalSyllables;
  }

  private simplifySentenceStructure(text: string): string {
    // Replace complex conjunctions
    text = text.replace(/\bhowever\b/gi, 'but');
    text = text.replace(/\btherefore\b/gi, 'so');
    text = text.replace(/\bmoreover\b/gi, 'also');
    text = text.replace(/\bfurthermore\b/gi, 'also');
    text = text.replace(/\bnevertheless\b/gi, 'but');
    text = text.replace(/\bconsequently\b/gi, 'so');
    
    // Simplify relative clauses
    text = text.replace(/\bwhich is\b/gi, 'that is');
    text = text.replace(/\bin which\b/gi, 'where');
    
    return text;
  }

  private breakLongSentences(text: string): string {
    const sentences = text.split(/([.!?]+)/);
    const processedSentences: string[] = [];

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '';
      
      if (!sentence || sentence.trim().length === 0) {
        processedSentences.push(sentence + punctuation);
        continue;
      }

      const words = sentence.trim().split(/\s+/);
      
      // Break sentences longer than 20 words
      if (words.length > 20) {
        const breakPoints = this.findNaturalBreakPoints(sentence);
        if (breakPoints.length > 0) {
          const parts = this.splitAtBreakPoints(sentence, breakPoints);
          processedSentences.push(parts.join('. ') + punctuation);
        } else {
          processedSentences.push(sentence + punctuation);
        }
      } else {
        processedSentences.push(sentence + punctuation);
      }
    }

    return processedSentences.join('');
  }

  private findNaturalBreakPoints(sentence: string): number[] {
    const breakPoints: number[] = [];
    const words = sentence.split(/\s+/);
    
    // Look for conjunctions and transition words
    const conjunctions = ['and', 'but', 'or', 'because', 'since', 'while', 'although', 'if'];
    
    for (let i = 1; i < words.length - 1; i++) {
      if (conjunctions.includes(words[i].toLowerCase().replace(/[^\w]/g, ''))) {
        breakPoints.push(i);
      }
    }
    
    return breakPoints;
  }

  private splitAtBreakPoints(sentence: string, breakPoints: number[]): string[] {
    const words = sentence.split(/\s+/);
    const parts: string[] = [];
    let lastBreak = 0;
    
    // Split at the first good break point after word 15
    for (const breakPoint of breakPoints) {
      if (breakPoint > 15) {
        parts.push(words.slice(lastBreak, breakPoint).join(' ').trim());
        parts.push(words.slice(breakPoint).join(' ').trim());
        break;
      }
    }
    
    if (parts.length === 0) {
      // No good break point found, split at midpoint
      const midpoint = Math.floor(words.length / 2);
      parts.push(words.slice(0, midpoint).join(' ').trim());
      parts.push(words.slice(midpoint).join(' ').trim());
    }
    
    return parts.filter(part => part.length > 0);
  }

  private convertToActiveVoice(text: string): string {
    // Simple passive to active voice conversions
    text = text.replace(/was (\w+ed) by/gi, (match, verb) => {
      return verb.replace(/ed$/, 's');
    });
    
    text = text.replace(/is recommended/gi, 'doctors recommend');
    text = text.replace(/was found/gi, 'researchers found');
    text = text.replace(/was observed/gi, 'doctors saw');
    text = text.replace(/was reported/gi, 'patients reported');
    
    return text;
  }

  private addExplanatoryContext(text: string): string {
    // Add context for numbers and percentages
    text = text.replace(/(\d+)%/g, '$1 out of 100 people');
    text = text.replace(/1 in (\d+)/g, '1 out of every $1 people');
    
    // Add context for time periods
    text = text.replace(/\bq\.?d\.?\b/gi, 'once a day');
    text = text.replace(/\bb\.?i\.?d\.?\b/gi, 'twice a day');
    text = text.replace(/\bt\.?i\.?d\.?\b/gi, 'three times a day');
    text = text.replace(/\bq\.?i\.?d\.?\b/gi, 'four times a day');
    
    return text;
  }

  // Validate reading level meets target
  validateReadingLevel(text: string, targetLevel = 6): {
    meetsTarget: boolean;
    currentLevel: number;
    suggestions: string[];
  } {
    const currentLevel = this.calculateFleschKincaid(text);
    const meetsTarget = currentLevel <= targetLevel;
    const suggestions: string[] = [];

    if (!meetsTarget) {
      if (currentLevel > targetLevel + 2) {
        suggestions.push('Text is significantly above target reading level');
        suggestions.push('Consider breaking long sentences into shorter ones');
        suggestions.push('Replace more complex medical terms with simpler alternatives');
      } else if (currentLevel > targetLevel) {
        suggestions.push('Text is slightly above target reading level');
        suggestions.push('Consider simplifying a few more complex terms');
      }
    }

    return {
      meetsTarget,
      currentLevel,
      suggestions
    };
  }

  // Get reading level description
  getReadingLevelDescription(level: number): string {
    if (level <= 6) return 'Elementary school level (6th grade or below)';
    if (level <= 8) return 'Middle school level (7th-8th grade)';
    if (level <= 10) return 'High school level (9th-10th grade)';
    if (level <= 12) return 'High school graduate level (11th-12th grade)';
    if (level <= 16) return 'College level (13th-16th grade)';
    return 'Graduate level (17th grade and above)';
  }

  // Batch process multiple texts
  async simplifyMultipleTexts(texts: string[]): Promise<SimplificationResult[]> {
    return Promise.all(texts.map(text => this.simplifyForPatients(text)));
  }

  // Get complexity statistics
  getComplexityStatistics(text: string): {
    averageWordsPerSentence: number;
    averageSyllablesPerWord: number;
    complexWordCount: number;
    longSentenceCount: number;
  } {
    const sentences = this.countSentences(text);
    const words = this.countWords(text);
    const syllables = this.countSyllables(text);
    
    const wordArray = text.split(/\s+/);
    const complexWordCount = wordArray.filter(word => 
      this.countSyllables(word) >= 3 || 
      Object.keys(this.medicalTerms).some(term => 
        word.toLowerCase().includes(term.toLowerCase())
      )
    ).length;

    const sentenceArray = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentenceCount = sentenceArray.filter(sentence => 
      sentence.split(/\s+/).length > 20
    ).length;

    return {
      averageWordsPerSentence: sentences > 0 ? words / sentences : 0,
      averageSyllablesPerWord: words > 0 ? syllables / words : 0,
      complexWordCount,
      longSentenceCount
    };
  }
}

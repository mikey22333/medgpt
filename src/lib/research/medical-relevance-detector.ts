// Enhanced medical relevance detection system
export class MedicalRelevanceDetector {
  private static readonly IRRELEVANT_TERMS = [
    // Medical specialties that are often irrelevant to general queries
    'testicular rupture', 'scrotal trauma', 'testicular trauma',
    'endocannabinoid', 'cannabinoid receptor',
    
    // Drug-specific terms when not asking about drugs
    'empagliflozin', 'dapagliflozin', 'farxiga', 'jardiance',
    'mirena', 'intrauterine device', 'contraceptive',
    
    // Non-medical domains
    'bibliometric analysis', 'citation analysis', 'scopus database',
    'web of science', 'publication trends', 'research metrics',
    'social media', 'twitter', 'facebook', 'instagram',
    'business model', 'marketing strategy', 'economic analysis',
    'financial performance', 'stock price', 'market share',
    'computer science', 'machine learning', 'artificial intelligence',
    'data mining', 'algorithm', 'software development',
    'pure mathematics', 'theoretical physics', 'quantum mechanics',
    
    // Veterinary medicine (unless specifically asked)
    'veterinary', 'animal model', 'mouse model', 'rat model',
    'canine', 'feline', 'bovine', 'porcine', 'equine'
  ];

  private static readonly HIGH_RELEVANCE_INDICATORS = [
    // Study types
    'randomized controlled trial', 'systematic review', 'meta-analysis',
    'clinical trial', 'cohort study', 'case-control study',
    
    // Medical contexts
    'clinical practice', 'patient care', 'treatment outcome',
    'diagnostic accuracy', 'therapeutic intervention',
    'adverse events', 'side effects', 'contraindications',
    
    // Evidence quality
    'cochrane review', 'practice guideline', 'clinical guideline',
    'evidence-based', 'grade recommendation'
  ];

  private static readonly MEDICAL_SPECIALTIES = [
    'cardiology', 'oncology', 'neurology', 'psychiatry', 'pulmonology',
    'gastroenterology', 'endocrinology', 'nephrology', 'rheumatology',
    'infectious disease', 'immunology', 'dermatology', 'ophthalmology',
    'otolaryngology', 'orthopedics', 'surgery', 'anesthesiology',
    'radiology', 'pathology', 'pediatrics', 'geriatrics', 'obstetrics',
    'gynecology', 'urology', 'emergency medicine', 'family medicine'
  ];

  static calculateRelevanceScore(
    title: string, 
    abstract: string, 
    journal: string, 
    query: string
  ): {
    score: number;
    reasons: string[];
    isIrrelevant: boolean;
  } {
    const combinedText = `${title} ${abstract} ${journal}`.toLowerCase();
    const queryLower = query.toLowerCase();
    let score = 0.5; // Base score
    const reasons: string[] = [];

    // Check for irrelevant terms (major penalty)
    const irrelevantMatches = this.IRRELEVANT_TERMS.filter(term => 
      combinedText.includes(term.toLowerCase())
    );
    
    if (irrelevantMatches.length > 0) {
      score -= 0.8;
      reasons.push(`Contains irrelevant terms: ${irrelevantMatches.join(', ')}`);
    }

    // Check if it's a drug label when not asking about drugs/medications
    const isDrugQuery = queryLower.includes('drug') || 
                       queryLower.includes('medication') || 
                       queryLower.includes('pharmaceutical');
    
    if (journal.toLowerCase().includes('fda drug label') && !isDrugQuery) {
      score -= 0.6;
      reasons.push('FDA drug label for non-drug query');
    }

    // Query term matching (positive scoring)
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 3);
    let matchedTerms = 0;
    
    for (const term of queryTerms) {
      if (combinedText.includes(term)) {
        matchedTerms++;
        score += 0.1;
      }
    }
    
    if (matchedTerms > 0) {
      reasons.push(`Matches ${matchedTerms}/${queryTerms.length} query terms`);
    }

    // High relevance indicators
    const highRelevanceMatches = this.HIGH_RELEVANCE_INDICATORS.filter(indicator =>
      combinedText.includes(indicator.toLowerCase())
    );
    
    if (highRelevanceMatches.length > 0) {
      score += 0.3;
      reasons.push(`High-quality study type: ${highRelevanceMatches.join(', ')}`);
    }

    // Medical specialty relevance
    const specialtyMatches = this.MEDICAL_SPECIALTIES.filter(specialty =>
      combinedText.includes(specialty.toLowerCase()) || 
      queryLower.includes(specialty.toLowerCase())
    );
    
    if (specialtyMatches.length > 0) {
      score += 0.2;
      reasons.push(`Relevant medical specialty: ${specialtyMatches.join(', ')}`);
    }

    // Journal quality assessment
    const highImpactJournals = [
      'new england journal of medicine', 'nejm', 'lancet', 'jama',
      'nature', 'science', 'cell', 'plos medicine', 'british medical journal',
      'bmj', 'annals of internal medicine', 'cochrane'
    ];
    
    if (highImpactJournals.some(journal_name => 
      journal.toLowerCase().includes(journal_name)
    )) {
      score += 0.15;
      reasons.push('Published in high-impact journal');
    }

    // Normalize score to 0-1 range
    score = Math.max(0, Math.min(1, score));

    // Determine if paper is irrelevant
    const isIrrelevant = score < 0.3 || irrelevantMatches.length > 0;

    return {
      score,
      reasons,
      isIrrelevant
    };
  }

  static filterRelevantPapers(papers: any[], query: string, threshold: number = 0.4): {
    relevant: any[];
    irrelevant: any[];
    report: string;
  } {
    const relevant: any[] = [];
    const irrelevant: any[] = [];
    const analysisReport: string[] = [];

    for (const paper of papers) {
      const analysis = this.calculateRelevanceScore(
        paper.title || '',
        paper.abstract || '',
        paper.journal || '',
        query
      );

      if (analysis.isIrrelevant || analysis.score < threshold) {
        irrelevant.push({
          ...paper,
          relevanceScore: analysis.score,
          irrelevanceReasons: analysis.reasons
        });
        analysisReport.push(
          `❌ FILTERED: "${paper.title}" (Score: ${Math.round(analysis.score * 100)}%) - ${analysis.reasons.join('; ')}`
        );
      } else {
        relevant.push({
          ...paper,
          relevanceScore: analysis.score,
          relevanceReasons: analysis.reasons
        });
        analysisReport.push(
          `✅ INCLUDED: "${paper.title}" (Score: ${Math.round(analysis.score * 100)}%) - ${analysis.reasons.join('; ')}`
        );
      }
    }

    const report = [
      `🔍 RELEVANCE ANALYSIS FOR QUERY: "${query}"`,
      `📊 RESULTS: ${relevant.length} relevant, ${irrelevant.length} irrelevant papers`,
      `📋 DETAILED ANALYSIS:`,
      ...analysisReport,
      `🎯 FILTERING THRESHOLD: ${Math.round(threshold * 100)}%`
    ].join('\n');

    return {
      relevant,
      irrelevant,
      report
    };
  }

  static generateFallbackStrategy(query: string, failedAttempts: number): {
    modifiedQuery: string;
    searchSources: string[];
    strategy: string;
  } {
    const strategies = [
      {
        name: "Broaden with Synonyms",
        modifyQuery: (q: string) => this.expandWithMedicalSynonyms(q),
        sources: ["PubMed", "Semantic Scholar"]
      },
      {
        name: "Simplify to Key Terms",
        modifyQuery: (q: string) => this.extractMedicalKeyTerms(q),
        sources: ["Semantic Scholar", "CrossRef"]
      },
      {
        name: "Add Medical Context",
        modifyQuery: (q: string) => `${q} medicine clinical`,
        sources: ["Europe PMC", "CrossRef"]
      },
      {
        name: "Emergency Broad Search",
        modifyQuery: (q: string) => this.extractMedicalKeyTerms(q).split(' ')[0],
        sources: ["Semantic Scholar"]
      }
    ];

    const strategy = strategies[Math.min(failedAttempts, strategies.length - 1)];
    
    return {
      modifiedQuery: strategy.modifyQuery(query),
      searchSources: strategy.sources,
      strategy: strategy.name
    };
  }

  private static expandWithMedicalSynonyms(query: string): string {
    const synonymMap: Record<string, string[]> = {
      'tuberculosis': ['TB', 'tuberculous infection', 'mycobacterial infection'],
      'BCG': ['Bacillus Calmette-Guérin', 'BCG vaccine'],
      'heart disease': ['cardiovascular disease', 'cardiac disease', 'coronary disease'],
      'diabetes': ['diabetes mellitus', 'diabetic', 'hyperglycemia'],
      'hypertension': ['high blood pressure', 'elevated blood pressure'],
      'infection': ['infectious disease', 'bacterial infection', 'viral infection']
    };

    let expandedQuery = query;
    for (const [term, synonyms] of Object.entries(synonymMap)) {
      if (query.toLowerCase().includes(term.toLowerCase())) {
        expandedQuery += ` OR ${synonyms.join(' OR ')}`;
      }
    }

    return expandedQuery;
  }

  private static extractMedicalKeyTerms(query: string): string {
    const medicalTerms = query.toLowerCase().split(/\s+/).filter(term =>
      term.length > 3 &&
      !['what', 'how', 'when', 'where', 'why', 'does', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(term)
    );

    return medicalTerms.slice(0, 3).join(' ');
  }
}

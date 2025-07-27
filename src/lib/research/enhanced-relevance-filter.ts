/**
 * Enhanced Medical Relevance Filter
 * Fixes the core issue of irrelevant citations by implementing smarter filtering
 */

interface RelevanceResult {
  score: number;
  isRelevant: boolean;
  reasons: string[];
  medicalRelevance: number;
  queryAlignment: number;
  evidenceQuality: number;
}

export class EnhancedMedicalRelevanceFilter {
  
  // Main relevance scoring function
  static assessRelevance(
    title: string,
    abstract: string,
    journal: string,
    query: string,
    authors?: string[]
  ): RelevanceResult {
    
    const result: RelevanceResult = {
      score: 0,
      isRelevant: false,
      reasons: [],
      medicalRelevance: 0,
      queryAlignment: 0,
      evidenceQuality: 0
    };

    // 1. Medical Relevance Score (40% of total)
    result.medicalRelevance = this.calculateMedicalRelevance(title, abstract, journal);
    
    // 2. Query Alignment Score (40% of total)
    result.queryAlignment = this.calculateQueryAlignment(title, abstract, query);
    
    // 3. Evidence Quality Score (20% of total)
    result.evidenceQuality = this.calculateEvidenceQuality(title, abstract, journal, authors);

    // Calculate weighted final score
    result.score = (
      result.medicalRelevance * 0.4 +
      result.queryAlignment * 0.4 +
      result.evidenceQuality * 0.2
    );

    // Determine if relevant (threshold: 0.5)
    result.isRelevant = result.score >= 0.5;

    // Generate explanation
    result.reasons = this.generateExplanation(result);

    return result;
  }

  // Calculate how medically relevant the paper is
  private static calculateMedicalRelevance(title: string, abstract: string, journal: string): number {
    const text = `${title} ${abstract}`.toLowerCase();
    const journalLower = journal.toLowerCase();
    
    let score = 0.3; // Base medical relevance

    // High-quality medical journals (major boost)
    const topMedicalJournals = [
      'new england journal of medicine', 'lancet', 'british medical journal',
      'jama', 'nature medicine', 'science translational medicine',
      'annals of internal medicine', 'circulation', 'journal of clinical oncology'
    ];
    
    if (topMedicalJournals.some(journal => journalLower.includes(journal))) {
      score += 0.4;
    }

    // Medical context indicators
    const medicalIndicators = [
      'patients?', 'clinical', 'medical', 'treatment', 'therapy', 'diagnosis',
      'disease', 'syndrome', 'disorder', 'symptoms?', 'medication', 'drug',
      'intervention', 'randomized', 'trial', 'cohort', 'case.control'
    ];

    const medicalMatches = medicalIndicators.filter(indicator => 
      new RegExp(`\\b${indicator}\\b`, 'i').test(text)
    ).length;

    score += Math.min(medicalMatches * 0.05, 0.3); // Max 0.3 boost

    // Penalty for non-medical domains
    const nonMedicalDomains = [
      'computer science', 'machine learning', 'artificial intelligence',
      'engineering', 'mathematics', 'physics', 'chemistry',
      'business', 'economics', 'marketing', 'finance',
      'social media', 'bibliometric', 'citation analysis'
    ];

    if (nonMedicalDomains.some(domain => text.includes(domain))) {
      score -= 0.4;
    }

    // Penalty for animal studies (unless specifically asked)
    const animalIndicators = ['mouse', 'rat', 'mice', 'animal model', 'in vitro', 'cell culture'];
    if (animalIndicators.some(indicator => text.includes(indicator))) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  // Calculate how well the paper aligns with the specific query
  private static calculateQueryAlignment(title: string, abstract: string, query: string): number {
    const text = `${title} ${abstract}`.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;

    // Extract key terms from query (remove stop words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must']);
    
    const queryTerms = queryLower
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term))
      .filter(term => /^[a-zA-Z]/.test(term)); // Only alphabetic terms

    if (queryTerms.length === 0) return 0.5; // Fallback for empty query

    // Calculate term overlap
    let exactMatches = 0;
    let partialMatches = 0;

    for (const term of queryTerms) {
      if (text.includes(term)) {
        exactMatches++;
      } else {
        // Check for partial matches (stemming/variations)
        const stem = term.substring(0, Math.max(3, term.length - 2));
        if (text.includes(stem)) {
          partialMatches++;
        }
      }
    }

    // Score based on term matching
    const exactMatchRatio = exactMatches / queryTerms.length;
    const partialMatchRatio = partialMatches / queryTerms.length;
    
    score = exactMatchRatio * 0.8 + partialMatchRatio * 0.3;

    // Bonus for title matching (title matches are more important)
    const titleLower = title.toLowerCase();
    const titleMatches = queryTerms.filter(term => titleLower.includes(term)).length;
    const titleMatchRatio = titleMatches / queryTerms.length;
    
    score += titleMatchRatio * 0.2;

    // Check for semantic relevance (concept-level matching)
    score += this.calculateSemanticAlignment(query, text);

    return Math.max(0, Math.min(1, score));
  }

  // Calculate evidence quality
  private static calculateEvidenceQuality(title: string, abstract: string, journal: string, authors?: string[]): number {
    const text = `${title} ${abstract}`.toLowerCase();
    let score = 0.5; // Base score

    // Study type hierarchy (Evidence-Based Medicine levels)
    const studyTypeScores: Record<string, number> = {
      'systematic review': 0.9,
      'meta-analysis': 0.95,
      'randomized controlled trial': 0.8,
      'cohort study': 0.6,
      'case-control study': 0.5,
      'cross-sectional study': 0.4,
      'case series': 0.3,
      'case report': 0.2
    };

    for (const [studyType, typeScore] of Object.entries(studyTypeScores)) {
      if (text.includes(studyType)) {
        score = Math.max(score, typeScore);
        break;
      }
    }

    // Sample size indicators
    const sampleSizeMatch = text.match(/(\d+)\s*(?:patients?|participants?|subjects?)/i);
    if (sampleSizeMatch) {
      const sampleSize = parseInt(sampleSizeMatch[1]);
      if (sampleSize > 1000) score += 0.1;
      else if (sampleSize > 100) score += 0.05;
    }

    // Quality indicators
    const qualityIndicators = [
      'double.blind', 'placebo.controlled', 'multicentre', 'multicenter',
      'prospective', 'peer.reviewed', 'cochrane', 'grade methodology'
    ];

    const qualityMatches = qualityIndicators.filter(indicator => 
      new RegExp(indicator.replace('.', '[\\s-]?'), 'i').test(text)
    ).length;

    score += qualityMatches * 0.05;

    // Journal impact factor (simplified estimation)
    const highImpactIndicators = [
      'nature', 'science', 'cell', 'lancet', 'nejm', 'jama', 'bmj'
    ];

    if (highImpactIndicators.some(indicator => journal.toLowerCase().includes(indicator))) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  // Simple semantic alignment check
  private static calculateSemanticAlignment(query: string, text: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const textWords = new Set(text.toLowerCase().split(/\s+/));
    
    // Jaccard similarity
    const intersection = new Set([...queryWords].filter(x => textWords.has(x)));
    const union = new Set([...queryWords, ...textWords]);
    
    return intersection.size / union.size * 0.3; // Cap contribution at 0.3
  }

  // Generate human-readable explanation
  private static generateExplanation(result: RelevanceResult): string[] {
    const reasons: string[] = [];
    
    if (result.medicalRelevance > 0.7) {
      reasons.push('High medical relevance');
    } else if (result.medicalRelevance < 0.3) {
      reasons.push('Low medical relevance');
    }

    if (result.queryAlignment > 0.7) {
      reasons.push('Strong query alignment');
    } else if (result.queryAlignment < 0.3) {
      reasons.push('Weak query alignment');
    }

    if (result.evidenceQuality > 0.7) {
      reasons.push('High evidence quality');
    } else if (result.evidenceQuality < 0.3) {
      reasons.push('Low evidence quality');
    }

    if (result.score < 0.3) {
      reasons.push('Overall low relevance score');
    } else if (result.score > 0.8) {
      reasons.push('Overall high relevance score');
    }

    return reasons.length > 0 ? reasons : ['Standard relevance assessment'];
  }

  // Batch filter papers
  static filterPapers(papers: any[], query: string, minScore: number = 0.5): {
    relevant: any[];
    irrelevant: any[];
    summary: {
      totalPapers: number;
      relevantCount: number;
      averageScore: number;
      medicalRelevanceAvg: number;
      queryAlignmentAvg: number;
      evidenceQualityAvg: number;
    };
  } {
    const results = papers.map(paper => {
      const relevance = this.assessRelevance(
        paper.title || '',
        paper.abstract || paper.summary || '',
        paper.journal || paper.venue || '',
        query,
        paper.authors
      );
      
      return {
        ...paper,
        relevanceScore: relevance.score,
        relevanceDetails: relevance
      };
    });

    const relevant = results.filter(paper => paper.relevanceScore >= minScore);
    const irrelevant = results.filter(paper => paper.relevanceScore < minScore);

    const avgScore = results.reduce((sum, p) => sum + p.relevanceScore, 0) / results.length;
    const avgMedical = results.reduce((sum, p) => sum + p.relevanceDetails.medicalRelevance, 0) / results.length;
    const avgQuery = results.reduce((sum, p) => sum + p.relevanceDetails.queryAlignment, 0) / results.length;
    const avgEvidence = results.reduce((sum, p) => sum + p.relevanceDetails.evidenceQuality, 0) / results.length;

    return {
      relevant,
      irrelevant,
      summary: {
        totalPapers: papers.length,
        relevantCount: relevant.length,
        averageScore: avgScore,
        medicalRelevanceAvg: avgMedical,
        queryAlignmentAvg: avgQuery,
        evidenceQualityAvg: avgEvidence
      }
    };
  }
}

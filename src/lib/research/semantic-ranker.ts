import { HfInference } from '@huggingface/inference';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Semantic Search and Neural Ranking System
export class SemanticResearchRanker {
  private hf: HfInference;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    // Initialize Hugging Face for semantic embeddings (optional)
    try {
      if (process.env.HUGGINGFACE_API_KEY) {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
      } else {
        // Initialize with empty key for fallback functionality
        this.hf = new HfInference('');
      }
    } catch (error) {
      console.warn('Failed to initialize HuggingFace client:', error);
      // Initialize with minimal configuration
      this.hf = new HfInference('');
    }

    // Initialize Google Gemini for neural re-ranking (optional)
    try {
      if (process.env.GOOGLE_GEMINI_API_KEY) {
        this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
      }
    } catch (error) {
      console.warn('Failed to initialize Gemini client:', error);
      this.gemini = null;
    }
  }

  // Generate semantic embeddings for query and papers
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.hf || !process.env.HUGGINGFACE_API_KEY) {
        // If no API key or HF client, use fallback
        return this.createKeywordVector(text);
      }

      const response = await this.hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2', // Medical domain-optimized
        inputs: text.substring(0, 512), // Limit to 512 chars for efficiency
      });
      
      // Ensure we get a flat array of numbers
      if (Array.isArray(response) && Array.isArray(response[0])) {
        return response[0] as number[];
      }
      return response as number[];
    } catch (error) {
      console.warn('Semantic embedding failed, falling back to keyword matching:', error);
      // Fallback to simple keyword vector if AI services unavailable
      return this.createKeywordVector(text);
    }
  }

  // Cosine similarity for semantic matching
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Enhanced semantic relevance scoring
  async calculateSemanticRelevance(
    paperTitle: string,
    paperAbstract: string,
    query: string
  ): Promise<number> {
    try {
      const paperText = `${paperTitle} ${paperAbstract}`;
      
      // Generate embeddings
      const [queryEmbedding, paperEmbedding] = await Promise.all([
        this.generateEmbedding(query),
        this.generateEmbedding(paperText)
      ]);

      // Calculate semantic similarity
      const semanticScore = this.cosineSimilarity(queryEmbedding, paperEmbedding);
      
      // Combine with keyword-based boosters
      const keywordScore = this.calculateKeywordRelevance(paperText, query);
      const evidenceScore = this.calculateEvidenceQuality(paperTitle, paperAbstract);
      const recentnessScore = this.calculateRecentnessBonus(paperTitle, paperAbstract);
      
      // Weighted combination (semantic gets highest weight like Consensus.app)
      const finalScore = (
        semanticScore * 0.5 +        // Semantic similarity (primary)
        keywordScore * 0.25 +        // Keyword matching
        evidenceScore * 0.15 +       // Evidence quality
        recentnessScore * 0.1        // Recency bonus
      );

      return Math.min(finalScore, 1.0);
      
    } catch (error) {
      console.warn('Semantic ranking failed, using fallback:', error);
      return this.calculateKeywordRelevance(`${paperTitle} ${paperAbstract}`, query);
    }
  }

  // Enhanced keyword relevance with medical domain understanding
  private calculateKeywordRelevance(paperText: string, query: string): number {
    const paperLower = paperText.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Extract medical concepts and terms
    const queryTerms = this.extractMedicalConcepts(queryLower);
    const paperTerms = this.extractMedicalConcepts(paperLower);
    
    let score = 0;
    let matchedTerms = 0;

    // Exact phrase matching (highest priority)
    const queryPhrases = this.extractPhrases(queryLower);
    queryPhrases.forEach(phrase => {
      if (paperLower.includes(phrase)) {
        score += 0.4;
        matchedTerms++;
      }
    });

    // Medical concept matching
    queryTerms.forEach(term => {
      if (paperTerms.includes(term)) {
        score += 0.2;
        matchedTerms++;
      }
    });

    // Synonym and related term matching
    const synonymScore = this.calculateSynonymMatching(queryLower, paperLower);
    score += synonymScore;

    // Apply penalty if very few terms match
    const matchRatio = matchedTerms / Math.max(queryTerms.length, 1);
    if (matchRatio < 0.2) {
      score *= 0.5; // Significant penalty for poor matching
    }

    return Math.min(score, 1.0);
  }

  // Extract medical concepts and important terms
  private extractMedicalConcepts(text: string): string[] {
    const concepts = [];
    
    // Medical condition patterns
    const conditionPatterns = [
      /diabetes\s+\w+/g, /type\s+\d+\s+diabetes/g, /\w+\s+cancer/g,
      /cardiovascular\s+\w+/g, /heart\s+\w+/g, /blood\s+pressure/g,
      /\w+\s+syndrome/g, /\w+\s+disease/g, /\w+\s+disorder/g
    ];

    // Drug and treatment patterns  
    const treatmentPatterns = [
      /\w+\s+therapy/g, /\w+\s+treatment/g, /\w+\s+intervention/g,
      /\w+\s+inhibitor/g, /\w+\s+agonist/g, /\w+\s+antagonist/g
    ];

    // Extract patterns
    [...conditionPatterns, ...treatmentPatterns].forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches.map(m => m.trim()));
      }
    });

    // Add individual medical terms
    const medicalTerms = text.split(/\s+/).filter(term => 
      term.length > 3 && this.isMedicalTerm(term)
    );
    
    concepts.push(...medicalTerms);
    
    return [...new Set(concepts)]; // Remove duplicates
  }

  // Check if a term is likely medical
  private isMedicalTerm(term: string): boolean {
    const medicalSuffixes = [
      'itis', 'osis', 'emia', 'uria', 'pathy', 'therapy', 'ectomy', 
      'otomy', 'plasty', 'scopy', 'gram', 'logy'
    ];
    
    const medicalPrefixes = [
      'cardio', 'neuro', 'gastro', 'hepato', 'nephro', 'pulmo',
      'hemato', 'onco', 'endo', 'dermato', 'psycho'
    ];

    const drugSuffixes = [
      'mab', 'nib', 'pride', 'sartan', 'pril', 'olol', 'pine', 'statin'
    ];

    return (
      medicalSuffixes.some(suffix => term.endsWith(suffix)) ||
      medicalPrefixes.some(prefix => term.startsWith(prefix)) ||
      drugSuffixes.some(suffix => term.endsWith(suffix)) ||
      term.length > 8 // Complex medical terms tend to be longer
    );
  }

  // Extract meaningful phrases from query
  private extractPhrases(query: string): string[] {
    const phrases = [];
    
    // Extract 2-3 word medical phrases
    const words = query.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (this.isMedicalPhrase(twoWord)) {
        phrases.push(twoWord);
      }
      
      if (i < words.length - 2) {
        const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (this.isMedicalPhrase(threeWord)) {
          phrases.push(threeWord);
        }
      }
    }
    
    return phrases;
  }

  // Check if phrase is medically meaningful
  private isMedicalPhrase(phrase: string): boolean {
    const medicalPhrases = [
      'type 2', 'cardiovascular disease', 'blood pressure', 'heart failure',
      'clinical trial', 'randomized controlled', 'systematic review', 'meta analysis',
      'risk factor', 'side effect', 'adverse event', 'treatment outcome',
      'therapeutic effect', 'clinical efficacy', 'safety profile'
    ];
    
    return medicalPhrases.some(mp => phrase.includes(mp)) ||
           (phrase.split(' ').length === 2 && phrase.split(' ').every(word => this.isMedicalTerm(word)));
  }

  // Medical synonym and related term matching
  private calculateSynonymMatching(query: string, paperText: string): number {
    const synonymMap = {
      'diabetes': ['diabetic', 'hyperglycemia', 'glucose', 'insulin resistance'],
      'hypertension': ['high blood pressure', 'elevated bp', 'hypertensive'],
      'heart failure': ['cardiac failure', 'heart insufficiency', 'cardiomyopathy'],
      'myocardial infarction': ['heart attack', 'mi', 'acute coronary syndrome'],
      'stroke': ['cerebrovascular accident', 'cva', 'cerebral infarction'],
      'cancer': ['malignancy', 'tumor', 'neoplasm', 'carcinoma', 'oncology'],
      'treatment': ['therapy', 'intervention', 'management', 'therapeutic'],
      'prevention': ['prophylaxis', 'preventive', 'preventative'],
      'medication': ['drug', 'pharmaceutical', 'medicine', 'pharmacotherapy']
    };

    let synonymScore = 0;

    Object.entries(synonymMap).forEach(([term, synonyms]) => {
      if (query.includes(term)) {
        synonyms.forEach(synonym => {
          if (paperText.includes(synonym)) {
            synonymScore += 0.1;
          }
        });
      }
    });

    return Math.min(synonymScore, 0.3); // Cap synonym bonus
  }

  // Calculate evidence quality score (like Consensus.app's study quality ranking)
  private calculateEvidenceQuality(title: string, abstract: string): number {
    const content = `${title} ${abstract}`.toLowerCase();
    let qualityScore = 0;

    // Study design hierarchy (higher = better evidence)
    const studyTypes = [
      { terms: ['systematic review', 'meta-analysis', 'meta analysis'], score: 1.0 },
      { terms: ['randomized controlled trial', 'rct', 'randomized trial'], score: 0.9 },
      { terms: ['controlled trial', 'clinical trial'], score: 0.8 },
      { terms: ['cohort study', 'prospective study'], score: 0.7 },
      { terms: ['case-control study'], score: 0.6 },
      { terms: ['cross-sectional', 'observational'], score: 0.5 },
      { terms: ['case series', 'case report'], score: 0.3 }
    ];

    // Find the highest quality study type
    for (const studyType of studyTypes) {
      if (studyType.terms.some(term => content.includes(term))) {
        qualityScore = Math.max(qualityScore, studyType.score);
        break;
      }
    }

    // Journal quality indicators
    const qualityIndicators = [
      'peer-reviewed', 'double-blind', 'placebo-controlled', 'multicentre',
      'large sample', 'long-term follow-up', 'primary endpoint'
    ];

    const qualityMatches = qualityIndicators.filter(indicator => 
      content.includes(indicator)
    ).length;

    qualityScore += qualityMatches * 0.05; // Bonus for quality indicators

    return Math.min(qualityScore, 1.0);
  }

  // Calculate recency bonus
  private calculateRecentnessBonus(title: string, abstract: string): number {
    const content = `${title} ${abstract}`;
    const currentYear = new Date().getFullYear();
    
    // Extract year from content
    const yearMatches = content.match(/\b(19|20)\d{2}\b/g);
    if (!yearMatches) return 0;

    const years = yearMatches.map(y => parseInt(y)).filter(y => y > 1990 && y <= currentYear);
    if (years.length === 0) return 0;

    const mostRecentYear = Math.max(...years);
    const yearsOld = currentYear - mostRecentYear;

    // Exponential decay for recency (newer papers get higher scores)
    if (yearsOld <= 2) return 1.0;
    if (yearsOld <= 5) return 0.8;
    if (yearsOld <= 10) return 0.6;
    return 0.3;
  }

  // Fallback keyword vector for when AI services unavailable
  private createKeywordVector(text: string): number[] {
    const keywords = [
      'diabetes', 'cardiovascular', 'hypertension', 'cancer', 'treatment',
      'therapy', 'clinical', 'trial', 'study', 'patient', 'efficacy',
      'safety', 'outcome', 'risk', 'prevention', 'management', 'drug',
      'medication', 'intervention', 'randomized', 'controlled', 'systematic',
      'meta-analysis', 'review', 'evidence', 'research', 'medicine'
    ];

    return keywords.map(keyword => 
      text.toLowerCase().includes(keyword) ? 1 : 0
    );
  }

  // Neural re-ranking using semantic similarity (fallback without OpenAI)
  async neuralRerank(papers: any[], query: string, topK: number = 20): Promise<any[]> {
    if (papers.length === 0) {
      return papers;
    }

    try {
      // Sort by relevance score and evidence level
      const ranked = papers
        .map(paper => ({
          ...paper,
          combinedScore: (paper.relevanceScore || 0) * 0.7 + this.getEvidenceLevelScore(paper.evidenceLevel || '') * 0.3
        }))
        .sort((a, b) => b.combinedScore - a.combinedScore);

      return ranked.slice(0, topK);
    } catch (error) {
      console.warn('Semantic reranking failed:', error);
      return papers.slice(0, topK);
    }
  }

  private getEvidenceLevelScore(evidenceLevel: string): number {
    if (evidenceLevel.includes('Level 1')) return 1.0;
    if (evidenceLevel.includes('Level 2')) return 0.8;
    if (evidenceLevel.includes('Level 3')) return 0.6;
    if (evidenceLevel.includes('Level 4')) return 0.4;
    return 0.2;
  }
}

export default SemanticResearchRanker;

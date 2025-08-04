/**
 * Immediate Integration: Biomedical Embeddings for CliniSynth
 * Uses Hugging Face API directly for production deployment
 */

import { type Citation } from "@/lib/types/chat";

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  success: boolean;
}

export class HuggingFaceBiomedicalService {
  private apiKey: string;
  private cache: Map<string, number[]> = new Map();
  
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  /**
   * Generate embeddings using Hugging Face Inference API
   * Falls back gracefully to keyword matching if API fails
   */
  async generateEmbedding(text: string, model: string = 'BAAI/bge-small-en-v1.5'): Promise<EmbeddingResult> {
    const cacheKey = `${model}:${text.substring(0, 100)}`;
    
    if (this.cache.has(cacheKey)) {
      return {
        embedding: this.cache.get(cacheKey)!,
        model,
        success: true
      };
    }

    try {
      // Use working Hugging Face models
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text
        }),
      });

      if (response.ok) {
        const embedding = await response.json();
        if (Array.isArray(embedding) && embedding.length > 0) {
          this.cache.set(cacheKey, embedding);
          console.log(`✅ Generated ${embedding.length}D embedding with ${model}`);
          return {
            embedding,
            model,
            success: true
          };
        }
      } else {
        const errorText = await response.text();
        console.warn(`Hugging Face API error (${response.status}): ${errorText}`);
      }

      // If primary model fails, try fallback models
      const fallbackModels = [
        'intfloat/e5-small-v2',
        'thenlper/gte-small'
      ];

      for (const fallbackModel of fallbackModels) {
        try {
          const fallbackResponse = await fetch(`https://api-inference.huggingface.co/models/${fallbackModel}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: text }),
          });

          if (fallbackResponse.ok) {
            const fallbackEmbedding = await fallbackResponse.json();
            if (Array.isArray(fallbackEmbedding) && fallbackEmbedding.length > 0) {
              this.cache.set(cacheKey, fallbackEmbedding);
              console.log(`✅ Fallback: Generated ${fallbackEmbedding.length}D embedding with ${fallbackModel}`);
              return {
                embedding: fallbackEmbedding,
                model: fallbackModel,
                success: true
              };
            }
          }
        } catch (fallbackError) {
          console.warn(`Fallback model ${fallbackModel} failed:`, fallbackError);
        }
      }

      // If all APIs fail, use local embedding
      console.warn(`All Hugging Face models failed, using local fallback`);
      return this.generateLocalEmbedding(text);

    } catch (error) {
      console.warn(`Embedding generation failed: ${error}. Using keyword fallback.`);
      return this.generateLocalEmbedding(text);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Improved paper ranking with semantic embeddings
   */
  async rankPapersWithEmbeddings(
    query: string,
    papers: Citation[],
    options: { threshold?: number; maxResults?: number } = {}
  ): Promise<Array<{ paper: Citation; score: number; reason: string }>> {
    
    console.log(`🔬 Ranking ${papers.length} papers with biomedical embeddings...`);
    
    // Generate query embedding
    const queryResult = await this.generateEmbedding(query);
    if (!queryResult.success) {
      console.warn('Query embedding failed, using fallback ranking');
      return this.fallbackRanking(query, papers);
    }

    const results: Array<{ paper: Citation; score: number; reason: string }> = [];

    for (const paper of papers) {
      try {
        // Create paper text for embedding
        const paperText = `${paper.title} ${paper.abstract || ''}`.substring(0, 500);
        
        // Generate paper embedding
        const paperResult = await this.generateEmbedding(paperText);
        
        if (paperResult.success) {
          // Calculate semantic similarity
          const similarity = this.calculateCosineSimilarity(
            queryResult.embedding,
            paperResult.embedding
          );

          // Apply medical relevance boost
          const medicalBoost = this.calculateMedicalRelevanceBoost(query, paperText);
          const finalScore = similarity * 0.7 + medicalBoost * 0.3;

          results.push({
            paper,
            score: finalScore,
            reason: `Semantic similarity: ${(similarity * 100).toFixed(1)}%, Medical relevance: ${(medicalBoost * 100).toFixed(1)}%`
          });
        } else {
          // Fallback to keyword matching for this paper
          const keywordScore = this.calculateKeywordScore(query, paperText);
          results.push({
            paper,
            score: keywordScore,
            reason: 'Keyword matching (embedding failed)'
          });
        }
      } catch (error) {
        console.warn(`Error processing paper: ${paper.title}`, error);
        // Include paper with low score rather than exclude
        results.push({
          paper,
          score: 0.1,
          reason: 'Processing error'
        });
      }
    }

    // Sort by score and apply filters
    const threshold = options.threshold || 0.2;
    const filtered = results
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score);

    const maxResults = options.maxResults || 20;
    const final = filtered.slice(0, maxResults);

    console.log(`✅ Ranked papers: ${final.length}/${papers.length} above threshold ${threshold}`);
    
    return final;
  }

  /**
   * Calculate medical relevance boost based on domain-specific terms
   */
  private calculateMedicalRelevanceBoost(query: string, paperText: string): number {
    const medicalTerms = [
      'treatment', 'therapy', 'clinical', 'patient', 'disease', 'diagnosis',
      'randomized', 'controlled', 'trial', 'efficacy', 'safety', 'outcome',
      'meta-analysis', 'systematic review', 'cohort', 'case-control',
      'biomarker', 'pathophysiology', 'pharmacology', 'therapeutic'
    ];

    const queryTerms = query.toLowerCase().split(' ');
    const paperLower = paperText.toLowerCase();

    let medicalScore = 0;
    let totalTerms = 0;

    for (const term of medicalTerms) {
      totalTerms++;
      if (queryTerms.some(qt => qt.includes(term)) && paperLower.includes(term)) {
        medicalScore += 1;
      } else if (paperLower.includes(term)) {
        medicalScore += 0.5;
      }
    }

    return Math.min(1, medicalScore / (totalTerms * 0.5));
  }

  /**
   * Keyword-based fallback scoring
   */
  private calculateKeywordScore(query: string, paperText: string): number {
    const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    const paperLower = paperText.toLowerCase();

    let score = 0;
    for (const term of queryTerms) {
      if (paperLower.includes(term)) {
        score += 1 / queryTerms.length;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Local embedding generation using keyword vectors (fallback)
   */
  private generateLocalEmbedding(text: string): EmbeddingResult {
    // Simple keyword-based vector generation
    const words = text.toLowerCase().split(' ').filter(w => w.length > 2);
    const vocab = Array.from(new Set(words));
    
    // Create a simple bag-of-words embedding
    const embedding = new Array(256).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word) % 256;
      embedding[hash] += 1 / words.length;
    });

    return {
      embedding,
      model: 'local_fallback',
      success: true
    };
  }

  /**
   * Simple hash function for keyword mapping
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Fallback ranking when embeddings completely fail
   */
  private fallbackRanking(
    query: string, 
    papers: Citation[]
  ): Array<{ paper: Citation; score: number; reason: string }> {
    return papers.map(paper => {
      const paperText = `${paper.title} ${paper.abstract || ''}`;
      const score = this.calculateKeywordScore(query, paperText);
      return {
        paper,
        score,
        reason: 'Keyword matching (fallback mode)'
      };
    }).sort((a, b) => b.score - a.score);
  }
}

// Export singleton instance
export const biomedicalEmbeddings = new HuggingFaceBiomedicalService();

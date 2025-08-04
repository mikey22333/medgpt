/**
 * Biomedical Embedding Service for CliniSynth
 * Implements proper biomedical embeddings with fallback mechanisms
 */

export interface EmbeddingModel {
  name: string;
  path: string;
  description: string;
  domain: 'general' | 'biomedical' | 'clinical' | 'scientific';
  maxLength: number;
  quality: 'high' | 'medium' | 'low';
}

export interface EmbeddingOptions {
  model?: string;
  maxLength?: number;
  normalize?: boolean;
  fallbackToKeyword?: boolean;
}

export interface SimilarityResult {
  score: number;
  model: string;
  confidence: 'high' | 'medium' | 'low';
  fallbackUsed: boolean;
}

export class BiomedicalEmbeddingService {
  private models: Record<string, EmbeddingModel> = {
    // Primary biomedical models
    biobert: {
      name: 'BioBERT',
      path: 'dmis-lab/biobert-v1.1',
      description: 'BioBERT for biomedical NER and similarity',
      domain: 'biomedical',
      maxLength: 512,
      quality: 'high'
    },
    
    clinicalbert: {
      name: 'ClinicalBERT',
      path: 'emilyalsentzer/Bio_ClinicalBERT',
      description: 'Clinical notes optimized BERT',
      domain: 'clinical',
      maxLength: 512,
      quality: 'high'
    },
    
    specter2: {
      name: 'SPECTER2',
      path: 'allenai/specter2',
      description: 'Scientific paper embeddings',
      domain: 'scientific',
      maxLength: 512,
      quality: 'high'
    },
    
    scibert: {
      name: 'SciBERT',
      path: 'allenai/scibert_scivocab_uncased',
      description: 'Scientific vocabulary BERT',
      domain: 'scientific',
      maxLength: 512,
      quality: 'medium'
    },
    
    // Fallback models
    pubmedbert: {
      name: 'PubMedBERT',
      path: 'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract',
      description: 'PubMed abstracts pre-trained BERT',
      domain: 'biomedical',
      maxLength: 512,
      quality: 'medium'
    },
    
    minilm: {
      name: 'MiniLM',
      path: 'sentence-transformers/all-MiniLM-L6-v2',
      description: 'General purpose sentence transformer',
      domain: 'general',
      maxLength: 256,
      quality: 'low'
    }
  };

  private cache: Map<string, number[]> = new Map();
  private activeModel: string = 'biobert';
  private fallbackModel: string = 'minilm';

  constructor(options?: { primaryModel?: string; fallbackModel?: string }) {
    if (options?.primaryModel && this.models[options.primaryModel]) {
      this.activeModel = options.primaryModel;
    }
    if (options?.fallbackModel && this.models[options.fallbackModel]) {
      this.fallbackModel = options.fallbackModel;
    }
  }

  async generateEmbedding(
    text: string, 
    options: EmbeddingOptions = {}
  ): Promise<{ embedding: number[]; model: string; fallbackUsed: boolean }> {
    const modelKey = options.model || this.activeModel;
    const model = this.models[modelKey];
    
    if (!model) {
      throw new Error(`Unknown model: ${modelKey}`);
    }

    // Create cache key
    const cacheKey = `${modelKey}:${this.hashText(text)}`;
    if (this.cache.has(cacheKey)) {
      return {
        embedding: this.cache.get(cacheKey)!,
        model: modelKey,
        fallbackUsed: false
      };
    }

    // Preprocess text
    const processedText = this.preprocessText(text, model.maxLength);

    try {
      // Try primary biomedical model
      const embedding = await this.callEmbeddingAPI(processedText, model);
      
      // Normalize if requested
      const finalEmbedding = options.normalize ? this.normalizeVector(embedding) : embedding;
      
      // Cache result
      this.cache.set(cacheKey, finalEmbedding);
      
      return {
        embedding: finalEmbedding,
        model: modelKey,
        fallbackUsed: false
      };

    } catch (error) {
      console.warn(`Primary embedding model ${modelKey} failed:`, error);
      
      if (options.fallbackToKeyword !== false) {
        // Try fallback model
        try {
          const fallbackModel = this.models[this.fallbackModel];
          const fallbackEmbedding = await this.callEmbeddingAPI(processedText, fallbackModel);
          const finalEmbedding = options.normalize ? this.normalizeVector(fallbackEmbedding) : fallbackEmbedding;
          
          console.log(`✅ Fallback to ${this.fallbackModel} successful`);
          return {
            embedding: finalEmbedding,
            model: this.fallbackModel,
            fallbackUsed: true
          };
        } catch (fallbackError) {
          console.warn(`Fallback model ${this.fallbackModel} also failed:`, fallbackError);
        }
      }

      // Final fallback to keyword-based vector
      console.log('🔄 Using keyword-based embedding as final fallback');
      const keywordEmbedding = this.createKeywordEmbedding(processedText);
      return {
        embedding: keywordEmbedding,
        model: 'keyword',
        fallbackUsed: true
      };
    }
  }

  async calculateSimilarity(
    query: string,
    documents: string[],
    options: EmbeddingOptions = {}
  ): Promise<SimilarityResult[]> {
    try {
      const queryResult = await this.generateEmbedding(query, options);
      const documentResults = await Promise.all(
        documents.map(doc => this.generateEmbedding(doc, options))
      );

      return documentResults.map(docResult => {
        const similarity = this.cosineSimilarity(
          queryResult.embedding,
          docResult.embedding
        );

        // Determine confidence based on model quality and fallback usage
        let confidence: 'high' | 'medium' | 'low' = 'high';
        if (queryResult.fallbackUsed || docResult.fallbackUsed) {
          confidence = 'medium';
        }
        if (queryResult.model === 'keyword' || docResult.model === 'keyword') {
          confidence = 'low';
        }

        return {
          score: similarity,
          model: queryResult.model,
          confidence,
          fallbackUsed: queryResult.fallbackUsed || docResult.fallbackUsed
        };
      });

    } catch (error) {
      console.error('Similarity calculation failed:', error);
      
      // Fallback to simple keyword matching
      return documents.map(doc => ({
        score: this.keywordSimilarity(query, doc),
        model: 'keyword',
        confidence: 'low' as const,
        fallbackUsed: true
      }));
    }
  }

  private async callEmbeddingAPI(text: string, model: EmbeddingModel): Promise<number[]> {
    // Implementation depends on available services
    
    // Option 1: Hugging Face Inference API
    if (process.env.HUGGINGFACE_API_KEY) {
      return this.callHuggingFaceAPI(text, model);
    }
    
    // Option 2: Local model serving (if available)
    if (process.env.LOCAL_EMBEDDING_URL) {
      return this.callLocalEmbeddingService(text, model);
    }
    
    // Option 3: Other API services
    if (process.env.OPENAI_API_KEY && model.domain === 'general') {
      return this.callOpenAIEmbedding(text);
    }
    
    throw new Error('No embedding service available');
  }

  private async callHuggingFaceAPI(text: string, model: EmbeddingModel): Promise<number[]> {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model.path}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ 
          inputs: text,
          options: { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Handle different response formats
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0];
    }
    if (Array.isArray(result)) {
      return result;
    }
    
    throw new Error('Unexpected Hugging Face API response format');
  }

  private async callLocalEmbeddingService(text: string, model: EmbeddingModel): Promise<number[]> {
    const response = await fetch(`${process.env.LOCAL_EMBEDDING_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model: model.path }),
    });

    if (!response.ok) {
      throw new Error(`Local embedding service error: ${response.status}`);
    }

    const result = await response.json();
    return result.embedding;
  }

  private async callOpenAIEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
  }

  private preprocessText(text: string, maxLength: number): string {
    // Clean and truncate text
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,()]/g, '')
      .trim();

    // Truncate to model's max length (rough approximation)
    if (cleaned.length > maxLength * 4) { // ~4 chars per token
      cleaned = cleaned.substring(0, maxLength * 4);
    }

    return cleaned;
  }

  private createKeywordEmbedding(text: string): number[] {
    // Create a simple keyword-based vector
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Create a fixed-size vector (384 dimensions to match MiniLM)
    const vector = new Array(384).fill(0);
    
    // Hash words to vector positions
    words.forEach(word => {
      const hash = this.simpleHash(word);
      const pos = Math.abs(hash) % 384;
      vector[pos] += 1.0 / words.length;
    });

    return this.normalizeVector(vector);
  }

  private keywordSimilarity(text1: string, text2: string): number {
    const words1 = new Set(
      text1.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
    
    const words2 = new Set(
      text2.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      console.warn('Vector length mismatch, using shorter length');
      const minLength = Math.min(vec1.length, vec2.length);
      vec1 = vec1.slice(0, minLength);
      vec2 = vec2.slice(0, minLength);
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private hashText(text: string): string {
    return text.length.toString() + '_' + this.simpleHash(text.substring(0, 100)).toString();
  }

  getAvailableModels(): EmbeddingModel[] {
    return Object.values(this.models);
  }

  getModelInfo(modelKey: string): EmbeddingModel | undefined {
    return this.models[modelKey];
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Method to test model availability
  async testModelAvailability(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [key, model] of Object.entries(this.models)) {
      try {
        await this.generateEmbedding('test', { model: key, fallbackToKeyword: false });
        results[key] = true;
      } catch (error) {
        results[key] = false;
      }
    }
    
    return results;
  }
}

export default BiomedicalEmbeddingService;

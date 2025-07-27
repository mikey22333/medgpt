export abstract class BaseSearchClient {
  protected apiKey?: string;
  protected rateLimit = 100; // requests per minute
  protected requestCount = 0;
  protected lastResetTime = Date.now();

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeElapsed = now - this.lastResetTime;
    
    // Reset counter every minute
    if (timeElapsed >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    if (this.requestCount >= this.rateLimit) {
      const waitTime = 60000 - timeElapsed;
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    this.requestCount++;
  }

  protected async makeRequest(url: string, options?: RequestInit): Promise<Response> {
    await this.checkRateLimit();
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CliniSynth/1.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}: ${response.statusText}`));
      }
      
      return response;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  protected handleApiError(error: any): never {
    console.error('API request failed:', error);
    throw error;
  }

  protected normalizeDate(date: string | Date): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  protected extractText(element: any): string {
    if (typeof element === 'string') return element;
    if (Array.isArray(element)) return element.join(' ');
    if (element && typeof element === 'object') {
      return element.text || element.value || element.content || '';
    }
    return '';
  }

  protected calculateRelevanceScore(text: string, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    let score = 0;
    queryTerms.forEach(term => {
      if (textLower.includes(term)) {
        score += 1;
      }
    });
    
    return Math.min((score / queryTerms.length) * 100, 100);
  }

  // Abstract method to be implemented by subclasses
  abstract search(query: string, filters?: any): Promise<any[]>;
}

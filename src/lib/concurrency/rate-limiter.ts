// Global Rate Limiter for external API calls
// Prevents hitting rate limits on PubMed, Semantic Scholar, etc.

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

class GlobalRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  
  // Rate limit configurations for different services
  private readonly configs = {
    'pubmed': { maxTokens: 10, refillRate: 3 }, // 3 requests per second, burst of 10
    'semantic-scholar': { maxTokens: 5, refillRate: 1 }, // 1 request per second, burst of 5
    'europe-pmc': { maxTokens: 15, refillRate: 5 }, // 5 requests per second, burst of 15
    'crossref': { maxTokens: 20, refillRate: 10 }, // 10 requests per second, burst of 20
    'fda': { maxTokens: 8, refillRate: 2 }, // 2 requests per second, burst of 8
    'together-ai': { maxTokens: 5, refillRate: 1 }, // 1 request per second for AI
    'openrouter': { maxTokens: 3, refillRate: 0.5 }, // 0.5 requests per second for backup AI
  };

  async checkRateLimit(service: string): Promise<boolean> {
    const config = this.configs[service as keyof typeof this.configs];
    if (!config) {
      console.warn(`⚠️ No rate limit config for service: ${service}`);
      return true; // Allow if no config
    }

    const bucket = this.getBucket(service, config);
    this.refillBucket(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      console.log(`✅ Rate limit OK for ${service}. Tokens remaining: ${bucket.tokens}`);
      return true;
    }

    console.log(`🚫 Rate limit exceeded for ${service}. Tokens: ${bucket.tokens}`);
    return false;
  }

  async waitForRateLimit(service: string): Promise<void> {
    const config = this.configs[service as keyof typeof this.configs];
    if (!config) return;

    while (!(await this.checkRateLimit(service))) {
      const waitTime = Math.ceil(1000 / config.refillRate); // Wait for next token
      console.log(`⏳ Waiting ${waitTime}ms for ${service} rate limit...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Enhanced method that respects rate limits with retry
  async executeWithRateLimit<T>(
    service: string, 
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait for rate limit if needed
        await this.waitForRateLimit(service);
        
        // Execute the operation
        const result = await operation();
        return result;
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt}/${maxRetries} failed for ${service}:`, error.message);
        
        // If it's a rate limit error, wait longer
        if (this.isRateLimitError(error)) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          console.log(`🔄 Rate limit error, backing off ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }

        // If it's the last attempt or non-retryable error, throw
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error(`All ${maxRetries} attempts failed for ${service}`);
  }

  private getBucket(service: string, config: { maxTokens: number; refillRate: number }): RateLimitBucket {
    if (!this.buckets.has(service)) {
      this.buckets.set(service, {
        tokens: config.maxTokens,
        lastRefill: Date.now(),
        maxTokens: config.maxTokens,
        refillRate: config.refillRate
      });
    }
    return this.buckets.get(service)!;
  }

  private refillBucket(bucket: RateLimitBucket): void {
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timePassed * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  private isRateLimitError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.response?.status;
    
    return status === 429 || 
           message.includes('rate limit') || 
           message.includes('too many requests') ||
           message.includes('quota exceeded');
  }

  private isRetryableError(error: any): boolean {
    const status = error.status || error.response?.status;
    
    // Retry on rate limits, timeouts, and server errors
    return status === 429 || 
           status >= 500 || 
           error.code === 'TIMEOUT' ||
           error.code === 'ECONNRESET' ||
           error.message?.includes('timeout');
  }

  // Get current status for monitoring
  getStatus() {
    const status: Record<string, any> = {};
    
    for (const [service, bucket] of this.buckets.entries()) {
      this.refillBucket(bucket); // Refresh tokens
      status[service] = {
        tokensAvailable: Math.floor(bucket.tokens),
        maxTokens: bucket.maxTokens,
        refillRate: bucket.refillRate,
        utilizationPercent: Math.round((1 - bucket.tokens / bucket.maxTokens) * 100)
      };
    }
    
    return status;
  }

  // Reset all buckets (for emergency use)
  resetAllLimits(): void {
    for (const [service, config] of Object.entries(this.configs)) {
      this.buckets.set(service, {
        tokens: config.maxTokens,
        lastRefill: Date.now(),
        maxTokens: config.maxTokens,
        refillRate: config.refillRate
      });
    }
    console.log('🔄 All rate limits reset');
  }
}

// Singleton instance
export const rateLimiter = new GlobalRateLimiter();

// Helper function for wrapping API calls
export async function withRateLimit<T>(
  service: string,
  operation: () => Promise<T>
): Promise<T> {
  return rateLimiter.executeWithRateLimit(service, operation);
}

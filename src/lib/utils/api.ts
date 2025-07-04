import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends RequestInit {
  retries?: number;
  timeout?: number;
  validateStatus?: (status: number) => boolean;
}

export async function fetchWithRetry<T>(
  url: string,
  schema: z.ZodType<T>,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    retries = 3,
    timeout = 10000,
    validateStatus = (status) => status >= 200 && status < 300,
    ...fetchOptions
  } = options;

  const requestId = uuidv4();
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const responseData = await response.json().catch(() => ({}));

      if (!validateStatus(response.status)) {
        throw new ApiError(
          response.status,
          responseData.message || 'API request failed',
          responseData.code,
          responseData.details
        );
      }

      // Validate response against schema
      const result = schema.safeParse(responseData);
      if (!result.success) {
        console.error('Response validation failed:', result.error);
        throw new ApiError(500, 'Invalid response format from server');
      }

      return result.data;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on 4xx errors except 429 (Too Many Requests)
      if (
        error instanceof ApiError && 
        error.status >= 400 && 
        error.status < 500 && 
        error.status !== 429
      ) {
        break;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Unknown error occurred');
}

// Rate limiter utility
export class RateLimiter {
  private queue: Array<() => void> = [];
  private lastRequestTime = 0;

  constructor(
    private readonly requestsPerSecond: number,
    private readonly maxConcurrent: number = 5
  ) {}

  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      const execute = () => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minTimeBetweenRequests = 1000 / this.requestsPerSecond;

        if (timeSinceLastRequest >= minTimeBetweenRequests) {
          this.lastRequestTime = now;
          resolve(() => {
            // Release function
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              next?.();
            }
          });
        } else {
          const delay = minTimeBetweenRequests - timeSinceLastRequest;
          setTimeout(() => {
            this.lastRequestTime = Date.now();
            resolve(() => {
              // Release function
              if (this.queue.length > 0) {
                const next = this.queue.shift();
                next?.();
              }
            });
          }, delay);
        }
      };

      if (this.queue.length < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

// Global rate limiter (5 requests per second by default)
export const defaultRateLimiter = new RateLimiter(5);

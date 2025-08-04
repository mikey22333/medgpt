// Request Queue System to prevent resource exhaustion
// Limits concurrent requests per user and globally

interface QueuedRequest {
  id: string;
  userId: string;
  type: 'chat' | 'research' | 'export';
  priority: number;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeoutId?: NodeJS.Timeout;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = new Map<string, number>(); // userId -> count
  private globalActiveCount = 0;
  
  // Configuration
  private readonly MAX_CONCURRENT_PER_USER = 2;
  private readonly MAX_GLOBAL_CONCURRENT = 20;
  private readonly REQUEST_TIMEOUT = 60000; // 60 seconds
  private readonly QUEUE_MAX_SIZE = 100;

  async queueRequest<T>(
    userId: string, 
    type: 'chat' | 'research' | 'export',
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if queue is full
    if (this.queue.length >= this.QUEUE_MAX_SIZE) {
      throw new Error('System is at capacity. Please try again in a moment.');
    }

    // Get user's current active request count
    const userActiveCount = this.activeRequests.get(userId) || 0;

    // Check per-user limits
    if (userActiveCount >= this.MAX_CONCURRENT_PER_USER) {
      throw new Error('You have too many active requests. Please wait for them to complete.');
    }

    // Check global limits
    if (this.globalActiveCount >= this.MAX_GLOBAL_CONCURRENT) {
      // Queue the request
      return this.enqueueRequest(userId, type, requestFn);
    }

    // Execute immediately if under limits
    return this.executeRequest(userId, requestFn);
  }

  private async enqueueRequest<T>(
    userId: string,
    type: 'chat' | 'research' | 'export',
    requestFn: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const priority = this.getPriority(type);
      
      const queuedRequest: QueuedRequest = {
        id: requestId,
        userId,
        type,
        priority,
        timestamp: Date.now(),
        resolve: async (value: any) => {
          try {
            const result = await this.executeRequest(userId, requestFn);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        reject
      };

      // Set timeout
      queuedRequest.timeoutId = setTimeout(() => {
        this.removeFromQueue(requestId);
        reject(new Error('Request timed out in queue'));
      }, this.REQUEST_TIMEOUT);

      // Add to queue and sort by priority
      this.queue.push(queuedRequest);
      this.queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);

      console.log(`📋 Queued request ${requestId} for user ${userId}. Queue size: ${this.queue.length}`);
    });
  }

  private async executeRequest<T>(userId: string, requestFn: () => Promise<T>): Promise<T> {
    // Increment counters
    this.activeRequests.set(userId, (this.activeRequests.get(userId) || 0) + 1);
    this.globalActiveCount++;

    console.log(`🚀 Executing request for user ${userId}. Global active: ${this.globalActiveCount}`);

    try {
      const result = await requestFn();
      return result;
    } finally {
      // Decrement counters
      this.activeRequests.set(userId, Math.max(0, (this.activeRequests.get(userId) || 1) - 1));
      this.globalActiveCount = Math.max(0, this.globalActiveCount - 1);

      // Process next request in queue
      this.processNextRequest();
    }
  }

  private processNextRequest(): void {
    if (this.queue.length === 0) return;
    if (this.globalActiveCount >= this.MAX_GLOBAL_CONCURRENT) return;

    // Find next eligible request
    for (let i = 0; i < this.queue.length; i++) {
      const request = this.queue[i];
      const userActiveCount = this.activeRequests.get(request.userId) || 0;

      if (userActiveCount < this.MAX_CONCURRENT_PER_USER) {
        // Remove from queue
        this.queue.splice(i, 1);
        
        // Clear timeout
        if (request.timeoutId) {
          clearTimeout(request.timeoutId);
        }

        // Execute
        request.resolve(null);
        break;
      }
    }
  }

  private removeFromQueue(requestId: string): void {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const request = this.queue[index];
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      this.queue.splice(index, 1);
    }
  }

  private getPriority(type: 'chat' | 'research' | 'export'): number {
    switch (type) {
      case 'chat': return 3; // Highest priority
      case 'research': return 2;
      case 'export': return 1; // Lowest priority
      default: return 1;
    }
  }

  // Health check method
  getStatus() {
    return {
      queueSize: this.queue.length,
      globalActiveCount: this.globalActiveCount,
      activeUserCounts: Object.fromEntries(this.activeRequests),
      oldestQueuedRequest: this.queue.length > 0 ? 
        Date.now() - this.queue[this.queue.length - 1].timestamp : null
    };
  }

  // Emergency queue clear (for admin use)
  clearQueue(): void {
    this.queue.forEach(request => {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      request.reject(new Error('Queue cleared by administrator'));
    });
    this.queue = [];
    this.activeRequests.clear();
    this.globalActiveCount = 0;
  }
}

// Singleton instance
export const requestQueue = new RequestQueue();

// Middleware function for API routes
export function withRequestQueue<T extends any[], R>(
  userId: string,
  type: 'chat' | 'research' | 'export',
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return requestQueue.queueRequest(userId, type, () => fn(...args));
  };
}

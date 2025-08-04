// Error monitoring and circuit breaker system
// Prevents cascade failures and provides system health monitoring

interface ErrorMetrics {
  count: number;
  lastError: Date;
  consecutiveFailures: number;
  totalFailures: number;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

class ErrorTracker {
  private errorMetrics = new Map<string, ErrorMetrics>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  
  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 5; // Failures before opening circuit
  private readonly RECOVERY_TIMEOUT = 30000; // 30 seconds before attempting recovery
  private readonly HALF_OPEN_MAX_CALLS = 3; // Max calls to test recovery

  // Track error occurrence
  recordError(service: string, error: any): void {
    const now = new Date();
    
    // Update error metrics
    const metrics = this.errorMetrics.get(service) || {
      count: 0,
      lastError: now,
      consecutiveFailures: 0,
      totalFailures: 0
    };
    
    metrics.count++;
    metrics.totalFailures++;
    metrics.consecutiveFailures++;
    metrics.lastError = now;
    
    this.errorMetrics.set(service, metrics);
    
    // Update circuit breaker
    this.updateCircuitBreaker(service);
    
    console.error(`🚨 Error recorded for ${service}:`, {
      error: error.message,
      consecutiveFailures: metrics.consecutiveFailures,
      totalFailures: metrics.totalFailures,
      circuitState: this.circuitBreakers.get(service)?.state
    });
  }

  // Record successful operation
  recordSuccess(service: string): void {
    const metrics = this.errorMetrics.get(service);
    if (metrics) {
      metrics.consecutiveFailures = 0; // Reset consecutive failures
    }
    
    // Update circuit breaker on success
    const breaker = this.circuitBreakers.get(service);
    if (breaker) {
      if (breaker.state === 'HALF_OPEN') {
        // Recovery successful, close circuit
        breaker.state = 'CLOSED';
        breaker.failureCount = 0;
        console.log(`✅ Circuit breaker CLOSED for ${service} - recovery successful`);
      }
    }
  }

  // Check if service is available (circuit breaker check)
  isServiceAvailable(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return true; // No breaker = available
    
    const now = Date.now();
    
    switch (breaker.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        if (now >= breaker.nextAttemptTime) {
          // Time to try recovery
          breaker.state = 'HALF_OPEN';
          console.log(`🔄 Circuit breaker HALF_OPEN for ${service} - attempting recovery`);
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
        return true; // Allow limited calls to test recovery
        
      default:
        return true;
    }
  }

  // Execute operation with circuit breaker protection
  async executeWithCircuitBreaker<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.isServiceAvailable(service)) {
      throw new Error(`Service ${service} is currently unavailable (circuit breaker OPEN)`);
    }

    try {
      const result = await operation();
      this.recordSuccess(service);
      return result;
    } catch (error) {
      this.recordError(service, error);
      throw error;
    }
  }

  private updateCircuitBreaker(service: string): void {
    const metrics = this.errorMetrics.get(service);
    if (!metrics) return;
    
    let breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      breaker = {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      };
      this.circuitBreakers.set(service, breaker);
    }
    
    breaker.failureCount = metrics.consecutiveFailures;
    breaker.lastFailureTime = Date.now();
    
    // Open circuit if threshold reached
    if (breaker.state === 'CLOSED' && breaker.failureCount >= this.FAILURE_THRESHOLD) {
      breaker.state = 'OPEN';
      breaker.nextAttemptTime = Date.now() + this.RECOVERY_TIMEOUT;
      console.warn(`⚡ Circuit breaker OPENED for ${service} - too many failures`);
    }
  }

  // Get system health status
  getHealthStatus() {
    const status: Record<string, any> = {};
    
    for (const [service, metrics] of this.errorMetrics.entries()) {
      const breaker = this.circuitBreakers.get(service);
      const minutesSinceLastError = metrics.lastError ? 
        (Date.now() - metrics.lastError.getTime()) / 60000 : null;
      
      status[service] = {
        totalErrors: metrics.totalFailures,
        consecutiveFailures: metrics.consecutiveFailures,
        lastErrorMinutesAgo: minutesSinceLastError ? Math.round(minutesSinceLastError) : null,
        circuitBreakerState: breaker?.state || 'CLOSED',
        isAvailable: this.isServiceAvailable(service),
        healthScore: this.calculateHealthScore(metrics, breaker)
      };
    }
    
    return {
      services: status,
      overallHealth: this.calculateOverallHealth(status),
      systemLoad: this.getSystemLoad()
    };
  }

  private calculateHealthScore(metrics: ErrorMetrics, breaker?: CircuitBreakerState): number {
    if (breaker?.state === 'OPEN') return 0;
    if (breaker?.state === 'HALF_OPEN') return 25;
    
    const hoursSinceLastError = metrics.lastError ? 
      (Date.now() - metrics.lastError.getTime()) / 3600000 : 24;
    
    if (hoursSinceLastError >= 24) return 100;
    if (hoursSinceLastError >= 1) return 75;
    if (metrics.consecutiveFailures === 0) return 90;
    if (metrics.consecutiveFailures < 3) return 60;
    return 30;
  }

  private calculateOverallHealth(serviceStatus: Record<string, any>): number {
    const services = Object.values(serviceStatus);
    if (services.length === 0) return 100;
    
    const avgHealth = services.reduce((sum, service) => sum + service.healthScore, 0) / services.length;
    return Math.round(avgHealth);
  }

  private getSystemLoad(): { level: string; description: string } {
    const totalErrors = Array.from(this.errorMetrics.values())
      .reduce((sum, metrics) => sum + metrics.consecutiveFailures, 0);
    
    const openCircuits = Array.from(this.circuitBreakers.values())
      .filter(breaker => breaker.state === 'OPEN').length;
    
    if (openCircuits > 2 || totalErrors > 10) {
      return { level: 'HIGH', description: 'System under stress - multiple services degraded' };
    } else if (openCircuits > 0 || totalErrors > 5) {
      return { level: 'MEDIUM', description: 'Some services experiencing issues' };
    } else {
      return { level: 'LOW', description: 'System operating normally' };
    }
  }

  // Reset all metrics (admin function)
  resetAllMetrics(): void {
    this.errorMetrics.clear();
    this.circuitBreakers.clear();
    console.log('🔄 All error metrics and circuit breakers reset');
  }

  // Force close all circuit breakers (emergency function)
  forceCloseAllCircuits(): void {
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      console.log(`🔧 Forced circuit breaker CLOSED for ${service}`);
    }
  }

  // Get detailed error report for a service
  getServiceErrorReport(service: string) {
    const metrics = this.errorMetrics.get(service);
    const breaker = this.circuitBreakers.get(service);
    
    if (!metrics) {
      return { message: `No error data for service: ${service}` };
    }
    
    return {
      service,
      totalFailures: metrics.totalFailures,
      consecutiveFailures: metrics.consecutiveFailures,
      lastErrorTime: metrics.lastError.toISOString(),
      circuitBreakerState: breaker?.state || 'CLOSED',
      isCurrentlyAvailable: this.isServiceAvailable(service),
      nextRecoveryAttempt: breaker?.nextAttemptTime ? 
        new Date(breaker.nextAttemptTime).toISOString() : null,
      recommendations: this.getRecommendations(metrics, breaker)
    };
  }

  private getRecommendations(metrics: ErrorMetrics, breaker?: CircuitBreakerState): string[] {
    const recommendations: string[] = [];
    
    if (breaker?.state === 'OPEN') {
      recommendations.push('Service is currently down - wait for automatic recovery or check service status');
    }
    
    if (metrics.consecutiveFailures >= 3) {
      recommendations.push('High failure rate detected - consider checking API keys and service status');
    }
    
    if (metrics.totalFailures > 50) {
      recommendations.push('High total failure count - consider reviewing service integration');
    }
    
    return recommendations;
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Helper function for wrapping operations with circuit breaker
export async function withCircuitBreaker<T>(
  service: string,
  operation: () => Promise<T>
): Promise<T> {
  return errorTracker.executeWithCircuitBreaker(service, operation);
}

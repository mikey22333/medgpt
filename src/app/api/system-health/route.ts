import { NextRequest, NextResponse } from 'next/server';
import { requestQueue } from '@/lib/concurrency/request-queue';
import { rateLimiter } from '@/lib/concurrency/rate-limiter';
import { errorTracker } from '@/lib/monitoring/error-tracker';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only allow authenticated users to see system health
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Gather system health data
    const requestQueueStatus = requestQueue.getStatus();
    const rateLimiterStatus = rateLimiter.getStatus();
    const errorStatus = errorTracker.getHealthStatus();
    
    // Check database health
    const dbHealth = await checkDatabaseHealth(supabase);
    
    // Calculate overall system health score
    const overallHealthScore = calculateOverallHealth({
      requestQueue: requestQueueStatus,
      rateLimiter: rateLimiterStatus,
      errors: errorStatus,
      database: dbHealth
    });

    const response = {
      timestamp: new Date().toISOString(),
      overallHealth: overallHealthScore,
      status: getHealthStatus(overallHealthScore),
      components: {
        requestQueue: {
          status: requestQueueStatus.queueSize < 50 ? 'healthy' : 'stressed',
          metrics: requestQueueStatus
        },
        rateLimiter: {
          status: 'operational',
          metrics: rateLimiterStatus
        },
        errorTracking: {
          status: errorStatus.overallHealth >= 70 ? 'healthy' : 'degraded',
          metrics: errorStatus
        },
        database: dbHealth
      },
      recommendations: generateRecommendations({
        requestQueueStatus,
        rateLimiterStatus,
        errorStatus,
        dbHealth
      })
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallHealth: 0,
      status: 'critical',
      error: 'Health check system failure',
      message: error.message
    }, { status: 500 });
  }
}

async function checkDatabaseHealth(supabase: any) {
  try {
    const startTime = Date.now();
    
    // Test basic query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact' })
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'error',
        responseTime,
        error: error.message
      };
    }

    return {
      status: responseTime < 1000 ? 'healthy' : 'slow',
      responseTime,
      userCount: data.length
    };

  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

function calculateOverallHealth(components: any): number {
  let totalScore = 0;
  let componentCount = 0;

  // Request Queue Health (25% weight)
  const queueHealth = components.requestQueue.queueSize < 20 ? 100 : 
                     components.requestQueue.queueSize < 50 ? 75 :
                     components.requestQueue.queueSize < 80 ? 50 : 25;
  totalScore += queueHealth * 0.25;
  componentCount++;

  // Error Tracking Health (30% weight)
  totalScore += components.errors.overallHealth * 0.30;
  componentCount++;

  // Database Health (25% weight)
  const dbHealth = components.database.status === 'healthy' ? 100 :
                   components.database.status === 'slow' ? 60 : 20;
  totalScore += dbHealth * 0.25;
  componentCount++;

  // Rate Limiter Health (20% weight) - assume healthy if no critical services down
  const rateLimiterHealth = Object.values(components.rateLimiter)
    .every((service: any) => service.utilizationPercent < 90) ? 100 : 70;
  totalScore += rateLimiterHealth * 0.20;
  componentCount++;

  return Math.round(totalScore);
}

function getHealthStatus(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

function generateRecommendations(data: any): string[] {
  const recommendations: string[] = [];

  // Request Queue recommendations
  if (data.requestQueueStatus.queueSize > 50) {
    recommendations.push('High request queue - consider scaling server resources');
  }
  if (data.requestQueueStatus.globalActiveCount > 15) {
    recommendations.push('High concurrent request load - monitor performance');
  }

  // Error tracking recommendations
  if (data.errorStatus.overallHealth < 70) {
    recommendations.push('Multiple services experiencing errors - check API keys and service status');
  }

  // Database recommendations
  if (data.dbHealth.status === 'slow') {
    recommendations.push('Database response times are slow - check Supabase performance');
  }
  if (data.dbHealth.status === 'error') {
    recommendations.push('Database connection issues - verify Supabase configuration');
  }

  // Rate limiter recommendations
  const highUtilizationServices = Object.entries(data.rateLimiterStatus)
    .filter(([_, service]: [string, any]) => service.utilizationPercent > 80)
    .map(([name]) => name);
  
  if (highUtilizationServices.length > 0) {
    recommendations.push(`High API utilization detected: ${highUtilizationServices.join(', ')}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('System is operating optimally');
  }

  return recommendations;
}

// Admin endpoint to reset all systems (POST)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // In a real app, you'd check if user is admin
    // For now, allow any authenticated user (remove in production)
    
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset-queue':
        requestQueue.clearQueue();
        return NextResponse.json({ message: 'Request queue cleared' });
        
      case 'reset-errors':
        errorTracker.resetAllMetrics();
        return NextResponse.json({ message: 'Error metrics reset' });
        
      case 'reset-rate-limits':
        rateLimiter.resetAllLimits();
        return NextResponse.json({ message: 'Rate limits reset' });
        
      case 'force-close-circuits':
        errorTracker.forceCloseAllCircuits();
        return NextResponse.json({ message: 'All circuit breakers closed' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

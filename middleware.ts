import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/chat': { requests: 20, windowMs: 60000 }, // 20 requests per minute for chat
  '/api/research': { requests: 30, windowMs: 60000 }, // 30 requests per minute for research
  '/api/export': { requests: 10, windowMs: 60000 }, // 10 requests per minute for exports
  'default': { requests: 50, windowMs: 60000 } // 50 requests per minute for other APIs
};

function getRateLimitKey(request: NextRequest): string {
  // Use IP address as the key (in production, consider using user ID for authenticated users)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return ip;
}

function getRateLimit(pathname: string) {
  // Find matching rate limit or use default
  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return limit;
    }
  }
  return RATE_LIMITS.default;
}

function checkRateLimit(key: string, limit: { requests: number; windowMs: number }): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(key);

  if (!userRequests || now > userRequests.resetTime) {
    // First request or window expired - reset counter
    requestCounts.set(key, {
      count: 1,
      resetTime: now + limit.windowMs
    });
    return true;
  }

  if (userRequests.count >= limit.requests) {
    // Rate limit exceeded
    return false;
  }

  // Increment counter
  userRequests.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting in development - check multiple conditions
  const isLocalhost = request.nextUrl.hostname === 'localhost' || 
                     request.nextUrl.hostname === '127.0.0.1' ||
                     request.nextUrl.hostname.includes('localhost');
  const isDev = process.env.NODE_ENV === 'development';
  const isDevPort = request.nextUrl.port === '3000' || request.nextUrl.port === '3001';
  
  // Skip rate limiting if any development condition is met
  if (isDev || isLocalhost || isDevPort) {
    console.log('Skipping rate limiting - development mode detected');
    return NextResponse.next();
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = getRateLimit(pathname);
    
    if (!checkRateLimit(rateLimitKey, rateLimit)) {
      console.log(`Rate limit exceeded for ${rateLimitKey} on ${pathname}`);
      
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          details: `Please wait before making more requests to ${pathname}` 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimit.windowMs) / 1000))
          }
        }
      );
    }

    // Add rate limit headers to successful requests
    const userRequests = requestCounts.get(rateLimitKey);
    if (userRequests) {
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', String(rateLimit.requests));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, rateLimit.requests - userRequests.count)));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(userRequests.resetTime / 1000)));
      return response;
    }
  }

  // Continue to the next middleware or route handler
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/research/:path*',
    '/api/export/:path*',
    '/api/documents/:path*'
  ]
};

// Cleanup function to prevent memory leaks (run periodically)
export function cleanupRateLimitData() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// Manual reset function for development
export function resetRateLimits() {
  requestCounts.clear();
  console.log('Rate limits cleared');
}

// Clear rate limits immediately on file load during development
if (typeof window === 'undefined') { // Server-side only
  resetRateLimits();
}

// Set up cleanup interval (in a real app, this would be handled by a background job)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitData, 300000); // Clean up every 5 minutes
}

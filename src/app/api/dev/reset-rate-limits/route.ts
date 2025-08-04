import { NextRequest, NextResponse } from 'next/server';

// This endpoint allows manual reset of rate limits during development
export async function POST(request: NextRequest) {
  // Only allow in development or from localhost
  const isLocalhost = request.nextUrl.hostname === 'localhost' || 
                     request.nextUrl.hostname === '127.0.0.1';
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev && !isLocalhost) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    // Import and call the reset function
    const { resetRateLimits } = await import('../../../../../middleware');
    resetRateLimits();
    
    return NextResponse.json({ 
      message: 'Rate limits cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to clear rate limits',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Rate limit reset endpoint - use POST to reset',
    usage: 'POST /api/dev/reset-rate-limits'
  });
}

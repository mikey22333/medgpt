import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let redirectedFrom = searchParams.get('redirectedFrom') || '/chat'; // Default to /chat instead of /

  // URL decode the redirectedFrom parameter if it's encoded
  try {
    redirectedFrom = decodeURIComponent(redirectedFrom);
  } catch (error) {
    console.warn('Failed to decode redirectedFrom parameter:', redirectedFrom);
    redirectedFrom = '/chat'; // Fallback to chat page
  }

  // Ensure redirectedFrom starts with /
  if (!redirectedFrom.startsWith('/')) {
    redirectedFrom = '/' + redirectedFrom;
  }

  console.log('Auth callback initial params:', { 
    code: code ? 'present' : 'missing',
    redirectedFrom,
    searchParams: Object.fromEntries(searchParams),
    origin,
    url: request.url,
    headers: {
      host: request.headers.get('host'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      referer: request.headers.get('referer')
    }
  });

  if (code) {
    const supabase = await createClient();
    
    console.log('Supabase auth exchange starting...');
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log('Supabase auth result:', {
      error: error?.message,
      hasSession: !!sessionData?.session,
      user: sessionData?.session?.user?.email
    });
    
    if (!error) {
      // Get all relevant headers for debugging
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
      const host = request.headers.get('host');
      const referer = request.headers.get('referer');
      
      // More reliable production detection
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const isLocalHost = host?.includes('localhost') || host?.includes('127.0.0.1') || origin.includes('localhost');
      const isProduction = !isLocalEnv && !isLocalHost;
      
      let redirectUrl;
      let baseUrl;
      
      console.log('Production detection debug:', {
        NODE_ENV: process.env.NODE_ENV,
        isLocalEnv,
        host,
        origin,
        isLocalHost,
        isProduction,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
      });
      
      if (isProduction) {
        // Production environment - use production URL
        if (forwardedHost) {
          // Use forwarded host (most reliable for proxied requests)
          baseUrl = `${forwardedProto}://${forwardedHost}`;
        } else if (host && !host.includes('localhost')) {
          // Use host header if it's not localhost
          baseUrl = `https://${host}`;
        } else {
          // Fallback to environment variable or hardcoded production URL
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clinisynth.onrender.com';
        }
      } else {
        // Development environment - use localhost
        baseUrl = 'http://localhost:3000';
      }
      
      redirectUrl = `${baseUrl}${redirectedFrom}`;
      
      // Enhanced logging for debugging
      console.log('Auth callback redirect debug:', { 
        origin, 
        host,
        forwardedHost, 
        forwardedProto,
        referer,
        redirectedFrom, 
        baseUrl,
        redirectUrl,
        isLocalEnv: !isProduction,
        isProduction,
        NODE_ENV: process.env.NODE_ENV
      });
      
      return NextResponse.redirect(redirectUrl);
    } else {
      console.error('Auth code exchange error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectedFrom = searchParams.get('redirectedFrom') || '/';

  if (code) {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Get all relevant headers for debugging
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
      const host = request.headers.get('host');
      const referer = request.headers.get('referer');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      let redirectUrl;
      let baseUrl;
      
      if (isLocalEnv) {
        // Development environment
        baseUrl = origin;
      } else {
        // Production environment - determine correct base URL
        if (forwardedHost) {
          // Use forwarded host (most reliable for proxied requests)
          baseUrl = `${forwardedProto}://${forwardedHost}`;
        } else if (host && !host.includes('localhost')) {
          // Use host header if it's not localhost
          baseUrl = `https://${host}`;
        } else if (referer && !referer.includes('localhost')) {
          // Fallback to referer origin if available
          try {
            const refererUrl = new URL(referer);
            baseUrl = refererUrl.origin;
          } catch {
            baseUrl = origin;
          }
        } else {
          // Last resort - use request origin
          baseUrl = origin;
        }
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
        isLocalEnv,
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

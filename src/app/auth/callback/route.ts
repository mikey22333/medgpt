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
      // Always use the current request origin to avoid localhost redirects
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      let redirectUrl;
      
      if (isLocalEnv) {
        // Development environment
        redirectUrl = `${origin}${redirectedFrom}`;
      } else if (forwardedHost) {
        // Production with load balancer (Render, Vercel, etc.)
        redirectUrl = `${forwardedProto}://${forwardedHost}${redirectedFrom}`;
      } else {
        // Fallback to request origin
        redirectUrl = `${origin}${redirectedFrom}`;
      }
      
      console.log('Auth callback redirect:', { 
        origin, 
        forwardedHost, 
        forwardedProto, 
        redirectedFrom, 
        redirectUrl 
      });
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

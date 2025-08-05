'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 CLIENT-SIDE: Auth callback page loaded');
        console.log('🔍 CLIENT-SIDE: Current URL:', window.location.href);
        console.log('🔍 CLIENT-SIDE: Hash:', window.location.hash);
        console.log('🔍 CLIENT-SIDE: Search:', window.location.search);

        const supabase = createClient();
        
        // Check if we have tokens in the URL fragment (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('🔍 CLIENT-SIDE: Fragment params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          error: error || 'none',
          errorDescription: errorDescription || 'none'
        });

        if (error) {
          console.error('🚨 CLIENT-SIDE: OAuth error in fragment:', { error, errorDescription });
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (accessToken) {
          console.log('🎯 CLIENT-SIDE: Processing implicit flow tokens...');
          
          // For implicit flow, Supabase should automatically handle the session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          console.log('🔍 CLIENT-SIDE: Session check result:', {
            hasSession: !!session,
            user: session?.user?.email,
            error: sessionError?.message
          });

          if (session) {
            console.log('✅ CLIENT-SIDE: Session established successfully');
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Force redirect to production URL
            const isProduction = !window.location.href.includes('localhost');
            const baseUrl = isProduction ? 'https://clinisynth.onrender.com' : 'http://localhost:3000';
            const redirectUrl = `${baseUrl}/chat`;
            
            console.log('🚀 CLIENT-SIDE: Redirecting to:', redirectUrl);
            
            // Use window.location for cross-origin redirect
            window.location.href = redirectUrl;
            return;
          }
        }

        // Try to handle the callback normally (for code flow)
        const { data, error: callbackError } = await supabase.auth.exchangeCodeForSession(window.location.search);
        
        if (callbackError) {
          console.error('🚨 CLIENT-SIDE: Code exchange error:', callbackError);
          setStatus('error');
          setMessage(`Authentication failed: ${callbackError.message}`);
          return;
        }

        if (data.session) {
          console.log('✅ CLIENT-SIDE: Code flow session established');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Force redirect to production URL
          const isProduction = !window.location.href.includes('localhost');
          const baseUrl = isProduction ? 'https://clinisynth.onrender.com' : 'http://localhost:3000';
          const redirectUrl = `${baseUrl}/chat`;
          
          console.log('🚀 CLIENT-SIDE: Redirecting to:', redirectUrl);
          window.location.href = redirectUrl;
          return;
        }

        // If we get here, something went wrong
        console.error('🚨 CLIENT-SIDE: No session established');
        setStatus('error');
        setMessage('Authentication failed: No session established');

      } catch (error) {
        console.error('🚨 CLIENT-SIDE: Auth callback error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Error'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
          {status === 'loading' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4">
              <a 
                href="/login" 
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Try logging in again
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient();
      
      try {
        console.log('🔍 Client-side auth callback processing...');
        
        // Get redirect destination
        let redirectedFrom = searchParams.get('redirectedFrom') || '/chat';
        try {
          redirectedFrom = decodeURIComponent(redirectedFrom);
        } catch {
          redirectedFrom = '/chat';
        }
        
        console.log('📍 Will redirect to:', redirectedFrom);
        
        // Handle the auth callback
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('🚨 Auth error:', authError);
          setError(authError.message);
          return;
        }

        if (data.session) {
          console.log('✅ Session found, user authenticated:', data.session.user.email);
          
          // Force redirect to production URL
          const isProduction = !window.location.hostname.includes('localhost');
          const baseUrl = isProduction ? 'https://clinisynth.onrender.com' : 'http://localhost:3000';
          const finalUrl = `${baseUrl}${redirectedFrom}`;
          
          console.log('🚀 Redirecting to:', finalUrl);
          
          // Use replace to avoid history issues
          window.location.replace(finalUrl);
        } else {
          console.log('❌ No session found, redirecting to login');
          router.push('/auth/login');
        }
        
      } catch (error) {
        console.error('🚨 Callback processing error:', error);
        setError('Authentication failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuth();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Authentication Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Completing Sign In</h1>
        <p className="text-slate-600">
          {isProcessing ? 'Processing your authentication...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}

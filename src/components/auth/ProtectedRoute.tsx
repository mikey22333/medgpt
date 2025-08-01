"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/auth/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Include current path in redirect so user comes back here after login
      const currentPath = window.location.pathname;
      const loginUrl = `${redirectTo}?redirectedFrom=${encodeURIComponent(currentPath)}`;
      console.log('ProtectedRoute redirect:', { currentPath, loginUrl });
      router.push(loginUrl);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Loading CliniSynth</h2>
              <p className="text-sm text-gray-600">Preparing your medical research assistant...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

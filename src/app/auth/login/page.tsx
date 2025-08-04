"use client";

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Chrome, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  let redirectedFrom = searchParams.get('redirectedFrom') || '/chat'; // Default to chat page
  
  // Ensure we have a valid redirect path
  if (redirectedFrom === '/' || redirectedFrom === '') {
    redirectedFrom = '/chat';
  }
  
  console.log('Login page redirectedFrom:', redirectedFrom);
  
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // Get the correct base URL for redirects
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const redirectUrl = `${baseUrl}/auth/callback`;
        
        console.log('Signup redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        
        if (error) {
          // Handle specific signup errors
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Try signing in instead.');
          }
          throw error;
        }
        
        // Clear form and show success message
        setPassword('');
        console.log('Signup successful:', data); // Debug log
        
        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          setMessage(`✅ Account created successfully! We've sent a confirmation email to ${email}. Please check your inbox and click the confirmation link to activate your account.`);
          
          // Auto-switch to sign in mode after showing the message
          setTimeout(() => {
            setIsSignUp(false);
            setMessage('Ready to sign in? Enter your credentials above after confirming your email.');
          }, 12000);
        } else if (data.user) {
          // If email confirmation is disabled, redirect immediately
          setMessage('✅ Account created successfully! Redirecting...');
          setTimeout(() => {
            router.push(redirectedFrom);
          }, 1500);
        } else {
          // Fallback message
          setMessage(`✅ Account created! Please check ${email} for a confirmation email.`);
        }
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // Handle specific signin errors
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and click the confirmation link before signing in.');
          }
          throw error;
        }
        
        router.push(redirectedFrom);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Force production URL regardless of environment
      const isProduction = !window.location.hostname.includes('localhost');
      const baseUrl = isProduction ? 'https://clinisynth.onrender.com' : 'http://localhost:3000';
      
      const redirectUrl = `${baseUrl}/auth/callback?redirectedFrom=${encodeURIComponent(redirectedFrom)}`;
      
      console.log('Google OAuth redirect URL (forced):', { 
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        isProduction,
        baseUrl, 
        redirectUrl 
      });
      
      console.log('About to call Supabase signInWithOAuth...');
      
      // TEMPORARY DEBUG: Manual OAuth URL construction to see what Supabase generates vs what we want
      const manualOAuthUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
      console.log('Manual OAuth URL would be:', manualOAuthUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      
      console.log('Supabase OAuth response:', { data, error });
      console.log('Supabase should redirect to:', redirectUrl);
      
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Get the correct base URL for redirects
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${baseUrl}/auth/callback?redirectedFrom=${encodeURIComponent(redirectedFrom)}`;
      
      console.log('Magic link redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      
      if (error) throw error;
      
      setMessage('Check your email for the magic link!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="flex items-center space-x-3">
            <Logo size="lg" className="shadow-lg animate-pulse" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900">CliniSynth</h1>
              <p className="text-sm text-slate-600">AI Medical Research</p>
            </div>
          </div>
        </div>
        
        <div className="text-center animate-fade-in-delay">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to CliniSynth
          </h2>
          <p className="text-slate-600 text-lg mb-2">
            {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
          </p>
          {isSignUp && (
            <p className="text-slate-500 text-sm">
              💡 After creating your account, check your email for a confirmation link
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border-0 animate-fade-in-delay">
          {/* Google Sign In */}
          <div className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium h-12 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Chrome className="h-5 w-5 mr-3 text-blue-500" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-4 text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-5">
              {/* Show current action for better UX */}
              {isLoading && (
                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">
                    {isSignUp ? '🚀 Creating your CliniSynth account...' : '🔑 Signing you in...'}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-11 h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-11 pr-11 h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full medical-gradient hover:opacity-90 text-white font-semibold h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>{isSignUp ? 'Creating your account...' : 'Signing you in...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>{isSignUp ? '🚀 Create account' : '🔑 Sign in'}</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                )}
              </Button>
            </form>

            {/* Magic Link Option */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleMagicLink}
                disabled={isLoading || !email.trim()}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg px-4 py-2"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Send magic link instead
              </Button>
            </div>

            {/* Toggle Sign Up/Sign In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-50 rounded-lg px-4 py-2 transition-all duration-200"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-sm font-bold">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {message && (
            <div className="mt-6 p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200 shadow-sm animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 text-lg">✓</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-emerald-800 font-medium leading-relaxed">{message}</p>
                  {isSignUp && message.includes('confirmation email') && (
                    <div className="mt-3 p-3 bg-emerald-100/50 rounded-lg">
                      <p className="text-xs text-emerald-700">
                        💡 <strong>Next steps:</strong> Check your email inbox (and spam folder) for a confirmation link from CliniSynth. Click the link to activate your account.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

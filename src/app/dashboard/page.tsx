"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  User, 
  LogOut, 
  Crown,
  CheckCircle,
  XCircle,
  Shield,
  Zap,
  Star,
  ArrowLeft,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  subscription_tier: 'free' | 'pro';
  query_limit: number;
  queries_used: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
}

// Separate component for search params functionality
function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    subscription_tier: 'free',
    query_limit: 3,
    queries_used: 0
  });
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const checkoutLoading = false;
  const checkoutError = null;

  const supabase = createClient();
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, query_limit, queries_used, stripe_customer_id, stripe_subscription_id, subscription_status')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleUpgrade = async () => {
    if (!user?.id) return;
    alert('Stripe integration coming soon! Please follow the STRIPE_SETUP_GUIDE.md to set up your Stripe account.');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your account...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/chat')}
                  variant="ghost"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Chat</span>
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{user?.email}</span>
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Payment Status Alerts */}
          {paymentStatus === 'success' && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Payment Successful!</h3>
                  <p className="text-sm text-green-700 mt-1">Welcome to CliniSynth Pro! Your subscription is now active.</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'cancelled' && (
            <div className="mb-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Payment Cancelled</h3>
                  <p className="text-sm text-orange-700 mt-1">You can upgrade to Pro anytime. No worries!</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Plan Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Subscription</h2>
            
            <Card className="p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${userProfile.subscription_tier === 'pro' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    <Crown className={`h-6 w-6 ${userProfile.subscription_tier === 'pro' ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {userProfile.subscription_tier === 'pro' ? 'CliniSynth Pro' : 'CliniSynth Free'}
                    </h3>
                    <p className="text-gray-600">
                      {userProfile.subscription_tier === 'pro' 
                        ? 'All premium features included' 
                        : 'Limited features with daily limits'
                      }
                    </p>
                  </div>
                </div>
                
                {userProfile.subscription_tier === 'free' && (
                  <Button 
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    {checkoutLoading ? 'Processing...' : 'Upgrade to Pro'}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Pricing Plans */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <Card className={`p-6 ${userProfile.subscription_tier === 'free' ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                    <Shield className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">🆓 Free Plan – For Everyone</h3>
                  <div className="text-3xl font-bold text-gray-900">$0</div>
                  <p className="text-gray-600">per month</p>
                  <p className="text-sm text-gray-500 mt-2">Ideal for basic use and trial experience</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">3 total queries/day (Doctor + Research combined)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">Doctor Mode & Research Mode</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">Structured clinical summaries</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">Visual data outputs (pie charts, bar graphs)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">10 citations per query</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-4 w-4 text-red-500 mr-3" />
                    <span className="text-sm text-gray-500">No PDF export</span>
                  </li>
                </ul>
                
                {userProfile.subscription_tier === 'free' && (
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Current Plan
                    </span>
                  </div>
                )}
              </Card>

              {/* Pro Plan */}
              <Card className={`p-6 relative ${userProfile.subscription_tier === 'pro' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'bg-white border-blue-200'}`}>
                {userProfile.subscription_tier !== 'pro' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
                    <Crown className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">⚡ Pro Plan – For Power Users</h3>
                  <div className="text-3xl font-bold text-gray-900">$12</div>
                  <p className="text-gray-600">per month</p>
                  <p className="text-sm text-gray-500 mt-2">Great for medical students, researchers, and clinicians</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">15 queries/day</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">Everything in Free Plan</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">PDF export of research</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">Citation visual summaries (max 20 citations)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">View as pie chart or tag clusters</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                    <span className="text-sm text-gray-700">Faster AI response & processing priority</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="h-4 w-4 text-purple-500 mr-3" />
                    <span className="text-sm text-gray-700">Early access to new features</span>
                  </li>
                </ul>
                
                {userProfile.subscription_tier === 'pro' ? (
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Current Plan
                    </span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {checkoutLoading ? 'Processing...' : 'Upgrade to Pro'}
                  </Button>
                )}
              </Card>
            </div>
          </div>

          {/* Additional Information */}
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@clinisynth.com" className="text-blue-600 hover:underline">
                support@clinisynth.com
              </a>
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Main component with Suspense wrapper
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    }>
      <DashboardContent />
    </Suspense>
  );
}

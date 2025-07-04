"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  User, 
  LogOut, 
  MessageSquare,
  FlaskConical,
  UserCheck,
  Search,
  Settings,
  Crown,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
// import { useStripeCheckout } from '@/hooks/useStripeCheckout';
// import { STRIPE_CONFIG, detectUserCurrency } from '@/lib/stripe/config';

interface UserQuery {
  id: string;
  mode: string;
  query_text: string;
  response_text?: string;
  created_at: string;
  session_id: string;
}

interface UserProfile {
  subscription_tier: 'free' | 'pro';
  query_limit: number;
  queries_used: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recentQueries, setRecentQueries] = useState<UserQuery[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    subscription_tier: 'free',
    query_limit: 3, // Updated to match new pricing strategy
    queries_used: 0
  });
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  // const { createCheckoutSession, loading: checkoutLoading, error: checkoutError } = useStripeCheckout();
  const checkoutLoading = false;
  const checkoutError = null;

  const supabase = createClient();

  // Check for payment status in URL
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    // setCurrency(detectUserCurrency()); // TODO: Uncomment when Stripe is ready
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, query_limit, queries_used, stripe_customer_id, stripe_subscription_id, subscription_status')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Load recent queries (last 20)
      const { data: queries } = await supabase
        .from('user_queries')
        .select('id, mode, query_text, response_text, created_at, session_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (queries) {
        setRecentQueries(queries);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleUpgrade = async () => {
    if (!user?.id) return;
    
    // TODO: Implement Stripe checkout when ready
    alert('Stripe integration coming soon! Please follow the STRIPE_SETUP_GUIDE.md to set up your Stripe account.');
    
    // try {
    //   await createCheckoutSession(user.id);
    // } catch (error) {
    //   console.error('Failed to start checkout:', error);
    // }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'research': return <FlaskConical className="h-4 w-4 text-blue-600" />;
      case 'doctor': return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'source-finder': return <Search className="h-4 w-4 text-purple-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'research': return 'Research';
      case 'doctor': return 'Doctor';
      case 'source-finder': return 'Source Finder';
      default: return 'Chat';
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!confirm('Delete this conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      await supabase
        .from('user_queries')
        .delete()
        .eq('id', queryId)
        .eq('user_id', user?.id);
      
      // Reload recent queries to reflect deletion
      loadUserData();
    } catch (error) {
      console.error('Error deleting query:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm p-3 md:p-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => router.push('/chat')}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
              >
                ← Back to Chat
              </Button>
              <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">Settings & Pricing</h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs md:text-sm text-gray-600 truncate max-w-[150px] md:max-w-none">{user?.email}</span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Payment Status Alert */}
          {paymentStatus === 'success' && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Payment Successful!</h3>
                  <p className="text-sm text-green-700">Welcome to Pro! Your subscription is now active.</p>
                </div>
              </div>
            </Card>
          )}

          {paymentStatus === 'cancelled' && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-900">Payment Cancelled</h3>
                  <p className="text-sm text-orange-700">You can upgrade to Pro anytime from this page.</p>
                </div>
              </div>
            </Card>
          )}

          {checkoutError && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">Payment Error</h3>
                  <p className="text-sm text-red-700">{checkoutError}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Subscription Card */}
          <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Crown className={`h-5 w-5 ${userProfile.subscription_tier === 'pro' ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    {userProfile.subscription_tier === 'pro' ? '💎 Pro Plan' : '🧪 Starter Plan (Free)'}
                  </h3>
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  {userProfile.subscription_tier === 'free' 
                    ? `${userProfile.queries_used} / ${userProfile.query_limit} questions today`
                    : 'Unlimited questions'
                  }
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
                {userProfile.subscription_tier === 'free' && (
                  <Button 
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 text-xs md:text-sm"
                  >
                    <Crown className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-xs md:text-sm">
                  <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                  <span className="sm:hidden">⚙️</span>
                </Button>
              </div>
            </div>
            
            {/* Usage Progress Bar - Only for free tier */}
            {userProfile.subscription_tier === 'free' && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Daily Question Usage</span>
                  <span>{userProfile.queries_used} / {userProfile.query_limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((userProfile.queries_used / userProfile.query_limit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Plan Features */}
            {userProfile.subscription_tier === 'free' ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Plan Features */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">🧪 Starter Plan (Free)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ 3 AI questions/day</li>
                    <li>✅ 3 citations per response</li>
                    <li>✅ Google/email login</li>
                    <li>✅ Doctor & Research modes</li>
                    <li>✅ Access to FDA + PubMed</li>
                    <li>❌ No saved history</li>
                  </ul>
                </div>
                
                {/* Pro Plan Features */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-2">💎 Pro Plan</h4>
                  <div className="text-lg font-bold text-blue-600 mb-2">
                    {currency === 'INR' ? '₹299/month' : '$5.99/month'}
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Unlimited AI chats</li>
                    <li>✅ 10+ citations per response</li>
                    <li>✅ Full Research Mode access</li>
                    <li>✅ Save chat history</li>
                    <li>✅ Download PDF responses</li>
                    <li>✅ Source Finder Intelligence</li>
                    <li>✅ Priority speed</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-purple-50 rounded-lg border-2 border-yellow-200">
                <h4 className="font-medium text-gray-900 mb-2">💎 Pro Plan Active</h4>
                <div className="text-sm text-gray-600">
                  You have access to unlimited questions, priority speed, and all premium features.
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Card 
              className="p-3 md:p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg border-0"
              onClick={() => router.push('/chat')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <MessageSquare className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-base">Start New Chat</h3>
                    <p className="text-blue-100 text-xs md:text-sm truncate">
                      {userProfile.subscription_tier === 'free' 
                        ? `${userProfile.query_limit - userProfile.queries_used} questions left today`
                        : 'Unlimited questions available'
                      }
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              </div>
            </Card>

            <Card 
              className="p-3 md:p-4 bg-gradient-to-br from-purple-600 to-purple-700 text-white cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg border-0"
              onClick={userProfile.subscription_tier === 'free' ? handleUpgrade : undefined}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Crown className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-base">
                      {userProfile.subscription_tier === 'free' ? 'Upgrade to Pro' : 'Pro Features'}
                    </h3>
                    <p className="text-purple-100 text-xs md:text-sm truncate">
                      {userProfile.subscription_tier === 'free' 
                        ? (currency === 'INR' ? '₹299/month' : '$5.99/month')
                        : 'All premium features active'
                      }
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              </div>
            </Card>
          </div>

          {/* Recent Chat History */}
          <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Conversations</h3>
              {recentQueries.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => router.push('/chat')} className="text-xs md:text-sm">
                  View All Chats
                </Button>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm">Loading chat history...</p>
              </div>
            ) : recentQueries.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {recentQueries.map((query) => (
                  <div key={query.id} className="relative flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="mt-1 flex-shrink-0">
                      {getModeIcon(query.mode)}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push('/chat')}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {getModeLabel(query.mode)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatDate(query.created_at)}
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-gray-900 font-medium line-clamp-2">
                        {truncateText(query.query_text, 100)}
                      </p>
                      {query.response_text && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {truncateText(query.response_text, 100)}
                        </p>
                      )}
                    </div>
                    
                    {/* Always visible action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/chat');
                        }}
                        className="p-1 h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                        title="Edit conversation"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuery(query.id);
                        }}
                        className="p-1 h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400">Start chatting to see your history here</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

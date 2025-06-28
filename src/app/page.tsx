"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Sparkles, Settings, LogOut, Crown, ChevronDown, User, FlaskConical, UserCheck, Search, X, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useQueryLimit } from '@/hooks/useQueryLimit';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const { refresh: refreshQueryLimit, canChat, queriesUsed, queryLimit } = useQueryLimit();
  const router = useRouter();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [currentMode, setCurrentMode] = useState<'research' | 'doctor' | 'source-finder'>('research');
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [hasMessages, setHasMessages] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Helper function to get storage keys - matching ChatInterface component
  const getStorageKeys = (mode: string, userId: string) => {
    if (mode === 'source-finder') {
      return {
        messages: `medgpt-sourcefinder-messages-${userId}`,
        session: 'medgpt-source-finder-session'
      };
    }
    return {
      messages: `medgpt-${mode}-messages-${userId}`,
      session: `medgpt-${mode}-session`
    };
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Check if current mode has messages
  useEffect(() => {
    if (user) {
      const checkMessages = () => {
        const { messages: storageKey } = getStorageKeys(currentMode, user.id);
        const messages = localStorage.getItem(storageKey);
        const hasStoredMessages = messages ? JSON.parse(messages).length > 0 : false;
        
        setHasMessages(hasStoredMessages);
      };
      
      checkMessages();
      
      // Listen for storage changes instead of polling
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key && e.key.includes(`medgpt-${currentMode}-messages-${user.id}`)) {
          checkMessages();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also check when returning from other tabs/windows
      const handleFocus = () => checkMessages();
      window.addEventListener('focus', handleFocus);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user, currentMode]);

  // Load user plan
  useEffect(() => {
    if (user) {
      const loadUserPlan = async () => {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setUserPlan(profile.subscription_tier as 'free' | 'pro');
          }
        } catch (error) {
          console.error('Error loading user plan:', error);
        }
      };
      
      loadUserPlan();
    }
  }, [user, supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };

    if (showSettingsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettingsDropdown]);

  const handleSignOut = async () => {
    await signOut();
    setShowSettingsDropdown(false);
  };

  const handlePricing = () => {
    router.push('/dashboard'); // Go to settings/dashboard for pricing
    setShowSettingsDropdown(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">MedGPT Scholar</h2>
              <p className="text-sm text-gray-600">Initializing your medical research assistant...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-white/80 backdrop-blur-sm p-4">
          <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
            {/* Logo and Title - Left Side */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MedGPT Scholar</h1>
                <p className="text-sm text-gray-600">AI-Powered Medical Research Assistant</p>
              </div>
            </div>

            {/* Mode Toggle and Clear Chat - Center */}
            <div className="flex justify-center items-center gap-3">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={currentMode === 'research' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setCurrentMode('research');
                    refreshQueryLimit(); // Refresh query limit when changing modes
                  }}
                  className="flex items-center gap-1 text-xs px-2 sm:px-3"
                >
                  <FlaskConical className="h-3 w-3" />
                  <span className="hidden sm:inline">Research</span>
                </Button>
                <Button
                  variant={currentMode === 'doctor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setCurrentMode('doctor');
                    refreshQueryLimit(); // Refresh query limit when changing modes
                  }}
                  className="flex items-center gap-1 text-xs px-2 sm:px-3"
                >
                  <UserCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Doctor</span>
                </Button>
                <Button
                  variant={currentMode === 'source-finder' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setCurrentMode('source-finder');
                    refreshQueryLimit(); // Refresh query limit when changing modes
                  }}
                  className="flex items-center gap-1 text-xs px-2 sm:px-3"
                >
                  <Search className="h-3 w-3" />
                  <span className="hidden sm:inline">Source</span>
                </Button>
              </div>
              
              {/* Debug Info - Show current usage */}
              <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border">
                {queriesUsed}/{queryLimit} {canChat ? '✅' : '❌'}
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Force refreshing query limit...');
                  refreshQueryLimit();
                }}
                className="flex items-center gap-1 text-xs px-2 sm:px-3"
                title="Refresh query limit"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              
              {/* Clear Chat Button - Only show when there are messages */}
              {hasMessages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Clear chat for current mode using the same storage key format as ChatInterface
                    const { messages: storageKey, session: sessionKey } = getStorageKeys(currentMode, user.id);
                    
                    localStorage.removeItem(storageKey);
                    sessionStorage.removeItem(sessionKey);
                    
                    // Update state immediately
                    setHasMessages(false);
                    
                    // Trigger a page reload to refresh the chat
                    window.location.reload();
                  }}
                  className="flex items-center gap-1 text-xs px-2 sm:px-3 border-red-200 text-red-600 hover:bg-red-50"
                  title={`Clear ${currentMode} chat`}
                >
                  <X className="h-3 w-3" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>

            {/* Settings Dropdown - Right Side */}
            <div className="flex justify-end">
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500">
                        {userPlan === 'pro' ? '💎 Pro Plan' : '🧪 Starter Plan'}
                      </p>
                    </div>
                    
                    <button
                      onClick={handlePricing}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Pricing & Settings
                    </button>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface 
            hideHeader={true} 
            initialMode={currentMode}
            onModeChange={setCurrentMode}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

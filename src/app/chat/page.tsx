"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { Sparkles, Settings, LogOut, Crown, ChevronDown, User, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useQueryLimit } from '@/hooks/useQueryLimit';

export default function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const { refresh: refreshQueryLimit } = useQueryLimit();
  const router = useRouter();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [currentMode, setCurrentMode] = useState<'research' | 'doctor' | 'source-finder'>('research');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

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
    router.push('/dashboard');
    setShowSettingsDropdown(false);
  };

  const handleConversationSelect = (conversationId: string, mode: 'research' | 'doctor' | 'source-finder') => {
    setCurrentConversationId(conversationId);
    setCurrentMode(mode);
    refreshQueryLimit();
  };

  const handleNewChat = (mode?: 'research' | 'doctor' | 'source-finder') => {
    // Clear current conversation to start fresh
    setCurrentConversationId(null);
    if (mode) {
      setCurrentMode(mode);
    }
    refreshQueryLimit();
  };

  const handleSessionCreate = (sessionId: string) => {
    setCurrentConversationId(sessionId);
    refreshQueryLimit();
  };

  const handleModeChange = (mode: 'research' | 'doctor' | 'source-finder') => {
    setCurrentMode(mode);
    setCurrentConversationId(null); // Start new conversation when changing modes
    refreshQueryLimit();
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
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="h-screen h-[100dvh] flex bg-white overflow-hidden max-w-full">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:flex flex-shrink-0" style={{ width: '256px', maxWidth: '256px', minWidth: '256px', overflow: 'hidden' }}>
          <ChatSidebar
            currentSessionId={currentConversationId || undefined}
            currentMode={currentMode}
            onSessionSelect={handleConversationSelect}
            onNewChat={handleNewChat}
          />
        </div>

        {/* Mobile Sidebar - Only shown when triggered */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-white">
              <ChatSidebar
                currentSessionId={currentConversationId || undefined}
                currentMode={currentMode}
                onSessionSelect={(sessionId, mode) => {
                  handleConversationSelect(sessionId, mode);
                  setShowMobileSidebar(false);
                }}
                onNewChat={(mode) => {
                  handleNewChat(mode);
                  setShowMobileSidebar(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-w-0 max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 border-b bg-white/80 backdrop-blur-sm p-3 md:p-4 relative z-50 max-w-full overflow-hidden">
            <div className="max-w-7xl mx-auto flex items-center justify-between max-w-full min-w-0">
              {/* Left side - Mobile menu button */}
              <div className="flex justify-start">
                <Button
                  onClick={() => setShowMobileSidebar(true)}
                  variant="outline"
                  size="sm"
                  className="md:hidden flex items-center gap-2 h-9 px-2"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-xs">Menu</span>
                </Button>
                {/* Spacer for desktop */}
                <div className="hidden md:block w-9"></div>
              </div>

              {/* Center - Current Mode Display */}
              <div className="flex-1 flex justify-center min-w-0">
                <div className="text-center max-w-full">
                  <h2 className="text-sm font-medium text-gray-600 capitalize truncate">
                    {currentMode.replace('-', ' ')} Mode
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    {currentConversationId ? 'Active Conversation' : 'New Chat'}
                  </p>
                </div>
              </div>

              {/* Right side - User dropdown */}
              <div className="flex justify-end">
                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 md:gap-2 h-9 px-2 md:px-3"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline text-xs md:text-sm">{user?.email}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  
                  {showSettingsDropdown && (
                    <div className="absolute right-0 mt-2 w-44 md:w-48 bg-white rounded-lg shadow-xl border py-2 z-[9999] max-w-[calc(100vw-2rem)] mr-2 md:mr-0 top-full">
                      <div className="px-3 md:px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                        <p className="text-xs text-gray-500">
                          {userPlan === 'pro' ? '💎 Pro Plan' : '🧪 Starter Plan'}
                        </p>
                      </div>
                      
                      <button
                        onClick={handlePricing}
                        className="w-full px-3 md:px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="truncate">Pricing & Settings</span>
                      </button>
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 md:px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="truncate">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden max-w-full min-w-0">
            <ChatInterface 
              sessionId={currentConversationId || undefined}
              mode={currentMode}
              onSessionChange={handleSessionCreate}
              hideHeader={false}
              onModeChange={handleModeChange}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

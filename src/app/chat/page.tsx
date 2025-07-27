"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { toast } from 'sonner';

export default function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const { refresh: refreshQueryLimit } = useQueryLimit();
  const router = useRouter();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [currentMode, setCurrentMode] = useState<'research' | 'doctor'>('research');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
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

  const handleConversationSelect = useCallback((conversationId: string, mode: 'research' | 'doctor') => {
    setCurrentConversationId(conversationId);
    setCurrentMode(mode);
    refreshQueryLimit();
  }, [refreshQueryLimit]);

  const handleNewChat = useCallback((mode?: 'research' | 'doctor') => {
    // Clear current conversation to start fresh
    setCurrentConversationId(null);
    if (mode) {
      setCurrentMode(mode);
    }
    setRefreshTrigger(prev => prev + 1); // Trigger ChatSidebar refresh
    refreshQueryLimit();
  }, [refreshQueryLimit]);

  const handleMessageSent = useCallback(() => {
    setRefreshTrigger(prev => prev + 1); // Trigger ChatSidebar refresh
  }, []);

  const handleSessionCreate = useCallback((sessionId: string) => {
    setCurrentConversationId(sessionId);
    setRefreshTrigger(prev => prev + 1); // Trigger ChatSidebar refresh
    refreshQueryLimit();
  }, [refreshQueryLimit]);

  const handleModeChange = useCallback((mode: 'research' | 'doctor') => {
    console.log('handleModeChange called with mode:', mode);
    console.log('Current mode before change:', currentMode);
    
    // If there are existing messages and we're switching modes, start a new chat
    if (currentMode !== mode && currentConversationId) {
      // Clear current conversation to start fresh with new mode
      setCurrentConversationId(null);
      setRefreshTrigger(prev => prev + 1); // Trigger ChatSidebar refresh
      
      // Show toast notification for mode change and new chat
      toast.success(`Started new ${mode === 'research' ? 'Research' : 'Doctor'} mode chat`, {
        duration: 3000,
        description: 'Previous conversation saved separately'
      });
    } else {
      // Show simple mode change notification if no conversation exists
      toast.success(`Switched to ${mode === 'research' ? 'Research' : 'Doctor'} mode`, {
        duration: 2000,
      });
    }
    
    setCurrentMode(mode);
    console.log('Mode updated to:', mode);
    
    // Don't reset conversation ID when changing modes for the first time - only when switching with existing messages
    refreshQueryLimit();
  }, [currentMode, currentConversationId, refreshQueryLimit, setRefreshTrigger]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">CliniSynth</h2>
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
      <div className="h-screen h-[100dvh] flex bg-white overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:flex flex-col flex-shrink-0 w-64 max-w-64 min-w-64 overflow-hidden border-r border-gray-200">
          <ChatSidebar
            currentSessionId={currentConversationId || undefined}
            currentMode={currentMode}
            onSessionSelect={handleConversationSelect}
            onNewChat={handleNewChat}
            onModeChange={handleModeChange}
            refreshTrigger={refreshTrigger}
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
                onModeChange={handleModeChange}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-w-0 overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 border-b bg-white/80 backdrop-blur-sm p-3 md:p-4 relative z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-2 sm:px-0">
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
              <div className="flex-1 flex justify-center min-w-0 px-2">
                <div className="text-center min-w-0">
                  <h2 className="text-sm font-medium text-gray-600 capitalize truncate">
                    {currentMode.replace('-', ' ')} Mode
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    {currentConversationId ? 'Active Conversation' : 'New Chat'}
                  </p>
                </div>
              </div>

              {/* Right side - User dropdown */}
              <div className="flex justify-end">                  <div className="relative" ref={dropdownRef}>
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
                      <div className="absolute right-0 mt-2 w-44 md:w-48 bg-white rounded-lg shadow-xl border py-2 z-50">
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
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              sessionId={currentConversationId}
              mode={currentMode}
              onSessionChange={handleSessionCreate}
              hideHeader={false}
              onModeChange={handleModeChange}
              onMessageSent={handleMessageSent}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

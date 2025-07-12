'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageCircle, RefreshCw, Bot, User, FlaskConical } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { chatClient, type Conversation, type ChatMode } from '@/lib/supabase/chat';
import { cn } from '@/lib/utils';

const modeIcons = {
  research: Bot,
  doctor: User,
  'source-finder': FlaskConical
};

const modeLabels = {
  research: 'Research',
  doctor: 'Doctor',
  'source-finder': 'Source Finder'
};

interface ChatSidebarProps {
  currentSessionId?: string;
  currentMode?: 'research' | 'doctor' | 'source-finder';
  onSessionSelect: (sessionId: string, mode: 'research' | 'doctor' | 'source-finder') => void;
  onNewChat: (mode: 'research' | 'doctor' | 'source-finder') => void;
  onModeChange?: (mode: 'research' | 'doctor' | 'source-finder') => void;
  className?: string;
  refreshTrigger?: number; // Add trigger to force refresh
}

export function ChatSidebar({ 
  currentSessionId, 
  currentMode = 'research', 
  onSessionSelect, 
  onNewChat,
  onModeChange,
  className,
  refreshTrigger
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<{ [mode in ChatMode]: Conversation[] }>({
    research: [],
    doctor: [],
    'source-finder': []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(refreshTrigger);

  const loadConversations = React.useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await chatClient.getUserConversations(user.id);
      setConversations(result);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load conversations when user changes
  React.useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  // Handle refresh trigger separately
  React.useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger !== lastRefreshTrigger && user?.id) {
      setLastRefreshTrigger(refreshTrigger);
      loadConversations();
    }
  }, [refreshTrigger, lastRefreshTrigger, user?.id]);

  const handleRefresh = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await chatClient.getUserConversations(user.id);
      setConversations(result);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Memoize the check for empty conversations
  const hasNoConversations = React.useMemo(() => 
    Object.values(conversations).every(list => list.length === 0),
    [conversations]
  );

  return (
    <div className={cn("h-full bg-gray-50 border-r border-gray-200 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Button 
            onClick={() => onNewChat(currentMode)}
            className="flex-1 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Mode</div>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant={currentMode === 'research' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange?.('research')}
            className="flex items-center gap-2 justify-start"
          >
            <Bot className="h-4 w-4" />
            Research
          </Button>
          <Button
            variant={currentMode === 'doctor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange?.('doctor')}
            className="flex items-center gap-2 justify-start"
          >
            <User className="h-4 w-4" />
            Doctor
          </Button>
          <Button
            variant={currentMode === 'source-finder' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange?.('source-finder')}
            className="flex items-center gap-2 justify-start"
          >
            <FlaskConical className="h-4 w-4" />
            Source Finder
          </Button>
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading conversations...</div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 text-center py-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Show conversations grouped by mode */}
              {Object.entries(conversations).map(([mode, conversationList]) => {
                const modeKey = mode as ChatMode;
                const Icon = modeIcons[modeKey];
                const label = modeLabels[modeKey];
                
                if (conversationList.length === 0) {
                  return null;
                }

                return (
                  <div key={modeKey} className="mb-4">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                        {conversationList.length}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {conversationList.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => onSessionSelect(conversation.id, conversation.mode)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                            "hover:bg-gray-100 border border-transparent",
                            currentSessionId === conversation.id 
                              ? "bg-blue-50 border-blue-200 text-blue-700" 
                              : "text-gray-700"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {conversation.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {conversation.last_message}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(conversation.last_message_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Show message if no conversations */}
              {hasNoConversations && (
                <div className="text-sm text-gray-500 text-center py-8">
                  No conversations yet.
                  <br />
                  Start a new chat to get started!
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

    </div>
  );
}

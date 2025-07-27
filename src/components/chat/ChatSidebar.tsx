'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageCircle, RefreshCw, Bot, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQueryLimit } from '@/hooks/useQueryLimit';
import { chatClient, type Conversation, type ChatMode } from '@/lib/supabase/chat';
import { cn } from '@/lib/utils';

const modeIcons = {
  research: Bot,
  doctor: User
};

interface ChatSidebarProps {
  currentSessionId?: string;
  currentMode?: 'research' | 'doctor';
  onSessionSelect: (sessionId: string, mode: 'research' | 'doctor') => void;
  onNewChat: (mode: 'research' | 'doctor') => void;
  onModeChange?: (mode: 'research' | 'doctor') => void;
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
  const { queriesUsed, queryLimit, canChat, timeUntilReset, isProUser, loading: limitLoading } = useQueryLimit();
  const [conversations, setConversations] = useState<{ [mode in ChatMode]: Conversation[] }>({
    research: [],
    doctor: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(refreshTrigger);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering conversation selection
    
    if (!user?.id) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }
    
    setDeletingConversationId(conversationId);
    
    try {
      const success = await chatClient.deleteConversation(conversationId, user.id);
      if (success) {
        // If deleting current conversation, clear it
        if (currentSessionId === conversationId) {
          onNewChat(currentMode);
        }
        // Refresh conversations list
        await loadConversations();
      } else {
        alert('Failed to delete conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingConversationId(null);
    }
  };

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
    <div className={cn("h-full w-full bg-gray-50 flex flex-col overflow-hidden", className)}>
      {/* Header with New Chat Button */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
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

      {/* Query Usage Progress */}
      {!limitLoading && !isProUser && (
        <div className="p-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Query Usage</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{queriesUsed} of {queryLimit} used</span>
              <span>{((queriesUsed / queryLimit) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  queriesUsed >= queryLimit ? "bg-red-500" : 
                  queriesUsed >= queryLimit * 0.8 ? "bg-yellow-500" : "bg-green-500"
                )}
                style={{ width: `${Math.min((queriesUsed / queryLimit) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {canChat ? (
                <span className="text-green-600">• Ready to chat</span>
              ) : (
                <span className="text-red-600">• Reset in {timeUntilReset}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pro User Badge */}
      {!limitLoading && isProUser && (
        <div className="p-4 border-b border-gray-200">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-3 text-center">
            <div className="text-sm font-medium">✨ Pro User</div>
            <div className="text-xs opacity-90">Unlimited queries</div>
          </div>
        </div>
      )}

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="text-xs text-gray-500">Loading...</div>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-500 text-center py-3">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Show all conversations in a simple list */}
              {(() => {
                const allConversations = Object.values(conversations).flat()
                  .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
                
                if (allConversations.length === 0) {
                  return (
                    <div className="text-xs text-gray-500 text-center py-6">
                      No conversations yet.
                      <br />
                      Start a new chat!
                    </div>
                  );
                }

                return (
                  <div className="space-y-0.5">
                    {allConversations.map((conversation) => {
                      const Icon = modeIcons[conversation.mode];
                      const isDeleting = deletingConversationId === conversation.id;
                      return (
                        <div
                          key={conversation.id}
                          className={cn(
                            "group relative flex items-center w-full text-left px-2 py-2 rounded text-xs transition-colors",
                            "hover:bg-gray-100",
                            currentSessionId === conversation.id 
                              ? "bg-blue-50 text-blue-700 border border-blue-200" 
                              : "text-gray-600"
                          )}
                        >
                          <button
                            onClick={() => onSessionSelect(conversation.id, conversation.mode)}
                            disabled={isDeleting}
                            className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden"
                          >
                            <Icon className={cn(
                              "h-3 w-3 flex-shrink-0",
                              currentSessionId === conversation.id ? "text-blue-600" : "text-gray-400"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs leading-tight overflow-hidden">
                                <span 
                                  className="block truncate max-w-full" 
                                  title={conversation.title}
                                  style={{ maxWidth: '200px' }}
                                >
                                  {conversation.title.length > 50 ? `${conversation.title.substring(0, 50)}...` : conversation.title}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 overflow-hidden">
                                <span className="capitalize truncate">{conversation.mode}</span>
                                <span className="flex-shrink-0">•</span>
                                <span className="truncate">{new Date(conversation.last_message_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </button>
                          
                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            disabled={isDeleting}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                              "p-1 hover:bg-red-100 hover:text-red-600 rounded",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              isDeleting && "opacity-100"
                            )}
                            title="Delete conversation"
                          >
                            {isDeleting ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </ScrollArea>

    </div>
  );
}

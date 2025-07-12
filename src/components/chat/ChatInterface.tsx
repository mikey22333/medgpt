"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { type Message } from "@/lib/types/chat";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryLimit } from "@/hooks/useQueryLimit";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ChatInterfaceProps {
  mode?: 'research' | 'doctor' | 'source-finder';
  sessionId?: string | null;
  onSessionChange?: (sessionId: string) => void;
  hideHeader?: boolean;
  onModeChange?: (mode: 'research' | 'doctor' | 'source-finder') => void;
  onMessageSent?: () => void; // Add callback for when message is sent
}

export function ChatInterface({ 
  mode = 'research', 
  sessionId,
  onSessionChange,
  hideHeader = false,
  onModeChange,
  onMessageSent
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const { 
    queriesUsed, 
    queryLimit, 
    canChat, 
    isProUser, 
    timeUntilReset,
    loading: limitLoading,
    refresh: refreshQueryLimit 
  } = useQueryLimit();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isSendingMessage = useRef(false);
  const supabase = createClient();

  // Use a stable session ID - either from props or generate once
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (sessionId) return sessionId;
    return crypto.randomUUID();
  });

  // Track if this is a new session that hasn't been loaded yet
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [isInternalSessionChange, setIsInternalSessionChange] = useState(false);

  // Handle session ID changes - including when starting a new chat (sessionId becomes null/undefined)
  useEffect(() => {
    if (sessionId === null || sessionId === undefined) {
      // Starting a new chat - clear everything and generate new session
      console.log('Starting new chat - clearing session from', currentSessionId);
      setIsInternalSessionChange(true);
      const newSessionId = crypto.randomUUID();
      setCurrentSessionId(newSessionId);
      setMessages([]);
      setHasLoadedSession(false);
      
      // Reset internal change flag after state updates
      setTimeout(() => setIsInternalSessionChange(false), 0);
    } else if (sessionId && sessionId !== currentSessionId) {
      // Switching to an existing conversation
      console.log('Session ID changed from', currentSessionId, 'to', sessionId);
      setIsInternalSessionChange(false);
      setCurrentSessionId(sessionId);
      setHasLoadedSession(false); // Reset loaded state for new session
    }
  }, [sessionId]); // Keep only sessionId as dependency

  // Notify parent about session ID (but not when we internally generate new sessions)
  useEffect(() => {
    if (onSessionChange && currentSessionId && !isInternalSessionChange) {
      // Use a timeout to prevent immediate state updates that could cause loops
      const timeoutId = setTimeout(() => {
        onSessionChange(currentSessionId);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentSessionId, onSessionChange, isInternalSessionChange]);

  // Load messages from database on mount
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const loadConversation = async () => {
      if (!currentSessionId || !user || hasLoadedSession) return;
      
      try {
        console.log('Loading conversation for session:', currentSessionId);
        setIsLoadingConversation(true);
        
        // First try to load from database
        const response = await fetch(`/api/conversations/${currentSessionId}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0 && isMounted) {
            console.log(`Loaded ${data.messages.length} messages from database for session ${currentSessionId}`);
            setMessages(data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
            setHasLoadedSession(true);
            return; // Exit early if we loaded from database
          }
        }
        
        // Fallback to localStorage if database load fails or is empty
        const savedMessages = localStorage.getItem(`chat-${currentSessionId}`);
        if (savedMessages && isMounted) {
          try {
            const parsed = JSON.parse(savedMessages);
            console.log(`Loaded ${parsed.length} messages from localStorage for session ${currentSessionId}`);
            setMessages(parsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
          } catch (error) {
            console.error('Error parsing localStorage messages:', error);
            setMessages([]);
          }
        } else if (isMounted) {
          // No messages found, start fresh
          console.log('No messages found for session', currentSessionId);
          setMessages([]);
        }
        
        if (isMounted) {
          setHasLoadedSession(true);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        
        if (isMounted) {
          // Fallback to localStorage
          const savedMessages = localStorage.getItem(`chat-${currentSessionId}`);
          if (savedMessages) {
            try {
              const parsed = JSON.parse(savedMessages);
              setMessages(parsed.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })));
            } catch (error) {
              console.error('Error parsing localStorage messages:', error);
              setMessages([]);
            }
          } else {
            setMessages([]);
          }
          setHasLoadedSession(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingConversation(false);
        }
      }
    };

    loadConversation();
    
    return () => {
      isMounted = false; // Cleanup flag
    };
  }, [currentSessionId, user]); // REMOVED hasLoadedSession dependency to break the loop

  // Save messages to localStorage as backup when they change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`chat-${currentSessionId}`, JSON.stringify(messages));
    }
  }, [messages, currentSessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check if user is authenticated
    if (!user) {
      toast.error("Please log in to use the chat feature.");
      window.location.href = '/auth/login';
      return;
    }

    if (!canChat) {
      toast.error("Query limit reached. Please upgrade to Pro or wait for reset.");
      return;
    }

    isSendingMessage.current = true;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Sending message with session ID:', currentSessionId);
      
      const response = await fetch('/api/chat', {  // Back to original endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
          mode,
          sessionId: currentSessionId,
          useRAG: true,
          enableDeepThinking: true,
          enableMultiAgent: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      let content = '';
      let citations = [];
      let reasoningSteps = undefined;
      let confidence = undefined;
      let multiAgentResult = undefined;
      
      if (data.message) {
        // New API structure
        content = data.message.content;
        citations = data.message.citations || [];
        reasoningSteps = data.message.reasoningSteps;
        confidence = data.message.confidence;
        multiAgentResult = data.message.multiAgentResult;
      } else if (data.content) {
        // Direct content structure
        content = data.content;
        citations = data.citations || [];
        reasoningSteps = data.reasoningSteps;
        confidence = data.confidence;
        multiAgentResult = data.multiAgentResult;
      } else {
        throw new Error('Invalid response structure');
      }
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        citations: citations,
        reasoningSteps: reasoningSteps,
        confidence: confidence,
        multiAgentResult: multiAgentResult
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // If this was an internally generated session and it's the first message exchange,
      // now notify the parent about the session ID
      if (isInternalSessionChange && messages.length === 1) { // 1 because we just added the user message
        setIsInternalSessionChange(false);
        onSessionChange?.(currentSessionId);
      }
      
      // Update session ID if returned from API
      if (data.sessionId && data.sessionId !== currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }
      
      // Call onMessageSent callback to refresh sidebar
      onMessageSent?.();
      
      // Refresh query limit after successful response
      await refreshQueryLimit();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      isSendingMessage.current = false;
    }
  };

  const handleModeChange = (newMode: 'research' | 'doctor' | 'source-finder') => {
    onModeChange?.(newMode);
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Mode Toggle */}
      {!hideHeader && (
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">MedGPT Scholar</h1>
                <p className="text-xs text-gray-600">
                  {mode === 'research' ? 'Research Assistant' : 
                   mode === 'doctor' ? 'Virtual Doctor' : 
                   'Source Finder'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Query Limit Display */}
          {!limitLoading && (
            <div className="mt-3 text-xs text-gray-500">
              {!isProUser && (
                <span>
                  Queries: {queriesUsed}/{queryLimit} • 
                  {canChat ? ' Ready to chat' : ` Reset in ${timeUntilReset}`}
                </span>
              )}
              {isProUser && <span>✨ Pro User - Unlimited queries</span>}
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto px-4 py-6 chat-container">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {mode === 'research' ? 'Research Assistant' : 
                   mode === 'doctor' ? 'Virtual Doctor' : 
                   'Source Finder'}
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  {mode === 'research' 
                    ? "Ask me any medical question and I'll provide evidence-based answers with citations from PubMed and other sources."
                    : mode === 'doctor'
                    ? "I'm here to help with your medical questions with compassionate, professional guidance."
                    : "Paste text snippets and I'll help you find their original sources and citations."
                  }
                </p>
                {!user && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Please <a href="/auth/login" className="underline font-medium">log in</a> to start chatting
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mode={mode}
                />
              ))}
              
              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      MedGPT Scholar
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!user ? "Please log in to chat..." : `Ask a ${mode === 'research' ? 'research' : mode === 'doctor' ? 'medical' : 'source'} question...`}
              disabled={isLoading || !canChat || !user}
              className="w-full pr-12 py-3 text-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent chat-content"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim() || !canChat || !user}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {!user ? (
              <span className="text-blue-600">
                Please <a href="/auth/login" className="underline font-medium">log in</a> to start chatting
              </span>
            ) : !canChat && !isProUser ? (
              <span className="text-red-600">
                Daily limit reached • Upgrade to Pro for unlimited chats or wait {timeUntilReset}
              </span>
            ) : (
              "Press Enter to send • Always consult healthcare professionals for medical advice"
            )}
          </div>
        </div>
      </div>

      {/* Debug Panel - Only console logging, no UI */}
      {process.env.NODE_ENV === 'development' && (() => {
        // Log debug info to console only
        console.log('ChatInterface Debug:', {
          mode,
          sessionId: currentSessionId || 'None',
          messageCount: messages.length,
          loading: isLoading,
          canChat,
          queries: `${queriesUsed}/${queryLimit}`
        });
        return null; // Don't render anything
      })()}
    </div>
  );
}

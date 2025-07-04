"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { type Message } from "@/lib/types/chat";
import { Send, Bot, User, Sparkles, FlaskConical, UserCheck, Search } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryLimit } from "@/hooks/useQueryLimit";
import { toast } from "sonner";

interface ChatInterfaceProps {
  mode?: 'research' | 'doctor' | 'source-finder';
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  hideHeader?: boolean;
  onModeChange?: (mode: 'research' | 'doctor' | 'source-finder') => void;
}

export function ChatInterface({ 
  mode = 'research', 
  sessionId,
  onSessionChange,
  hideHeader = false,
  onModeChange
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (sessionId) {
      const savedMessages = localStorage.getItem(`chat-${sessionId}`);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      }
    }
  }, [sessionId]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`chat-${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!canChat) {
      toast.error("Query limit reached. Please upgrade to Pro or wait for reset.");
      return;
    }

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
          mode,
          sessionId,
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
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        citations: data.citations || [],
        reasoning: data.reasoning,
        reasoningSteps: data.reasoningSteps,
        confidence: data.confidence
      };

      setMessages(prev => [...prev, aiMessage]);
      
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
            
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <Button
                variant={mode === 'research' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('research')}
                className="flex items-center gap-2 text-xs"
              >
                <FlaskConical className="h-3 w-3" />
                Research
              </Button>
              <Button
                variant={mode === 'doctor' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('doctor')}
                className="flex items-center gap-2 text-xs"
              >
                <UserCheck className="h-3 w-3" />
                Doctor
              </Button>
              <Button
                variant={mode === 'source-finder' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('source-finder')}
                className="flex items-center gap-2 text-xs"
              >
                <Search className="h-3 w-3" />
                Source
              </Button>
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
              placeholder={`Ask a ${mode === 'research' ? 'research' : mode === 'doctor' ? 'medical' : 'source'} question...`}
              disabled={isLoading || !canChat}
              className="w-full pr-12 py-3 text-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent chat-content"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim() || !canChat}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {!canChat && !isProUser ? (
              <span className="text-red-600">
                Daily limit reached • Upgrade to Pro for unlimited chats or wait {timeUntilReset}
              </span>
            ) : (
              "Press Enter to send • Always consult healthcare professionals for medical advice"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

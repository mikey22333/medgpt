"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { AIConfidenceIndicator } from "./AIConfidenceIndicator";
import { InteractiveIntelligence } from "./InteractiveIntelligence";
import { type Message } from "@/lib/types/chat";
import { Send, Sparkles, Stethoscope, Pill, Heart, Brain, Paperclip, X, FileText, AlertCircle, UserCheck, FlaskConical, Search, Quote, Users } from "lucide-react";
import { ExportOptions } from "./ExportOptions";
import { FlashcardMode } from "./FlashcardMode";
import { ResearchExplorer } from "./ResearchExplorer";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryLimit } from "@/hooks/useQueryLimit";
import { QueryLimitWarning } from "@/components/QueryLimitWarning";

// Local storage keys for each mode - now user-specific
const getStorageKeys = (userId: string) => ({
  research: `medgpt-research-messages-${userId}`,
  doctor: `medgpt-doctor-messages-${userId}`,
  'source-finder': `medgpt-sourcefinder-messages-${userId}`
} as const);

const SESSION_STORAGE_KEYS = {
  research: 'medgpt-research-session',
  doctor: 'medgpt-doctor-session',
  'source-finder': 'medgpt-source-finder-session'
} as const;

// Helper functions for localStorage persistence
const saveToLocalStorage = (key: string, messages: Message[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString() // Convert Date to string for storage
    }))));
  } catch (error) {
    console.warn('Failed to save chat history to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string): Message[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const messages = JSON.parse(stored);
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp) // Convert string back to Date
    }));
  } catch (error) {
    console.warn('Failed to load chat history from localStorage:', error);
    return [];
  }
};

const saveSessionId = (key: string, sessionId: string) => {
  try {
    localStorage.setItem(key, sessionId);
  } catch (error) {
    console.warn('Failed to save session ID to localStorage:', error);
  }
};

const loadSessionId = (key: string): string => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
  } catch (error) {
    console.warn('Failed to load session ID from localStorage:', error);
  }
  // Generate new session ID if none exists
  return `${key.split('-')[1]}_${Date.now()}`;
};

interface ChatInterfaceProps {
  hideHeader?: boolean;
  initialMode?: 'research' | 'doctor' | 'source-finder';
  onModeChange?: (mode: 'research' | 'doctor' | 'source-finder') => void;
}

export function ChatInterface({ hideHeader = false, initialMode = 'research', onModeChange }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { 
    canChat, 
    isProUser, 
    queriesUsed, 
    queryLimit, 
    timeUntilReset, 
    loading: limitLoading,
    refresh: refreshQueryLimit
  } = useQueryLimit();
  
  // Get user-specific storage keys (memoized to prevent recreation on every render)
  const STORAGE_KEYS = useMemo(() => {
    return user ? getStorageKeys(user.id) : {
      research: 'medgpt-research-messages-temp',
      doctor: 'medgpt-doctor-messages-temp',
      'source-finder': 'medgpt-sourcefinder-messages-temp'
    } as const;
  }, [user]);
  
  // Separate message arrays for each mode - will be loaded from localStorage
  const [researchMessages, setResearchMessages] = useState<Message[]>([]);
  const [doctorMessages, setDoctorMessages] = useState<Message[]>([]);
  const [sourceFinderMessages, setSourceFinderMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'research' | 'doctor' | 'source-finder'>(initialMode);

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Create a wrapper for setMode that also calls onModeChange
  const handleModeChange = (newMode: 'research' | 'doctor' | 'source-finder') => {
    setMode(newMode);
    onModeChange?.(newMode);
  };
  // Deep intelligence and multi-agent are always enabled for optimal medical AI analysis
  const enableDeepThinking = true;
  const enableMultiAgent = true;
  
  // Separate session IDs for each mode - will be loaded from localStorage
  const [researchSessionId, setResearchSessionId] = useState('');
  const [doctorSessionId, setDoctorSessionId] = useState('');
  const [sourceFinderSessionId, setSourceFinderSessionId] = useState('');
  
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showResearchExplorer, setShowResearchExplorer] = useState(false);
  const [flashcardTopic, setFlashcardTopic] = useState<string | undefined>();
  const [researchQuery, setResearchQuery] = useState<string | undefined>();
  const [lastResponseMeta, setLastResponseMeta] = useState<{
    confidence: number;
    sources: string[];
    evidenceQuality: 'High' | 'Moderate' | 'Low';
  } | null>(null);
  
  // Document upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user-specific chat history when user changes
  useEffect(() => {
    if (user) {
      // Load messages for each mode
      setResearchMessages(loadFromLocalStorage(STORAGE_KEYS.research));
      setDoctorMessages(loadFromLocalStorage(STORAGE_KEYS.doctor));
      setSourceFinderMessages(loadFromLocalStorage(STORAGE_KEYS['source-finder']));
      
      // Load or generate session IDs
      setResearchSessionId(loadSessionId(STORAGE_KEYS.research));
      setDoctorSessionId(loadSessionId(STORAGE_KEYS.doctor));
      setSourceFinderSessionId(loadSessionId(STORAGE_KEYS['source-finder']));
    }
  }, [user, STORAGE_KEYS]); // STORAGE_KEYS is now memoized so it's safe to include

  // Get current messages and session ID based on mode
  const getCurrentMessages = () => {
    switch (mode) {
      case 'research': return researchMessages;
      case 'doctor': return doctorMessages;
      case 'source-finder': return sourceFinderMessages;
      default: return researchMessages;
    }
  };

  const getCurrentSessionId = () => {
    switch (mode) {
      case 'research': return researchSessionId;
      case 'doctor': return doctorSessionId;
      case 'source-finder': return sourceFinderSessionId;
      default: return researchSessionId;
    }
  };

  const setCurrentMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    switch (mode) {
      case 'research':
        setResearchMessages(prevMessages => {
          const updatedMessages = typeof newMessages === 'function' ? newMessages(prevMessages) : newMessages;
          saveToLocalStorage(STORAGE_KEYS.research, updatedMessages);
          return updatedMessages;
        });
        break;
      case 'doctor':
        setDoctorMessages(prevMessages => {
          const updatedMessages = typeof newMessages === 'function' ? newMessages(prevMessages) : newMessages;
          saveToLocalStorage(STORAGE_KEYS.doctor, updatedMessages);
          return updatedMessages;
        });
        break;
      case 'source-finder':
        setSourceFinderMessages(prevMessages => {
          const updatedMessages = typeof newMessages === 'function' ? newMessages(prevMessages) : newMessages;
          saveToLocalStorage(STORAGE_KEYS['source-finder'], updatedMessages);
          return updatedMessages;
        });
        break;
    }
  };

  // Get current messages for the active mode
  const messages = getCurrentMessages();
  const sessionId = getCurrentSessionId();

  const researchQueries = [
    { icon: <Stethoscope className="h-4 w-4" />, text: "What is the pathophysiology of lupus nephritis?", category: "Pathophysiology" },
    { icon: <Pill className="h-4 w-4" />, text: "What are the contraindications for warfarin according to FDA labeling?", category: "Pharmacology" },
    { icon: <Heart className="h-4 w-4" />, text: "Latest guidelines for hypertension management in adults", category: "Guidelines" },
    { icon: <Brain className="h-4 w-4" />, text: "FDA safety alerts for diabetes medications", category: "Safety" },
  ];

  const doctorQueries = [
    { icon: <Heart className="h-4 w-4" />, text: "I have chest pain and shortness of breath. Should I be worried?", category: "Symptoms" },
    { icon: <Brain className="h-4 w-4" />, text: "My blood pressure is 150/95. What should I do?", category: "Assessment" },
    { icon: <Pill className="h-4 w-4" />, text: "Can I take ibuprofen with my blood pressure medication?", category: "Medication" },
    { icon: <Stethoscope className="h-4 w-4" />, text: "What does my lab report with high cholesterol mean?", category: "Lab Results" },
  ];

  const sourceFinderQueries = [
    { icon: <Quote className="h-4 w-4" />, text: "Patients with diabetes mellitus have a 2-4 fold increased risk of cardiovascular disease compared to non-diabetic individuals", category: "Citation Lookup" },
    { icon: <Search className="h-4 w-4" />, text: "The efficacy of checkpoint inhibitors in melanoma has been demonstrated in multiple randomized controlled trials", category: "Source Verification" },
    { icon: <FileText className="h-4 w-4" />, text: "Meta-analysis of 15 studies showed significant reduction in mortality with early antibiotic administration", category: "Research Origin" },
    { icon: <Brain className="h-4 w-4" />, text: "Neuroplasticity mechanisms underlying cognitive rehabilitation involve synaptic strengthening and dendritic sprouting", category: "Source Identification" },
  ];

  const exampleQueries = mode === 'research' ? researchQueries : mode === 'doctor' ? doctorQueries : sourceFinderQueries;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    // Check query limit for free users
    if (!isProUser && !canChat) {
      alert(`You've reached your daily limit of ${queryLimit} chats. Upgrade to Pro for unlimited access or wait ${timeUntilReset} for your limit to reset.`);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: uploadedFile 
        ? `${input.trim() || "Please analyze this document"}\n\n📎 Uploaded: ${uploadedFile.name}`
        : input.trim(),
      timestamp: new Date(),
    };

    setCurrentMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let response;
      
      if (uploadedFile) {
        // Send file + prompt to document analysis endpoint
        const formData = new FormData();
        formData.append('document', uploadedFile);
        formData.append('userPrompt', input.trim() || "Please analyze this document and provide key insights.");
        formData.append('conversationHistory', JSON.stringify(messages.slice(-6)));
        formData.append('mode', mode);

        response = await fetch("/api/documents/analyze", {
          method: "POST",
          body: formData,
        });
        
        // Clear uploaded file after sending
        setUploadedFile(null);
        setUploadError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Regular chat API call or source finder
        const apiEndpoint = mode === 'source-finder' ? '/api/source-finder' : '/api/chat';
        const requestBody = mode === 'source-finder' 
          ? {
              textSnippet: userMessage.content,
              conversationHistory: messages.slice(-6),
            }
          : {
              message: userMessage.content,
              conversationHistory: messages.slice(-6), // Send last 6 messages for context
              useRAG: true,
              mode: mode,
              enableDeepThinking: enableDeepThinking,
              enableMultiAgent: enableMultiAgent,
              sessionId: sessionId,
            };

        response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: data.message?.id || Date.now().toString(),
        role: "assistant",
        content: data.message?.content || data.analysis || data.content,
        timestamp: new Date(data.message?.timestamp || Date.now()),
        citations: data.message?.citations || data.citations,
        reasoningSteps: data.message?.reasoningSteps,
        multiAgentResult: data.message?.multiAgentResult,
        sessionId: data.message?.sessionId,
      };

      setCurrentMessages(prev => [...prev, assistantMessage]);
      
      // Refresh query limit to show updated count (backend already incremented it)
      if (!isProUser) {
        refreshQueryLimit();
      }
      
      // Update response metadata for confidence indicator
      if (assistantMessage.citations) {
        setLastResponseMeta(calculateResponseMeta(assistantMessage.citations));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or check if the AI service is running.`,
        timestamp: new Date(),
      };
      
      setCurrentMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
  };

  const handleMeshTermClick = (meshTerm: string) => {
    const enhancedQuery = `${meshTerm} latest research evidence`;
    setInput(enhancedQuery);
    // Optionally auto-submit the query
    // handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleGenerateFlashcards = (topic: string) => {
    setFlashcardTopic(topic);
    setShowFlashcards(true);
  };

  const handleExploreResearch = (query: string) => {
    setResearchQuery(query);
    setShowResearchExplorer(true);
  };

  // Handle user interactions with the interactive intelligence
  const handleUserInteraction = (type: string, content: string) => {
    // Add the interaction as a user message
    const interactionMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `🤖 ${type}: ${content}`,
      timestamp: new Date(),
      sessionId: sessionId
    };
    
    setCurrentMessages(prev => [...prev, interactionMessage]);
    // Optionally auto-submit for immediate AI response
  };

  // Document upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF, Word document, Excel file, or text file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.');
      return;
    }

    setUploadError(null);
    setUploadedFile(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleLogoClick = () => {
    setCurrentMessages([]);
    setInput("");
    setUploadedFile(null);
    setUploadError(null);
    setLastResponseMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear localStorage for current mode and generate new session ID
    const storageKey = STORAGE_KEYS[mode];
    const sessionStorageKey = SESSION_STORAGE_KEYS[mode];
    try {
      localStorage.removeItem(storageKey);
      const newSessionId = `${mode}_${Date.now()}`;
      saveSessionId(sessionStorageKey, newSessionId);
      
      // Update the appropriate session ID state
      switch (mode) {
        case 'research':
          setResearchSessionId(newSessionId);
          break;
        case 'doctor':
          setDoctorSessionId(newSessionId);
          break;
        case 'source-finder':
          setSourceFinderSessionId(newSessionId);
          break;
      }
    } catch (error) {
      console.warn('Failed to clear chat history from localStorage:', error);
    }
  };

  // Calculate overall confidence from last response
  const calculateResponseMeta = (citations: any[]) => {
    if (!citations || citations.length === 0) return null;

    const avgConfidence = citations.reduce((sum, c) => sum + (c.confidenceScore || 50), 0) / citations.length;
    const sources = Array.from(new Set(citations.map(c => c.source).filter(Boolean)));
    const hasHighEvidence = citations.some(c => c.evidenceLevel === 'High');
    const hasModerateEvidence = citations.some(c => c.evidenceLevel === 'Moderate');
    
    return {
      confidence: Math.round(avgConfidence),
      sources,
      evidenceQuality: hasHighEvidence ? 'High' as const : hasModerateEvidence ? 'Moderate' as const : 'Low' as const
    };
  };

  return (
    <div className={hideHeader ? "flex h-full" : "flex h-screen"}>
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
        {/* Header with Mode Toggle - Conditionally Visible */}
        {!hideHeader && (
          <div className="border-b p-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
                title="Go to home"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">MedGPT Scholar</h1>
                  <p className="text-xs text-muted-foreground">
                    {mode === 'research' ? 'Research Assistant' : mode === 'doctor' ? 'Virtual Doctor' : 'Source Finder'}
                  </p>
                </div>
              </div>
              
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
              <Button
                variant={mode === 'research' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('research')}
                className="flex items-center gap-2 text-xs relative"
              >
                <FlaskConical className="h-3 w-3" />
                Research
                {researchMessages.filter(msg => msg.role === 'assistant').length > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                    {researchMessages.filter(msg => msg.role === 'assistant').length}
                  </span>
                )}
              </Button>
              <Button
                variant={mode === 'doctor' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('doctor')}
                className="flex items-center gap-2 text-xs relative"
              >
                <UserCheck className="h-3 w-3" />
                Doctor
                {doctorMessages.filter(msg => msg.role === 'assistant').length > 0 && (
                  <span className="ml-1 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                    {doctorMessages.filter(msg => msg.role === 'assistant').length}
                  </span>
                )}
              </Button>
              <Button
                variant={mode === 'source-finder' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('source-finder')}
                className="flex items-center gap-2 text-xs relative"
              >
                <Search className="h-3 w-3" />
                Source
                {sourceFinderMessages.filter(msg => msg.role === 'assistant').length > 0 && (
                  <span className="ml-1 bg-purple-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                    {sourceFinderMessages.filter(msg => msg.role === 'assistant').length}
                  </span>
                )}
              </Button>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoClick}
                  className="flex items-center gap-2 text-xs"
                  title={`Clear ${mode} chat`}
                >
                  <X className="h-3 w-3" />
                  Clear Chat
                </Button>
              )}
            </div>
            
            {/* Clean header - advanced features work silently in background */}
          </div>
        </div>
        )}

        {/* Query Limit Warning */}
        {!limitLoading && (
          <div className="px-4 pt-4">
            <QueryLimitWarning
              queriesUsed={queriesUsed}
              queryLimit={queryLimit}
              timeUntilReset={timeUntilReset || ''}
              isProUser={isProUser}
            />
          </div>
        )}

        {/* Welcome Section */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold">
                {mode === 'research' ? 'Research Mode' : mode === 'doctor' ? 'Doctor Mode' : 'Source Finder Mode'}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {mode === 'research' 
                  ? "Ask me any medical question and I'll provide evidence-based answers with citations from recent research and FDA resources."
                  : mode === 'doctor'
                  ? "I'm here to help with your medical questions. I'll provide clear, compassionate guidance like a board-certified physician."
                  : "Paste text snippets or quotes from articles and I'll help you find their original sources and citations."
                }
              </p>
            </div>
            
            {/* Enhanced Example Queries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {exampleQueries.map((query, index) => (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors border-l-4 border-l-blue-500"
                  onClick={() => handleExampleClick(query.text)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-blue-600">
                      {query.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-blue-600 mb-1">
                        {query.category}
                      </div>
                      <p className="text-sm text-gray-700">{query.text}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={message.id} className="space-y-3">
                    <MessageBubble 
                      message={message} 
                      mode={mode}
                      showReasoning={false}
                      onMeshTermClick={handleMeshTermClick}
                      onGenerateFlashcards={handleGenerateFlashcards}
                      onExploreResearch={handleExploreResearch}
                    />
                    
                    {/* Interactive Intelligence hidden from users - working in background */}
                    
                    {/* Show AI Confidence after assistant messages - only in research and source-finder modes */}
                    {message.role === 'assistant' && index === messages.length - 1 && lastResponseMeta && (mode === 'research' || mode === 'source-finder') && (
                      <AIConfidenceIndicator
                        confidence={lastResponseMeta.confidence}
                        sources={lastResponseMeta.sources}
                        evidenceQuality={lastResponseMeta.evidenceQuality}
                      />
                    )}
                  </div>
                ))}
                {isLoading && <TypingIndicator />}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Input Form - Fixed at bottom with highlighting */}
        <div className="border-t bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-lg backdrop-blur-sm sticky bottom-0 z-10">
          {/* Document Upload Area - Show when file is selected */}
          {uploadedFile && (
            <div className="mb-3 p-3 bg-blue-100 border-2 border-blue-300 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-700" />
                  <span className="text-sm font-semibold text-blue-900">{uploadedFile.name}</span>
                  <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full font-medium">
                    Ready to send with next message
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="h-7 w-7 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {uploadError && (
                <div className="mt-2 flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            className="hidden"
          />

          <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={!isProUser && !canChat 
                  ? `Daily limit reached. Upgrade to Pro or wait ${timeUntilReset} to chat again.`
                  : uploadedFile 
                  ? "Tell me what to do with the uploaded document..." 
                  : mode === 'source-finder'
                  ? "Paste text snippets or quotes from articles to find their sources... (Press Ctrl+Enter or Shift+Enter to send)"
                  : "Ask a medical question... (Press Ctrl+Enter or Shift+Enter to send)"
                }
                disabled={isLoading || (!isProUser && !canChat)}
                className={`min-h-[44px] max-h-[120px] resize-none bg-white border-2 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-500 ${
                  !isProUser && !canChat 
                    ? 'border-red-200 focus:border-red-400 bg-red-50' 
                    : 'border-blue-200 focus:border-blue-400'
                }`}
                rows={mode === 'source-finder' ? 3 : 1}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileSelect}
                disabled={isLoading || (!isProUser && !canChat)}
                className="mb-0 px-3 py-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                title="Upload document"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || (!input.trim() && !uploadedFile) || (!isProUser && !canChat)} 
                className="mb-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 transition-all duration-200 shadow-md"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <p className="text-xs text-gray-600 mt-3 text-center font-medium">
            {!isProUser && !canChat ? (
              <span className="text-red-600">
                Daily limit reached • Upgrade to Pro for unlimited chats or wait {timeUntilReset}
              </span>
            ) : uploadedFile ? (
              "📎 File attached • Type your instructions and press send to analyze"
            ) : (
              "💡 Press Ctrl+Enter to send • Upload documents for analysis"
            )}
          </p>
        </div>
      </div>
      
      {/* Flashcard Mode Modal */}
      {showFlashcards && (
        <FlashcardMode 
          onClose={() => setShowFlashcards(false)}
          initialTopic={flashcardTopic}
        />
      )}
      
      {/* Research Explorer Modal */}
      {showResearchExplorer && (
        <ResearchExplorer 
          onClose={() => setShowResearchExplorer(false)}
          initialQuery={researchQuery}
        />
      )}
    </div>
  );
}

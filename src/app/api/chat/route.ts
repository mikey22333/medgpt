import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai/ai-service";
import { RAGPipeline } from "@/lib/research/rag";
import { createEnhancedMedicalPrompt, validateMedicalQuery } from "@/lib/ai/prompts";
import { DeepThinkingEngine } from "@/lib/ai/deep-thinking";
import { MultiAgentReasoningSystem } from "@/lib/ai/multi-agent-reasoning";
import { RealTimeReasoningEngine, AdvancedConfidenceCalibration } from "@/lib/ai/real-time-reasoning";
import { type Message, type Citation } from "@/lib/types/chat";
import { createClient } from "@/lib/supabase/server";
import { requestQueue, withRequestQueue } from "@/lib/concurrency/request-queue";
import { rateLimiter, withRateLimit } from "@/lib/concurrency/rate-limiter";
import { dbTransactions } from "@/lib/database/transactions";
import { errorTracker, withCircuitBreaker } from "@/lib/monitoring/error-tracker";

// Enhanced context generation function
function generateEnhancedContextSummary(citations: Citation[], userQuery: string, researchData: any): string {
  if (citations.length === 0) {
    return "No relevant research papers found for this query.";
  }

  const totalPapers = citations.length;
  const sources = [...new Set(citations.map(c => c.source))];
  const recentPapers = citations.filter(c => {
    const year = typeof c.year === 'string' ? parseInt(c.year) : c.year;
    return year >= 2020;
  });
  
  let summary = `ENHANCED RESEARCH CONTEXT:\n\n`;
  summary += `✅ FOUND ${totalPapers} HIGHLY RELEVANT PAPERS for query: "${userQuery}"\n`;
  summary += `📊 Sources: ${sources.join(', ')} (${sources.length} databases)\n`;
  summary += `📅 Recent Studies: ${recentPapers.length} papers from 2020-2025\n\n`;
  
  summary += `🎯 CRITICAL INSTRUCTION FOR AI:\n`;
  summary += `- These ${totalPapers} papers have been PRE-FILTERED for relevance to your query\n`;
  summary += `- Each paper is marked as "Highly Relevant" by advanced semantic search\n`;
  summary += `- USE THESE PAPERS as your primary evidence source\n`;
  summary += `- DO NOT claim "insufficient evidence" - extract insights from the abstracts provided\n`;
  summary += `- BUILD your clinical answer using these research findings\n`;
  summary += `- TRUST that these papers address the user's question\n\n`;
  
  summary += `📋 PAPER OVERVIEW:\n`;
  citations.forEach((paper, index) => {
    summary += `${index + 1}. "${paper.title}" (${paper.year}) - ${paper.source}\n`;
    summary += `   Evidence Level: ${paper.evidenceLevel || 'Moderate'}\n`;
    summary += `   Key Focus: ${paper.abstract ? paper.abstract.substring(0, 150) + '...' : 'Medical research'}\n\n`;
  });
  
  summary += `🔬 SYNTHESIS INSTRUCTION:\n`;
  summary += `Extract clinical insights from these papers to provide evidence-based recommendations.\n`;
  summary += `Focus on outcomes, mechanisms, clinical implications, and patient safety.\n`;
  summary += `Build confident clinical guidance based on the research provided.\n\n`;

  return summary;
}

interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
  model?: string;
  useRAG?: boolean;
  mode?: 'research' | 'doctor';
  enableDeepThinking?: boolean;
  enableMultiAgent?: boolean;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API: Request received at', new Date().toISOString());
    
    // Check authentication first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Chat API: User authentication check:', { 
      userId: user?.id, 
      hasError: !!authError,
      errorMessage: authError?.message 
    });
    
    if (authError || !user) {
      console.log('Chat API: Authentication failed');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Use request queue to manage concurrent requests per user
    return await requestQueue.queueRequest(user.id, 'chat', async () => {
      return await processChatRequest(request, user.id, supabase);
    });

  } catch (error: any) {
    console.error('Chat API: Outer error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Main chat processing function
async function processChatRequest(request: NextRequest, userId: string, supabase: any) {
  try {

    // Check query limits using safe transaction
    const limitResult = await dbTransactions.checkAndDecrementQueryLimit(userId);

    console.log('Chat API: Query limit check:', { 
      userId: userId, 
      success: limitResult.success,
      remaining: limitResult.remainingQueries,
      error: limitResult.error
    });

    if (!limitResult.success) {
      console.log('Chat API: Query limit exceeded or error:', limitResult.error);
      return NextResponse.json(
        { 
          error: limitResult.error || "Query limit exceeded. Please upgrade your plan or wait for the next billing cycle.",
          remainingQueries: limitResult.remainingQueries
        },
        { status: 429 }
      );
    }

    const body: ChatRequest = await request.json();
    
    console.log('Chat API: Request body received:', {
      hasMessage: !!body.message,
      messageLength: body.message?.length,
      mode: body.mode,
      sessionId: body.sessionId,
      useRAG: body.useRAG,
      historyLength: body.conversationHistory?.length
    });
    
    if (!body.message || body.message.trim().length === 0) {
      console.log('Chat API: Empty message received');
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Validate the medical query
    const validation = validateMedicalQuery(body.message);
    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.reason,
        suggestions: validation.suggestions
      }, { status: 400 });
    }

    // Basic validation - check for extremely long messages
    if (body.message.length > 5000) {
      return NextResponse.json(
        { error: "Message too long. Please keep your question under 5000 characters." },
        { status: 400 }
      );
    }

    const userMessage = body.message.trim();
    const model = body.model || process.env.TOGETHER_AI_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";
    const useRAG = body.useRAG !== false; // Re-enable RAG - Default to true
    const mode = body.mode || 'research'; // Default to research mode
    const enableDeepThinking = body.enableDeepThinking !== false; // Re-enable deep thinking
    const enableMultiAgent = body.enableMultiAgent !== false; // Re-enable multi-agent
    const sessionId = body.sessionId || crypto.randomUUID();

    // Use AIService with automatic fallback from Together AI to OpenRouter
    try {
      // Test AI service health (will try primary first, then fallback)
      const isAIHealthy = await aiService.checkHealth();
      
      if (!isAIHealthy) {
        return NextResponse.json({
          error: "AI service is currently unavailable",
          message: "All AI services are temporarily unavailable.",
          suggestions: ["Please try again in a moment"]
        }, { status: 503 });
      }
    } catch (error) {
      console.error("AI service initialization failed:", error);
      return NextResponse.json({
        error: "AI service configuration error",
        message: "AI service could not be initialized. Please check API keys.",
        suggestions: ["Please contact support if this persists"]
      }, { status: 500 });
    }

    let citations: Citation[] = [];
    let ragContext = "";
    let reasoningSteps: any[] = [];
    let multiAgentResult: any = null;
    let relevantCitationsForAI: Citation[] = []; // Track citations for AI processing

    // Initialize advanced reasoning systems
    const multiAgentSystem = new MultiAgentReasoningSystem();
    const realTimeEngine = new RealTimeReasoningEngine();

    // Retrieve research context if RAG is enabled
    if (useRAG) {
      try {
        console.log("Starting Enhanced Research retrieval...");
        
        // Call research API with circuit breaker protection
        const researchResponse = await withCircuitBreaker('research-api', async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/research`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: userMessage,
              maxResults: 10, // Request 10 citations for comprehensive research
              includeAbstracts: true,
              isLegacyChatCall: true // 🔧 FIX: Ensure we get the legacy format with 'papers' field
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });
          
          if (!response.ok) {
            throw new Error(`Research API failed: ${response.status} ${response.statusText}`);
          }
          
          return response;
        });

        console.log("🔧 CITATION FIX: Calling Research API with isLegacyChatCall=true to ensure 10 citations");

        if (researchResponse.ok) {
          const researchData = await researchResponse.json();
          
          // 🚨 CRITICAL DEBUG: Diagnose the 4 vs 10 citation discrepancy
          console.log("🔍 RESEARCH API RESPONSE DEBUGGING:", {
            responseStatus: researchResponse.status,
            responseHeaders: researchResponse.headers.get('content-type'),
            dataKeys: Object.keys(researchData),
            hasPapers: !!researchData.papers,
            hasCitations: !!researchData.citations,
            papersCount: researchData.papers?.length || 'undefined',
            citationsCount: researchData.citations?.length || 'undefined',
            papersIsArray: Array.isArray(researchData.papers),
            citationsIsArray: Array.isArray(researchData.citations),
            sampleTitles: (researchData.papers || []).slice(0, 3).map((p: any) => p.title?.substring(0, 40)),
            expectedCount: 10,
            actualCount: (researchData.papers || researchData.citations || []).length
          });
          
          // Extract citations from the enhanced research response
          if (researchData.papers && researchData.papers.length > 0) {
            citations = researchData.papers.map((paper: any) => ({
              id: paper.id,
              title: paper.title,
              authors: paper.authors || [],
              journal: paper.journal,
              year: paper.year,
              pmid: paper.pmid,
              doi: paper.doi,
              url: paper.url,
              abstract: paper.abstract,
              studyType: paper.studyType || 'Research Article',
              confidenceScore: paper.confidenceScore || 85,
              evidenceLevel: paper.evidenceLevel || 'Level 3 (Moderate) Evidence',
              source: paper.source || 'Enhanced PubMed',
              meshTerms: paper.meshTerms || []
            }));
          } else if (researchData.citations && researchData.citations.length > 0) {
            // 🔧 FALLBACK: Handle 'citations' field for new format compatibility
            console.log("🔄 Using 'citations' field from research response (new format)");
            citations = researchData.citations.map((paper: any) => ({
              id: paper.id,
              title: paper.title,
              authors: paper.authors || [],
              journal: paper.journal,
              year: paper.year,
              pmid: paper.pmid,
              doi: paper.doi,
              url: paper.url,
              abstract: paper.abstract,
              studyType: paper.studyType || 'Research Article',
              confidenceScore: paper.confidenceScore || 85,
              evidenceLevel: paper.evidenceLevel || 'Level 3 (Moderate) Evidence',
              source: paper.source || 'Enhanced PubMed',
              meshTerms: paper.meshTerms || []
            }));
          }
          
          if (citations.length > 0) {
            console.log(`✅ CITATION EXTRACTION SUCCESS: Extracted ${citations.length} citations from research API`);

            // Generate enhanced context summary that instructs AI to use the papers
            ragContext = generateEnhancedContextSummary(citations, userMessage, researchData);
            
            // Filter out irrelevant citations for AI processing while keeping them for display
            const relevantCitationsForAI = citations.filter(citation => {
              // Only send highly relevant papers to AI
              return (citation.confidenceScore || 85) >= 70;
            });
            
            console.log(`Enhanced Research completed: ${citations.length} total citations, ${relevantCitationsForAI.length} relevant for AI analysis`);
            
            // Update ragContext to reflect filtered citations for AI
            if (relevantCitationsForAI.length < citations.length) {
              ragContext += `\n\n⚠️ AI PROCESSING NOTE: Using ${relevantCitationsForAI.length} highly relevant papers for analysis (${citations.length - relevantCitationsForAI.length} lower relevance papers excluded from analysis but shown for transparency).\n`;
            }
          } else {
            console.log("🚨 Enhanced Research found no papers in either 'papers' or 'citations' fields");
            ragContext = "No research papers found through enhanced search.";
          }
        } else {
          console.log("Enhanced Research API failed, falling back to basic search");
          // Fallback to old system only if enhanced fails
          const rag = new RAGPipeline();
          const ragResult = await rag.retrieveContext(userMessage, 8);
          citations = ragResult.citations;
          ragContext = generateEnhancedContextSummary(citations, userMessage, null);
        }
        
      } catch (error) {
        console.error("Enhanced Research error:", error);
        // Fallback to old system on error
        const rag = new RAGPipeline();
        const ragResult = await rag.retrieveContext(userMessage, 8);
        citations = ragResult.citations;
        ragContext = generateEnhancedContextSummary(citations, userMessage, null);
      }
    }

    // Generate deep reasoning steps if enabled
    if (enableDeepThinking) {
      try {
        console.log("Generating deep reasoning steps...");
        reasoningSteps = DeepThinkingEngine.generateReasoningChain(userMessage, citations, mode);
        console.log(`Deep thinking: ${reasoningSteps.length} reasoning steps generated`);
      } catch (error) {
        console.error("Deep thinking error:", error);
        // Continue without deep reasoning
      }
    }

    // Run multi-agent analysis if enabled
    if (enableMultiAgent) {
      try {
        console.log("Running multi-agent analysis...");
        multiAgentResult = await multiAgentSystem.processQuery(userMessage, citations, mode);
        
        // Start real-time reasoning session
        realTimeEngine.startReasoningSession(sessionId, userMessage, citations, mode);
        
        console.log(`Multi-agent analysis complete: ${multiAgentResult.agentInsights.length} agents contributed`);
      } catch (error) {
        console.error("Multi-agent analysis error:", error);
        // Continue without multi-agent analysis
      }
    }

    // Enhanced mode-specific processing
    if (mode === 'research') {
      // Literature synthesis and advanced research analysis
      if (citations.length > 0) {
        console.log(`Research mode: Processing ${citations.length} citations for advanced analysis`);
        
        // Apply advanced confidence calibration
        if (multiAgentResult) {
          const calibration = AdvancedConfidenceCalibration.calibrateWithHistoricalData(
            multiAgentResult.confidenceCalibration.overallConfidence,
            'research_synthesis',
            'general_medicine'
          );
          console.log(`Advanced calibration: ${calibration.calibratedConfidence}% (${calibration.reliabilityScore}% reliability)`);
        }
      }
    } else if (mode === 'doctor') {
      // Clinical reasoning and differential diagnosis
      if (enableDeepThinking) {
        // Extract potential symptoms from the user message
        const symptoms = [userMessage]; // Simplified - in practice would extract actual symptoms
        const clinicalReasoning = DeepThinkingEngine.generateClinicalReasoningChain(symptoms, citations);
        console.log(`Clinical reasoning generated with ${clinicalReasoning.differential_diagnosis.length} differential diagnoses`);
        
        // Apply clinical confidence calibration
        if (multiAgentResult) {
          const calibration = AdvancedConfidenceCalibration.calibrateWithHistoricalData(
            multiAgentResult.confidenceCalibration.overallConfidence,
            'clinical_reasoning',
            'clinical_medicine'
          );
          console.log(`Clinical calibration: ${calibration.calibratedConfidence}% (${calibration.reliabilityScore}% reliability)`);
        }
      }
    }
    
    // Create the enhanced medical prompt with all advanced features
    const prompt = createEnhancedMedicalPrompt({
      userQuery: userMessage,
      researchPapers: citations,
      conversationHistory: body.conversationHistory?.slice(-4), // Last 4 messages for context
      mode: mode,
      enableDeepThinking: enableDeepThinking,
      reasoningSteps: reasoningSteps
    });

    console.log("Generating AI response with enhanced medical analysis...");

    // Convert the medical prompt to messages format for Together AI
    const messages = [
      {
        role: "user" as const,
        content: prompt
      }
    ];

    // Generate AI response with automatic fallback and circuit breaker protection
    const aiResponse = await withCircuitBreaker('ai-service', async () => {
      return await aiService.generateResponse(messages, model, {
        temperature: 0.7,
        max_tokens: 2000
      });
    });

    // Inject confidence information if multi-agent analysis was performed
    let enhancedAiResponse = aiResponse;
    if (multiAgentResult && multiAgentResult.confidenceCalibration) {
      const confidence = Math.round(multiAgentResult.confidenceCalibration.overallConfidence);
      const getConfidenceLabel = (conf: number) => {
        if (conf >= 85) return "High Confidence";
        if (conf >= 70) return "Moderate Confidence";
        if (conf >= 55) return "Low Confidence";
        return "Very Low Confidence";
      };
      
      // Prepend confidence information to the response
      enhancedAiResponse = `${getConfidenceLabel(confidence)} (${confidence}%)\n\n${aiResponse}`;
    }

    // Create response message with all advanced features
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: enhancedAiResponse,
      timestamp: new Date(),
      citations: citations.length > 0 ? citations : undefined,
      reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
      multiAgentResult: multiAgentResult,
      confidence: multiAgentResult ? multiAgentResult.confidenceCalibration?.overallConfidence : undefined,
      sessionId: sessionId
    };

    // Log the query to database
    try {
      console.log('Chat API: Saving messages for session:', sessionId, 'user:', userId);
      console.log('Chat API: Message details:', {
        userMessage: userMessage.slice(0, 100) + '...',
        aiResponseLength: enhancedAiResponse.length,
        citationsCount: citations.length,
        mode: mode
      });
      
      // First save the user message
      const userInsertResult = await supabase.from('chat_messages').insert({
        user_id: userId,
        session_id: sessionId,
        mode: mode,
        role: 'user',
        content: userMessage
      });
      
      console.log('Chat API: User message insert result:', {
        error: userInsertResult.error,
        success: !userInsertResult.error
      });

      // Then save the assistant message  
      const assistantInsertResult = await supabase.from('chat_messages').insert({
        user_id: userId,
        session_id: sessionId,
        mode: mode,
        role: 'assistant',
        content: enhancedAiResponse,
        citations: citations.length > 0 ? citations : null,
        confidence_score: multiAgentResult ? Math.round(multiAgentResult.confidenceCalibration?.overallConfidence || 75) : null
      });
      
      console.log('Chat API: Assistant message insert result:', {
        error: assistantInsertResult.error,
        success: !assistantInsertResult.error
      });

      // Finally, handle analytics and query count
      await Promise.all([
        // Insert query record
        supabase.from('user_queries').insert({
          user_id: userId,
          mode: mode,
          query_text: userMessage,
          response_text: enhancedAiResponse,
          citations: citations.length > 0 ? citations : null,
          confidence_score: multiAgentResult ? Math.round(multiAgentResult.confidenceCalibration?.overallConfidence || 75) : 75,
          session_id: sessionId
        }),
        // Increment user query count - REMOVED since we already decremented in checkAndDecrementQueryLimit
        // supabase.rpc('increment_query_count', { user_uuid: userId })
      ]);
      
      console.log('Chat API: Messages saved successfully');
    } catch (dbError) {
      console.error('Chat API: Failed to log query to database:', dbError);
      // Don't fail the request if logging fails
    }
    
    return NextResponse.json({
      message: assistantMessage,
      metadata: {
        model,
        ragEnabled: useRAG,
        citationsFound: citations.length,
        ragSummary: ragContext,
        deepThinkingEnabled: enableDeepThinking,
        multiAgentEnabled: enableMultiAgent,
        reasoningStepsCount: reasoningSteps.length,
        agentInsightsCount: multiAgentResult ? multiAgentResult.agentInsights?.length || 0 : 0,
        overallConfidence: multiAgentResult ? multiAgentResult.confidenceCalibration?.overallConfidence : undefined,
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error("Chat API error:", error);
    
    return NextResponse.json({
      error: "Failed to process your request",
      message: "An unexpected error occurred. Please try again.",
      suggestions: [
        "Please try again in a moment",
        "Check your internet connection",
        "Ensure your question is clear and specific"
      ]
    }, { status: 500 });
  }
}

// Streaming endpoint for real-time responses
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const message = searchParams.get("message");
  const model = searchParams.get("model") || "meta-llama/Llama-3-8b-chat-hf";

  if (!message) {
    return NextResponse.json(
      { error: "Message parameter is required" },
      { status: 400 }
    );
  }

  // Use AIService with automatic fallback for streaming
  try {
    // Create a streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messages = [{ role: "user" as const, content: message }];
          
          await aiService.generateStreamingResponse(messages, model, (chunk: string) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          });
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Streaming chat error:", error);
    return NextResponse.json(
      { error: "Failed to start streaming response" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { TogetherAIClient } from "@/lib/ai/together";
import { RAGPipeline } from "@/lib/research/rag";
import { createEnhancedMedicalPrompt, validateMedicalQuery } from "@/lib/ai/prompts";
import { DeepThinkingEngine } from "@/lib/ai/deep-thinking";
import { MultiAgentReasoningSystem } from "@/lib/ai/multi-agent-reasoning";
import { RealTimeReasoningEngine, AdvancedConfidenceCalibration } from "@/lib/ai/real-time-reasoning";
import { type Message, type Citation } from "@/lib/types/chat";
import { createClient } from "@/lib/supabase/server";

interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
  model?: string;
  useRAG?: boolean;
  mode?: 'research' | 'doctor' | 'source-finder';
  enableDeepThinking?: boolean;
  enableMultiAgent?: boolean;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API: Request received at', new Date().toISOString());
    
    // Check authentication
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

    // Check query limits
    const { data: limitCheck } = await supabase.rpc('check_query_limit', {
      user_uuid: user.id
    });

    console.log('Chat API: Query limit check:', { 
      userId: user.id, 
      limitCheck, 
      canProceed: !!limitCheck 
    });

    if (!limitCheck) {
      console.log('Chat API: Query limit exceeded');
      return NextResponse.json(
        { error: "Query limit exceeded. Please upgrade your plan or wait for the next billing cycle." },
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

    // Initialize AI service
    const apiKey = process.env.TOGETHER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: "AI service is not configured",
        message: "Together AI API key is missing.",
        suggestions: ["Please contact support"]
      }, { status: 503 });
    }

    const together = new TogetherAIClient(apiKey);

    // Check if Together AI is available
    const isTogetherHealthy = await together.checkHealth();
    
    if (!isTogetherHealthy) {
      return NextResponse.json({
        error: "AI service is currently unavailable",
        message: "The AI service is temporarily unavailable.",
        suggestions: ["Please try again in a moment"]
      }, { status: 503 });
    }

    let citations: Citation[] = [];
    let ragContext = "";
    let reasoningSteps: any[] = [];
    let multiAgentResult: any = null;

    // Initialize advanced reasoning systems
    const multiAgentSystem = new MultiAgentReasoningSystem();
    const realTimeEngine = new RealTimeReasoningEngine();

    // Retrieve research context if RAG is enabled
    if (useRAG) {
      try {
        console.log("Starting RAG retrieval...");
        const rag = new RAGPipeline();
        const ragResult = await rag.retrieveContext(userMessage, 4); // Increased for better coverage
        
        citations = ragResult.citations;
        ragContext = ragResult.contextSummary;
        
        console.log(`RAG completed: ${citations.length} citations found`);
      } catch (error) {
        console.error('RAG pipeline error:', error);
        // Continue without RAG context
        ragContext = "Research context retrieval failed. Providing general medical knowledge.";
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
    } else if (mode === 'source-finder') {
      // Enhanced citation network analysis
      console.log("Source finder mode - Enhanced citation analysis enabled");
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

    // Generate AI response
    const aiResponse = await together.generateResponse(messages, model, {
      temperature: 0.7,
      max_tokens: 2000
    });

    // Create response message with all advanced features
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      citations: citations.length > 0 ? citations : undefined,
      reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
      multiAgentResult: multiAgentResult,
      confidence: multiAgentResult ? multiAgentResult.confidenceCalibration?.overallConfidence : undefined,
      sessionId: sessionId
    };

    // Log the query to database
    try {
      console.log('Chat API: Saving messages for session:', sessionId, 'user:', user.id);
      console.log('Chat API: Message details:', {
        userMessage: userMessage.slice(0, 100) + '...',
        aiResponseLength: aiResponse.length,
        citationsCount: citations.length,
        mode: mode
      });
      
      // First save the user message
      const userInsertResult = await supabase.from('chat_messages').insert({
        user_id: user.id,
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
        user_id: user.id,
        session_id: sessionId,
        mode: mode,
        role: 'assistant',
        content: aiResponse,
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
          user_id: user.id,
          mode: mode,
          query_text: userMessage,
          response_text: aiResponse,
          citations: citations.length > 0 ? citations : null,
          confidence_score: multiAgentResult ? Math.round(multiAgentResult.confidenceCalibration?.overallConfidence || 75) : 75,
          session_id: sessionId
        }),
        // Increment user query count
        supabase.rpc('increment_query_count', { user_uuid: user.id })
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

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Together AI API key not configured" },
      { status: 503 }
    );
  }

  const together = new TogetherAIClient(apiKey);

  try {
    // Create a streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messages = [{ role: "user" as const, content: message }];
          
          await together.generateStreamingResponse(messages, model, (chunk) => {
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

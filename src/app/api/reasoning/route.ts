import { NextRequest, NextResponse } from "next/server";
import { RealTimeReasoningEngine } from "@/lib/ai/real-time-reasoning";

interface ReasoningRequest {
  sessionId: string;
  action: 'subscribe' | 'update' | 'feedback' | 'end';
  data?: any;
}

// Global reasoning engine instance (in production, use proper state management)
const globalReasoningEngine = new RealTimeReasoningEngine();

export async function POST(request: NextRequest) {
  try {
    const body: ReasoningRequest = await request.json();
    
    if (!body.sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    switch (body.action) {
      case 'subscribe':
        // Client wants to subscribe to updates for a session
        const currentState = globalReasoningEngine.getCurrentState(body.sessionId);
        const updates = globalReasoningEngine.getUpdates(body.sessionId);
        
        return NextResponse.json({
          success: true,
          currentState,
          updates,
          message: "Subscribed to reasoning updates"
        });

      case 'update':
        // New evidence or context provided
        if (body.data?.newEvidence) {
          const updateResults = await globalReasoningEngine.adaptToNewEvidence(
            body.sessionId, 
            body.data.newEvidence
          );
          
          return NextResponse.json({
            success: true,
            updates: updateResults,
            message: `${updateResults.length} updates generated from new evidence`
          });
        }
        break;

      case 'feedback':
        // User provided feedback on reasoning
        if (body.data?.feedback) {
          const feedbackResults = await globalReasoningEngine.refineWithUserFeedback(
            body.sessionId,
            body.data.feedback
          );
          
          return NextResponse.json({
            success: true,
            updates: feedbackResults,
            message: `Reasoning refined based on user feedback`
          });
        }
        break;

      case 'end':
        // End the reasoning session
        globalReasoningEngine.endReasoningSession(body.sessionId);
        
        return NextResponse.json({
          success: true,
          message: "Reasoning session ended"
        });

      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Real-time reasoning API error:", error);
    
    return NextResponse.json({
      error: "Failed to process reasoning request",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}

// SSE endpoint for real-time updates
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID parameter is required" },
      { status: 400 }
    );
  }

  // Create SSE stream for real-time updates
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to updates
      globalReasoningEngine.subscribeToUpdates(sessionId, (update) => {
        const data = JSON.stringify({
          type: 'reasoning_update',
          update,
          timestamp: new Date().toISOString()
        });
        
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Send initial connection message
      const initialData = JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time reasoning updates',
        sessionId,
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        globalReasoningEngine.unsubscribeFromUpdates(sessionId);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    },
  });
}

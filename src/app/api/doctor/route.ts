import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sessionId, mode } = body;
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // For now, return a simple mock response
    // TODO: Integrate with actual AI service (Ollama, OpenAI, etc.)
    const response = `Thank you for your medical question: "${query}". 

I'm a medical assistant designed to help with general health information and medical questions. However, please note that I cannot provide specific medical diagnoses or replace professional medical advice.

**Important Medical Disclaimer:**
- This information is for educational purposes only
- Always consult with a qualified healthcare provider for medical concerns
- In case of emergency, contact emergency services immediately

Based on your question, I recommend discussing this with your healthcare provider who can provide personalized advice based on your medical history and current condition.

Is there anything specific about this topic you'd like me to explain in more general terms?`;

    return NextResponse.json({
      response,
      citations: [],
      reasoningSteps: [
        {
          step: 1,
          description: "Received medical question",
          content: "Processing user query about medical topic"
        },
        {
          step: 2,
          description: "Generated educational response",
          content: "Provided general medical information with appropriate disclaimers"
        }
      ],
      confidence: 0.8,
      sessionId,
      mode
    });

  } catch (error) {
    console.error("Doctor API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        response: "I apologize, but I encountered an error processing your request. Please try again later."
      },
      { status: 500 }
    );
  }
}

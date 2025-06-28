import { NextResponse } from "next/server";
import { TogetherAIClient } from "@/lib/ai/together";

export async function GET() {
  try {
    const apiKey = process.env.TOGETHER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "Together AI API key not configured",
          suggestions: [
            "Add TOGETHER_API_KEY to your environment variables",
            "Get an API key from https://api.together.xyz",
            "Restart the server after adding the API key"
          ]
        },
        { status: 503 }
      );
    }

    const together = new TogetherAIClient(apiKey);
    const isHealthy = await together.checkHealth();
    
    if (!isHealthy) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "Together AI API is not accessible",
          suggestions: [
            "Check your API key validity",
            "Verify your internet connection",
            "Check Together AI service status"
          ]
        },
        { status: 503 }
      );
    }

    // Try to list available models
    const models = await together.listModels();
    
    // Filter for medical/chat optimized models
    const recommendedModels = models.filter(model => 
      model.id.includes("llama") || 
      model.id.includes("mistral") || 
      model.id.includes("phi")
    ).slice(0, 10);

    return NextResponse.json({
      status: "healthy",
      message: "Together AI API is accessible",
      provider: "Together AI",
      modelsAvailable: models.length,
      recommendedModels: recommendedModels.map(model => ({
        id: model.id,
        name: model.id.split("/").pop() || model.id
      })),
      defaultModel: process.env.TOGETHER_AI_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    });

  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Failed to check Together AI status",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

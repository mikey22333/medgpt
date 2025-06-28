import { AIService } from "@/lib/ai/ai-service";
import { createClient } from "@/lib/supabase/server";

async function testFallback() {
  try {
    console.log("🔍 Testing AI service fallback functionality...");
    
    // Initialize the AI service
    const aiService = new AIService();
    
    // Test health check
    console.log("🔄 Checking AI service health...");
    const isHealthy = await aiService.checkHealth();
    console.log(`✅ AI Service Health Check: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
    
    if (!isHealthy) {
      console.error("❌ AI Service is not healthy. Please check your API keys and internet connection.");
      return;
    }
    
    // Test a simple query
    const testQuery = "What are the latest guidelines for treating hypertension?";
    console.log(`\n📝 Testing with query: "${testQuery}"`);
    
    const messages = [
      {
        role: "user" as const,
        content: testQuery
      }
    ];
    
    console.log("\n🚀 Sending request to AI service...");
    const response = await aiService.generateResponse(messages, undefined, {
      temperature: 0.7,
      max_tokens: 500
    });
    
    console.log("\n✅ Response received successfully!");
    console.log("\n📄 Response preview:", response.substring(0, 200) + "...");
    
    // Check which provider was used
    // @ts-ignore - Accessing private property for testing
    const provider = aiService.useFallback ? "OpenRouter (Fallback)" : "Together AI (Primary)";
    console.log(`\n🔌 AI Provider Used: ${provider}`);
    
  } catch (error) {
    console.error("\n❌ Error testing fallback:", error);
  }
}

// Run the test
testFallback();

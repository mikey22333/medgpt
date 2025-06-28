import { AIService } from "@/lib/ai/ai-service";

// Mock the TogetherAIClient to simulate failure
class MockFailingTogetherAIClient {
  async checkHealth() {
    return false; // Simulate unhealthy service
  }
  
  async generateResponse() {
    throw new Error("Simulated Together AI failure");
  }
  
  async generateStreamingResponse() {
    throw new Error("Simulated Together AI streaming failure");
  }
}

async function testFallbackMechanism() {
  try {
    console.log("🔍 Testing fallback mechanism...");
    
    // Create a test instance with a failing primary client and real OpenRouter fallback
    const openRouterApiKey = "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";
    const openRouter = new (require("@/lib/ai/openrouter").OpenRouterClient)(openRouterApiKey);
    
    const testService = new AIService(
      new MockFailingTogetherAIClient() as any,
      openRouter
    );
    
    // Test health check should show primary is down but fallback is available
    console.log("🔄 Testing health check...");
    const isHealthy = await testService.checkHealth();
    console.log(`✅ Service Health: ${isHealthy ? 'Healthy (using fallback)' : 'Unhealthy'}`);
    
    if (!isHealthy) {
      console.error("❌ Service is not healthy. Check your fallback configuration.");
      return;
    }
    
    // Test a query - should automatically use OpenRouter
    const testQuery = "What are the latest guidelines for treating diabetes type 2?";
    console.log(`\n📝 Testing with query: "${testQuery}"`);
    
    const messages = [
      {
        role: "user" as const,
        content: testQuery
      }
    ];
    
    console.log("\n🚀 Sending request (should use fallback)...");
    const response = await testService.generateResponse(
      messages, 
      "deepseek/deepseek-chat-v3-0324:free",
      {
        temperature: 0.7,
        max_tokens: 500
      }
    );
    
    console.log("\n✅ Fallback response received successfully!");
    console.log("\n📄 Response preview:", response.substring(0, 200) + "...");
    
  } catch (error) {
    console.error("\n❌ Error testing fallback mechanism:", error);
  }
}

// Run the test
testFallbackMechanism();

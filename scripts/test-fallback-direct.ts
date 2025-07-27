import { TogetherAIClient } from "@/lib/ai/together";
import { OpenRouterClient } from "@/lib/ai/openrouter";

// Directly test the OpenRouter client
async function testOpenRouterDirectly() {
  try {
    // Replace with your API key
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || "your_openrouter_api_key_here";
    const openRouter = new OpenRouterClient(openRouterApiKey);

    console.log("🔍 Testing OpenRouter client directly...");
    
    // Test health check
    console.log("🔄 Checking OpenRouter health...");
    const isHealthy = await openRouter.checkHealth();
    console.log(`✅ OpenRouter Health Check: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
    
    if (!isHealthy) {
      console.error("❌ OpenRouter is not healthy. Please check your API key and internet connection.");
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
    
    console.log("\n🚀 Sending request to OpenRouter...");
    const response = await openRouter.generateResponse(
      messages, 
      "deepseek/deepseek-chat-v3-0324:free",
      {
        temperature: 0.7,
        max_tokens: 500
      }
    );
    
    console.log("\n✅ Response received successfully!");
    console.log("\n📄 Response preview:", response.substring(0, 200) + "...");
    
  } catch (error) {
    console.error("\n❌ Error testing OpenRouter:", error);
  }
}

// Run the test
testOpenRouterDirectly();

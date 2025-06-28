import { OpenRouterClient } from "@/lib/ai/openrouter";

// Simple test of the fallback mechanism
async function testFallback() {
  try {
    console.log("🔍 Testing OpenRouter fallback...");
    
    // Initialize OpenRouter client directly
    const openRouterApiKey = "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";
    const openRouter = new OpenRouterClient(openRouterApiKey);
    
    // Test a query
    const testQuery = "What are the latest guidelines for treating migraines?";
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
    
    console.log("\n✅ Fallback response received successfully!");
    console.log("\n📄 Response preview:", response.substring(0, 200) + "...");
    
    // Test streaming
    console.log("\n🎬 Testing streaming response...");
    let streamedText = "";
    await openRouter.generateStreamingResponse(
      messages,
      "deepseek/deepseek-chat-v3-0324:free",
      (chunk) => {
        process.stdout.write(chunk);
        streamedText += chunk;
      }
    );
    
    console.log("\n\n✅ Streaming test completed!");
    
  } catch (error) {
    console.error("\n❌ Error testing fallback:", error);
  }
}

// Run the test
testFallback();

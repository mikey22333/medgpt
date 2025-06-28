import { TogetherAI } from "@/lib/ai/together";

async function testTogetherAPI() {
  const apiKey = process.env.TOGETHER_API_KEY;
  
  if (!apiKey) {
    console.error("❌ TOGETHER_API_KEY is not set in environment variables");
    console.log("Please add TOGETHER_API_KEY to your .env.local file");
    return;
  }

  console.log("🔍 Testing Together AI API connection...");
  
  try {
    const together = new TogetherAI(apiKey);
    
    // Test health check
    console.log("🔄 Checking API health...");
    const isHealthy = await together.checkHealth();
    console.log(`✅ Together API Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
    
    if (!isHealthy) {
      console.error("❌ Together API is not healthy. Please check your API key and network connection.");
      return;
    }
    
    // Test a simple completion
    console.log("\n🚀 Testing model completion...");
    const response = await together.generateResponse(
      [
        {
          role: "user" as const,
          content: "Hello, are you working? Respond with just 'Yes' if you can see this message."
        }
      ],
      "meta-llama/Llama-3-8b-chat-hf",
      {
        temperature: 0.7,
        max_tokens: 50
      }
    );
    
    console.log("\n✅ API Response Received:");
    console.log(response);
    
  } catch (error) {
    console.error("\n❌ Error testing Together API:", error);
    console.log("\nTroubleshooting steps:");
    console.log("1. Verify your API key is correct and has sufficient credits");
    console.log("2. Check your internet connection");
    console.log("3. Check https://status.together.xyz/ for any outages");
    console.log("4. Try using the fallback OpenRouter API by setting OPENROUTER_API_KEY");
  }
}

// Run the test
testTogetherAPI();

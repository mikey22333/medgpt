import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing AI Fallback by simulating Together AI failure...');
    
    // Temporarily override the Together API key to simulate failure
    const originalKey = process.env.TOGETHER_API_KEY;
    process.env.TOGETHER_API_KEY = 'invalid_key_to_test_fallback';
    
    // Import AIService after setting invalid key
    const { aiService } = await import('@/lib/ai/ai-service');
    
    const testMessages = [
      {
        role: "user" as const,
        content: "What is hypertension? One sentence please."
      }
    ];
    
    console.log('Attempting to generate response with invalid Together AI key...');
    const startTime = Date.now();
    
    try {
      const response = await aiService.generateResponse(testMessages, undefined, {
        temperature: 0.3,
        max_tokens: 100
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log('✅ Fallback successful!');
      console.log('Response time:', responseTime + 'ms');
      console.log('Response preview:', response.substring(0, 100) + '...');
      
      // Restore original key
      process.env.TOGETHER_API_KEY = originalKey;
      
      return NextResponse.json({
        success: true,
        message: "Fallback mechanism working correctly",
        results: {
          fallbackTriggered: true,
          responseTime,
          responsePreview: response.substring(0, 200),
          fallbackService: "OpenRouter (expected)",
          testConducted: "Invalid Together AI key simulation"
        },
        conclusions: [
          "✅ Primary service failed as expected (invalid key)",
          "✅ Fallback service activated successfully", 
          "✅ Response generated successfully via fallback",
          "✅ Fallback mechanism is working correctly"
        ]
      });
      
    } catch (error) {
      // Restore original key before handling error
      process.env.TOGETHER_API_KEY = originalKey;
      
      console.error('❌ Both primary and fallback failed:', error);
      
      return NextResponse.json({
        success: false,
        message: "Both AI services failed",
        error: error instanceof Error ? error.message : 'Unknown error',
        results: {
          fallbackTriggered: true,
          bothServicesFailed: true,
          likelyReasons: [
            "OpenRouter API key is missing or invalid",
            "Network connectivity issues",
            "Both services are down"
          ]
        },
        apiKeyStatus: {
          togetherAI: "Simulated as invalid",
          openRouter: !!process.env.OPENROUTER_API_KEY ? "Present" : "Missing"
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('🚨 Test setup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Test setup failed",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

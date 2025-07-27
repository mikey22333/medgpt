import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testType = searchParams.get('type') || 'health';
  
  try {
    console.log('🧪 AI Fallback Test Started');
    console.log('Test Type:', testType);
    
    // Test 1: Check AI service health
    console.log('\n1. Testing AI Service Health...');
    const isHealthy = await aiService.checkHealth();
    console.log('AI Service Health:', isHealthy);
    
    // Test 2: Check environment variables
    console.log('\n2. Checking Environment Variables...');
    const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
    console.log('Together AI Key:', hasTogetherKey ? 'Present' : 'Missing');
    console.log('OpenRouter Key:', hasOpenRouterKey ? 'Present' : 'Missing');
    
    // Test 3: Test a simple generation
    console.log('\n3. Testing AI Generation...');
    const testMessages = [
      {
        role: "user" as const,
        content: testType === 'fallback' 
          ? "This is a test to trigger fallback mechanism"
          : "What is diabetes? (One sentence answer)"
      }
    ];
    
    const startTime = Date.now();
    let response;
    let errorOccurred = false;
    
    try {
      response = await aiService.generateResponse(testMessages, undefined, {
        temperature: 0.3,
        max_tokens: 100
      });
      
    } catch (error) {
      console.error('AI Generation Error:', error);
      errorOccurred = true;
      throw error;
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('\n4. Test Results:');
    console.log('Response Time:', responseTime + 'ms');
    console.log('Error Occurred:', errorOccurred);
    console.log('Response Length:', response?.length);
    console.log('Response Preview:', response?.substring(0, 100) + '...');
    
    // Test 4: Simulate primary service failure (if requested)
    let fallbackTestResult = null;
    if (testType === 'force_fallback') {
      console.log('\n5. Testing Forced Fallback...');
      try {
        // This would require modifying AIService to have a test mode
        fallbackTestResult = {
          message: "Forced fallback test not implemented in production code",
          recommendation: "To test fallback, temporarily disable TOGETHER_API_KEY in environment"
        };
      } catch (error) {
        fallbackTestResult = {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackTriggered: true
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      testType,
      results: {
        healthCheck: isHealthy,
        hasTogetherKey,
        hasOpenRouterKey,
        errorOccurred,
        responseTime,
        responsePreview: response?.substring(0, 200),
        fallbackTest: fallbackTestResult
      },
      recommendations: [
        !isHealthy && "AI service is not healthy - check API keys",
        !hasTogetherKey && !hasOpenRouterKey && "No AI API keys found - add TOGETHER_API_KEY or OPENROUTER_API_KEY",
        errorOccurred && "AI generation failed - check API keys and connectivity",
        responseTime > 5000 && "Response time is slow - check network connectivity"
      ].filter(Boolean),
      nextSteps: [
        "Test with different message types",
        "Monitor response times",
        "Check logs for fallback triggers",
        testType !== 'force_fallback' && "Try ?type=force_fallback to test fallback scenario"
      ].filter(Boolean)
    });
    
  } catch (error) {
    console.error('🚨 AI Fallback Test Failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testType,
      troubleshooting: [
        "Check TOGETHER_API_KEY in environment variables",
        "Check OPENROUTER_API_KEY in environment variables", 
        "Verify API keys are valid and have sufficient credits",
        "Check network connectivity",
        "Review server logs for detailed error information"
      ],
      apiKeyStatus: {
        togetherAI: !!process.env.TOGETHER_API_KEY,
        openRouter: !!process.env.OPENROUTER_API_KEY,
        hasAnyKey: !!(process.env.TOGETHER_API_KEY || process.env.OPENROUTER_API_KEY)
      }
    }, { status: 500 });
  }
}

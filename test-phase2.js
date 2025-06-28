// Test Phase 2 Implementation
import { DeepThinkingEngine } from '../src/lib/ai/deep-thinking';
import { createEnhancedMedicalPrompt } from '../src/lib/ai/prompts';

// Test deep thinking engine
const testQuery = "What are the latest treatments for diabetes?";
const testCitations = [
  {
    id: "1",
    title: "Systematic review of diabetes management",
    authors: ["Smith, J.", "Doe, A."],
    journal: "Diabetes Care",
    year: 2024,
    pmid: "12345678"
  }
];

console.log("Testing Deep Thinking Engine...");

try {
  // Test reasoning chain generation
  const reasoningSteps = DeepThinkingEngine.generateReasoningChain(
    testQuery, 
    testCitations, 
    'research'
  );
  
  console.log(`✅ Generated ${reasoningSteps.length} reasoning steps`);
  console.log("Sample step:", reasoningSteps[0]);

  // Test enhanced prompt creation
  const prompt = createEnhancedMedicalPrompt({
    userQuery: testQuery,
    researchPapers: testCitations,
    mode: 'research',
    enableDeepThinking: true,
    reasoningSteps: reasoningSteps
  });
  
  console.log("✅ Enhanced prompt created successfully");
  console.log("Prompt length:", prompt.length);
  
} catch (error) {
  console.error("❌ Test failed:", error);
}

export {};

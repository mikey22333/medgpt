// Test file to check specific exports
try {
  const { createEnhancedMedicalPrompt, validateMedicalQuery } = require('./src/lib/ai/prompts.ts');
  console.log('✅ Exports found:', {
    createEnhancedMedicalPrompt: typeof createEnhancedMedicalPrompt,
    validateMedicalQuery: typeof validateMedicalQuery
  });
} catch (error) {
  console.error('❌ Import error:', error.message);
}

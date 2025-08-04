/**
 * Test MeSH Integration in Improved Query Processor
 * Demonstrates database-specific query optimization with enhanced MeSH utilization
 */

// Import the improved query processor
const { ImprovedQueryProcessor } = require('./src/lib/research/improved-query-processor.ts');

console.log('🧠 Testing Enhanced MeSH Integration\n');

// Test medical query
const testQuery = "diabetes treatment with metformin in elderly patients";

console.log(`Original Query: "${testQuery}"\n`);

// Analyze the query
const analysis = ImprovedQueryProcessor.analyzeMedicalQuery(testQuery);
console.log('📊 PICO Analysis:');
console.log(`- Condition: ${analysis.condition}`);
console.log(`- Intervention: ${analysis.intervention}`);
console.log(`- Population: ${analysis.population}`);
console.log(`- Query Type: ${analysis.queryType}`);
console.log(`- Medical Concepts: ${analysis.medicalConcepts.join(', ')}\n`);

// Generate optimized queries
const queries = ImprovedQueryProcessor.generateOptimizedQueries(analysis);

console.log('🎯 Database-Specific Optimized Queries:\n');

console.log('📖 PubMed (Full MeSH Integration):');
console.log(`${queries.pubmedQuery}\n`);

console.log('🏥 Europe PMC (Hybrid MeSH + Text):');
console.log(`${queries.europePMCQuery}\n`);

console.log('🤖 Semantic Scholar (Natural Language):');
console.log(`${queries.semanticScholarQuery}\n`);

console.log('📚 CrossRef (Phrase Matching):');
console.log(`${queries.crossrefQuery}\n`);

console.log('🔬 OpenAlex (Concept-Based):');
console.log(`${queries.openAlexQuery}\n`);

console.log('✅ Key MeSH Enhancements:');
console.log('- PubMed: Uses MeSH Major Topic for precision + explosion control');
console.log('- Europe PMC: MESH:"term" syntax with text fallback');
console.log('- Enhanced mapping covers 60+ medical concepts');
console.log('- PICO framework ensures structured analysis');
console.log('- Study type filters for evidence-based results');

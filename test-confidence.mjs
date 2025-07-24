// Simple test for multi-agent confidence system
import { MultiAgentReasoningSystem } from '../src/lib/ai/multi-agent-reasoning.js';

const testCitations = [{
  id: '1',
  title: 'Long COVID: major findings, mechanisms and recommendations',
  authors: ['Davis HE', 'Assaf GS', 'McCorkell L'],
  journal: 'Nature Reviews Microbiology',
  year: '2021',
  abstract: 'Long COVID affects multiple organ systems with symptoms persisting for months after the initial infection. Cardiovascular, pulmonary, neurological, and other organ systems show persistent dysfunction.',
  source: 'PubMed',
  confidenceScore: 90,
  evidenceLevel: 'High',
  studyType: 'Systematic Review'
}];

async function testMultiAgent() {
  console.log('Testing multi-agent confidence system...');
  
  const system = new MultiAgentReasoningSystem();
  const result = await system.processQuery('long-term effects of COVID-19 on organ systems', testCitations, 'research');
  
  console.log('✅ Multi-agent Result:');
  console.log('- Overall Confidence:', result.confidenceCalibration?.overallConfidence);
  console.log('- Agent Insights:', result.agentInsights.length);
  console.log('- Consensus View:', result.consensusView.substring(0, 100) + '...');
  
  return result;
}

testMultiAgent().catch(console.error);

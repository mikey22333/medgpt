// Simple test runner for meta-summary tests
const { MetaSummaryService } = require('./dist/lib/research/meta-summary');
const { getDefaultGRADEAssessment } = require('./dist/lib/research/grade');

console.log('Starting meta-summary tests...');

const service = new MetaSummaryService();

// Test 1: Core Pathophysiology
test('corePathophysiology', () => {
  const summary = {
    title: 'Test Meta-analysis',
    authors: ['Author 1', 'Author 2'],
    year: 2023,
    journal: 'Test Journal',
    url: 'http://example.com',
    confidence: 'moderate',
    keyFindings: [],
    clinicalImplications: [],
    limitations: [],
    plainLanguageSummary: '',
    structuredSummary: {
      population: 'patients with lupus nephritis',
      intervention: 'mycophenolate mofetil',
      comparator: 'placebo',
      outcomes: [],
      certainty: 'moderate',
      importance: 'high'
    }
  };

  const result = service.generatePlainLanguageSummary(summary);
  console.log('Test 1 - Core Pathophysiology:');
  console.log(result.includes('🧬 **Core Pathophysiology**') ? '✅ Passed' : '❌ Failed');
  console.log('---');
});

// Test 2: GRADE Table
test('gradeTable', () => {
  const summary = {
    title: 'Test Meta-analysis',
    authors: ['Author 1', 'Author 2'],
    year: 2023,
    journal: 'Test Journal',
    url: 'http://example.com',
    confidence: 'moderate',
    keyFindings: [],
    clinicalImplications: [],
    limitations: [],
    plainLanguageSummary: '',
    structuredSummary: {
      population: 'patients with diabetes',
      intervention: 'metformin',
      comparator: 'placebo',
      outcomes: [],
      certainty: 'moderate',
      importance: 'high'
    },
    gradeAssessment: getDefaultGRADEAssessment('rct')
  };

  const result = service.generatePlainLanguageSummary(summary);
  console.log('Test 2 - GRADE Table:');
  console.log(result.includes('📊 **GRADE Summary**') ? '✅ Passed' : '❌ Failed');
  console.log('---');
});

// Test 3: Aspirin-specific paragraph
test('aspirinParagraph', () => {
  const summary = {
    title: 'Test Meta-analysis',
    authors: ['Author 1', 'Author 2'],
    year: 2023,
    journal: 'Test Journal',
    url: 'http://example.com',
    confidence: 'moderate',
    keyFindings: [],
    clinicalImplications: [],
    limitations: [],
    plainLanguageSummary: '',
    structuredSummary: {
      population: 'adults at risk for colorectal cancer',
      intervention: 'low-dose aspirin',
      comparator: 'placebo',
      outcomes: [],
      certainty: 'moderate',
      importance: 'high'
    }
  };

  const result = service.generatePlainLanguageSummary(summary);
  console.log('Test 3 - Aspirin Paragraph:');
  console.log(result.includes('💊 **Aspirin and Colorectal Cancer**') ? '✅ Passed' : '❌ Failed');
  console.log('---');
});

function test(name, fn) {
  console.log(`Running test: ${name}`);
  try {
    fn();
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

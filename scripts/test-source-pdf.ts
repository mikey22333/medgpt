import { exportToPDF } from '../src/lib/utils/pdf-export';

async function testSourcePDFExport() {
  console.log('Testing Source Finder PDF export...');
  
  try {
    const result = await exportToPDF({
      mode: 'source',
      title: 'Test Source Finder Export',
      content: 'This is a test AI response from Source Finder mode. It should include detailed information about medical research papers and findings.\n\nThis content should appear in the exported PDF when using Source Finder mode.',
      query: 'What are the latest treatments for diabetes?',
      papers: [
        {
          pmid: '12345',
          title: 'Novel Diabetes Treatment Approaches',
          authors: ['Dr. Smith', 'Dr. Johnson'],
          year: '2023',
          journal: 'Medical Journal',
          citationCount: 45,
          source: 'PubMed' as const,
          url: 'https://pubmed.ncbi.nlm.nih.gov/12345',
          abstract: 'This study explores new treatment options...'
        }
      ]
    });
    
    console.log('PDF export result:', result);
    
    if (result) {
      console.log('✅ Source Finder PDF export test passed!');
    } else {
      console.log('❌ Source Finder PDF export test failed!');
    }
  } catch (error) {
    console.error('❌ PDF export test error:', error);
  }
}

// Run the test
testSourcePDFExport();

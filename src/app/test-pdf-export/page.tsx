'use client';

import { useState } from 'react';
import { usePDFExport, type PDFExportOptions } from '@/hooks/usePDFExport';
import { Button } from '@/components/ui/button';

export default function TestPDFExport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { exportToPDF } = usePDFExport();

  const testResearchExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const options: PDFExportOptions = {
        mode: 'research',
        title: 'Test Research Export',
        content: 'This is a test research export with sample data.',
        query: 'test research query',
        papers: [
          {
            title: 'Sample Research Paper',
            authors: ['Author One', 'Author Two'],
            journal: 'Journal of Testing',
            year: '2023',
            abstract: 'This is a sample abstract for testing purposes.',
            url: 'https://example.com/paper1',
            source: 'PubMed',
            citationCount: 42,
            doi: '10.1234/example123',
            pmid: '12345678',
            isOpenAccess: true
          }
        ],
        metaAnalysis: {
          effectSize: 'OR 1.5',
          confidenceInterval: '1.2-1.8',
          nnt: '10',
          heterogeneity: 'I² = 25%'
        },
        gradeAssessment: {
          confidence: 'high',
          rationale: 'High quality evidence from multiple studies',
          limitations: ['Limited sample size in some studies']
        },
        clinicalImplications: 'This research suggests a significant effect with important clinical implications.'
      };

      await exportToPDF(options);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const testSourceExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const options: PDFExportOptions = {
        mode: 'source',
        title: 'Test Source Export',
        content: 'This is a test AI response from Source Finder mode. It should include detailed information about medical research findings and provide comprehensive analysis of the requested query. This content should now appear in the exported PDF when using Source Finder mode, demonstrating that the content export functionality is working correctly.',
        query: 'test source query',
        papers: [
          {
            title: 'First Sample Paper',
            authors: ['Author One', 'Author Two'],
            journal: 'Journal of Testing',
            year: '2023',
            abstract: 'This is a sample abstract for testing purposes.',
            url: 'https://example.com/paper1',
            source: 'PubMed',
            citationCount: 42,
            doi: '10.1234/example123',
            pmid: '12345678',
            isOpenAccess: true
          },
          {
            title: 'Second Sample Paper with a Much Longer Title to Test Text Wrapping and Table Formatting',
            authors: ['Author Three', 'Author Four', 'Author Five'],
            journal: 'International Journal of Testing',
            year: '2022',
            abstract: 'Another sample abstract with more detailed information about the study methodology and results.',
            url: 'https://example.com/paper2',
            source: 'Europe PMC',
            citationCount: 15,
            doi: '10.5678/example456',
            pmid: '87654321',
            isOpenAccess: false
          }
        ],
        includeAbstracts: true,
        exportStyle: 'summary'
      };

      await exportToPDF(options);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">PDF Export Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Research Mode Export</h2>
          <p className="text-gray-600 mb-4">
            Test exporting a research summary with meta-analysis and GRADE assessment.
          </p>
          <Button 
            onClick={testResearchExport}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Test Research Export'}
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Source Mode Export</h2>
          <p className="text-gray-600 mb-4">
            Test exporting source documents in a table format.
          </p>
          <Button 
            onClick={testSourceExport}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Generating...' : 'Test Source Export'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';
import { generateResearchPDF, generateSourcePDF, downloadPDF } from '@/lib/utils/pdf-export';
import { type ResearchPaper } from '@/lib/types/research';
import { type GRADEConfidence } from '@/lib/research/grade';

export type ExportMode = 'research' | 'source';

interface BaseExportOptions {
  title: string;
  query?: string;
  papers?: ResearchPaper[];
  includeAbstracts?: boolean;
  includeReferences?: boolean;
  includeSourceInfo?: boolean;
  exportStyle?: 'summary' | 'citation';
}

export interface ResearchExportOptions extends BaseExportOptions {
  mode: 'research';
  content?: string;
  metaAnalysis?: {
    effectSize?: string;
    confidenceInterval?: string;
    nnt?: string;
    heterogeneity?: string;
  };
  gradeAssessment?: {
    confidence?: GRADEConfidence;
    rationale?: string;
    limitations?: string[];
  };
  clinicalImplications?: string;
}

export interface SourceExportOptions extends BaseExportOptions {
  mode: 'source';
  content?: string;
  appliedFilters?: Record<string, string>;
}

export type PDFExportOptions = ResearchExportOptions | SourceExportOptions;

// Base interface removed - using the more detailed types above

export function usePDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToPDF = useCallback(async (options: PDFExportOptions) => {
    const {
      mode = 'research',
      title = 'Export',
      papers = [],
      includeAbstracts = true,
      includeReferences = true,
      includeSourceInfo = true,
      exportStyle = 'summary',
      query = ''
    } = options;

    setIsGenerating(true);
    setError(null);

    try {
      let pdfBlob: Blob;
      
      if (mode === 'research') {
        const researchOpts = options as ResearchExportOptions;
        pdfBlob = await generateResearchPDF({
          mode: 'research',
          title,
          content: researchOpts.content || '',
          papers,
          includeAbstracts,
          includeReferences,
          includeSourceInfo,
          metaAnalysis: researchOpts.metaAnalysis,
          gradeAssessment: researchOpts.gradeAssessment,
          clinicalImplications: researchOpts.clinicalImplications,
          query
        });
      } else {
        const sourceOpts = options as SourceExportOptions;
        pdfBlob = await generateSourcePDF({
          mode: 'source',
          title,
          content: sourceOpts.content || '',
          papers,
          includeAbstracts,
          includeSourceInfo,
          exportStyle: sourceOpts.exportStyle || 'summary',
          appliedFilters: sourceOpts.appliedFilters,
          query
        });
      }

      // Create a filename-safe version of the title
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

      const timestamp = new Date().toISOString().split('T')[0];
      downloadPDF(pdfBlob, `medgpt-${mode}-${safeTitle}-${timestamp}.pdf`);
      return true;
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate PDF'));
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    exportToPDF,
    isGenerating,
    error,
    resetError: () => setError(null)
  };
}

// Hook specifically for research results
export function useResearchPDFExport() {
  const { exportToPDF, ...rest } = usePDFExport();

  const exportResearch = useCallback(({
    query,
    content,
    papers,
    includeAbstracts = true
  }: {
    query: string;
    content: string;
    papers: ResearchPaper[];
    includeAbstracts?: boolean;
  }) => {
    return exportToPDF({
      mode: 'research',
      title: `Research: ${query}`,
      content,
      papers,
      includeAbstracts,
      includeReferences: true,
      includeSourceInfo: true
    });
  }, [exportToPDF]);

  return {
    exportResearch,
    ...rest
  };
}

// Hook specifically for source results
export function useSourcePDFExport() {
  const { exportToPDF, ...rest } = usePDFExport();

  const exportSource = useCallback(({
    source,
    query,
    papers,
    includeAbstracts = true
  }: {
    source: string;
    query: string;
    papers: ResearchPaper[];
    includeAbstracts?: boolean;
  }) => {
    return exportToPDF({
      mode: 'source',
      title: `${source} Results: ${query}`,
      papers,
      includeAbstracts,
      includeReferences: true,
      includeSourceInfo: true
    });
  }, [exportToPDF]);

  return {
    exportSource,
    ...rest
  };
}

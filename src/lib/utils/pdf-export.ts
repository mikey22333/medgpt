// Import jsPDF types
import 'jspdf';
import 'jspdf-autotable';
import { type ResearchPaper, type GRADEConfidence } from "@/lib/types/research";

// Extend the window object to include jspdf-autotable types
declare global {
  interface Window {
    jsPDF: {
      new (options?: {
        orientation?: 'portrait' | 'landscape' | 'p' | 'l';
        unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
        format?: string | number[];
        filters?: string[];
        compress?: boolean;
        precision?: number;
        encryption?: any;
        putOnlyUsedFonts?: boolean;
        hotfixes?: string[];
      }): JsPDFWithAutoTable;
    };
  }
  // Declare jsPDF in global scope
  const jsPDF: Window['jsPDF'];
}

// Get the jsPDF constructor from window at runtime
const getJsPDF = (): Window['jsPDF'] => {
  if (typeof window === 'undefined') {
    throw new Error('jsPDF is only available in the browser');
  }
  return window.jsPDF;
};

// Type for jsPDF with autotable
type JsPDFWithAutoTable = {
  // AutoTable methods
  autoTable: (options: any) => void;
  lastAutoTable?: {
    finalY: number;
  };
  
  // Text methods
  setFont: (font: string, style?: string, weight?: string | number) => JsPDFWithAutoTable;
  setFontSize: (size: number) => JsPDFWithAutoTable;
  setTextColor: (r: number, g?: number, b?: number) => JsPDFWithAutoTable;
  text: (text: string | string[], x: number, y: number, options?: any) => JsPDFWithAutoTable;
  splitTextToSize: (text: string, maxWidth: number, options?: any) => string[];
  
  // Page methods
  addPage: (format?: string | string[], orientation?: string) => JsPDFWithAutoTable;
  setPage: (pageNumber: number) => JsPDFWithAutoTable;
  getNumberOfPages: () => number;
  
  // Drawing methods
  setDrawColor: (r: number, g: number, b: number) => JsPDFWithAutoTable;
  line: (x1: number, y1: number, x2: number, y2: number, style?: any) => JsPDFWithAutoTable;
  
  // Output methods
  output: (type: string, options?: any) => any;
  
  // Internal properties
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
    pages: {
      length: number;
      [index: number]: any;
    };
  };
  
  // Other jsPDF methods
  [key: string]: any;
};

// Create a new PDF document
export const createPdfDocument = (): JsPDFWithAutoTable => {
  const jsPDF = getJsPDF();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  }) as unknown as JsPDFWithAutoTable;
  return doc;
};

// Type definitions for jspdf-autotable
type AutoTableOptions = {
  head?: any[][];
  body?: any[][];
  startY?: number;
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
  styles?: Record<string, any>;
  headStyles?: Record<string, any>;
  bodyStyles?: Record<string, any>;
  footStyles?: Record<string, any>;
  alternateRowStyles?: Record<string, any>;
  columnStyles?: Record<number | string, any>;
  theme?: string;
  didDrawPage?: (data: any) => void;
  willDrawCell?: (data: any) => void;
  didDrawCell?: (data: any) => void;
};

// Export the generateSourcePDF function for use in other files
export const generateSourcePDF = async (options: PDFExportOptions): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);
  let yPos = margin;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title || 'Source Export', margin, yPos);
  yPos += 15;

  // Add query if available
  if (options.query) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Query: ${options.query}`, margin, yPos);
    yPos += 10;
  }

  // Add papers table
  if (options.papers && options.papers.length > 0) {
    const tableData = options.papers.map((paper, index) => {
      const authors = Array.isArray(paper.authors) 
        ? paper.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
        : '';
      
      return [
        (index + 1).toString(),
        paper.title,
        authors,
        paper.year?.toString() || '',
        paper.journal || '',
        paper.citationCount?.toString() || '0',
        paper.source || ''
      ];
    });

    // @ts-ignore - jspdf-autotable types are not available
    (doc as any).autoTable({
      startY: yPos,
      head: [['#', 'Title', 'Authors', 'Year', 'Journal', 'Citations', 'Source']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 15 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 }
      }
    });
  }

  // Add page numbers
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 25,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Return the PDF as a Blob
  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: (options: AutoTableOptions) => void;
  }
}

interface GRADEAssessment {
  confidence?: GRADEConfidence;
  rationale?: string;
  limitations?: string[];
  studyDesign?: string;
  riskOfBias?: 'low' | 'some concerns' | 'high';
  inconsistency?: 'not serious' | 'serious' | 'very serious';
  indirectness?: 'not serious' | 'serious' | 'very serious';
  imprecision?: 'not serious' | 'serious' | 'very serious';
  publicationBias?: 'likely' | 'suspected' | 'undetected';
}

interface MetaAnalysisStats {
  effectSize?: string;
  confidenceInterval?: string;
  nnt?: string;
  heterogeneity?: string;
}

interface PDFExportOptions {
  // Common options
  title: string;
  query?: string;
  content?: string;
  papers?: ResearchPaper[];
  includeAbstracts?: boolean;
  includeReferences?: boolean;
  includeSourceInfo?: boolean;
  mode: 'research' | 'source';
  
  // Research mode specific
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
  
  // Source mode specific
  sourceQuery?: string;
  appliedFilters?: Record<string, string>;
  exportStyle?: 'summary' | 'citation';
}

// Helper to format GRADE confidence
export const formatGRADEConfidence = (confidence?: GRADEConfidence): string => {
  if (!confidence) return 'Not assessed';
  
  const confidenceMap: Record<GRADEConfidence, string> = {
    'high': 'High',
    'moderate': 'Moderate',
    'low': 'Low',
    'very-low': 'Very Low'
  };
  
  return confidenceMap[confidence] || confidence;
};

// Helper to generate GRADE table
export const generateGRADETable = (doc: JsPDFWithAutoTable, gradeAssessment: GRADEAssessment, startY: number): number => {
  const tableColumn = [
    'Assessment Criteria',
    'Rating',
    'Explanation'
  ];

  const tableRows = [
    [
      'Study Design',
      gradeAssessment.studyDesign || 'N/A',
      'Type of study design used in the research'
    ],
    [
      'Risk of Bias',
      gradeAssessment.riskOfBias ? gradeAssessment.riskOfBias.charAt(0).toUpperCase() + gradeAssessment.riskOfBias.slice(1) : 'N/A',
      'Assessment of potential biases in the study design'
    ],
    [
      'Inconsistency',
      gradeAssessment.inconsistency ? gradeAssessment.inconsistency.replace('not ', 'not ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'N/A',
      'Variability in results across studies'
    ],
    [
      'Indirectness',
      gradeAssessment.indirectness ? gradeAssessment.indirectness.replace('not ', 'not ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'N/A',
      'How directly the evidence answers the research question'
    ],
    [
      'Imprecision',
      gradeAssessment.imprecision ? gradeAssessment.imprecision.replace('not ', 'not ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'N/A',
      'Degree of uncertainty around the effect estimate'
    ],
    [
      'Publication Bias',
      gradeAssessment.publicationBias ? gradeAssessment.publicationBias.charAt(0).toUpperCase() + gradeAssessment.publicationBias.slice(1) : 'Undetected',
      'Potential for unpublished studies affecting results'
    ]
  ];

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      cellPadding: 6,
      fontSize: 10,
      cellWidth: 'wrap',
      overflow: 'linebreak',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { cellWidth: 80 }
    },
    margin: { left: 20, right: 20 }
  });

  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : startY + 50;
};

// Helper to generate GRADE table from PDFExportOptions
export const generateGRADETableFromOptions = (doc: JsPDFWithAutoTable, options: PDFExportOptions): number => {
  if (options.mode !== 'research' || !options.gradeAssessment) return 0;
  
  const { confidence, rationale, limitations = [] } = options.gradeAssessment;
  const startY = doc.lastAutoTable?.finalY || 40;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Evidence Quality Assessment', 15, startY + 15);
  
  // GRADE Confidence
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Confidence in Effect Estimate:', 20, startY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(formatGRADEConfidence(confidence), 90, startY + 30);
  
  // Rationale
  if (rationale) {
    doc.setFont('helvetica', 'bold');
    doc.text('Rationale:', 20, startY + 45);
    doc.setFont('helvetica', 'normal');
    const rationaleLines = doc.splitTextToSize(rationale, 170);
    doc.text(rationaleLines, 30, startY + 55);
  }
  
  // Limitations
  if (limitations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Key Limitations:', 20, startY + 80);
    doc.setFont('helvetica', 'normal');
    
    let yOffset = 90;
    limitations.forEach((limitation, index) => {
      doc.text('• ' + limitation, 25, startY + yOffset);
      yOffset += 7;
    });
    
    return yOffset + startY + 10;
  }
  
  return startY + 90;
};

// Helper to generate meta-analysis stats
export const generateMetaAnalysisStats = (doc: JsPDFWithAutoTable, metaAnalysis: MetaAnalysisStats | undefined, startY: number): number => {
  if (!metaAnalysis) return startY;
  
  const { effectSize = '', confidenceInterval = '', nnt = '', heterogeneity = '' } = metaAnalysis;
  let y = startY;
  
  // Add section header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Meta-Analysis Summary', 20, y);
  y += 10;
  
  // Add effect size if available
  if (effectSize) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Effect Size: ${effectSize}`, 25, y);
    y += 7;
  }
  
  // Add confidence interval if available
  if (confidenceInterval) {
    doc.text(`95% CI: ${confidenceInterval}`, 25, y);
    y += 7;
  }
  
  // Add NNT if available
  if (nnt) {
    doc.text(`NNT: ${nnt}`, 25, y);
    y += 7;
  }
  
  // Add heterogeneity if available
  if (heterogeneity) {
    doc.text(`Heterogeneity (I²): ${heterogeneity}`, 25, y);
    y += 7;
  }
  
  return y + 10; // Add some extra space after the section
};

// Helper to generate meta-analysis stats from PDFExportOptions
export const generateMetaAnalysisStatsFromOptions = (doc: JsPDFWithAutoTable, options: PDFExportOptions, startY: number): number => {
  if (!options.metaAnalysis) return startY;
  
  const { 
    effectSize = '', 
    confidenceInterval = '', 
    nnt = '', 
    heterogeneity = '' 
  } = options.metaAnalysis;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Meta-Analysis Results', 15, startY + 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  let yOffset = 30;
  
  if (effectSize) {
    doc.text('Effect Size:', 20, startY + yOffset);
    doc.text(effectSize, 90, startY + yOffset);
    yOffset += 10;
  }
  
  if (confidenceInterval) {
    doc.text('95% Confidence Interval:', 20, startY + yOffset);
    doc.text(confidenceInterval, 90, startY + yOffset);
    yOffset += 10;
  }
  
  if (nnt) {
    doc.text('Number Needed to Treat (NNT):', 20, startY + yOffset);
    doc.text(nnt, 90, startY + yOffset);
    yOffset += 10;
  }
  
  if (heterogeneity) {
    doc.text('Heterogeneity (I²):', 20, startY + yOffset);
    doc.text(heterogeneity, 90, startY + yOffset);
    yOffset += 15;
  } else {
    yOffset += 5;
  }
  
  return startY + yOffset;
};

export async function generateResearchPDF(options: PDFExportOptions): Promise<Blob> {
  const {
    title,
    query = '',
    content = '',
    papers = [],
    includeAbstracts = true,
    includeReferences = true,
    includeSourceInfo = true,
    mode = 'research',
    metaAnalysis,
    gradeAssessment,
    clinicalImplications,
    exportStyle = 'summary',
    appliedFilters = {}
  } = options;

  const doc = createPdfDocument();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - (margin * 2);
  
  // Add header with logo and title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  // Add logo (placeholder - replace with actual logo if available)
  // doc.addImage(logo, 'PNG', margin, 10, 30, 15);
  
  // Add title
  const titleLines = doc.splitTextToSize(title, maxWidth - 40);
  doc.text(titleLines, margin, 20);
  
  // Add AI disclaimer for research mode
  if (mode === 'research') {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const disclaimer = 'This document was automatically generated by MedGPT Scholar. The information provided is for educational and research purposes only and should not be considered medical advice. Always consult with a qualified healthcare provider for medical advice.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, maxWidth);
    doc.text(disclaimerLines, margin, 275, { align: 'center' });
  }
  
  // Add query if in source mode
  if (mode === 'source' && query) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Search Query: "${query}"`, margin, 30);
  }
  
  // Add date and page number
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 280);
  
  // Add page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, 280);
  }
  
  // Add footer
  doc.setFontSize(8);
  doc.text('Generated by MedGPT Scholar - AI-Powered Medical Research Assistant', pageWidth / 2, 290, { align: 'center' });
  
  let yPos = mode === 'research' ? 40 : 35;
  
  // Add main content based on mode
  if (mode === 'research') {
    // Research Mode Content
    if (content) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(content, maxWidth);
      doc.text('Clinical Implications', margin, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const implications = clinicalImplications || 'No clinical implications provided.';
      const implicationLines = doc.splitTextToSize(implications, maxWidth);
      doc.text(implicationLines, margin, yPos);
      yPos += (implicationLines.length * 6) + 15;
    }
    
    // Add references section
    if (papers.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('References', margin, yPos);
      yPos += 10;
    }
  } else {
    // Source Mode Content
    if (Object.keys(appliedFilters).length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Applied Filters:', margin, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      Object.entries(appliedFilters).forEach(([key, value]) => {
        doc.text(`• ${key}: ${value}`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 10;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Found ${papers.length} results for: "${query}"`, margin, yPos);
    yPos += 10;
  }
  
  // Add papers content based on mode and style
  if (papers.length > 0) {
    if (mode === 'source' && exportStyle === 'citation') {
      // Citation style for source mode
      doc.setFontSize(10);
      
      papers.forEach((paper, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        // Paper number
        doc.setFont('helvetica', 'bold');
        doc.text(`[${index + 1}]`, margin, yPos);
        
        // Format authors
        const authors = Array.isArray(paper.authors) 
          ? paper.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
          : 'Unknown authors';
        
        // Title in bold
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(paper.title, maxWidth - 10);
        doc.text(titleLines, margin + 10, yPos);
        yPos += (titleLines.length * 5) + 2;
        
        // Authors in normal
        doc.setFont('helvetica', 'normal');
        const authorLines = doc.splitTextToSize(authors, maxWidth - 10);
        doc.text(authorLines, margin + 10, yPos);
        yPos += (authorLines.length * 5) + 2;
        
        // Journal and year in italic
        doc.setFont('helvetica', 'italic');
        const journalText = `${paper.journal || 'N/A'} (${paper.year || 'n.d.'})`;
        doc.text(journalText, margin + 10, yPos);
        
        // Add citation count if available
        if (paper.citationCount) {
          doc.setFont('helvetica', 'normal');
          doc.text(`Citations: ${paper.citationCount}`, margin + 10, yPos + 5);
          yPos += 10;
        } else {
          yPos += 5;
        }
        
        // Add abstract if requested
        if (includeAbstracts && paper.abstract) {
          doc.setFont('helvetica', 'normal');
          doc.text('Abstract:', margin + 5, yPos + 5);
          const abstractLines = doc.splitTextToSize(paper.abstract, maxWidth - 15);
          doc.text(abstractLines, margin + 10, yPos + 10);
          yPos += (abstractLines.length * 4) + 15;
        } else {
          yPos += 10;
        }
        
        // Add source and link if available
        if (includeSourceInfo) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          const sourceText = `Source: ${paper.source}${paper.url ? ` | ${paper.url}` : ''}`;
          doc.text(sourceText, margin + 10, yPos);
          yPos += 5;
          doc.setFontSize(10);
        }
        
        // Add a line between papers
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      });
    } else {
      // Table format for research mode or summary style in source mode
      // Add section header if in research mode
      if (mode === 'research') {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('References', margin, yPos);
        yPos += 10;
      }
      
      // Prepare table data
      const tableData = papers.map((paper, index) => ({
        id: index + 1,
        title: paper.title,
        authors: Array.isArray(paper.authors) 
          ? paper.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
          : 'Unknown authors',
        year: paper.year,
        journal: paper.journal || 'N/A',
        citationCount: paper.citationCount || 0,
        source: paper.source,
        abstract: paper.abstract || ''
      }));
      
      // Generate table with appropriate columns based on mode
      const columns = mode === 'research' 
        ? ['#', 'Title', 'Authors', 'Year', 'Journal', 'Citations']
        : ['#', 'Title', 'Authors', 'Year', 'Journal', 'Citations', 'Source'];
      
      // @ts-ignore - jspdf-autotable types are not available
  (doc as any).autoTable({
        startY: yPos,
        head: [columns],
        body: tableData.map(p => {
          const row = [
            p.id,
            p.title.substring(0, 50) + (p.title.length > 50 ? '...' : ''),
            p.authors.length > 30 ? p.authors.substring(0, 30) + '...' : p.authors,
            p.year || 'N/A',
            p.journal ? (p.journal.substring(0, 20) + (p.journal.length > 20 ? '...' : '')) : 'N/A',
            p.citationCount || 0
          ];
          
          if (mode === 'source') {
            row.push(p.source);
          }
          
          return row;
        }),
        margin: { left: margin },
        styles: { 
          fontSize: mode === 'source' ? 7 : 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: mode === 'source' ? 7 : 8
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: (data: any) => {
          // Page numbers are already added in the header/footer
        }
      });
      
      // Update yPos after table
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Add abstracts if requested
      if (includeAbstracts && mode === 'research') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Abstracts', margin, yPos);
        yPos += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        for (const paper of papers) {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          // Add paper title
          doc.setFont('helvetica', 'bold');
          const titleLines = doc.splitTextToSize(`${paper.title}`, maxWidth);
          doc.text(titleLines, margin, yPos);
          yPos += (titleLines.length * 5) + 2;
          
          // Add abstract if available
          if (paper.abstract) {
            doc.setFont('helvetica', 'normal');
            const abstractLines = doc.splitTextToSize(paper.abstract, maxWidth);
            doc.text(abstractLines, margin, yPos);
            yPos += (abstractLines.length * 5) + 10;
          } else {
            doc.text('No abstract available', margin, yPos);
            yPos += 10;
          }
          
          // Add source and link if available
          if (includeSourceInfo) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            const sourceText = `Source: ${paper.source}${paper.url ? ` | ${paper.url}` : ''}`;
            doc.text(sourceText, margin, yPos);
            yPos += 5;
            doc.setFontSize(10);
          }
          
          yPos += 10; // Add some space between papers
        }
      }
    }
  }
  
  // Generate PDF blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

// Helper function to download the PDF
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

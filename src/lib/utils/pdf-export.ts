// Import jsPDF and autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type ResearchPaper } from "@/lib/types/research";
import { type GRADEConfidence } from "@/lib/research/grade";

// Utility function to convert markdown to plain text for PDF
export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // Remove markdown headers but keep the text with proper spacing
    .replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n')
    // Remove bold and italic formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Convert links to readable format
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Convert blockquotes to indented text
    .replace(/^>\s*(.*)$/gm, '  $1')
    // Remove horizontal rules
    .replace(/^---+$/gm, '\n')
    // Convert markdown tables to readable format
    .replace(/\|([^|]+)\|/g, (match, content) => content.trim() + ' | ')
    .replace(/^\|(.+)\|$/gm, '$1')
    // Remove table separator lines
    .replace(/^\|[-\s|]+\|$/gm, '')
    // Remove emojis and special Unicode characters but keep some useful symbols
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // Replace common markdown emojis with text equivalents
    .replace(/📚/g, '[RESEARCH]')
    .replace(/📊/g, '[DATA]')
    .replace(/🔍/g, '[SEARCH]')
    .replace(/🏥/g, '[CLINICAL]')
    .replace(/🎯/g, '[TARGET]')
    .replace(/💡/g, '[TIP]')
    .replace(/⚠️/g, '[WARNING]')
    .replace(/📄/g, '[DOCUMENT]')
    .replace(/🥇|⭐|🔬|💎/g, '[HIGH QUALITY]')
    // Clean up multiple spaces and newlines
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// PDF export options interface - base interface
interface BaseExportOptions {
  title: string;
  query?: string;
  papers?: ResearchPaper[];
  includeAbstracts?: boolean;
  includeReferences?: boolean;
  includeSourceInfo?: boolean;
  exportStyle?: 'summary' | 'citation';
}

interface ResearchExportOptions extends BaseExportOptions {
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

interface SourceExportOptions extends BaseExportOptions {
  mode: 'source';
  content?: string;
  appliedFilters?: Record<string, string>;
}

export type PDFExportOptions = ResearchExportOptions | SourceExportOptions;

// Export the generateSourcePDF function for use in other files
export const generateSourcePDF = async (options: SourceExportOptions): Promise<Blob> => {
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

  // Add AI response content if available
  if (options.content) {
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Response:', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Convert markdown to plain text
    const plainTextContent = markdownToPlainText(options.content);
    const contentLines = doc.splitTextToSize(plainTextContent, maxWidth);
    doc.text(contentLines, margin, yPos);
    yPos += contentLines.length * 5 + 15;
  }

  // Add papers table
  if (options.papers && options.papers.length > 0) {
    const tableData = options.papers.map((paper, index) => {
      const authors = Array.isArray(paper.authors) 
        ? paper.authors.map(a => typeof a === 'string' ? a : (a as any).name || '').join(', ')
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

    // Use autoTable method
    autoTable(doc, {
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
        6: { cellWidth: 25 }
      }
    });

    // Update yPos after table
    yPos = (doc as any).lastAutoTable?.finalY || yPos + 50;
  }

  // Add applied filters if available
  if (options.appliedFilters && Object.keys(options.appliedFilters).length > 0) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Applied Filters:', margin, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    Object.entries(options.appliedFilters).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, margin, yPos);
      yPos += 6;
    });
  }

  // Convert to blob and return
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};

// Generate research PDF with comprehensive content
export const generateResearchPDF = async (options: ResearchExportOptions): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);
  let yPos = margin;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title || 'Research Report', margin, yPos);
  yPos += 15;

  // Add timestamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += 15;

  // Add query if available
  if (options.query) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Research Query:', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const queryLines = doc.splitTextToSize(options.query, maxWidth);
    doc.text(queryLines, margin, yPos);
    yPos += queryLines.length * 6 + 10;
  }

  // Add main content if available
  if (options.content) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis & Findings:', margin, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Convert markdown to plain text
    const plainTextContent = markdownToPlainText(options.content);
    const contentLines = doc.splitTextToSize(plainTextContent, maxWidth);
    doc.text(contentLines, margin, yPos);
    yPos += contentLines.length * 5 + 15;
  }

  // Add meta-analysis data if available
  if (options.metaAnalysis) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Meta-Analysis Results:', margin, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (options.metaAnalysis.effectSize) {
      doc.text(`Effect Size: ${options.metaAnalysis.effectSize}`, margin, yPos);
      yPos += 6;
    }
    
    if (options.metaAnalysis.confidenceInterval) {
      doc.text(`Confidence Interval: ${options.metaAnalysis.confidenceInterval}`, margin, yPos);
      yPos += 6;
    }
    
    if (options.metaAnalysis.nnt) {
      doc.text(`Number Needed to Treat: ${options.metaAnalysis.nnt}`, margin, yPos);
      yPos += 6;
    }
    
    if (options.metaAnalysis.heterogeneity) {
      doc.text(`Heterogeneity: ${options.metaAnalysis.heterogeneity}`, margin, yPos);
      yPos += 6;
    }
  }

  // Add GRADE assessment if available
  if (options.gradeAssessment) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GRADE Assessment:', margin, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (options.gradeAssessment.confidence) {
      doc.text(`Evidence Quality: ${options.gradeAssessment.confidence}`, margin, yPos);
      yPos += 6;
    }
    
    if (options.gradeAssessment.rationale) {
      doc.text('Rationale:', margin, yPos);
      yPos += 6;
      const rationaleLines = doc.splitTextToSize(options.gradeAssessment.rationale, maxWidth);
      doc.text(rationaleLines, margin + 5, yPos);
      yPos += rationaleLines.length * 5;
    }
    
    if (options.gradeAssessment.limitations && options.gradeAssessment.limitations.length > 0) {
      yPos += 5;
      doc.text('Limitations:', margin, yPos);
      yPos += 6;
      options.gradeAssessment.limitations.forEach((limitation: string) => {
        doc.text(`• ${limitation}`, margin + 5, yPos);
        yPos += 6;
      });
    }
  }

  // Add clinical implications if available
  if (options.clinicalImplications) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Implications:', margin, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const implicationLines = doc.splitTextToSize(options.clinicalImplications, maxWidth);
    doc.text(implicationLines, margin, yPos);
    yPos += implicationLines.length * 5 + 15;
  }

  // Add papers section
  if (options.papers && options.papers.length > 0) {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Research Sources:', margin, yPos);
    yPos += 10;

    const tableData = options.papers.map((paper, index) => {
      const authors = Array.isArray(paper.authors) 
        ? paper.authors.map(a => typeof a === 'string' ? a : (a as any).name || '').join(', ')
        : '';
        
      return [
        (index + 1).toString(),
        paper.title,
        authors,
        paper.year?.toString() || '',
        paper.journal || '',
        paper.source || ''
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Title', 'Authors', 'Year', 'Journal', 'Source']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 },
        3: { cellWidth: 15 },
        4: { cellWidth: 35 },
        5: { cellWidth: 20 }
      }
    });

    yPos = (doc as any).lastAutoTable?.finalY || yPos + 50;
  }

  // Include abstracts if requested
  if (options.includeAbstracts && options.papers && options.papers.length > 0) {
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Paper Abstracts:', margin, yPos);
    yPos += 10;

    options.papers.forEach((paper, index) => {
      if (paper.abstract) {
        // Check if we need a new page
        if (yPos > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${paper.title}`, margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Clean abstract text of any markdown formatting
        const cleanAbstract = markdownToPlainText(paper.abstract);
        const abstractLines = doc.splitTextToSize(cleanAbstract, maxWidth);
        doc.text(abstractLines, margin, yPos);
        yPos += abstractLines.length * 4 + 10;
      }
    });
  }

  // Convert to blob and return
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};

// Download PDF function
export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Main export function that chooses the right generator
export const exportToPDF = async (options: PDFExportOptions): Promise<boolean> => {
  try {
    let blob: Blob;
    
    if (options.mode === 'source') {
      blob = await generateSourcePDF(options);
    } else {
      blob = await generateResearchPDF(options);
    }
    
    const filename = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
    downloadPDF(blob, filename);
    
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
};
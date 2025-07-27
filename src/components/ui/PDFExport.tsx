'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

interface PDFExportProps {
  contentId: string; // ID of the element to export
  fileName?: string;
  className?: string;
}

interface Citation {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  url?: string;
  abstract?: string;
}

export function PDFExport({ contentId, fileName = 'clinisynth-response', className = '' }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Function to clean text and remove problematic characters
  const cleanText = (text: string): string => {
    return text
      // Remove or replace common problematic characters
      .replace(/[""]/g, '"')  // Replace smart quotes
      .replace(/['']/g, "'")  // Replace smart apostrophes
      .replace(/[—–]/g, '-')  // Replace em/en dashes
      .replace(/…/g, '...')   // Replace ellipsis
      .replace(/[^\u0000-\u007F]/g, '') // Remove non-ASCII characters
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();
  };

  const extractStructuredContent = (element: HTMLElement): { content: string, citations: Citation[] } => {
    const citations: Citation[] = [];
    
    // Create a clone to avoid modifying original DOM
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // First, extract and remove citation cards
    const citationCards = clonedElement.querySelectorAll('.citation-card');
    citationCards.forEach((card) => {
      const titleElement = card.querySelector('h4');
      const title = cleanText(titleElement?.textContent?.trim() || '');
      
      if (title) {
        // Extract citation data (simplified)
        let authors: string[] = ['Unknown Author'];
        let journal = 'Unknown Journal';
        let year = new Date().getFullYear();
        let doi = '';
        let pmid = '';
        let url = '';
        
        // Get authors from author elements
        const authorElements = card.querySelectorAll('div.text-xs.text-gray-600');
        for (const div of authorElements) {
          const text = cleanText(div.textContent?.trim() || '');
          if (text && text.includes(',') && !text.includes('DOI:') && !text.includes('PMID:')) {
            authors = text.split(',').map(author => cleanText(author.trim())).filter(a => a.length > 0);
            break;
          }
        }
        
        // Get journal and year from badges
        const badges = card.querySelectorAll('span, .badge');
        for (const badge of badges) {
          const badgeText = cleanText(badge.textContent?.trim() || '');
          if (badgeText.match(/\b(19|20)\d{2}\b/)) {
            year = parseInt(badgeText.match(/\b(19|20)\d{2}\b/)![0]);
          } else if (badgeText.length > 3 && badgeText.length < 100 && 
                     !badgeText.includes('%') && !badgeText.includes('Level')) {
            journal = badgeText;
          }
        }
        
        // Get DOI/PMID
        const allText = card.textContent || '';
        const doiMatch = allText.match(/DOI:\s*([^\s,\]]+)/);
        const pmidMatch = allText.match(/PMID:\s*(\d+)/);
        
        if (doiMatch) {
          doi = doiMatch[1];
          url = `https://doi.org/${doi}`;
        } else if (pmidMatch) {
          pmid = pmidMatch[1];
          url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
        }
        
        citations.push({
          title, authors, journal, year, doi, pmid, url
        });
      }
      
      // Remove the citation card
      card.remove();
    });
    
    // Now extract the main content - focus on the actual chat response
    let content = '';
    
    // Method 1: Look for the main chat response container
    const mainContentSelectors = [
      '[class*="prose"]',
      '[class*="response"]', 
      '[class*="message"]',
      '[class*="content"]',
      '.whitespace-pre-wrap',
      'div[class*="text-"]'
    ];
    
    let mainContent: Element | null = null;
    
    for (const selector of mainContentSelectors) {
      const elements = clonedElement.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent?.trim() || '';
        // Look for substantial content that looks like a research summary
        if (text.length > 200 && 
            (text.includes('Research Summary') || 
             text.includes('Clinical') || 
             text.includes('treatment') ||
             text.includes('study') ||
             text.includes('%'))) {
          mainContent = element;
          break;
        }
      }
      if (mainContent) break;
    }
    
    if (mainContent) {
      // Extract structured content from the main content area
      const textContent = mainContent.textContent || '';
      const cleanedContent = cleanText(textContent);
      
      // More precise section splitting - only treat as headers if they start a line and are followed by content
      const lines = cleanedContent.split('\n').filter(line => line.trim());
      const structuredParts: string[] = [];
      
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) {
          i++;
          continue;
        }
        
        // Check if this line is actually a section header (standalone line that matches our patterns)
        const isActualHeader = (
          line.length < 100 && // Headers are typically short
          line.match(/^(Research Summary|Key Findings|Clinical Implications|Future Research|Evidence Quality|Recommendations|Treatment|Diagnosis|Conclusion)$/i) && // Exact match, not part of sentence
          i + 1 < lines.length && // There's content after it
          lines[i + 1].trim().length > 20 // The next line has substantial content
        );
        
        if (isActualHeader) {
          // Add the header
          structuredParts.push(`\n## ${line}\n`);
          i++;
        } else {
          // This is regular content - group sentences into paragraphs
          let paragraph = line;
          i++;
          
          // Continue building the paragraph until we hit a clear break or header
          while (i < lines.length) {
            const nextLine = lines[i].trim();
            if (!nextLine) {
              i++;
              break; // Empty line indicates paragraph break
            }
            
            // Check if next line is a header
            const nextIsHeader = (
              nextLine.length < 100 &&
              nextLine.match(/^(Research Summary|Key Findings|Clinical Implications|Future Research|Evidence Quality|Recommendations|Treatment|Diagnosis|Conclusion)$/i) &&
              i + 1 < lines.length &&
              lines[i + 1].trim().length > 20
            );
            
            if (nextIsHeader) {
              break; // Stop building paragraph, next line is a header
            }
            
            // Add to current paragraph
            paragraph += ' ' + nextLine;
            i++;
            
            // Break paragraph if it gets too long
            if (paragraph.length > 500) {
              break;
            }
          }
          
          // Add the completed paragraph
          if (paragraph.trim().length > 30) {
            structuredParts.push(`${paragraph.trim()}\n\n`);
          }
        }
      }
      
      content = structuredParts.join('');
    } else {
      // Fallback: get all text content and try to structure it
      const allText = cleanText(clonedElement.textContent || '');
      if (allText.length > 100) {
        // Simple paragraph splitting
        const sentences = allText.split(/(?<=[.!?])\s+/);
        let currentParagraph = '';
        const paragraphs: string[] = [];
        
        for (const sentence of sentences) {
          if (currentParagraph.length + sentence.length < 300) {
            currentParagraph += (currentParagraph ? ' ' : '') + sentence;
          } else {
            if (currentParagraph.trim()) {
              paragraphs.push(currentParagraph.trim() + '\n\n');
            }
            currentParagraph = sentence;
          }
        }
        
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim() + '\n\n');
        }
        
        content = paragraphs.join('');
      }
    }
    
    // Final cleanup
    content = content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
    
    console.log('PDF Debug - Final content length:', content.length);
    console.log('PDF Debug - Content preview:', content.substring(0, 300));
    console.log('PDF Debug - Citations found:', citations.length);
    
    return { content, citations };
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      // Find the element to export
      const element = document.getElementById(contentId);
      if (!element) {
        throw new Error('Element not found for PDF export');
      }

      // Extract text content and citations with proper structure
      const { content, citations } = extractStructuredContent(element);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      
      // Add header with better styling
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 102, 204);
      pdf.text('Medical Research Summary', margin, yPosition);
      yPosition += 12;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Note: Citation titles are clickable links to source papers', margin, yPosition);
      yPosition += 8;
      
      // Add a separator line
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
      
      // Add main content with simplified formatting
      if (content && content.trim()) {
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        // Split content into lines and process each one
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Check if we need a new page first
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin + 15;
          }
          
          // Handle headers
          if (trimmedLine.startsWith('## ')) {
            // Section header
            yPosition += 8; // Add space before header
            
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 51, 153);
            pdf.text(trimmedLine.substring(3), margin, yPosition);
            yPosition += 12;
            
            // Reset to normal text
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            
          } else if (trimmedLine.startsWith('• ') || trimmedLine.match(/^\d+\.\s/)) {
            // List items
            const wrappedLines = pdf.splitTextToSize(trimmedLine, maxWidth - 10);
            for (let j = 0; j < wrappedLines.length; j++) {
              if (yPosition > pageHeight - 25) {
                pdf.addPage();
                yPosition = margin + 15;
              }
              
              if (j === 0) {
                pdf.text(wrappedLines[j], margin + 5, yPosition);
              } else {
                pdf.text(wrappedLines[j], margin + 15, yPosition);
              }
              yPosition += 5;
            }
            yPosition += 2; // Small gap after list items
            
          } else if (trimmedLine.length > 10) {
            // Regular paragraph content
            const wrappedLines = pdf.splitTextToSize(trimmedLine, maxWidth);
            
            for (const wrappedLine of wrappedLines) {
              if (yPosition > pageHeight - 25) {
                pdf.addPage();
                yPosition = margin + 15;
              }
              
              pdf.text(wrappedLine, margin, yPosition);
              yPosition += 5;
            }
            
            // Add paragraph spacing
            yPosition += 4;
          }
        }
      }
      
      // Add citations section with improved formatting
      if (citations.length > 0) {
        // Add extra space before citations
        yPosition += 15;
        
        // Check if we need a new page for citations
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin + 15;
        }
        
        // Citations header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 102, 204);
        pdf.text('References', margin, yPosition);
        yPosition += 8;
        
        // Add a line separator
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        citations.forEach((citation, index) => {
          // Check if we need a new page (estimate 4-5 lines per citation)
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin + 15;
          }
          
          const citationStartY = yPosition;
          
          // Citation number with better styling
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 102, 204);
          pdf.text(`[${index + 1}]`, margin, yPosition);
          
          // Citation title (clickable if URL exists)
          pdf.setFont('helvetica', 'bold');
          
          const cleanTitle = cleanText(citation.title);
          const titleText = cleanTitle.length > 90 ? 
            cleanTitle.substring(0, 90) + '...' : cleanTitle;
          const titleLines = pdf.splitTextToSize(titleText, maxWidth - 15);
          
          let titleY = yPosition;
          for (let i = 0; i < titleLines.length; i++) {
            if (citation.url) {
              // Make all title lines clickable and blue
              pdf.setTextColor(0, 102, 204);
              pdf.text(titleLines[i], margin + 15, titleY);
              
              // Add clickable link for each line
              const lineWidth = pdf.getTextWidth(titleLines[i]);
              pdf.link(margin + 15, titleY - 3, lineWidth, 5, { url: citation.url });
            } else {
              // No URL - use black text
              pdf.setTextColor(0, 0, 0);
              pdf.text(titleLines[i], margin + 15, titleY);
            }
            titleY += 4;
          }
          
          yPosition = titleY + 2;
          
          // Authors
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          const cleanAuthors = citation.authors.map(author => cleanText(author));
          const authorsText = cleanAuthors.slice(0, 3).join(', ') + 
            (cleanAuthors.length > 3 ? ', et al.' : '');
          const authorLines = pdf.splitTextToSize(authorsText, maxWidth - 15);
          for (const line of authorLines) {
            pdf.text(line, margin + 15, yPosition);
            yPosition += 4;
          }
          
          // Journal and year
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          const cleanJournal = cleanText(citation.journal);
          const journalText = `${cleanJournal} (${citation.year})`;
          pdf.text(journalText, margin + 15, yPosition);
          yPosition += 4;
          
          // DOI/PMID
          if (citation.doi || citation.pmid) {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(120, 120, 120);
            const idText = citation.doi ? `DOI: ${cleanText(citation.doi)}` : `PMID: ${cleanText(citation.pmid || '')}`;
            pdf.text(idText, margin + 15, yPosition);
            yPosition += 4;
          }
          
          yPosition += 8; // Space between citations
        });
      }
      
      // Add footer with page numbers and generation info
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        
        // Page number
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 5);
        
        // Footer line
        pdf.setLineWidth(0.2);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      }

      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`${fileName}-${timestamp}.pdf`);

    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 text-xs ${className}`}
    >
      {isExporting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <FileDown className="h-3 w-3" />
      )}
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  );
}

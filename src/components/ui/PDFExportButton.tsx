import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePDFExport } from "@/hooks/usePDFExport";
import { type ResearchPaper } from "@/lib/types/research";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PDFExportButtonProps {
  title: string;
  content?: string;
  papers?: ResearchPaper[];
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function PDFExportButton({
  title,
  content = '',
  papers = [],
  variant = "outline",
  size = "default",
  className = "",
  disabled = false,
  showIcon = true,
  children,
}: PDFExportButtonProps) {
  const { exportToPDF, isGenerating, error } = usePDFExport();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error("Failed to generate PDF", {
        description: error.message,
      });
    }
  }, [error]);

  const handleExport = async () => {
    if (!isMounted) return;
    
    try {
      // Default to research mode if content is provided, otherwise source mode
      const mode = content ? 'research' : 'source';
      const success = await exportToPDF({
        mode: mode as 'research' | 'source',
        title,
        content,
        papers,
        includeAbstracts: true,
        includeReferences: true,
        includeSourceInfo: true,
      });

      if (success) {
        toast.success("PDF exported successfully");
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export PDF");
    }
  };

  // Don't render anything during SSR to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={handleExport}
      disabled={disabled || isGenerating}
    >
      {showIcon && <Download className="h-4 w-4" />}
      {children || (isGenerating ? 'Generating...' : 'Export to PDF')}
    </Button>
  );
}

// Specialized button for research results
export function ResearchPDFButton({
  query,
  content,
  papers = [],
  ...props
}: Omit<PDFExportButtonProps, 'title'> & {
  query: string;
  content: string;
  papers: ResearchPaper[];
}) {
  return (
    <PDFExportButton
      title={`Research: ${query}`}
      content={content}
      papers={papers}
      {...props}
    >
      <Download className="h-4 w-4" />
      {props.children || 'Export Research'}
    </PDFExportButton>
  );
}

// Specialized button for source results
export function SourcePDFButton({
  source,
  query,
  papers = [],
  ...props
}: Omit<PDFExportButtonProps, 'title'> & {
  source: string;
  query: string;
  papers: ResearchPaper[];
}) {
  return (
    <PDFExportButton
      title={`${source} Results: ${query}`}
      papers={papers}
      content="" // Empty content forces source mode
      {...props}
    >
      <Download className="h-4 w-4" />
      {props.children || `Export ${source} Results`}
    </PDFExportButton>
  );
}

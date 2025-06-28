"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Message, type Citation } from "@/lib/types/chat";
import { ExportUtils, type ExportData } from "@/lib/utils/export";
import { Download, Copy, FileText, FileDown, Check } from "lucide-react";

interface ExportOptionsProps {
  messages?: Message[];
  citations?: Citation[];
  query?: string;
  response?: string;
}

export function ExportOptions({ messages, citations, query, response }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const exportData: ExportData = {
        conversation: messages,
        citations: citations,
        query: query,
        response: response,
        timestamp: new Date(),
      };

      await ExportUtils.exportToPDF(exportData, "MedGPT Scholar - Medical Research");
    } catch (error) {
      console.error("Export failed:", error);
      // Could add toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = () => {
    const exportData: ExportData = {
      conversation: messages,
      citations: citations,
      query: query,
      response: response,
      timestamp: new Date(),
    };

    const textContent = ExportUtils.exportToText(exportData);
    ExportUtils.downloadTextFile(textContent);
  };

  const handleCopyToClipboard = async () => {
    const exportData: ExportData = {
      conversation: messages,
      citations: citations,
      query: query,
      response: response,
      timestamp: new Date(),
    };

    const textContent = ExportUtils.exportToText(exportData);
    
    try {
      await ExportUtils.copyToClipboard(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const hasCitations = citations && citations.length > 0;
  const hasContent = (messages && messages.length > 0) || (query && response);

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export Options
      </h3>
      
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs h-8"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          <FileDown className="h-3 w-3 mr-2" />
          {isExporting ? "Exporting..." : "Export as PDF"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs h-8"
          onClick={handleExportText}
        >
          <FileText className="h-3 w-3 mr-2" />
          Export as Text
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs h-8"
          onClick={handleCopyToClipboard}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-2" />
              Copy to Clipboard
            </>
          )}
        </Button>
      </div>

      {hasCitations && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Includes {citations?.length} citation{citations?.length !== 1 ? 's' : ''} with complete metadata
          </p>
        </div>
      )}
    </Card>
  );
}

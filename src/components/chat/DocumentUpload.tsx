"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react";

interface DocumentUploadProps {
  onDocumentAnalyzed: (analysis: string, filename: string) => void;
}

export function DocumentUpload({ onDocumentAnalyzed }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, Word document, Excel file, or text file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError(null);
    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', uploadedFile);

      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze document');
      }

      const data = await response.json();
      onDocumentAnalyzed(data.analysis, uploadedFile.name);
      
      // Reset state
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze document');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-4 mb-4 border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
      <div className="text-center">
        <div className="mb-4">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-1">Upload Medical Document</h3>
          <p className="text-sm text-muted-foreground">
            Upload lab results, medical reports, research papers, or clinical notes for AI analysis
          </p>
        </div>

        {!uploadedFile ? (
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
              className="hidden"
            />
            <Button
              onClick={triggerFileSelect}
              variant="outline"
              className="mb-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <p className="text-xs text-muted-foreground">
              Supports PDF, Word, Excel, and text files (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{uploadedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing Document...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p className="mb-1">
            <strong>Supported formats:</strong> PDF, Word (.doc/.docx), Excel (.xls/.xlsx), Text (.txt), CSV
          </p>
          <p>
            <strong>Use cases:</strong> Lab results, medical reports, research papers, clinical guidelines, patient notes
          </p>
        </div>
      </div>
    </Card>
  );
}

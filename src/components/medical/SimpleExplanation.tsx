"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleExplanationProps {
  medicalTerm: string;
  explanation: string;
  className?: string;
}

export function SimpleExplanation({ medicalTerm, explanation, className }: SimpleExplanationProps) {
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('SimpleExplanation rendering:', { medicalTerm, explanation: explanation.substring(0, 100) + '...' });
  }

  // Clean up the explanation text
  const cleanExplanation = explanation
    .replace(/\*\*Simple Explanation:\*\*/gi, '') // Remove the header if it's included
    .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim whitespace
    .replace(/\n\s*\n/g, '\n\n'); // Normalize line breaks

  return (
    <div className={cn("my-4", className)}>
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800">Simple Explanation: {medicalTerm}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {cleanExplanation}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

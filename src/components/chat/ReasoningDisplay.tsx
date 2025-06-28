"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, AlertTriangle, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ReasoningStep {
  step: number;
  title: string;
  process: string;
  evidence: string[];
  confidence: number;
  uncertainties: string[];
  criticalQuestions: string[];
}

interface ReasoningDisplayProps {
  steps: ReasoningStep[];
  mode: 'research' | 'doctor' | 'source-finder';
  isVisible?: boolean;
}

export function ReasoningDisplay({ steps, mode, isVisible = true }: ReasoningDisplayProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1])); // First step expanded by default

  if (!isVisible || steps.length === 0) {
    return null;
  }

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600 bg-green-50";
    if (confidence >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'doctor': return "🩺";
      case 'research': return "🔬";
      case 'source-finder': return "📚";
      default: return "🧠";
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'doctor': return "Clinical Reasoning";
      case 'research': return "Research Analysis";
      case 'source-finder': return "Source Analysis";
      default: return "Deep Thinking";
    }
  };

  return (
    <Card className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-semibold text-blue-800">
          {getModeIcon()} Deep Intelligence: {getModeTitle()}
        </span>
        <Badge variant="secondary" className="ml-auto">
          {steps.length} reasoning steps
        </Badge>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const isExpanded = expandedSteps.has(step.step);
          
          return (
            <div key={step.step} className="bg-white rounded-lg border border-blue-100">
              <button
                onClick={() => toggleStep(step.step)}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-blue-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    Step {step.step}
                  </Badge>
                  <span className="font-medium text-gray-800">{step.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getConfidenceColor(step.confidence)}`}>
                    {step.confidence}% confidence
                  </Badge>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-gray-700 mb-2">Reasoning Process:</h4>
                    <p className="text-sm text-gray-600">{step.process}</p>
                  </div>

                  {step.evidence.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Supporting Evidence:
                      </h4>
                      <ul className="text-sm space-y-1">
                        {step.evidence.map((evidence, idx) => (
                          <li key={idx} className="text-gray-600 pl-2 border-l-2 border-green-200">
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.uncertainties.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Uncertainties & Limitations:
                      </h4>
                      <ul className="text-sm space-y-1">
                        {step.uncertainties.map((uncertainty, idx) => (
                          <li key={idx} className="text-gray-600 pl-2 border-l-2 border-yellow-200">
                            {uncertainty}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.criticalQuestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <HelpCircle className="h-4 w-4 text-blue-500" />
                        Critical Questions:
                      </h4>
                      <ul className="text-sm space-y-1">
                        {step.criticalQuestions.map((question, idx) => (
                          <li key={idx} className="text-gray-600 pl-2 border-l-2 border-blue-200">
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
        <Brain className="h-3 w-3" />
        Deep thinking analysis helps ensure thorough, evidence-based reasoning
      </div>
    </Card>
  );
}

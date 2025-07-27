import React from 'react';
import { type Message, type Citation } from "@/lib/types/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ResearchSummaryTableProps {
  message: Message;
  userQuery?: string;
}

export function ResearchSummaryTable({ message, userQuery }: ResearchSummaryTableProps) {
  // Only show table for assistant messages with citations
  if (message.role !== 'assistant' || !message.citations || message.citations.length === 0) {
    return null;
  }

  const citations = message.citations;
  
  // Extract metadata from the message
  const extractConfidence = (): { level: string; percentage: number | null } => {
    const multiAgentConfidence = message.confidence;
    const confidenceMatch = message.content.match(/confidence[:\s]*(\d+)%/i) || 
                           message.content.match(/(\d+)%\s*confidence/i);
    
    const confidence = multiAgentConfidence || (confidenceMatch ? parseInt(confidenceMatch[1]) : null);
    
    if (confidence !== null) {
      if (confidence >= 85) return { level: "High Confidence", percentage: confidence };
      if (confidence >= 70) return { level: "Moderate Confidence", percentage: confidence };
      if (confidence >= 55) return { level: "Low Confidence", percentage: confidence };
      return { level: "Very Low Confidence", percentage: confidence };
    }
    return { level: "Not Available", percentage: null };
  };

  const extractStudyTypes = (): string[] => {
    const types = new Set<string>();
    citations.forEach(citation => {
      if (citation.studyType) {
        types.add(citation.studyType);
      }
    });
    return Array.from(types);
  };

  const extractDatabases = (): string[] => {
    const sources = new Set<string>();
    citations.forEach(citation => {
      if (citation.source) {
        sources.add(citation.source);
      }
    });
    return Array.from(sources);
  };

  const getRecentStudies = (): number => {
    return citations.filter(citation => {
      const year = typeof citation.year === 'string' ? parseInt(citation.year) : citation.year;
      return year && year >= 2020;
    }).length;
  };

  const extractKeyFindings = (): string => {
    // Extract key findings from the AI response
    const content = message.content.toLowerCase();
    if (content.includes('key findings')) {
      const keyFindingsMatch = message.content.match(/📋 key findings[:\s]*(.*?)(?=\n\s*[📊⚖️🔍🎯]|$)/i);
      if (keyFindingsMatch) {
        return keyFindingsMatch[1].trim().substring(0, 200) + '...';
      }
    }
    
    // Fallback: extract first significant finding
    const sentences = message.content.split(/[.!?]+/);
    const meaningfulSentence = sentences.find(s => 
      s.length > 50 && 
      (s.includes('study') || s.includes('research') || s.includes('evidence') || s.includes('suggest'))
    );
    
    return meaningfulSentence ? meaningfulSentence.trim().substring(0, 200) + '...' : 'See detailed analysis above';
  };

  const extractRecommendations = (): string => {
    const content = message.content;
    if (content.includes('Clinical Implications') || content.includes('clinical implications')) {
      const clinicalMatch = content.match(/⚖️ clinical implications[:\s]*(.*?)(?=\n\s*[📊📋🔍🎯]|$)/i);
      if (clinicalMatch) {
        return clinicalMatch[1].trim().substring(0, 200) + '...';
      }
    }
    
    // Look for recommendation patterns
    const recMatch = content.match(/(recommend|suggest|should|evidence suggests)[^.]*[.]/i);
    return recMatch ? recMatch[0].substring(0, 200) + '...' : 'See clinical implications above';
  };

  const getRelevanceWarnings = (): Array<{title: string, warning: string, category: string}> => {
    const warnings: Array<{title: string, warning: string, category: string}> = [];
    
    citations.forEach(citation => {
      if (citation.relevanceWarning && citation.relevanceWarning.trim() !== '') {
        warnings.push({
          title: citation.title,
          warning: citation.relevanceWarning,
          category: citation.relevanceCategory || 'Unknown'
        });
      }
    });
    
    return warnings;
  };

  const confidence = extractConfidence();
  const studyTypes = extractStudyTypes();
  const databases = extractDatabases();
  const recentStudies = getRecentStudies();
  const keyFindings = extractKeyFindings();
  const recommendations = extractRecommendations();
  const relevanceWarnings = getRelevanceWarnings();

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "High Confidence": return "bg-green-100 text-green-800 border-green-200";
      case "Moderate Confidence": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Low Confidence": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Very Low Confidence": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const tableData = [
    { label: "Research Query", value: userQuery || "Medical research query", icon: "🔍" },
    { 
      label: "Evidence Level", 
      value: (
        <Badge className={`${getConfidenceColor(confidence.level)} border`}>
          {confidence.level} {confidence.percentage ? `(${confidence.percentage}%)` : ''}
        </Badge>
      ), 
      icon: "📊" 
    },
    { label: "Citations Found", value: `${citations.length} papers`, icon: "📚" },
    { label: "Databases Used", value: databases.join(", ") || "Multiple sources", icon: "🗄️" },
    { label: "Recent Studies (2020+)", value: `${recentStudies} papers`, icon: "📅" },
    { label: "Study Types", value: studyTypes.join(", ") || "Mixed methodology", icon: "🧪" },
    { label: "Key Findings", value: keyFindings, icon: "🎯" },
    { label: "Clinical Recommendations", value: recommendations, icon: "⚖️" },
    { label: "Analysis Generated", value: new Date().toLocaleString(), icon: "🕒" }
  ];

  return (
    <Card className="mx-3 sm:mx-6 mb-4 border border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-blue-600">📋</span>
            Research Summary
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
                  <td className="px-4 py-3 font-medium text-gray-700 border-b border-gray-100 w-1/3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{row.icon}</span>
                      {row.label}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 border-b border-gray-100">
                    {typeof row.value === 'string' ? (
                      <span className="leading-relaxed">{row.value}</span>
                    ) : (
                      row.value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Relevance Warnings Section */}
        {relevanceWarnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              ⚠️ Citation Quality Notices
            </h4>
            <div className="space-y-2">
              {relevanceWarnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex-shrink-0 text-amber-600 mt-0.5">
                    {warning.category === 'Off-topic' ? '🚫' : '⚠️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-800 truncate">
                      {warning.title.length > 60 ? `${warning.title.substring(0, 60)}...` : warning.title}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      <Badge className="bg-amber-100 text-amber-800 text-xs mr-2">
                        {warning.category}
                      </Badge>
                      {warning.warning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

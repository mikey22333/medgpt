"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, BookOpen, FileText, Microscope, Heart, Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type Citation } from "@/lib/types/chat";

interface SourceDiversityTrackerProps {
  citations: Citation[];
  className?: string;
}

export function SourceDiversityTracker({ citations, className }: SourceDiversityTrackerProps) {
  // Count sources by type
  const sourceStats = citations.reduce((acc, citation) => {
    const source = citation.source || 'Unknown';
    const studyType = citation.studyType || 'Unknown';
    
    acc.sources[source] = (acc.sources[source] || 0) + 1;
    acc.studyTypes[studyType] = (acc.studyTypes[studyType] || 0) + 1;
    
    if (citation.isGuideline) acc.guidelines++;
    if (citation.studyType?.includes('Meta-Analysis') || citation.studyType?.includes('Systematic Review')) {
      acc.highQuality++;
    }
    
    return acc;
  }, {
    sources: {} as Record<string, number>,
    studyTypes: {} as Record<string, number>,
    guidelines: 0,
    highQuality: 0
  });

  const totalCitations = citations.length;
  const diversityScore = Object.keys(sourceStats.sources).length;
  const qualityScore = Math.round((sourceStats.highQuality / totalCitations) * 100);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'PubMed': return <Database className="h-4 w-4 text-blue-600" />;
      case 'FDA Drug Labels': 
      case 'FDA FAERS': 
      case 'FDA Recalls': return <Shield className="h-4 w-4 text-red-600" />;
      case 'Europe PMC': return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'Semantic Scholar': return <Microscope className="h-4 w-4 text-purple-600" />;
      case 'Clinical Guidelines': return <Heart className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDiversityIcon = (score: number) => {
    if (score >= 4) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 2) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getQualityIcon = (score: number) => {
    if (score >= 50) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 25) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getDiversityColor = (score: number) => {
    if (score >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 2) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getQualityColor = (score: number) => {
    if (score >= 50) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 25) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <Card className={`border-l-4 border-l-purple-500 bg-purple-50/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5 text-purple-600" />
          <span className="text-purple-800">Evidence Source Diversity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white rounded border">
            <div className="text-lg font-bold text-gray-900">{totalCitations}</div>
            <div className="text-xs text-gray-600">Total Sources</div>
          </div>
          <div className={`p-3 rounded border ${getDiversityColor(diversityScore)}`}>
            <div className="flex items-center justify-center gap-1">
              {getDiversityIcon(diversityScore)}
              <span className="text-lg font-bold">{diversityScore}</span>
            </div>
            <div className="text-xs">Databases</div>
          </div>
          <div className={`p-3 rounded border ${getQualityColor(qualityScore)}`}>
            <div className="flex items-center justify-center gap-1">
              {getQualityIcon(qualityScore)}
              <span className="text-lg font-bold">{qualityScore}%</span>
            </div>
            <div className="text-xs">High Quality</div>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Source Distribution</h4>
          {Object.entries(sourceStats.sources).map(([source, count]) => {
            const percentage = Math.round((count / totalCitations) * 100);
            return (
              <div key={source} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(source)}
                    <span>{source}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {count} ({percentage}%)
                  </Badge>
                </div>
                <Progress value={percentage} className="h-1" />
              </div>
            );
          })}
        </div>

        {/* Study Type Quality */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Evidence Quality</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between p-2 bg-white rounded border">
              <span>Guidelines:</span>
              <Badge variant="outline" className="text-xs">
                {sourceStats.guidelines}
              </Badge>
            </div>
            <div className="flex justify-between p-2 bg-white rounded border">
              <span>High Quality:</span>
              <Badge variant="outline" className="text-xs">
                {sourceStats.highQuality}
              </Badge>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-1">Recommendations:</div>
          <div className="text-xs text-blue-700 space-y-1">
            {diversityScore < 3 && (
              <div>• Consider expanding search to include more databases</div>
            )}
            {qualityScore < 25 && (
              <div>• Look for more systematic reviews or meta-analyses</div>
            )}
            {sourceStats.guidelines === 0 && (
              <div>• Include clinical practice guidelines for treatment recommendations</div>
            )}
            {diversityScore >= 3 && qualityScore >= 50 && (
              <div>✅ Excellent source diversity and quality!</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// We also need to create the Progress component if it doesn't exist
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full ${className}`}>
      <div 
        className="bg-blue-600 h-full rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

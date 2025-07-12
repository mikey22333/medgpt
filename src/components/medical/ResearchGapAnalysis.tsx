import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BookOpen, TrendingUp, Search } from "lucide-react";

interface ResearchGapAnalysisProps {
  content: string;
  gaps: string[];
}

export function ResearchGapAnalysis({ content, gaps }: ResearchGapAnalysisProps) {
  
  const detectMissingLandmarkTrials = (content: string) => {
    const lowerContent = content.toLowerCase();
    const missingTrials = [];

    // CAC and Imaging Trials
    if ((lowerContent.includes('cac') || lowerContent.includes('calcium') || lowerContent.includes('stress test')) && 
        !lowerContent.includes('mesa')) {
      missingTrials.push({
        name: "MESA (Multi-Ethnic Study of Atherosclerosis)",
        pmid: "15851644",
        description: "Landmark study establishing CAC scoring for cardiovascular risk prediction",
        relevance: "Essential for CAC risk stratification and prognostic value"
      });
    }

    if ((lowerContent.includes('stress test') || lowerContent.includes('coronary ct')) && 
        !lowerContent.includes('promise')) {
      missingTrials.push({
        name: "PROMISE (Prospective Multicenter Imaging Study)",
        pmid: "25773919", 
        description: "Major RCT comparing coronary CTA vs functional testing",
        relevance: "Direct comparison of CAC/CCTA vs stress testing strategies"
      });
    }

    if ((lowerContent.includes('coronary ct') || lowerContent.includes('chest pain')) && 
        !lowerContent.includes('scot-heart')) {
      missingTrials.push({
        name: "SCOT-HEART (Scottish Computed Tomography of the Heart)",
        pmid: "25788432",
        description: "Randomized trial of CT coronary angiography in suspected CAD", 
        relevance: "Clinical outcomes with CT vs standard care in stable chest pain"
      });
    }

    if (lowerContent.includes('coronary') && !lowerContent.includes('confirm')) {
      missingTrials.push({
        name: "CONFIRM Registry",
        pmid: "21474560",
        description: "Large international registry of coronary CT angiography outcomes",
        relevance: "Real-world prognostic data for coronary CTA"
      });
    }

    return missingTrials;
  };

  const detectResearchGaps = (content: string) => {
    const detectedGaps = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('cac') && lowerContent.includes('stress') && 
        !lowerContent.includes('direct comparison')) {
      detectedGaps.push({
        type: "Comparative Effectiveness",
        description: "Limited head-to-head RCTs comparing CAC vs stress testing",
        impact: "High",
        suggestion: "Need for prospective randomized trials comparing diagnostic strategies"
      });
    }

    if (lowerContent.includes('cost') && !lowerContent.includes('cost-effectiveness')) {
      detectedGaps.push({
        type: "Health Economics", 
        description: "Insufficient cost-effectiveness analyses",
        impact: "Medium",
        suggestion: "Economic evaluations needed for healthcare decision-making"
      });
    }

    if (!lowerContent.includes('meta-analysis') && !lowerContent.includes('systematic review')) {
      detectedGaps.push({
        type: "Evidence Synthesis",
        description: "Lack of high-quality systematic reviews or meta-analyses",
        impact: "High", 
        suggestion: "Comprehensive meta-analysis of available evidence needed"
      });
    }

    return detectedGaps;
  };

  const missingTrials = detectMissingLandmarkTrials(content);
  const researchGaps = detectResearchGaps(content);

  if (missingTrials.length === 0 && researchGaps.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="text-orange-800">Research Gap Analysis</span>
        </CardTitle>
        <p className="text-sm text-orange-700">
          Identifying missing landmark studies and evidence gaps in the current analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Missing Landmark Trials */}
        {missingTrials.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-orange-800">
              <BookOpen className="h-4 w-4" />
              Missing Landmark Trials
            </h4>
            <div className="space-y-3">
              {missingTrials.map((trial, index) => (
                <div key={index} className="p-3 bg-white border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm text-gray-900">{trial.name}</h5>
                    <Badge variant="outline" className="text-xs bg-orange-100 border-orange-300">
                      PMID: {trial.pmid}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{trial.description}</p>
                  <p className="text-xs text-orange-700 font-medium">
                    <strong>Relevance:</strong> {trial.relevance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Gaps */}
        {researchGaps.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-orange-800">
              <Search className="h-4 w-4" />
              Evidence Gaps Identified
            </h4>
            <div className="space-y-3">
              {researchGaps.map((gap, index) => (
                <div key={index} className="p-3 bg-white border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm text-gray-900">{gap.type}</h5>
                    <Badge 
                      variant={gap.impact === 'High' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {gap.impact} Impact
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{gap.description}</p>
                  <p className="text-xs text-orange-700">
                    <strong>Recommendation:</strong> {gap.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-4 w-4" />
            Recommendations for Complete Analysis
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Include major cardiovascular imaging trials (MESA, PROMISE, SCOT-HEART)</li>
            <li>• Synthesize evidence from systematic reviews and meta-analyses</li>
            <li>• Consider comparative effectiveness and cost-effectiveness data</li>
            <li>• Evaluate real-world registry data alongside RCT evidence</li>
            <li>• Address patient-specific factors and risk stratification</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BookOpen, Heart, TrendingUp } from "lucide-react";

interface MissingLandmarkTrialsProps {
  content: string;
}

export function MissingLandmarkTrials({ content }: MissingLandmarkTrialsProps) {
  
  const detectMissingCACardiology = (content: string) => {
    const lowerContent = content.toLowerCase();
    const missingTrials = [];

    // Check for CAC vs stress testing queries
    if ((lowerContent.includes('cac') || lowerContent.includes('calcium') || lowerContent.includes('stress test')) && 
        !lowerContent.includes('mesa')) {
      missingTrials.push({
        name: "MESA (Multi-Ethnic Study of Atherosclerosis)",
        pmid: "18305265",
        citation: "Detrano R, Guerci AD, Carr JJ, et al. Coronary calcium as a predictor of coronary events in four racial or ethnic groups. N Engl J Med. 2008;358(13):1336-45.",
        keyFindings: [
          "CAC score superior to traditional risk factors for predicting coronary events",
          "CAC = 0 associated with very low 10-year event rate (0.4%)",
          "Each doubling of CAC score increased event risk by 15-35%"
        ],
        clinicalRelevance: "Landmark study establishing CAC scoring for cardiovascular risk prediction in asymptomatic patients"
      });
    }

    if ((lowerContent.includes('stress test') || lowerContent.includes('coronary ct') || lowerContent.includes('cac')) && 
        !lowerContent.includes('promise')) {
      missingTrials.push({
        name: "PROMISE (Prospective Multicenter Imaging Study)",
        pmid: "25773919", 
        citation: "Douglas PS, Hoffmann U, Patel MR, et al. Outcomes of anatomical versus functional testing for coronary artery disease. N Engl J Med. 2015;372(14):1291-300.",
        keyFindings: [
          "No difference in primary endpoint between anatomical vs functional testing",
          "Anatomical testing led to more catheterizations but fewer normal results",
          "Similar safety profile between CAC/CCTA and stress testing strategies"
        ],
        clinicalRelevance: "Only major RCT directly comparing anatomical (CAC/CCTA) vs functional (stress) testing strategies"
      });
    }

    if ((lowerContent.includes('coronary ct') || lowerContent.includes('chest pain')) && 
        !lowerContent.includes('scot-heart')) {
      missingTrials.push({
        name: "SCOT-HEART (Scottish Computed Tomography of the Heart)",
        pmid: "30145972",
        citation: "Newby DE, Adamson PD, Berry C, et al. Coronary CT angiography and 5-year risk of myocardial infarction. N Engl J Med. 2018;379(10):924-933.",
        keyFindings: [
          "41% reduction in coronary heart disease death or MI at 5 years",
          "CT angiography changed management in 25% of patients",
          "Improved diagnostic certainty and treatment optimization"
        ],
        clinicalRelevance: "Demonstrated long-term clinical benefit of CT angiography in stable chest pain patients"
      });
    }

    return missingTrials;
  };

  const detectMissingGuidelines = (content: string) => {
    const lowerContent = content.toLowerCase();
    const missingGuidelines = [];

    if (lowerContent.includes('cac') && !lowerContent.includes('acc/aha')) {
      missingGuidelines.push({
        name: "2019 ACC/AHA Primary Prevention Guidelines",
        recommendation: "CAC scoring reasonable for risk assessment in adults 40-75 years at intermediate risk",
        classLevel: "Class IIa (Moderate), Level of Evidence B-NR",
        clinicalImpact: "First major guideline to formally endorse CAC for clinical decision-making"
      });
    }

    if ((lowerContent.includes('stress test') || lowerContent.includes('coronary ct')) && !lowerContent.includes('esc')) {
      missingGuidelines.push({
        name: "2019 ESC Guidelines on Chronic Coronary Syndromes",
        recommendation: "CT angiography as first-line test for suspected CAD in patients with low-intermediate pretest probability",
        classLevel: "Class I (Strong), Level of Evidence A",
        clinicalImpact: "Established CT angiography as preferred initial test over stress testing in many scenarios"
      });
    }

    return missingGuidelines;
  };

  const missingTrials = detectMissingCACardiology(content);
  const missingGuidelines = detectMissingGuidelines(content);

  if (missingTrials.length === 0 && missingGuidelines.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-red-200 bg-red-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">Missing Landmark Evidence</span>
        </CardTitle>
        <p className="text-sm text-red-700">
          Critical studies and guidelines not referenced in the current analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Missing Landmark Trials */}
        {missingTrials.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-red-800">
              <BookOpen className="h-4 w-4" />
              Essential Landmark Trials Missing
            </h4>
            <div className="space-y-4">
              {missingTrials.map((trial, index) => (
                <div key={index} className="p-4 bg-white border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm text-gray-900">{trial.name}</h5>
                    <Badge variant="outline" className="text-xs bg-red-100 border-red-300">
                      PMID: {trial.pmid}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 italic">{trial.citation}</p>
                  
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-800 mb-1">Key Findings:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {trial.keyFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-red-600 font-bold">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-800">
                      <strong>Clinical Relevance:</strong> {trial.clinicalRelevance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Guidelines */}
        {missingGuidelines.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-red-800">
              <Heart className="h-4 w-4" />
              Major Guidelines Not Referenced
            </h4>
            <div className="space-y-3">
              {missingGuidelines.map((guideline, index) => (
                <div key={index} className="p-3 bg-white border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm text-gray-900">{guideline.name}</h5>
                    <Badge variant="secondary" className="text-xs">
                      {guideline.classLevel.split(',')[0]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">
                    <strong>Recommendation:</strong> {guideline.recommendation}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    <strong>Evidence Level:</strong> {guideline.classLevel}
                  </p>
                  <p className="text-xs text-red-700">
                    <strong>Impact:</strong> {guideline.clinicalImpact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Assessment */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-4 w-4" />
            Impact on Clinical Decision-Making
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>Evidence Quality:</strong> Analysis incomplete without landmark trials</li>
            <li>• <strong>Clinical Guidance:</strong> Missing authoritative guideline recommendations</li>
            <li>• <strong>Risk Stratification:</strong> Incomplete comparison of diagnostic strategies</li>
            <li>• <strong>Patient Care:</strong> Suboptimal guidance for clinical decision-making</li>
          </ul>
        </div>

        {/* Recommendation */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>📋 Recommendation:</strong> Include these landmark studies and guidelines for a complete evidence-based analysis of CAC vs stress testing strategies.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}

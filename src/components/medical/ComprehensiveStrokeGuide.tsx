"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Stethoscope, Target, Activity, Utensils, Droplets, Pill } from "lucide-react";

interface ComprehensiveStrokeGuideProps {
  missingInterventions?: string[];
  className?: string;
}

export function ComprehensiveStrokeGuide({ missingInterventions = [], className }: ComprehensiveStrokeGuideProps) {
  const interventionCategories = [
    {
      category: "Anticoagulation",
      icon: <Droplets className="h-5 w-5 text-red-600" />,
      indication: "Atrial fibrillation, cardioembolic stroke",
      medications: ["Apixaban 5mg BID", "Rivaroxaban 20mg daily", "Dabigatran 150mg BID", "Warfarin (INR 2-3)"],
      evidence: "ARISTOTLE, RE-LY, ROCKET-AF trials",
      mortalityBenefit: "25-30% stroke reduction vs warfarin",
      guidelines: "AHA/ASA 2021: Class I recommendation",
      color: "border-red-200 bg-red-50",
      isMissing: missingInterventions.includes('anticoagulation')
    },
    {
      category: "Antiplatelet Therapy", 
      icon: <Heart className="h-5 w-5 text-blue-600" />,
      indication: "Non-cardioembolic stroke, atherothrombotic",
      medications: ["Aspirin 75-100mg daily", "Clopidogrel 75mg daily", "Aspirin + Dipyridamole"],
      evidence: "CAPRIE, ESPS-2, MATCH trials",
      mortalityBenefit: "15-20% recurrence reduction",
      guidelines: "AHA/ASA 2021: First-line for non-cardioembolic",
      color: "border-blue-200 bg-blue-50",
      isMissing: missingInterventions.includes('antiplatelet')
    },
    {
      category: "Lipid Lowering",
      icon: <Pill className="h-5 w-5 text-green-600" />,
      indication: "All ischemic stroke patients",
      medications: ["Atorvastatin 80mg daily", "Rosuvastatin 20mg daily", "Simvastatin 40mg daily"],
      evidence: "SPARCL trial (atorvastatin)",
      mortalityBenefit: "16% stroke reduction + 20% mortality reduction",
      guidelines: "AHA/ASA 2021: High-intensity statin for all",
      color: "border-green-200 bg-green-50",
      isMissing: missingInterventions.includes('lipidLowering')
    },
    {
      category: "Blood Pressure Control",
      icon: <Activity className="h-5 w-5 text-purple-600" />,
      indication: "Most important modifiable risk factor",
      medications: ["ACE inhibitors", "ARBs", "Diuretics", "Calcium channel blockers"],
      evidence: "PROGRESS, PROFESS, SPS3 trials",
      mortalityBenefit: "30-40% stroke reduction with intensive control",
      guidelines: "Target <130/80 mmHg (AHA/ASA 2021)",
      color: "border-purple-200 bg-purple-50",
      isMissing: missingInterventions.includes('bloodPressure')
    },
    {
      category: "Diabetes Management",
      icon: <Target className="h-5 w-5 text-orange-600" />,
      indication: "Diabetic stroke patients (40% of strokes)",
      medications: ["Metformin", "SGLT2 inhibitors", "GLP-1 agonists", "Insulin"],
      evidence: "UKPDS, ADVANCE, Action to Control trials",
      mortalityBenefit: "20-25% vascular event reduction",
      guidelines: "Target HbA1c <7% (ADA/ESC 2020)",
      color: "border-orange-200 bg-orange-50",
      isMissing: missingInterventions.includes('diabetes')
    },
    {
      category: "Lifestyle Interventions",
      icon: <Utensils className="h-5 w-5 text-teal-600" />,
      indication: "Essential for all patients - low cost, high impact",
      medications: ["Smoking cessation", "Mediterranean diet", "Regular exercise", "Weight management"],
      evidence: "PREDIMED, Nurses' Health Study, meta-analyses",
      mortalityBenefit: "50-80% risk reduction with comprehensive approach",
      guidelines: "Class I recommendation all guidelines",
      color: "border-teal-200 bg-teal-50",
      isMissing: missingInterventions.includes('lifestyle')
    },
    {
      category: "PFO Closure",
      icon: <Brain className="h-5 w-5 text-indigo-600" />,
      indication: "Cryptogenic stroke + patent foramen ovale",
      medications: ["Percutaneous device closure", "Continued antiplatelet therapy"],
      evidence: "RESPECT, CLOSE, REDUCE trials",
      mortalityBenefit: "45-60% recurrence reduction vs medical therapy",
      guidelines: "Consider in selected patients <60 years (ESOC 2020)",
      color: "border-indigo-200 bg-indigo-50",
      isMissing: missingInterventions.includes('pfoClousure')
    }
  ];

  return (
    <div className={className}>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
            <Stethoscope className="h-6 w-6" />
            Comprehensive Stroke Prevention: All Intervention Categories
          </CardTitle>
          <p className="text-sm text-blue-700">
            Evidence-based approach addressing all modifiable risk factors
          </p>
          {missingInterventions.length > 0 && (
            <div className="mt-2 p-2 bg-amber-100 border border-amber-300 rounded">
              <p className="text-xs text-amber-800">
                <strong>⚠️ Scope Gap Detected:</strong> Missing coverage of {missingInterventions.length} intervention categories
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {interventionCategories.map((intervention, index) => (
            <Card 
              key={index} 
              className={`${intervention.color} border-2 ${
                intervention.isMissing ? 'border-amber-400 shadow-md' : 'border'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {intervention.icon}
                    <h4 className="font-semibold text-sm">{intervention.category}</h4>
                    {intervention.isMissing && (
                      <Badge className="bg-amber-500 text-white text-xs">Missing</Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {intervention.mortalityBenefit}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{intervention.indication}</p>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Medications/Interventions:</p>
                  <div className="flex flex-wrap gap-1">
                    {intervention.medications.map((med, i) => (
                      <Badge key={i} className="text-xs bg-green-100 text-green-800 border-green-300">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Key Evidence: </span>
                    <span className="text-gray-600">{intervention.evidence}</span>
                  </div>
                  <div>
                    <span className="font-medium">Guidelines: </span>
                    <span className="text-gray-600">{intervention.guidelines}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 border border-green-300 rounded-lg">
            <h5 className="font-semibold text-green-800 text-sm mb-2">🎯 Comprehensive Approach Benefits:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-green-700">
              <div>• <strong>Mortality Reduction:</strong> Up to 70% with all interventions</div>
              <div>• <strong>Recurrence Prevention:</strong> Cumulative benefits across mechanisms</div>
              <div>• <strong>Cost-Effectiveness:</strong> Lifestyle interventions provide highest ROI</div>
              <div>• <strong>Quality of Life:</strong> Comprehensive care improves outcomes</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
            <h5 className="font-semibold text-amber-800 text-sm mb-2">📋 Clinical Guidelines Referenced:</h5>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">AHA/ASA 2021</Badge>
              <Badge variant="outline">ESC 2020</Badge>
              <Badge variant="outline">ESOC 2020</Badge>
              <Badge variant="outline">NICE Guidelines</Badge>
              <Badge variant="outline">ACC/AHA</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

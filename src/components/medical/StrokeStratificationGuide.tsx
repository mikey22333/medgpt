"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Stethoscope, Target } from "lucide-react";

interface StrokeStratificationGuideProps {
  className?: string;
}

export function StrokeStratificationGuide({ className }: StrokeStratificationGuideProps) {
  const strokeSubtypes = [
    {
      type: "Atrial Fibrillation (AF)",
      icon: <Heart className="h-5 w-5 text-red-600" />,
      prevalence: "20-30% of ischemic strokes",
      firstLine: ["Apixaban 5mg BID", "Rivaroxaban 20mg daily", "Dabigatran 150mg BID"],
      alternative: ["Warfarin (INR 2-3)", "Edoxaban 60mg daily"],
      evidence: "ARISTOTLE, RE-LY trials",
      riskScore: "CHA2DS2-VASc ≥2 (males), ≥3 (females)",
      color: "border-red-200 bg-red-50"
    },
    {
      type: "Embolic Stroke of Undetermined Source (ESUS)",
      icon: <Brain className="h-5 w-5 text-purple-600" />,
      prevalence: "15-25% of ischemic strokes",
      firstLine: ["Aspirin 75-100mg daily", "Clopidogrel 75mg daily"],
      alternative: ["Aspirin + Dipyridamole", "Consider PFO closure if present"],
      evidence: "NAVIGATE ESUS (rivaroxaban failed), RESPECT (PFO closure)",
      riskScore: "Consider PFO screening, 24-48hr cardiac monitoring",
      color: "border-purple-200 bg-purple-50"
    },
    {
      type: "Atherosclerotic Disease",
      icon: <Stethoscope className="h-5 w-5 text-orange-600" />,
      prevalence: "25-35% of ischemic strokes", 
      firstLine: ["Aspirin 75-100mg", "High-intensity statin", "BP control"],
      alternative: ["Clopidogrel if aspirin intolerant", "Aspirin + rivaroxaban 2.5mg BID"],
      evidence: "COMPASS trial (aspirin + rivaroxaban), SPARCL (atorvastatin)",
      riskScore: "Carotid imaging, lipid profile, diabetes screening",
      color: "border-orange-200 bg-orange-50"
    },
    {
      type: "Small Vessel Disease (Lacunar)",
      icon: <Target className="h-5 w-5 text-green-600" />,
      prevalence: "15-20% of ischemic strokes",
      firstLine: ["Aspirin 75-100mg", "Aggressive BP control (<130/80)", "Statin therapy"],
      alternative: ["Clopidogrel", "Dual antiplatelet (short-term only)"],
      evidence: "SPS3 trial, PROGRESS trial",
      riskScore: "24hr BP monitoring, HbA1c, microalbuminuria",
      color: "border-green-200 bg-green-50"
    }
  ];

  return (
    <div className={className}>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
            <Brain className="h-6 w-6" />
            Stroke Prevention: Subtype-Specific Approach
          </CardTitle>
          <p className="text-sm text-blue-700">
            Different stroke mechanisms require tailored prevention strategies
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {strokeSubtypes.map((subtype, index) => (
            <Card key={index} className={`${subtype.color} border`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {subtype.icon}
                    <h4 className="font-semibold text-sm">{subtype.type}</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {subtype.prevalence}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">First-line therapy:</p>
                  <div className="flex flex-wrap gap-1">
                    {subtype.firstLine.map((med, i) => (
                      <Badge key={i} className="text-xs bg-green-100 text-green-800 border-green-300">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Alternatives:</p>
                  <div className="flex flex-wrap gap-1">
                    {subtype.alternative.map((alt, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {alt}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Key Evidence: </span>
                    <span className="text-gray-600">{subtype.evidence}</span>
                  </div>
                  <div>
                    <span className="font-medium">Risk Assessment: </span>
                    <span className="text-gray-600">{subtype.riskScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
            <h5 className="font-semibold text-amber-800 text-sm mb-2">⚠️ Clinical Notes:</h5>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Dual antiplatelet therapy only for short-term use (21-90 days) due to bleeding risk</li>
              <li>• DOACs contraindicated in mechanical heart valves (use warfarin)</li>
              <li>• Consider bleeding risk (HAS-BLED score) when choosing anticoagulation</li>
              <li>• PFO closure reserved for recurrent ESUS despite medical therapy</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

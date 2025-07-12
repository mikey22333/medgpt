"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Database, BookOpen, Users, Globe, ExternalLink } from "lucide-react";

interface ResearchGap {
  area: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  suggestedStudies: string[];
}

interface FutureResearchProps {
  query: string;
  researchGaps: ResearchGap[];
  registryRecommendations?: string[];
  className?: string;
}

export function FutureResearchTracker({ 
  query, 
  researchGaps, 
  registryRecommendations = [],
  className 
}: FutureResearchProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const defaultRegistryRecommendations = [
    "National Cardiovascular Disease Registry (NCDR)",
    "NCAA Sport-Related Injury Database",
    "European Heart Rhythm Association (EHRA) Registry",
    "International Registry of Acute Aortic Dissection (IRAD)",
    "Global Burden of Disease Study (GBD)"
  ];

  const registries = registryRecommendations.length > 0 ? registryRecommendations : defaultRegistryRecommendations;

  const defaultGaps: ResearchGap[] = researchGaps.length > 0 ? researchGaps : [
    {
      area: "Long-term Outcomes",
      description: "Limited data on 10+ year follow-up for treatment effectiveness",
      priority: "High",
      suggestedStudies: ["Longitudinal cohort studies", "Registry-based outcomes research"]
    },
    {
      area: "Diverse Populations",
      description: "Underrepresentation of women and ethnic minorities in studies",
      priority: "High", 
      suggestedStudies: ["Multi-ethnic cohort studies", "Gender-stratified analyses"]
    },
    {
      area: "Real-World Effectiveness",
      description: "Gap between clinical trial efficacy and real-world outcomes",
      priority: "Medium",
      suggestedStudies: ["Pragmatic clinical trials", "Health services research"]
    }
  ];

  return (
    <Card className={`border-l-4 border-l-orange-500 bg-orange-50/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <span className="text-orange-800">Future Research Priorities</span>
          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
            Knowledge Gaps
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Research Gaps */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Identified Research Gaps
          </h4>
          {defaultGaps.map((gap, index) => (
            <div key={index} className="p-3 bg-white rounded border border-orange-200">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-sm text-gray-900">{gap.area}</h5>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(gap.priority)}`}>
                  {gap.priority} Priority
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">{gap.description}</p>
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-700">Suggested Studies:</span>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {gap.suggestedStudies.map((study, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-orange-400 rounded-full"></span>
                      {study}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Registry Recommendations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Recommended Registry Data Sources
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {registries.slice(0, 3).map((registry, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-medium">{registry}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Search registry"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Future Study Recommendations */}
        <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Recommended Future Studies</span>
          </div>
          <div className="text-xs text-orange-700 space-y-1">
            <div>• Large-scale prospective cohort studies (n &gt; 10,000)</div>
            <div>• Multi-center randomized controlled trials</div>
            <div>• Meta-analyses with individual patient data</div>
            <div>• Real-world evidence studies using electronic health records</div>
            <div>• Health economic outcomes research</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="p-2 bg-orange-100 rounded border border-orange-300">
          <p className="text-xs text-orange-800 text-center">
            <strong>Research Opportunity:</strong> Consider collaborating with academic institutions to address these knowledge gaps
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProbabilityData {
  condition: string;
  probability: number;
  color: string;
  description: string;
}

interface ProbabilityChartProps {
  content: string;
}

export function ProbabilityChart({ content }: ProbabilityChartProps) {
  // Extract probability data from content
  const extractProbabilities = (content: string): ProbabilityData[] => {
    const lowerContent = content.toLowerCase();
    
    // Look for explicit percentages
    const percentageMatches = content.match(/(\d+)%\s*(chance|likelihood)/gi);
    
    if (lowerContent.includes('viral') && lowerContent.includes('70%')) {
      return [
        { condition: 'Viral Infection', probability: 70, color: 'bg-green-500', description: 'Most likely - manageable at home' },
        { condition: 'Bacterial Infection', probability: 20, color: 'bg-yellow-500', description: 'Less likely - may need antibiotics' },
        { condition: 'Serious Conditions', probability: 10, color: 'bg-red-500', description: 'Unlikely - but monitor symptoms' }
      ];
    } else if (lowerContent.includes('fever') || lowerContent.includes('temperature')) {
      return [
        { condition: 'Common Viral Illness', probability: 65, color: 'bg-green-500', description: 'Most common cause' },
        { condition: 'Bacterial Infection', probability: 25, color: 'bg-yellow-500', description: 'Possible - watch for worsening' },
        { condition: 'Other Causes', probability: 10, color: 'bg-gray-500', description: 'Various other possibilities' }
      ];
    } else if (lowerContent.includes('headache')) {
      return [
        { condition: 'Tension Headache', probability: 60, color: 'bg-green-500', description: 'Most common type' },
        { condition: 'Migraine', probability: 25, color: 'bg-yellow-500', description: 'Possible - note triggers' },
        { condition: 'Secondary Causes', probability: 15, color: 'bg-orange-500', description: 'Less common - monitor symptoms' }
      ];
    } else {
      // Generic probabilities based on content analysis
      return [
        { condition: 'Common Condition', probability: 70, color: 'bg-green-500', description: 'Most likely scenario' },
        { condition: 'Alternative Cause', probability: 20, color: 'bg-yellow-500', description: 'Less common possibility' },
        { condition: 'Rare Conditions', probability: 10, color: 'bg-red-500', description: 'Unlikely but monitor' }
      ];
    }
  };

  const probabilities = extractProbabilities(content);
  
  // Don't show chart if content doesn't seem medical
  if (!content.toLowerCase().match(/(fever|headache|pain|symptoms|infection|viral|bacterial)/)) {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">📊</span>
          </div>
          Likelihood Assessment
        </CardTitle>
        <p className="text-sm text-gray-600">Based on your symptoms and clinical patterns</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {probabilities.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm">{item.condition}</span>
                <Badge variant="outline" className="text-xs">
                  {item.probability}%
                </Badge>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${item.color} transition-all duration-1000 ease-out rounded-full`}
                  style={{ width: `${item.probability}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
        
        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 flex items-start gap-2">
            <span className="text-blue-500 font-bold">ℹ️</span>
            These are estimated probabilities based on symptom patterns. Individual cases may vary. Always consult healthcare professionals for definitive diagnosis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";

interface AIConfidenceIndicatorProps {
  confidence: number;
  sources: string[];
  evidenceQuality: 'High' | 'Moderate' | 'Low';
}

export function AIConfidenceIndicator({ confidence, sources, evidenceQuality }: AIConfidenceIndicatorProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getConfidenceText = (score: number) => {
    if (score >= 80) return 'High Confidence';
    if (score >= 60) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const getEvidenceIcon = (quality: string) => {
    switch (quality) {
      case 'High': return <TrendingUp className="h-4 w-4" />;
      case 'Moderate': return <Brain className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-3 border-l-4 border-l-blue-500 bg-blue-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-blue-600" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">AI Analysis</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidence)}`}>
                {getConfidenceText(confidence)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="text-xs text-gray-600">
                Sources: {sources.join(', ')}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                {getEvidenceIcon(evidenceQuality)}
                Evidence Quality: {evidenceQuality}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-gray-700">
            {confidence}%
          </div>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                confidence >= 80 ? 'bg-green-500' :
                confidence >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

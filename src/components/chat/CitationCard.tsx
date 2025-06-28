import { type Citation } from "@/lib/types/chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Award, AlertTriangle, BookOpen, Microscope, TrendingUp, Shield } from "lucide-react";

interface CitationCardProps {
  citation: Citation;
  onMeshTermClick?: (term: string) => void;
}

export function CitationCard({ citation, onMeshTermClick }: CitationCardProps) {
  const handleCitationClick = () => {
    if (citation.url) {
      window.open(citation.url, '_blank');
    } else if (citation.pmid) {
      window.open(`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`, '_blank');
    } else if (citation.doi) {
      window.open(`https://doi.org/${citation.doi}`, '_blank');
    }
  };

  const getStudyTypeIcon = (type?: string) => {
    switch (type) {
      case 'RCT': return <Microscope className="h-3 w-3" />;
      case 'Meta-Analysis': return <TrendingUp className="h-3 w-3" />;
      case 'Guideline': return <BookOpen className="h-3 w-3" />;
      case 'FDA Label': return <Shield className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getStudyTypeColor = (type?: string) => {
    switch (type) {
      case 'RCT': return 'bg-green-100 text-green-800 border-green-200';
      case 'Meta-Analysis': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Guideline': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FDA Label': return 'bg-red-100 text-red-800 border-red-200';
      case 'FAERS Report': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGuidelineOrgBadge = (org?: string) => {
    const badges = {
      'WHO': { emoji: '🌍', color: 'bg-blue-500', name: 'WHO' },
      'NICE': { emoji: '🟩', color: 'bg-green-500', name: 'NICE' },
      'FDA': { emoji: '🟥', color: 'bg-red-500', name: 'FDA' },
      'AAP': { emoji: '📘', color: 'bg-blue-600', name: 'AAP' },
      'AHA': { emoji: '❤️', color: 'bg-red-600', name: 'AHA' },
      'CDC': { emoji: '🏛️', color: 'bg-indigo-500', name: 'CDC' },
    };
    
    if (org && badges[org as keyof typeof badges]) {
      const badge = badges[org as keyof typeof badges];
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${badge.color}`}>
          <span className="mr-1">{badge.emoji}</span>
          {badge.name}
        </span>
      );
    }
    return null;
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header with title and confidence */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStudyTypeIcon(citation.studyType)}
              <h4 className="font-medium text-sm leading-tight">{citation.title}</h4>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{citation.authors.slice(0, 3).join(', ')}{citation.authors.length > 3 ? ' et al.' : ''}</span>
              <span>•</span>
              <span>{citation.journal}</span>
              <span>•</span>
              <span>{citation.year}</span>
            </div>
          </div>
          
          {/* Confidence Score */}
          {citation.confidenceScore && (
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-gray-600">
                {citation.confidenceScore}%
              </div>
              <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getConfidenceColor(citation.confidenceScore)} transition-all`}
                  style={{ width: `${citation.confidenceScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Study Type Badge */}
          {citation.studyType && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStudyTypeColor(citation.studyType)}`}>
              {getStudyTypeIcon(citation.studyType)}
              <span className="ml-1">{citation.studyType}</span>
            </span>
          )}
          
          {/* Evidence Level */}
          {citation.evidenceLevel && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              citation.evidenceLevel === 'High' ? 'bg-green-100 text-green-800' :
              citation.evidenceLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              <Award className="h-3 w-3 mr-1" />
              {citation.evidenceLevel}
            </span>
          )}
          
          {/* Guideline Organization Badge */}
          {getGuidelineOrgBadge(citation.guidelineOrg)}
          
          {/* Source Badge */}
          {citation.source && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              {citation.source}
            </span>
          )}
        </div>

        {/* PMID/DOI Info */}
        {(citation.pmid || citation.doi) && (
          <div className="text-xs text-muted-foreground flex items-center gap-4">
            {citation.pmid && <span>PMID: {citation.pmid}</span>}
            {citation.doi && <span>DOI: {citation.doi}</span>}
          </div>
        )}

        {/* Abstract */}
        {citation.abstract && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {citation.abstract}
          </p>
        )}

        {/* MeSH Terms */}
        {citation.meshTerms && citation.meshTerms.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Related MeSH Terms:</div>
            <div className="flex flex-wrap gap-1">
              {citation.meshTerms.slice(0, 5).map((term, index) => (
                <button
                  key={index}
                  onClick={() => onMeshTermClick?.(term)}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  🏷️ {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCitationClick}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Source
          </Button>
        </div>
      </div>
    </Card>
  );
}

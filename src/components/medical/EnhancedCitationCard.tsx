"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Heart, Zap, FileText } from "lucide-react";
import { toast } from "sonner";
import { type Citation } from "@/lib/types/chat";
import { EvidenceQuality, QualityDot } from "./EvidenceQuality";

interface EnhancedCitationCardProps {
  citation: Citation;
  highlightConditions?: string[]; // Conditions to highlight (e.g., ['Brugada', 'LQTS', 'CPVT'])
}

export function EnhancedCitationCard({ citation, highlightConditions = [] }: EnhancedCitationCardProps) {
  const handleCopy = async () => {
    try {
      const authorsString = Array.isArray(citation.authors) 
        ? citation.authors.join(', ') 
        : citation.authors || 'Unknown authors';
      const citationText = `${citation.title}. ${authorsString}. ${citation.journal || 'Unknown journal'}. ${citation.year || 'Unknown year'}.${citation.doi ? ` DOI: ${citation.doi}` : ''}${citation.pmid ? ` PMID: ${citation.pmid}` : ''}`;
      await navigator.clipboard.writeText(citationText);
      toast.success("Citation copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy citation");
    }
  };

  const handleOpen = () => {
    if (citation.url) {
      window.open(citation.url, '_blank');
    } else if (citation.doi) {
      window.open(`https://doi.org/${citation.doi}`, '_blank');
    } else if (citation.pmid) {
      window.open(`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`, '_blank');
    }
  };

  // Check if this citation relates to highlighted conditions
  const isHighlightedCondition = highlightConditions.some(condition => 
    citation.title.toLowerCase().includes(condition.toLowerCase()) ||
    citation.abstract?.toLowerCase().includes(condition.toLowerCase())
  );

  // Determine the appropriate icon based on citation content
  const getConditionIcon = () => {
    const title = citation.title.toLowerCase();
    if (title.includes('brugada') || title.includes('long qt') || title.includes('lqts')) {
      return <Zap className="h-4 w-4 text-yellow-600" />;
    }
    if (title.includes('cardiac') || title.includes('heart') || title.includes('cpvt')) {
      return <Heart className="h-4 w-4 text-red-600" />;
    }
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  // Get special badge for guidelines
  const getGuidelineBadge = () => {
    if (citation.studyType === 'Guideline' || citation.isGuideline) {
      const org = citation.guidelineOrg || 'Unknown';
      return (
        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
          {org} Guidelines
        </Badge>
      );
    }
    return null;
  };

  // Get condition-specific badge
  const getConditionBadge = () => {
    const title = citation.title.toLowerCase();
    if (title.includes('brugada')) {
      return <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">Brugada Syndrome</Badge>;
    }
    if (title.includes('long qt') || title.includes('lqts')) {
      return <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">Long QT Syndrome</Badge>;
    }
    if (title.includes('cpvt')) {
      return <Badge variant="outline" className="text-xs bg-red-100 text-red-700">CPVT</Badge>;
    }
    return null;
  };

  return (
    <Card className={`p-3 citation-card border-l-4 ${
      isHighlightedCondition 
        ? 'border-l-yellow-500 bg-yellow-50/50' 
        : 'border-l-blue-500 bg-blue-50/50'
    }`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {getConditionIcon()}
            <h4 className="font-medium text-xs leading-tight text-gray-900 flex-1">
              {citation.title}
            </h4>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0"
              title="Copy citation"
            >
              <Copy className="h-3 w-3" />
            </Button>
            {(citation.url || citation.doi || citation.pmid) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpen}
                className="h-6 w-6 p-0"
                title="Open source"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {citation.authors && (
          <div className="text-xs text-gray-600">
            {Array.isArray(citation.authors) ? citation.authors.join(', ') : citation.authors}
          </div>
        )}
        
        {citation.abstract && (
          <div className="text-xs text-gray-600 line-clamp-2">
            {citation.abstract}
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {citation.year && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {citation.year}
            </Badge>
          )}
          
          {citation.journal && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {citation.journal}
            </Badge>
          )}

          {citation.studyType && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700">
              {citation.studyType}
            </Badge>
          )}

          {citation.evidenceLevel && (
            <div className="flex items-center gap-1">
              <QualityDot level={citation.evidenceLevel as any} size="sm" />
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700">
                {citation.evidenceLevel} Evidence
              </Badge>
            </div>
          )}

          {getGuidelineBadge()}
          {getConditionBadge()}

          {isHighlightedCondition && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 border-yellow-300">
              🔑 Key Reference
            </Badge>
          )}
        </div>

        {citation.pmid && (
          <div className="text-xs text-muted-foreground">
            PMID: {citation.pmid}
          </div>
        )}

        {citation.doi && (
          <div className="text-xs text-muted-foreground">
            DOI: {citation.doi}
          </div>
        )}
      </div>
    </Card>
  );
}

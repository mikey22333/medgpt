import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { type Citation } from "@/lib/types/chat";

interface CitationCardProps {
  citation: Citation;
}

export function CitationCard({ citation }: CitationCardProps) {
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

  return (
    <Card className="p-3 citation-card border-l-4 border-l-blue-500 bg-blue-50/50">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-xs leading-tight text-gray-900 flex-1">
            {citation.title}
          </h4>
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
          <div className="text-xs text-gray-600 line-clamp-1">
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
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 max-w-full truncate">
              {citation.journal}
            </Badge>
          )}
          
          {citation.evidenceLevel && (
            <Badge 
              variant="secondary" 
              className={`text-xs px-1.5 py-0.5 ${
                citation.evidenceLevel === 'High' ? 'bg-green-100 text-green-800' :
                citation.evidenceLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {citation.evidenceLevel}
            </Badge>
          )}
          
          {citation.confidenceScore && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {citation.confidenceScore}%
            </Badge>
          )}
          
          {citation.source && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {citation.source}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

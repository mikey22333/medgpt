import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Citation } from "@/lib/types/chat";

interface CitationCardProps {
  citation: Citation;
}

export function CitationCard({ citation }: CitationCardProps) {
  return (
    <Card className="p-3 citation-card">
      <div className="space-y-2">
        <div className="font-medium text-sm">
          {citation.title}
        </div>
        
        {citation.authors && (
          <div className="text-xs text-muted-foreground">
            {Array.isArray(citation.authors) ? citation.authors.join(', ') : citation.authors}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {citation.year && (
            <Badge variant="secondary" className="text-xs">
              {citation.year}
            </Badge>
          )}
          
          {citation.journal && (
            <Badge variant="outline" className="text-xs">
              {citation.journal}
            </Badge>
          )}
          
          {citation.evidenceLevel && (
            <Badge variant="secondary" className="text-xs">
              {citation.evidenceLevel} Evidence
            </Badge>
          )}
        </div>
        
        {citation.doi && (
          <div className="text-xs text-muted-foreground">
            DOI: {citation.doi}
          </div>
        )}
      </div>
    </Card>
  );
}

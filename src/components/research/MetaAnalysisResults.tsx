import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  FileText, 
  Users, 
  BarChart2, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  ClipboardCopy,
  ClipboardCheck,
  RefreshCw,
  Search,
  ArrowRight
} from 'lucide-react';
import { useMetaAnalysis, type FallbackSuggestion } from '@/hooks/useMetaAnalysis';
import { type EuropePMCMetaAnalysis, type MetaAnalysisSummary } from '@/lib/research/europepmc';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface MetaAnalysisResultsProps {
  query: string;
  minStudies?: number;
  minYear?: number;
  maxYear?: number;
  className?: string;
  onSearch?: (query: string) => void;
}

export function MetaAnalysisResults({
  query,
  minStudies,
  minYear,
  maxYear,
  className = '',
  onSearch,
}: MetaAnalysisResultsProps) {
  const router = useRouter();
  const [showSummary, setShowSummary] = useState(true);
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    fallbackSuggestions, 
    hasFallbackSuggestions 
  } = useMetaAnalysis(query, {
    minStudies,
    minYear,
    maxYear,
    sortBy: 'relevance',
    includeSummary: true, // Always fetch summaries
    suggestFallbacks: true,
  });

  const handleSuggestionClick = useCallback((suggestion: FallbackSuggestion) => {
    if (onSearch) {
      onSearch(suggestion.query);
    } else {
      // Update URL with the new query
      const params = new URLSearchParams();
      params.set('query', suggestion.query);
      if (minStudies !== undefined) params.set('minStudies', minStudies.toString());
      if (minYear !== undefined) params.set('minYear', minYear.toString());
      if (maxYear !== undefined) params.set('maxYear', maxYear.toString());
      
      router.push(`/research?${params.toString()}`);
    }
  }, [onSearch, minStudies, minYear, maxYear, router]);

  const toggleSummary = useCallback(() => {
    setShowSummary(prev => !prev);
  }, []);

  const getConfidenceBadge = (article: EuropePMCMetaAnalysis) => {
    // This is a simplified version - in a real app, you'd use the GRADE rating
    const hasLargeSample = article.outcomeMeasures?.some(m => m.participants && m.participants > 1000);
    const hasManyStudies = article.outcomeMeasures?.some(m => m.studies && m.studies > 10);
    
    if (hasLargeSample && hasManyStudies) {
      return (
        <Badge variant="success" className="ml-2">
          <CheckCircle className="h-3 w-3 mr-1" /> High Confidence
        </Badge>
      );
    }
    
    return (
      <Badge variant="warning" className="ml-2">
        <AlertCircle className="h-3 w-3 mr-1" /> Moderate Confidence
      </Badge>
    );
  };

  const formatAuthors = (authors: string[]) => {
    if (!authors || authors.length === 0) return 'Unknown Author';
    if (authors.length <= 2) return authors.join(' & ');
    return `${authors[0]} et al.`;
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading meta-analyses</h3>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Try again
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No meta-analyses found</h3>
        <p className="text-muted-foreground mb-6">
          Try adjusting your search criteria or try a different query.
        </p>
        
        {hasFallbackSuggestions && (
          <div className="mt-6 max-w-2xl mx-auto">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Try these alternative searches:</h4>
            <div className="space-y-2">
              {fallbackSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="group flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:underline">{suggestion.description}</p>
                    <p className="text-xs text-muted-foreground truncate">{suggestion.query}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">Or search on Europe PMC directly:</p>
              <Button 
                variant="outline" 
                onClick={() => window.open(`https://europepmc.org/search?query=${encodeURIComponent(query)}`, '_blank')}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Search Europe PMC
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const { toast } = useToast();

  // Generate a plain English explanation of the confidence level
  const getConfidenceExplanation = (confidence: string, reasons?: string[]) => {
    const baseExplanations: Record<string, string> = {
      'high': 'The evidence is very reliable and unlikely to change with future research. You can be very confident in these findings.',
      'moderate': 'The evidence is moderately reliable, but there may be some limitations. The findings are likely to be close to the true effect, but some uncertainty remains.',
      'low': 'The evidence has significant limitations and the true effect may be substantially different. Consider these findings with caution and look for additional research.',
      'very-low': 'The evidence is very limited and the true effect is likely to be substantially different. These findings should be interpreted with great caution.'
    };

    const baseExplanation = baseExplanations[confidence] || 'The confidence in this evidence could not be determined.';
    
    if (!reasons || reasons.length === 0) {
      return baseExplanation;
    }

    // Add specific reasons if available
    const formattedReasons = reasons.map((reason, i) => {
      // Remove any markdown formatting from reasons
      const cleanReason = reason
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '')    // Remove italics
        .replace(/`/g, '');     // Remove code ticks
      
      return `• ${cleanReason.charAt(0).toLowerCase() + cleanReason.slice(1)}`;
    });

    return (
      <div className="space-y-2">
        <p>{baseExplanation}</p>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">Key factors affecting confidence:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            {formattedReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The summary has been copied to your clipboard.',
    } as any);
  };

  const SummarySection = ({ summary }: { summary: MetaAnalysisSummary }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
      copyToClipboard(summary.plainLanguageSummary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };

    return (
      <Card className="mt-4 bg-muted/50">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSummary();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSummary ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="text-sm font-medium">AI-Generated Summary</h4>
              <Badge 
                variant={summary.confidence === 'high' ? 'default' : 'outline'} 
                className={`w-fit ${
                  summary.confidence === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  summary.confidence === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {summary.confidence.charAt(0).toUpperCase() + summary.confidence.slice(1)} Confidence
              </Badge>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
          >
            {isCopied ? (
              <ClipboardCheck className="h-4 w-4 mr-1" />
            ) : (
              <ClipboardCopy className="h-4 w-4 mr-1" />
            )}
            {isCopied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        
        {isExpanded && (
          <>
            <Separator />
            <CardContent className="p-4 pt-3 space-y-4">
              <div className="bg-foreground/5 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Evidence Confidence
                </h4>
                <p className="text-sm">
                  {getConfidenceExplanation(
                    summary.confidence, 
                    summary.gradeAssessment?.reasons
                  )}
                </p>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h4 className="text-sm font-medium mb-2">Plain Language Summary</h4>
                <p className="text-sm mb-4 whitespace-pre-line">{summary.plainLanguageSummary}</p>
                
                <h4 className="text-sm font-medium mb-2 mt-4">Key Findings</h4>
                <ul className="space-y-2 mb-4">
                  {summary.keyFindings.map((finding, i) => (
                    <li key={i} className="flex gap-2">
                      <span>•</span>
                      <span>
                        <span className="font-medium">{finding.outcome}:</span> {finding.interpretation} 
                        <span className="text-muted-foreground text-xs">({finding.effect}, {finding.certainty} certainty)</span>
                      </span>
                    </li>
                  ))}
                </ul>
                
                {summary.clinicalImplications.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium mb-2">Clinical Implications</h4>
                    <ul className="space-y-2 mb-4">
                      {summary.clinicalImplications.map((implication, i) => (
                        <li key={i} className="flex gap-2">
                          <span>•</span>
                          <span>{implication}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                
                {summary.limitations.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium mb-2">Limitations</h4>
                    <ul className="space-y-2">
                      {summary.limitations.map((limitation, i) => (
                        <li key={i} className="flex gap-2">
                          <span>•</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {data.map((article) => (
        <Card key={article.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-medium leading-snug">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center"
                >
                  {article.title}
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                </a>
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {article.studyType?.includes('meta-analysis') ? 'Meta-Analysis' : 'Systematic Review'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                {formatAuthors(article.authors)}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {new Date(article.publishedDate).getFullYear()}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <BarChart2 className="h-3.5 w-3.5 mr-1" />
                {article.outcomeMeasures?.length || 0} outcomes
              </span>
              {getConfidenceBadge(article)}
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {article.abstract || 'No abstract available.'}
            </p>
            
            {article.outcomeMeasures && article.outcomeMeasures.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <h4 className="text-sm font-medium mb-2">Key Findings:</h4>
                <div className="space-y-2">
                  {article.outcomeMeasures.slice(0, 2).map((outcome, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium">{outcome.name}:</span>{' '}
                      <span className="text-muted-foreground">
                        {outcome.measure.toUpperCase()} = {outcome.value.toFixed(2)} 
                        {outcome.ciLower !== undefined && outcome.ciUpper !== undefined && 
                          `(95% CI ${outcome.ciLower.toFixed(2)}-${outcome.ciUpper.toFixed(2)})`
                        }
                        {outcome.i2 !== undefined && `, I² = ${outcome.i2}%`}
                      </span>
                    </div>
                  ))}
                  {article.outcomeMeasures.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{article.outcomeMeasures.length - 2} more outcomes
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-4 flex flex-wrap gap-2">
              {article.pmid && (
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs inline-flex items-center text-primary hover:underline"
                >
                  PubMed
                </a>
              )}
              {article.pmcid && (
                <a
                  href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs inline-flex items-center text-primary hover:underline"
                >
                  PMC
                </a>
              )}
              {article.doi && (
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs inline-flex items-center text-primary hover:underline"
                >
                  DOI
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

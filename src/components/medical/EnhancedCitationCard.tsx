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
  userQuery?: string; // User's original query for relevance assessment
}

export function EnhancedCitationCard({ citation, highlightConditions = [], userQuery }: EnhancedCitationCardProps) {
  // Assess citation relevance to user query
  const assessCitationRelevance = () => {
    if (!userQuery) return { score: 50, level: 'unknown' as const };
    
    const queryLower = userQuery.toLowerCase();
    const titleLower = citation.title.toLowerCase();
    const abstractLower = citation.abstract?.toLowerCase() || '';
    
    let relevanceScore = 0;
    
    // Check if it's a bibliometric analysis or research trend study (low clinical relevance)
    if (titleLower.includes('bibliometric') || titleLower.includes('research trends') ||
        titleLower.includes('global research trends') || titleLower.includes('scientometric')) {
      return { score: 10, level: 'poor' as const, reason: 'Bibliometric analysis - describes research patterns, not clinical outcomes' };
    }
    
    // Check if it's an irrelevant FDA report
    if (titleLower.includes('fda adverse event') || citation.source?.includes('FDA FAERS')) {
      // Check if FDA report is for drugs mentioned in query
      const queryMentionsSGLT2 = queryLower.includes('sglt2') || queryLower.includes('empagliflozin') || queryLower.includes('dapagliflozin');
      const queryMentionsDPP4 = queryLower.includes('dpp-4') || queryLower.includes('sitagliptin') || queryLower.includes('saxagliptin');
      const reportMentionsPrednisone = titleLower.includes('prednisone');
      const reportMentionsPaclitaxel = titleLower.includes('paclitaxel');
      
      if ((queryMentionsSGLT2 || queryMentionsDPP4) && (reportMentionsPrednisone || reportMentionsPaclitaxel)) {
        return { score: 5, level: 'irrelevant' as const, reason: 'FDA report for unrelated drug' };
      }
    }
    
    // Check for drug comparison queries
    if (queryLower.includes('sglt2') && queryLower.includes('dpp-4')) {
      const mentionsSGLT2 = titleLower.includes('sglt2') || titleLower.includes('empagliflozin') || titleLower.includes('dapagliflozin');
      const mentionsDPP4 = titleLower.includes('dpp-4') || titleLower.includes('sitagliptin') || titleLower.includes('saxagliptin');
      
      if (mentionsSGLT2 && mentionsDPP4) {
        relevanceScore = 90; // Direct comparison
      } else if (mentionsSGLT2 || mentionsDPP4) {
        // Check if it's a general diabetes trial like UKPDS
        if (titleLower.includes('ukpds') || titleLower.includes('uk prospective diabetes')) {
          return { score: 15, level: 'poor' as const, reason: 'General diabetes trial, not drug class comparison' };
        }
        relevanceScore = 60; // Single drug class
      } else {
        relevanceScore = 20; // Unrelated
      }
    }
    
    // Check for omega-3 depression queries with AGGRESSIVE IRRELEVANCE DETECTION
    if (queryLower.includes('omega') || queryLower.includes('fatty acid') || queryLower.includes('fish oil')) {
      // HARD EXCLUDE: Papers that should NEVER appear for omega-3 depression queries
      const hardExclusions = [
        'electric field effect in atomically thin carbon films',
        'phq-9', 'hospital anxiety and depression scale', 'ces-d scale',
        'patient health questionnaire', 'beck depression inventory',
        'hamilton depression rating', 'center for epidemiologic studies depression',
        'graphene', 'carbon films', 'valence and conductance bands',
        'gate voltage', 'semimetal', 'two-dimensional'
      ];
      
      const isHardExcluded = hardExclusions.some(exclusion => 
        titleLower.includes(exclusion) || abstractLower.includes(exclusion)
      );
      
      if (isHardExcluded) {
        return { score: 0, level: 'irrelevant' as const, reason: 'Completely unrelated to omega-3 or depression research' };
      }
      
      const mentionsOmega3 = titleLower.includes('omega-3') || titleLower.includes('omega 3') || 
                             titleLower.includes('fatty acid') || titleLower.includes('epa') || 
                             titleLower.includes('dha') || titleLower.includes('fish oil') ||
                             abstractLower.includes('omega-3') || abstractLower.includes('omega 3') ||
                             abstractLower.includes('polyunsaturated fatty');
      const mentionsDepression = titleLower.includes('depression') || titleLower.includes('depressive') ||
                                  titleLower.includes('mood') || titleLower.includes('mental health') ||
                                  titleLower.includes('bipolar') ||
                                  abstractLower.includes('depression') || abstractLower.includes('depressive') ||
                                  abstractLower.includes('mood disorder') || abstractLower.includes('bipolar');
      
      // Depression measurement tools should score 0% for omega-3 queries
      const isDepressionMeasurementTool = titleLower.includes('scale') && 
                                         (titleLower.includes('depression') || titleLower.includes('anxiety')) &&
                                         !mentionsOmega3;
      
      if (isDepressionMeasurementTool) {
        return { score: 0, level: 'irrelevant' as const, reason: 'Depression measurement scale, not omega-3 treatment study' };
      }
      
      if (mentionsOmega3 && mentionsDepression) {
        relevanceScore = 95; // Highly relevant - directly addresses omega-3 and depression
      } else if (mentionsOmega3) {
        relevanceScore = 75; // Good relevance - omega-3 related
      } else if (mentionsDepression && (queryLower.includes('depression') || queryLower.includes('mood'))) {
        // For omega-3 depression queries, depression-only papers are not relevant
        return { score: 0, level: 'irrelevant' as const, reason: 'Depression-related but no omega-3 content' };
      } else {
        relevanceScore = 20; // Low relevance
      }
    }
    
    // Heart failure context
    if (queryLower.includes('heart failure') || queryLower.includes('hospitalization')) {
      if (titleLower.includes('heart failure') || abstractLower.includes('hospitalization for heart failure')) {
        relevanceScore += 30;
      }
    }
    
    // COVID-19 queries
    if (queryLower.includes('covid') || queryLower.includes('coronavirus') || queryLower.includes('sars-cov-2')) {
      const mentionsCovid = titleLower.includes('covid') || titleLower.includes('covid-19') ||
                           titleLower.includes('sars-cov-2') || titleLower.includes('coronavirus');
      const mentionsLongTerm = titleLower.includes('long') || titleLower.includes('persistent') ||
                              titleLower.includes('sequelae') || abstractLower.includes('long-term');
      
      if (mentionsCovid && mentionsLongTerm) {
        relevanceScore = 90; // Highly relevant for long COVID queries
      } else if (mentionsCovid) {
        relevanceScore = 80; // Good relevance for COVID queries
      }
    }
    
    // Hypertension and lifestyle queries
    if (queryLower.includes('hypertension') || queryLower.includes('blood pressure')) {
      const mentionsHypertension = titleLower.includes('hypertension') || titleLower.includes('blood pressure');
      const mentionsLifestyle = titleLower.includes('lifestyle') || titleLower.includes('diet') ||
                               titleLower.includes('exercise') || abstractLower.includes('lifestyle intervention');
      
      if (mentionsHypertension && mentionsLifestyle) {
        relevanceScore = 85; // Highly relevant
      } else if (mentionsHypertension) {
        relevanceScore = 70; // Good relevance
      }
    }
    
    // Population match
    if (queryLower.includes('diabetes') && (titleLower.includes('diabetes') || abstractLower.includes('diabetes'))) {
      relevanceScore += 20;
    }
    
    // Generic medical relevance (fallback for queries not covered above)
    if (relevanceScore === 0) {
      const queryTerms = queryLower.split(' ').filter(term => term.length > 3);
      let termMatches = 0;
      
      for (const term of queryTerms) {
        if (titleLower.includes(term) || abstractLower.includes(term)) {
          termMatches++;
        }
      }
      
      if (queryTerms.length > 0) {
        const matchPercentage = termMatches / queryTerms.length;
        if (matchPercentage >= 0.7) {
          relevanceScore = 75; // Most terms match
        } else if (matchPercentage >= 0.5) {
          relevanceScore = 60; // Half the terms match
        } else if (matchPercentage >= 0.3) {
          relevanceScore = 45; // Some terms match
        } else if (matchPercentage > 0) {
          relevanceScore = 25; // Few terms match
        }
      }
    }
    
    // Determine relevance level
    if (relevanceScore >= 80) return { score: relevanceScore, level: 'excellent' as const };
    if (relevanceScore >= 60) return { score: relevanceScore, level: 'good' as const };
    if (relevanceScore >= 40) return { score: relevanceScore, level: 'moderate' as const };
    if (relevanceScore >= 20) return { score: relevanceScore, level: 'poor' as const };
    return { score: relevanceScore, level: 'irrelevant' as const };
  };
  
  const relevanceAssessment = assessCitationRelevance();
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

  // Get relevance-based styling
  const getRelevanceStyles = () => {
    switch (relevanceAssessment.level) {
      case 'excellent':
        return {
          borderColor: 'border-l-green-500',
          bgColor: 'bg-green-50/50',
          badgeColor: 'bg-green-100 text-green-700 border-green-300'
        };
      case 'good':
        return {
          borderColor: 'border-l-blue-500',
          bgColor: 'bg-blue-50/50',
          badgeColor: 'bg-blue-100 text-blue-700 border-blue-300'
        };
      case 'moderate':
        return {
          borderColor: 'border-l-yellow-500',
          bgColor: 'bg-yellow-50/50',
          badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-300'
        };
      case 'poor':
        return {
          borderColor: 'border-l-orange-500',
          bgColor: 'bg-orange-50/50',
          badgeColor: 'bg-orange-100 text-orange-700 border-orange-300'
        };
      case 'irrelevant':
        return {
          borderColor: 'border-l-red-500',
          bgColor: 'bg-red-50/50',
          badgeColor: 'bg-red-100 text-red-700 border-red-300'
        };
      default:
        return {
          borderColor: 'border-l-gray-500',
          bgColor: 'bg-gray-50/50',
          badgeColor: 'bg-gray-100 text-gray-700 border-gray-300'
        };
    }
  };

  const relevanceStyles = getRelevanceStyles();

  // Check if this citation relates to highlighted conditions
  const isHighlightedCondition = highlightConditions.some(condition => 
    citation.title.toLowerCase().includes(condition.toLowerCase()) ||
    citation.abstract?.toLowerCase().includes(condition.toLowerCase())
  );

  // Override styling for highlighted conditions
  const finalStyles = isHighlightedCondition ? {
    borderColor: 'border-l-yellow-500',
    bgColor: 'bg-yellow-50/50'
  } : relevanceStyles;

  // Get relevance badge
  const getRelevanceBadge = () => {
    const icons = {
      excellent: '🎯',
      good: '✅',
      moderate: '⚠️',
      poor: '❌',
      irrelevant: '🚫',
      unknown: '❓'
    };
    
    const labels = {
      excellent: 'Highly Relevant',
      good: 'Relevant',
      moderate: 'Moderately Relevant',
      poor: 'Poorly Relevant',
      irrelevant: 'Irrelevant',
      unknown: 'Unknown Relevance'
    };

    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${relevanceStyles.badgeColor}`}>
          {icons[relevanceAssessment.level]} {labels[relevanceAssessment.level]} ({relevanceAssessment.score}%)
        </Badge>
        {relevanceAssessment.reason && (
          <span className="text-xs text-gray-500" title={relevanceAssessment.reason}>
            ℹ️
          </span>
        )}
      </div>
    );
  };

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
    <Card className={`p-3 citation-card border-l-4 ${finalStyles.borderColor} ${finalStyles.bgColor}`}>
      <div className="space-y-2">
        {/* Relevance Assessment Banner for Poor/Irrelevant Citations */}
        {(relevanceAssessment.level === 'poor' || relevanceAssessment.level === 'irrelevant') && (
          <div className={`p-2 rounded-md border-l-4 ${
            relevanceAssessment.level === 'irrelevant' 
              ? 'bg-red-100 border-red-400 text-red-800' 
              : 'bg-orange-100 border-orange-400 text-orange-800'
          }`}>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span>{relevanceAssessment.level === 'irrelevant' ? '🚫' : '⚠️'}</span>
              <span>
                {relevanceAssessment.level === 'irrelevant' 
                  ? 'CITATION ALERT: This source appears irrelevant to your query' 
                  : 'CITATION WARNING: This source has limited relevance to your query'}
              </span>
            </div>
            {relevanceAssessment.reason && (
              <div className="text-xs mt-1 opacity-80">
                Reason: {relevanceAssessment.reason}
              </div>
            )}
          </div>
        )}
        
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
            {Array.isArray(citation.authors) 
              ? citation.authors
                  .filter(author => author && typeof author === 'string' && author !== '[object Object]')
                  .slice(0, 3)
                  .join(', ') + (citation.authors.length > 3 ? ' et al.' : '')
              : (typeof citation.authors === 'string' && citation.authors !== '[object Object]')
                ? citation.authors 
                : 'Unknown Author'}
          </div>
        )}
        
        {citation.abstract && (
          <div className="text-xs text-gray-600 line-clamp-2">
            {citation.abstract}
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {/* Relevance Assessment Badge */}
          {getRelevanceBadge()}
          
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

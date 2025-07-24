/**
 * Open-Access Evidence Quality Dashboard
 * Real-time visualization of research quality metrics from free databases
 * Provides transparency and quality assessment for evidence-based decisions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedSearchResult } from '../../lib/research/EnhancedResearchService';

// Simple Progress component
const Progress: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full ${className}`}>
    <div 
      className="bg-blue-600 h-full rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export interface QualityDashboardProps {
  searchResults: EnhancedSearchResult;
  isLoading?: boolean;
}

export interface QualityMetric {
  name: string;
  value: number;
  target: number;
  status: 'excellent' | 'good' | 'warning' | 'poor';
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface SourceQuality {
  source: string;
  count: number;
  percentage: number;
  quality: number;
  color: string;
  icon: string;
}

export interface EvidenceGap {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

const OpenAccessEvidenceQualityDashboard: React.FC<QualityDashboardProps> = ({ 
  searchResults, 
  isLoading = false 
}) => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [sourceDistribution, setSourceDistribution] = useState<SourceQuality[]>([]);
  const [evidenceGaps, setEvidenceGaps] = useState<EvidenceGap[]>([]);

  useEffect(() => {
    if (searchResults) {
      calculateQualityMetrics();
      calculateSourceDistribution();
      identifyEvidenceGaps();
    }
  }, [searchResults]);

  const calculateQualityMetrics = () => {
    const metrics = searchResults.qualityMetrics;
    
    const qualityMetrics: QualityMetric[] = [
      {
        name: 'Average Quality Score',
        value: metrics.averageQualityScore,
        target: 80,
        status: metrics.averageQualityScore >= 80 ? 'excellent' : 
                metrics.averageQualityScore >= 70 ? 'good' :
                metrics.averageQualityScore >= 60 ? 'warning' : 'poor',
        description: 'Overall quality of evidence sources based on methodology, peer review, and transparency',
        trend: 'up'
      },
      {
        name: 'Open Access Coverage',
        value: metrics.openAccessPercentage,
        target: 90,
        status: metrics.openAccessPercentage >= 90 ? 'excellent' : 
                metrics.openAccessPercentage >= 75 ? 'good' :
                metrics.openAccessPercentage >= 60 ? 'warning' : 'poor',
        description: 'Percentage of results from verified open-access sources',
        trend: 'up'
      },
      {
        name: 'Full-Text Availability',
        value: metrics.fullTextPercentage,
        target: 80,
        status: metrics.fullTextPercentage >= 80 ? 'excellent' : 
                metrics.fullTextPercentage >= 65 ? 'good' :
                metrics.fullTextPercentage >= 50 ? 'warning' : 'poor',
        description: 'Percentage of results with freely accessible full-text articles',
        trend: 'stable'
      },
      {
        name: 'High-Level Evidence',
        value: ((metrics.evidenceDistribution['Level_1'] || 0) + 
                (metrics.evidenceDistribution['Level_2'] || 0)) / searchResults.totalResults * 100,
        target: 40,
        status: function() {
          const highLevel = ((metrics.evidenceDistribution['Level_1'] || 0) + 
                           (metrics.evidenceDistribution['Level_2'] || 0)) / searchResults.totalResults * 100;
          return highLevel >= 40 ? 'excellent' : 
                 highLevel >= 25 ? 'good' :
                 highLevel >= 15 ? 'warning' : 'poor';
        }(),
        description: 'Percentage of Level 1-2 evidence (systematic reviews, high-quality RCTs)',
        trend: 'up'
      }
    ];

    setQualityMetrics(qualityMetrics);
  };

  const calculateSourceDistribution = () => {
    const distribution = searchResults.sourceDistribution;
    const total = searchResults.totalResults;

    const sourceQualities: SourceQuality[] = Object.entries(distribution).map(([source, count]) => {
      const numCount = Number(count);
      const percentage = (numCount / total) * 100;
      
      // Source-specific quality assessments
      const sourceConfig = {
        'DOAJ': { quality: 85, color: 'bg-green-500', icon: '📘' },
        'PLOS': { quality: 90, color: 'bg-blue-500', icon: '🔬' },
        'BMC': { quality: 88, color: 'bg-purple-500', icon: '🏥' },
        'TRIP': { quality: 82, color: 'bg-orange-500', icon: '⚕️' },
        'PubMed': { quality: 75, color: 'bg-gray-500', icon: '📚' },
        'ClinicalTrials': { quality: 80, color: 'bg-red-500', icon: '🧪' }
      }[source] || { quality: 70, color: 'bg-gray-400', icon: '📄' };

      return {
        source,
        count: numCount,
        percentage,
        quality: sourceConfig.quality,
        color: sourceConfig.color,
        icon: sourceConfig.icon
      };
    }).sort((a, b) => b.count - a.count);

    setSourceDistribution(sourceQualities);
  };

  const identifyEvidenceGaps = () => {
    const gaps: EvidenceGap[] = [];

    // Check for missing evidence types
    if (searchResults.gaps.missingEvidenceTypes.length > 0) {
      gaps.push({
        type: 'Missing Evidence Types',
        severity: 'medium',
        description: `Missing: ${searchResults.gaps.missingEvidenceTypes.join(', ')}`,
        recommendation: 'Search specifically for these evidence types or broaden search terms'
      });
    }

    // Check database coverage
    const uncoveredDatabases = Object.entries(searchResults.gaps.databaseCoverage)
      .filter(([_, covered]) => !covered)
      .map(([db, _]) => db);

    if (uncoveredDatabases.length > 0) {
      gaps.push({
        type: 'Limited Database Coverage',
        severity: 'low',
        description: `No results from: ${uncoveredDatabases.join(', ')}`,
        recommendation: 'Consider alternative search terms or check database availability'
      });
    }

    // Check for low quality scores
    if (searchResults.qualityMetrics.averageQualityScore < 60) {
      gaps.push({
        type: 'Low Quality Evidence',
        severity: 'high',
        description: 'Average quality score below acceptable threshold',
        recommendation: 'Refine search terms to target higher-quality studies and journals'
      });
    }

    // Check for limited open access
    if (searchResults.qualityMetrics.openAccessPercentage < 50) {
      gaps.push({
        type: 'Limited Open Access',
        severity: 'medium',
        description: 'Less than 50% of results are from open-access sources',
        recommendation: 'Use DOAJ or PLOS-specific searches to increase open access coverage'
      });
    }

    setEvidenceGaps(gaps);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quality Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Evidence Quality Metrics
            <Badge variant="outline" className="ml-auto">
              {searchResults.totalResults} total results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {qualityMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{metric.value.toFixed(1)}%</span>
                    <span className="text-gray-500">Target: {metric.target}%</span>
                  </div>
                  <Progress 
                    value={metric.value} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-gray-600">{metric.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Source Distribution & Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sourceDistribution.map((source, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="text-lg">{source.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{source.source}</span>
                      <span className="text-sm text-gray-500">
                        {source.count} ({source.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress 
                        value={source.percentage} 
                        className="h-2 flex-1"
                      />
                      <Badge variant="outline" className="text-xs">
                        Q: {source.quality}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evidence Hierarchy Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Evidence Hierarchy Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(searchResults.qualityMetrics.evidenceDistribution).map(([level, count]) => {
              const numCount = Number(count);
              const percentage = (numCount / searchResults.totalResults) * 100;
              const levelConfig = {
                'Level_1': { name: 'Level 1 - Systematic Reviews', color: 'bg-green-500', description: 'Highest quality evidence' },
                'Level_2': { name: 'Level 2 - RCTs', color: 'bg-blue-500', description: 'High-quality controlled trials' },
                'Level_3': { name: 'Level 3 - Cohort Studies', color: 'bg-yellow-500', description: 'Observational studies' },
                'Level_4': { name: 'Level 4 - Case Studies', color: 'bg-orange-500', description: 'Lower-quality evidence' },
                'Level_5': { name: 'Level 5 - Expert Opinion', color: 'bg-gray-500', description: 'Lowest quality evidence' }
              }[level] || { name: level, color: 'bg-gray-400', description: 'Unclassified evidence' };

              return (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{levelConfig.name}</span>
                    <span className="text-sm text-gray-500">{numCount} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-gray-600">{levelConfig.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Evidence Gaps & Recommendations */}
      {evidenceGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Evidence Gaps & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evidenceGaps.map((gap, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(gap.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{gap.type}</h4>
                      <p className="text-sm">{gap.description}</p>
                      <p className="text-xs font-medium">Recommendation: {gap.recommendation}</p>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(gap.severity)}>
                      {gap.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Landmark Trials Highlight */}
      {searchResults.landmarkTrials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Landmark Trials Identified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.landmarkTrials.map((trial: any, index: number) => (
                <div key={index} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-800">{trial.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-yellow-700">
                      <span>📅 {trial.year}</span>
                      <span>📖 {trial.journal}</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Quality: {trial.qualityScore}
                      </Badge>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {trial.abstract.substring(0, 200)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Performance */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Search Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {(searchResults.processingTime / 1000).toFixed(2)}s
              </div>
              <div className="text-sm text-gray-600">Processing Time</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(searchResults.sourceDistribution).length}
              </div>
              <div className="text-sm text-gray-600">Databases Searched</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                ${0}
              </div>
              <div className="text-sm text-gray-600">API Cost</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {searchResults.qualityMetrics.openAccessPercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Open Access</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenAccessEvidenceQualityDashboard;

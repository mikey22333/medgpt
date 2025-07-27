"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage?: number;
  description?: string;
}

interface MessagePieChartProps {
  title: string;
  data: PieChartData[];
  className?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  size?: 'small' | 'medium' | 'large';
  subtitle?: string;
}

const CHART_COLORS = [
  '#10B981', // emerald-500
  '#3B82F6', // blue-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#EC4899', // pink-500
  '#6B7280', // gray-500
];

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">Count: {data.value}</p>
        {data.percentage && (
          <p className="text-sm text-gray-600">Percentage: {data.percentage.toFixed(1)}%</p>
        )}
        {data.description && (
          <p className="text-xs text-gray-500 mt-1">{data.description}</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4 justify-center">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function MessagePieChart({ 
  title, 
  data, 
  className, 
  showLegend = true, 
  showTooltip = true,
  size = 'medium',
  subtitle
}: MessagePieChartProps) {
  // Calculate percentages if not provided
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item, index) => ({
    ...item,
    percentage: item.percentage || (item.value / total) * 100,
    color: item.color || CHART_COLORS[index % CHART_COLORS.length]
  }));

  const sizeConfig = {
    small: { height: 200, innerRadius: 40, outerRadius: 80 },
    medium: { height: 300, innerRadius: 60, outerRadius: 120 },
    large: { height: 400, innerRadius: 80, outerRadius: 160 }
  };

  const config = sizeConfig[size];

  return (
    <Card className={cn("bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          {title}
          {subtitle && <span className="text-sm font-normal text-gray-600">({subtitle})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={config.height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={config.innerRadius}
                outerRadius={config.outerRadius}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend content={<CustomLegend />} />}
            </PieChart>
          </ResponsiveContainer>
          
          {/* Data summary below chart */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-800">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to extract data for common medical research visualizations
export function extractCitationSourceData(citations: any[]): PieChartData[] {
  if (!citations || citations.length === 0) return [];
  
  const sourceCount: { [key: string]: number } = {};
  
  citations.forEach(citation => {
    const source = citation.source || 'Unknown';
    sourceCount[source] = (sourceCount[source] || 0) + 1;
  });
  
  const sourceColors: { [key: string]: string } = {
    'PubMed': '#10B981',
    'Europe PMC': '#3B82F6', 
    'Semantic Scholar': '#F59E0B',
    'CrossRef': '#EF4444',
    'FDA': '#8B5CF6',
    'OpenAlex': '#06B6D4',
    'DOAJ': '#84CC16',
    'bioRxiv': '#F97316',
    'Unknown': '#6B7280'
  };
  
  return Object.entries(sourceCount).map(([source, count]) => ({
    name: source,
    value: count,
    color: sourceColors[source] || '#6B7280',
    description: `${count} citations from ${source}`
  }));
}

export function extractStudyTypeData(citations: any[]): PieChartData[] {
  if (!citations || citations.length === 0) return [];
  
  const typeCount: { [key: string]: number } = {};
  
  citations.forEach(citation => {
    const type = citation.studyType || 'Unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  
  const typeColors: { [key: string]: string } = {
    'Meta-Analysis': '#10B981',
    'Systematic Review': '#3B82F6',
    'RCT': '#F59E0B',
    'Observational': '#EF4444',
    'Guideline': '#8B5CF6',
    'Review': '#06B6D4',
    'Case Study': '#F97316',
    'Cohort Study': '#84CC16',
    'Case-Control Study': '#EC4899',
    'Unknown': '#6B7280'
  };
  
  return Object.entries(typeCount).map(([type, count]) => ({
    name: type,
    value: count,
    color: typeColors[type] || '#6B7280',
    description: `${count} ${type} studies`
  }));
}

export function extractEvidenceLevelData(citations: any[]): PieChartData[] {
  if (!citations || citations.length === 0) return [];
  
  const levelCount: { [key: string]: number } = {};
  
  citations.forEach(citation => {
    const level = citation.evidenceLevel || 'Unknown';
    levelCount[level] = (levelCount[level] || 0) + 1;
  });
  
  const levelColors: { [key: string]: string } = {
    'High': '#10B981',
    'Moderate': '#F59E0B',
    'Low': '#EF4444',
    'Unknown': '#6B7280'
  };
  
  return Object.entries(levelCount).map(([level, count]) => ({
    name: `${level} Evidence`,
    value: count,
    color: levelColors[level] || '#6B7280',
    description: `${count} studies with ${level.toLowerCase()} evidence level`
  }));
}

// Extract data from message content - for treatment outcomes, side effects, etc.
export function extractTreatmentOutcomeData(content: string): PieChartData[] {
  const outcomes: { [key: string]: number } = {};
  const contentLower = content.toLowerCase();
  
  // Look for outcome mentions in the content
  const outcomePatterns = [
    { name: 'Effective', keywords: ['effective', 'improved', 'beneficial', 'success'], color: '#10B981' },
    { name: 'Partially Effective', keywords: ['partial', 'moderate', 'some improvement'], color: '#F59E0B' },
    { name: 'No Effect', keywords: ['no effect', 'ineffective', 'no improvement'], color: '#6B7280' },
    { name: 'Adverse Effects', keywords: ['side effect', 'adverse', 'toxicity', 'harm'], color: '#EF4444' }
  ];
  
  outcomePatterns.forEach(pattern => {
    const count = pattern.keywords.reduce((total, keyword) => {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      return total + matches;
    }, 0);
    
    if (count > 0) {
      outcomes[pattern.name] = count;
    }
  });
  
  return Object.entries(outcomes).map(([outcome, count]) => {
    const pattern = outcomePatterns.find(p => p.name === outcome);
    return {
      name: outcome,
      value: count,
      color: pattern?.color || '#6B7280',
      description: `${count} mentions of ${outcome.toLowerCase()}`
    };
  });
}

// Extract confidence levels from message content
export function extractConfidenceData(content: string): PieChartData[] {
  const confidencePatterns = [
    { name: 'High Confidence', keywords: ['high confidence', 'strong evidence', 'conclusive'], color: '#10B981' },
    { name: 'Moderate Confidence', keywords: ['moderate confidence', 'moderate evidence'], color: '#F59E0B' },
    { name: 'Low Confidence', keywords: ['low confidence', 'limited evidence', 'uncertain'], color: '#EF4444' },
    { name: 'Uncertain', keywords: ['unclear', 'inconclusive', 'conflicting'], color: '#6B7280' }
  ];
  
  const confidenceCounts: { [key: string]: number } = {};
  const contentLower = content.toLowerCase();
  
  confidencePatterns.forEach(pattern => {
    const count = pattern.keywords.reduce((total, keyword) => {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      return total + matches;
    }, 0);
    
    if (count > 0) {
      confidenceCounts[pattern.name] = count;
    }
  });
  
  return Object.entries(confidenceCounts).map(([level, count]) => {
    const pattern = confidencePatterns.find(p => p.name === level);
    return {
      name: level,
      value: count,
      color: pattern?.color || '#6B7280',
      description: `${count} mentions of ${level.toLowerCase()}`
    };
  });
}

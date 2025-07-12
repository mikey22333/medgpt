"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, TrendingUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualizationData {
  type: 'pie' | 'bar' | 'flowchart' | 'pyramid';
  title: string;
  description: string;
  data: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
  totalSample?: string;
  source?: string;
}

interface MedicalVisualizationProps {
  visualization: VisualizationData;
  className?: string;
}

export function MedicalVisualization({ visualization, className }: MedicalVisualizationProps) {
  const { type, title, description, data, totalSample, source } = visualization;

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('MedicalVisualization rendering:', { type, title, data });
  }

  // Validate data - ensure we have valid data to render
  if (!data || data.length === 0) {
    console.warn('MedicalVisualization: No valid data provided', visualization);
    return (
      <Card className={cn("border border-orange-200 bg-orange-50", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            {title || 'Data Visualization'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-orange-700 italic">
            No visualization data available for this section.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = () => {
    switch (type) {
      case 'pie': return <PieChart className="h-5 w-5" />;
      case 'bar': return <BarChart3 className="h-5 w-5" />;
      case 'flowchart': return <TrendingUp className="h-5 w-5" />;
      case 'pyramid': return <FileText className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  const renderPieChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: item.color || `hsl(${index * 45}, 70%, 60%)` }}
            />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {typeof item.value === 'number' ? `${item.value}%` : item.value}
          </Badge>
        </div>
      ))}
    </div>
  );

  const renderBarChart = () => {
    // Find max value for scaling
    const maxValue = Math.max(...data.map(item => {
      const numericValue = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
      return typeof numericValue === 'number' && !isNaN(numericValue) ? numericValue : 0;
    }));
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          // Ensure value is a number for percentage calculation
          const numericValue = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
          const validValue = typeof numericValue === 'number' && !isNaN(numericValue) ? numericValue : 0;
          
          // Calculate percentage relative to max value for bar width
          const percentage = maxValue > 0 ? (validValue / maxValue) * 100 : 0;
          const displayValue = typeof item.value === 'number' ? `${item.value}%` : item.value;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-gray-600">{displayValue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(Math.max(percentage, 2), 100)}%`, // Min 2% for visibility, cap at 100%
                    backgroundColor: item.color || `hsl(${index * 60 + 200}, 70%, 60%)`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFlowchart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-800">
            {index + 1}
          </div>
          <div className="flex-1 p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg">
            <div className="font-medium text-sm">{item.label}</div>
            {item.value && (
              <div className="text-xs text-gray-600 mt-1">{item.value}</div>
            )}
          </div>
          {index < data.length - 1 && (
            <div className="flex-shrink-0 text-gray-400">
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderVisualization = () => {
    switch (type) {
      case 'pie': return renderPieChart();
      case 'bar': return renderBarChart();
      case 'flowchart': return renderFlowchart();
      case 'pyramid': return renderBarChart(); // Similar to bar chart but styled differently
      default: return renderBarChart();
    }
  };

  return (
    <Card className={`border-l-4 border-l-green-500 bg-green-50/30 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {getIcon()}
          <span className="text-green-800">{title}</span>
          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
            Data Visualization
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="pt-2">
        {renderVisualization()}
        
        {(totalSample || source) && (
          <div className="mt-4 pt-3 border-t border-green-200">
            {totalSample && (
              <p className="text-xs text-gray-600">Sample: {totalSample}</p>
            )}
            {source && (
              <p className="text-xs text-gray-600">Source: {source}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

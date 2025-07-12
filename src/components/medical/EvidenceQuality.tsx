"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, CheckCircle, AlertTriangle, AlertCircle, XCircle } from "lucide-react";

interface EvidenceQualityProps {
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY LOW' | 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5';
  studyType?: string;
  className?: string;
  compact?: boolean;
}

export function EvidenceQuality({ level, studyType, className, compact = false }: EvidenceQualityProps) {
  const getQualityConfig = () => {
    // Handle both GRADE levels and evidence levels
    const normalizedLevel = level.includes('Level') ? level : level;
    
    switch (normalizedLevel) {
      case 'HIGH':
      case 'Level 1':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: CheckCircle,
          description: 'High-quality evidence',
          confidence: '95%+',
          iconColor: 'text-green-600'
        };
      case 'MODERATE':
      case 'Level 2':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Shield,
          description: 'Moderate-quality evidence',
          confidence: '75-95%',
          iconColor: 'text-blue-600'
        };
      case 'LOW':
      case 'Level 3':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: AlertTriangle,
          description: 'Low-quality evidence',
          confidence: '50-75%',
          iconColor: 'text-yellow-600'
        };
      case 'VERY LOW':
      case 'Level 4':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: AlertCircle,
          description: 'Very low-quality evidence',
          confidence: '25-50%',
          iconColor: 'text-orange-600'
        };
      case 'Level 5':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: XCircle,
          description: 'Expert opinion only',
          confidence: '<25%',
          iconColor: 'text-red-600'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: AlertCircle,
          description: 'Unknown quality',
          confidence: 'N/A',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getQualityConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        <Badge variant="outline" className={`text-xs ${config.color}`}>
          {level}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`p-2 border-l-4 ${config.color.includes('green') ? 'border-l-green-500' : 
                                       config.color.includes('blue') ? 'border-l-blue-500' :
                                       config.color.includes('yellow') ? 'border-l-yellow-500' :
                                       config.color.includes('orange') ? 'border-l-orange-500' :
                                       config.color.includes('red') ? 'border-l-red-500' : 'border-l-gray-500'} ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
        <div className="flex-1">
          <Badge variant="outline" className={`text-xs ${config.color}`}>
            {level}
          </Badge>
          {studyType && (
            <Badge variant="secondary" className="text-xs ml-1">
              {studyType}
            </Badge>
          )}
          <div className="text-xs text-gray-600 mt-1">
            {config.description} • Confidence: {config.confidence}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Progress bar alternative for confidence visualization
interface ConfidenceBarProps {
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY LOW';
  className?: string;
}

export function ConfidenceBar({ level, className }: ConfidenceBarProps) {
  const getConfidenceData = () => {
    switch (level) {
      case 'HIGH': return { percentage: 95, color: 'bg-green-500', label: 'High Confidence' };
      case 'MODERATE': return { percentage: 80, color: 'bg-blue-500', label: 'Moderate Confidence' };
      case 'LOW': return { percentage: 60, color: 'bg-yellow-500', label: 'Low Confidence' };
      case 'VERY LOW': return { percentage: 30, color: 'bg-red-500', label: 'Very Low Confidence' };
      default: return { percentage: 0, color: 'bg-gray-500', label: 'Unknown' };
    }
  };

  const { percentage, color, label } = getConfidenceData();

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Color-coded dots for table displays
interface QualityDotProps {
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY LOW';
  size?: 'sm' | 'md' | 'lg';
}

export function QualityDot({ level, size = 'md' }: QualityDotProps) {
  const getConfig = () => {
    switch (level) {
      case 'HIGH': return { color: 'bg-green-500', ring: 'ring-green-200' };
      case 'MODERATE': return { color: 'bg-blue-500', ring: 'ring-blue-200' };
      case 'LOW': return { color: 'bg-yellow-500', ring: 'ring-yellow-200' };
      case 'VERY LOW': return { color: 'bg-red-500', ring: 'ring-red-200' };
      default: return { color: 'bg-gray-500', ring: 'ring-gray-200' };
    }
  };

  const { color, ring } = getConfig();
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div 
      className={`rounded-full ${color} ${ring} ring-2 ${sizeClasses[size]}`}
      title={`${level} quality evidence`}
    />
  );
}

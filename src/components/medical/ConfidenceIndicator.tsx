"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from "lucide-react";

interface ConfidenceIndicatorProps {
  percentage: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export function ConfidenceIndicator({ 
  percentage, 
  label, 
  size = 'md', 
  showPercentage = true,
  className 
}: ConfidenceIndicatorProps) {
  const getConfig = () => {
    if (percentage >= 85) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-500',
        ringColor: 'ring-green-200',
        icon: CheckCircle2,
        level: 'HIGH'
      };
    } else if (percentage >= 65) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        ringColor: 'ring-blue-200',
        icon: AlertCircle,
        level: 'MODERATE'
      };
    } else if (percentage >= 40) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500',
        ringColor: 'ring-yellow-200',
        icon: AlertTriangle,
        level: 'LOW'
      };
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        ringColor: 'ring-red-200',
        icon: XCircle,
        level: 'VERY LOW'
      };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: { container: 'w-12 h-12', icon: 'w-3 h-3', text: 'text-xs' },
    md: { container: 'w-16 h-16', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { container: 'w-20 h-20', icon: 'w-5 h-5', text: 'text-base' }
  };

  const strokeDasharray = 2 * Math.PI * 20; // Circumference for r=20
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <svg className={sizeClasses[size].container} viewBox="0 0 50 50">
          {/* Background circle */}
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={config.color}
            style={{
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)',
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`${sizeClasses[size].icon} ${config.color}`} />
        </div>
      </div>
      
      <div className="flex flex-col">
        {label && (
          <span className={`font-medium ${sizeClasses[size].text} text-gray-900`}>
            {label}
          </span>
        )}
        <div className="flex items-center gap-1">
          <Badge 
            variant="outline" 
            className={`text-xs px-1.5 py-0.5 ${
              config.level === 'HIGH' ? 'bg-green-100 text-green-700 border-green-300' :
              config.level === 'MODERATE' ? 'bg-blue-100 text-blue-700 border-blue-300' :
              config.level === 'LOW' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
              'bg-red-100 text-red-700 border-red-300'
            }`}
          >
            {config.level}
          </Badge>
          {showPercentage && (
            <span className={`${sizeClasses[size].text} ${config.color} font-medium`}>
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Simplified horizontal bar version
interface ConfidenceBarProps {
  percentage: number;
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY LOW';
  className?: string;
}

export function ConfidenceBar({ percentage, level, className }: ConfidenceBarProps) {
  const getColor = () => {
    switch (level) {
      case 'HIGH': return 'bg-green-500';
      case 'MODERATE': return 'bg-blue-500';
      case 'LOW': return 'bg-yellow-500';
      case 'VERY LOW': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium">{level}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

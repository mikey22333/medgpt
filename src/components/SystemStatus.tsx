"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface HealthStatus {
  togetherAI: boolean;
  models: string[];
  isLoading: boolean;
}

export function SystemStatus() {
  const [status, setStatus] = useState<HealthStatus>({
    togetherAI: false,
    models: [],
    isLoading: true,
  });

  const checkHealth = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      
      if (response.ok && data.status === "healthy") {
        setStatus({
          togetherAI: true,
          models: data.recommendedModels?.map((m: { name: string }) => m.name) || [],
          isLoading: false,
        });
      } else {
        setStatus({
          togetherAI: false,
          models: [],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Health check failed:", error);
      setStatus({
        togetherAI: false,
        models: [],
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">System Status</h3>
          {status.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status.togetherAI ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={checkHealth}
          disabled={status.isLoading}
        >
          {status.isLoading ? "Checking..." : "Refresh"}
        </Button>
      </div>
      
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span>AI Service (Together AI)</span>
          <span className={status.togetherAI ? "text-green-600" : "text-red-600"}>
            {status.togetherAI ? "Online" : "Offline"}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span>Research Sources</span>
          <span className="text-green-600">PubMed • Europe PMC • FDA</span>
        </div>
        
        {status.models.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span>Models Available</span>
            <span className="text-green-600">{status.models.length}</span>
          </div>
        )}
        
        {!status.togetherAI && !status.isLoading && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <span className="text-amber-800">
                Together AI API key not configured. Add TOGETHER_API_KEY to environment variables.
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

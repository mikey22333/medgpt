import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Clock, Shield } from "lucide-react";

interface FDAAlert {
  id: string;
  title: string;
  date: string;
  type: 'recall' | 'safety' | 'approval';
  severity: 'high' | 'medium' | 'low';
  summary: string;
  url?: string;
}

export function FDAAlerts() {
  const [alerts, setAlerts] = useState<FDAAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate FDA alerts (in production, this would fetch from FDA RSS/API)
    const simulatedAlerts: FDAAlert[] = [
      {
        id: '1',
        title: 'FDA warns about contaminated blood pressure medications',
        date: new Date().toISOString(),
        type: 'safety',
        severity: 'high',
        summary: 'FDA issues warning about NDMA contamination in certain ARB medications',
        url: 'https://www.fda.gov/safety/medical-product-safety-information'
      },
      {
        id: '2',
        title: 'New diabetes medication approved for Type 2 diabetes',
        date: new Date(Date.now() - 86400000).toISOString(),
        type: 'approval',
        severity: 'medium',
        summary: 'FDA approves new GLP-1 receptor agonist for glycemic control',
        url: 'https://www.fda.gov/news-events/press-announcements'
      },
      {
        id: '3',
        title: 'Voluntary recall of over-the-counter pain relief tablets',
        date: new Date(Date.now() - 172800000).toISOString(),
        type: 'recall',
        severity: 'medium',
        summary: 'Manufacturing defect leads to voluntary recall of acetaminophen tablets',
        url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts'
      }
    ];

    setTimeout(() => {
      setAlerts(simulatedAlerts);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getAlertIcon = (type: string, severity: string) => {
    if (type === 'recall' || severity === 'high') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (type === 'approval') return <Shield className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-sm">Latest FDA Alerts</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-sm">Latest FDA Alerts</h3>
        </div>
        <Clock className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {alerts.map(alert => (
          <div 
            key={alert.id}
            className={`p-3 border rounded-lg ${getAlertColor(alert.severity)} hover:shadow-sm transition-shadow`}
          >
            <div className="flex items-start gap-2">
              {getAlertIcon(alert.type, alert.severity)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {alert.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {alert.summary}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDate(alert.date)}
                  </span>
                  {alert.url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-1 text-xs"
                      onClick={() => window.open(alert.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => window.open('https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts', '_blank')}
        >
          View All FDA Alerts
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

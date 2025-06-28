import { useQueryLimit } from '@/hooks/useQueryLimit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

export function QueryLimitDebugger() {
  const { 
    limitData, 
    loading, 
    error, 
    queriesUsed, 
    queryLimit, 
    canChat, 
    refresh,
    timeUntilReset 
  } = useQueryLimit();
  
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug-user');
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setDebugInfo({ error: 'Failed to fetch debug info' });
    }
  };

  return (
    <Card className="p-4 m-4 space-y-4">
      <h3 className="text-lg font-bold">Query Limit Debugger</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Current Status</h4>
          <p>Queries Used: {queriesUsed}</p>
          <p>Query Limit: {queryLimit}</p>
          <p>Can Chat: {canChat ? 'Yes' : 'No'}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Error: {error || 'None'}</p>
          <p>Time Until Reset: {timeUntilReset || 'Unknown'}</p>
        </div>
        
        <div>
          <h4 className="font-semibold">Actions</h4>
          <div className="space-y-2">
            <Button onClick={refresh} size="sm">
              Refresh Limit Data
            </Button>
            <Button onClick={fetchDebugInfo} size="sm" variant="outline">
              Fetch Debug Info
            </Button>
          </div>
        </div>
      </div>

      {limitData && (
        <div>
          <h4 className="font-semibold">Raw Limit Data</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(limitData, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo && (
        <div>
          <h4 className="font-semibold">Debug Info</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

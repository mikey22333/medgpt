"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQueryLimit } from '@/hooks/useQueryLimit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const { user } = useAuth();
  const queryLimit = useQueryLimit();
  const [debugData, setDebugData] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const supabase = createClient();

  const fetchDebugData = async () => {
    try {
      const response = await fetch('/api/debug-user');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setDebugData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const fetchApiData = async () => {
    try {
      const response = await fetch('/api/query-limit');
      const data = await response.json();
      setApiData(data);
    } catch (error) {
      setApiData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const fetchDbData = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setDbData({ data, error });
      } catch (error) {
        setDbData({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  };

  const testRpcFunction = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .rpc('check_query_limit', { user_uuid: user.id });
        
        setDbData({ rpc_result: data, rpc_error: error });
      } catch (error) {
        setDbData({ rpc_error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  };

  const resetQueries = async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ queries_used: 0, last_reset_date: new Date().toISOString().split('T')[0] })
          .eq('id', user.id);
        
        if (!error) {
          alert('Queries reset successfully!');
          queryLimit.refresh();
        } else {
          alert('Error: ' + error.message);
        }
      } catch (error) {
        alert('Error: ' + error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchDebugData();
      fetchApiData();
      fetchDbData();
    }
  }, [user]);

  if (!user) {
    return <div>Please log in to view debug information.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Query Limit Debug Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* useQueryLimit Hook Data */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">useQueryLimit Hook</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Can Chat:</strong> {queryLimit.canChat ? 'Yes' : 'No'}</p>
            <p><strong>Queries Used:</strong> {queryLimit.queriesUsed}</p>
            <p><strong>Query Limit:</strong> {queryLimit.queryLimit}</p>
            <p><strong>Is Pro:</strong> {queryLimit.isProUser ? 'Yes' : 'No'}</p>
            <p><strong>Loading:</strong> {queryLimit.loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {queryLimit.error || 'None'}</p>
            <p><strong>Time Until Reset:</strong> {queryLimit.timeUntilReset || 'Unknown'}</p>
          </div>
          <Button onClick={queryLimit.refresh} className="mt-3" size="sm">
            Refresh Hook Data
          </Button>
        </Card>

        {/* API Response */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">API Response (/api/query-limit)</h2>
          <Button onClick={fetchApiData} size="sm" className="mb-3">
            Fetch API Data
          </Button>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </Card>

        {/* Debug User Info */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">User Debug Info</h2>
          <Button onClick={fetchDebugData} size="sm" className="mb-3">
            Fetch Debug Data
          </Button>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </Card>

        {/* Direct Database Query */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">Direct Database Query</h2>
          <div className="space-y-2">
            <Button onClick={fetchDbData} size="sm">
              Fetch Profile Data
            </Button>
            <Button onClick={testRpcFunction} size="sm" variant="outline">
              Test RPC Function
            </Button>
            <Button onClick={resetQueries} size="sm" variant="destructive">
              Reset Queries to 0
            </Button>
          </div>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40 mt-3">
            {JSON.stringify(dbData, null, 2)}
          </pre>
        </Card>
      </div>

      {/* Raw Data Dump */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">All Raw Data</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
          {JSON.stringify({
            user_id: user.id,
            user_email: user.email,
            queryLimit_hook: {
              canChat: queryLimit.canChat,
              queriesUsed: queryLimit.queriesUsed,
              queryLimit: queryLimit.queryLimit,
              isProUser: queryLimit.isProUser,
              loading: queryLimit.loading,
              error: queryLimit.error,
              timeUntilReset: queryLimit.timeUntilReset
            },
            api_response: apiData,
            debug_data: debugData,
            db_data: dbData
          }, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

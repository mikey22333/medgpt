'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function DatabaseTest() {
  const [status, setStatus] = useState('Initializing...');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    console.log('DatabaseTest: Component mounted');
    
    const runTest = async () => {
      try {
        console.log('DatabaseTest: Starting test...');
        const supabase = createClient();
        
        // Check authentication
        setStatus('Checking authentication...');
        console.log('DatabaseTest: Checking authentication...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.log('DatabaseTest: Auth error:', authError);
          setStatus(`Auth error: ${authError.message}`);
          return;
        }
        
        if (!user) {
          console.log('DatabaseTest: No user logged in');
          setStatus('No user logged in');
          return;
        }
        
        console.log('DatabaseTest: User authenticated:', user.id);
        setStatus(`User authenticated: ${user.id}`);
        
        // Try to query chat_messages
        setStatus('Querying chat_messages...');
        console.log('DatabaseTest: Querying chat_messages...');
        const { data: messages, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .limit(5);
        
        if (msgError) {
          console.log('DatabaseTest: Database error:', msgError);
          setStatus(`Database error: ${msgError.message}`);
          return;
        }
        
        console.log('DatabaseTest: Found messages:', messages);
        setStatus(`Found ${messages?.length || 0} messages`);
        setResults(messages || []);
        
      } catch (error) {
        console.error('DatabaseTest: Error:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    runTest();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold mb-2">Database Test</h3>
      <p className="mb-2">Status: {status}</p>
      {results.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1">Messages:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

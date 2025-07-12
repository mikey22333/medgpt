// Simple test to debug the chat API

const testChatAPI = async () => {
  console.log('Testing chat API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token' // This will fail auth, but we should see the auth error
      },
      body: JSON.stringify({
        message: 'test message',
        mode: 'research',
        useRAG: false, // Disable RAG to simplify
        enableDeepThinking: false, // Disable deep thinking
        enableMultiAgent: false // Disable multi-agent
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing chat API:', error);
  }
};

testChatAPI();

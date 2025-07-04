const debugAPICall = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: 'migraine prevention treatment',
        mode: 'research'
      }),
    });
    
    const data = await response.json();
    console.log('Full response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
};

debugAPICall();

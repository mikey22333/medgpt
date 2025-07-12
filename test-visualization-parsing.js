// Test script to verify visualization parsing and rendering
const testVisualizationParsing = () => {
  const sampleResponse = `
**Clinical Summary (TL;DR)**

Primary Cause: Brugada syndrome is a rare hereditary arrhythmia disorder characterized by a distinctive electrocardiogram pattern and an elevated risk of ventricular arrhythmias and sudden cardiac death in young adults → MODERATE (75-95% confidence)

VISUALIZATION REQUIREMENTS:

**📊 Suggested Visualization:**
Type: Bar chart
Title: Prevalence of Brugada Syndrome
Data: Estimated prevalence of Brugada syndrome in different populations (e.g., 1 in 2,000 in Europe, 1 in 5,000 in Asia, variable in other regions)

**Simple Explanation:** Brugada Syndrome
Brugada syndrome is a rare heart condition that can cause sudden death in young adults. It is characterized by abnormal heart rhythm patterns that can be seen on an electrocardiogram (ECG).
  `;

  // Test parsing logic
  const visualizationRegex = /VISUALIZATION REQUIREMENTS:\s*\n\s*\*\*📊 Suggested Visualization:\*\*\s*\n\s*Type:\s*([^\n]+)\n\s*Title:\s*([^\n]+)\n\s*Data:\s*([^*]+?)(?=\*\*|$)/g;
  
  let match;
  while ((match = visualizationRegex.exec(sampleResponse)) !== null) {
    console.log('Matched visualization:', {
      type: match[1].trim(),
      title: match[2].trim(),
      data: match[3].trim()
    });
    
    const vizData = match[3].trim();
    const dataItems = [];
    
    // Extract numerical data from prevalence text
    const europeMatch = vizData.match(/1 in (\d+,?\d*) in Europe/);
    const asiaMatch = vizData.match(/1 in (\d+,?\d*) in Asia/);
    
    if (europeMatch) {
      const denominator = parseInt(europeMatch[1].replace(',', ''));
      dataItems.push({ label: 'Europe', value: (1/denominator * 100).toFixed(3) });
    }
    if (asiaMatch) {
      const denominator = parseInt(asiaMatch[1].replace(',', ''));
      dataItems.push({ label: 'Asia', value: (1/denominator * 100).toFixed(3) });
    }
    if (vizData.includes('other regions')) {
      dataItems.push({ label: 'Other Regions', value: '0.025' });
    }
    
    console.log('Parsed data items:', dataItems);
  }
};

// Run test
console.log('Testing visualization parsing...');
testVisualizationParsing();

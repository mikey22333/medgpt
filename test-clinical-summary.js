// Test clinical summary parsing
const testClinicalSummaryParsing = () => {
  const sampleContent = `
🧾 **Clinical Summary (TL;DR)** • 🎯 **Primary Cause:** Anticoagulation therapy is crucial in reducing the risk of cardioembolic strokes, particularly in vulnerable populations such as patients with atrial fibrillation, artificial heart valves, or left ventricular thrombus, with a confidence level of **** (Moderate). • 🔬 **Secondary Causes:** The reason for anticoagulation failure, which remains a major stroke-care issue, is multifactorial and requires further investigation, with a confidence level of *** (Low). • 🩺 **Diagnostic Tools:** No specific diagnostic tools were identified in the provided research sources. • ⚠️ **Evidence Gaps:** There is a lack of high-quality evidence, such as systematic reviews or randomized controlled trials, to inform the most effective interventions for preventing recurrent ischemic stroke.

🧬 **Evidence Sources and Study Types**
  `;

  // Test the regex patterns
  const clinicalSummaryRegex1 = /📋\s*\*\*Clinical Summary \(TL;DR\)\*\*[^\n]*\n\n([^📊🌟]*?)(?=📊|🌟|\*\*📊|\*\*🌟|$)/g;
  const clinicalSummaryRegex2 = /📋\s*Clinical Summary \(TL;DR\)[^\n]*\n([^📊🌟]*?)(?=📊|🌟|\*\*📊|\*\*🌟|$)/g;
  const clinicalSummaryRegex3 = /\*\*Clinical Summary \(TL;DR\)\*\*[^\n]*\n([^📊🌟]*?)(?=📊|🌟|\*\*📊|\*\*🌟|$)/g;
  
  const summaryRegexes = [clinicalSummaryRegex1, clinicalSummaryRegex2, clinicalSummaryRegex3];
  
  let clinicalSummary = '';
  
  for (const regex of summaryRegexes) {
    let match;
    while ((match = regex.exec(sampleContent)) !== null) {
      if (!clinicalSummary) { // Only take the first match
        clinicalSummary = match[1].trim();
        console.log('Found clinical summary:', clinicalSummary.substring(0, 100) + '...');
        break;
      }
    }
    if (clinicalSummary) break;
  }
  
  if (!clinicalSummary) {
    console.log('No clinical summary found. Testing alternative patterns...');
    
    // Try a more flexible pattern
    const flexibleRegex = /Clinical Summary[^•]*([•][^🧬]+)/g;
    const flexMatch = flexibleRegex.exec(sampleContent);
    if (flexMatch) {
      clinicalSummary = flexMatch[1].trim();
      console.log('Found with flexible regex:', clinicalSummary.substring(0, 100) + '...');
    }
  }
  
  return clinicalSummary;
};

// Run test
console.log('Testing clinical summary parsing...');
const result = testClinicalSummaryParsing();
console.log('Final result length:', result.length);

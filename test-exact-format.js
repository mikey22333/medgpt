// Test with the exact format from the screenshot
const testScreenshotFormat = () => {
  const sampleContent = `📋 Clinical Summary (TL;DR) • 🎯 Primary Cause: Anticoagulation therapy is crucial in reducing the risk of cardioembolic strokes, particularly in vulnerable populations such as patients with atrial fibrillation, artificial heart valves, or left ventricular thrombus, with a confidence level of **** (Moderate). • 🔬 Secondary Causes: The reason for anticoagulation failure, which remains a major stroke-care issue, is multifactorial and may include inadequate dosing, poor patient compliance, or underlying conditions that increase the risk of thrombosis. • 🩺 Diagnostic Tools: The diagnosis of ischemic stroke and the assessment of the risk of recurrence involve a combination of clinical evaluation, imaging studies (such as MRI or CT scans), and laboratory tests (including blood work to evaluate coagulation parameters and cardiac enzymes). • ⚠️ Evidence Gaps: There is a need for more high-quality evidence, particularly from randomized controlled trials or systematic reviews, to guide the management of patients at risk of recurrent ischemic stroke, as the current evidence base is predominantly observational.

🧬 Evidence Sources and Study Types`;

  console.log('Sample content analysis:');
  console.log('Length:', sampleContent.length);
  console.log('Contains 📋:', sampleContent.includes('📋'));
  console.log('Contains Clinical Summary:', sampleContent.includes('Clinical Summary'));
  console.log('Contains 🧬:', sampleContent.includes('🧬'));
  console.log('Contains Evidence Sources:', sampleContent.includes('Evidence Sources'));
  
  // Find the positions
  const tldrIndex = sampleContent.indexOf('TL;DR');
  const evidenceIndex = sampleContent.indexOf('🧬');
  console.log('TL;DR at:', tldrIndex);
  console.log('🧬 at:', evidenceIndex);
  
  if (tldrIndex !== -1 && evidenceIndex !== -1) {
    const extracted = sampleContent.substring(tldrIndex, evidenceIndex).trim();
    console.log('Direct extraction:', extracted.substring(0, 200) + '...');
    
    // Try to find the bullet point content
    const bulletStart = extracted.indexOf('•');
    if (bulletStart !== -1) {
      const bulletContent = extracted.substring(bulletStart);
      console.log('Bullet content:', bulletContent.substring(0, 200) + '...');
      
      // Test splitting
      const sections = bulletContent.split('•').filter(s => s.trim());
      console.log(`Split into ${sections.length} sections:`);
      sections.forEach((section, i) => {
        console.log(`${i + 1}:`, section.trim().substring(0, 50) + '...');
      });
    }
  }
};

testScreenshotFormat();

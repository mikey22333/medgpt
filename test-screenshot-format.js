// Test with the exact format from the screenshot
const testScreenshotFormat = () => {
  const sampleContent = `🧾 **Clinical Summary (TL;DR)** • 🎯 **Primary Cause:** Anticoagulation therapy is crucial in reducing the risk of cardioembolic strokes, particularly in vulnerable populations such as patients with atrial fibrillation, artificial heart valves, or left ventricular thrombus, with a confidence level of **** (Moderate). • 🔬 **Secondary Causes:** The reason for anticoagulation failure, which remains a major stroke-care issue, is multifactorial and requires further investigation, with a confidence level of *** (Low). • 🩺 **Diagnostic Tools:** No specific diagnostic tools were identified in the provided research sources. • ⚠️ **Evidence Gaps:** There is a lack of high-quality evidence, such as systematic reviews or randomized controlled trials, to inform the most effective interventions for preventing recurrent ischemic stroke.

🧬 **Evidence Sources and Study Types**`;

  console.log('Content length:', sampleContent.length);
  console.log('Sample start:', sampleContent.substring(0, 100));

  // Try multiple regex patterns
  const patterns = [
    /🧾.*?Clinical Summary.*?([•].*?)🧬/gs,
    /Clinical Summary.*?([•].*?)🧬/gs,
    /TL;DR.*?([•].*?)🧬/gs,
    /([•].*?)🧬/gs,
    /🧾(.*?)🧬/gs
  ];
  
  patterns.forEach((pattern, i) => {
    const match = pattern.exec(sampleContent);
    if (match) {
      console.log(`✅ Pattern ${i + 1} matched:`, match[1].substring(0, 100) + '...');
    } else {
      console.log(`❌ Pattern ${i + 1} failed`);
    }
  });
  
  return false;
};

console.log('Testing screenshot format...');
testScreenshotFormat();

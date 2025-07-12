// Test the new clinical summary formatting
const testNewFormatting = () => {
  const sampleSummary = "• 🎯 Primary Cause: Anticoagulation therapy is crucial in reducing the risk of cardioembolic strokes, particularly in vulnerable populations such as patients with atrial fibrillation, artificial heart valves, or left ventricular thrombus, with a confidence level of **** (Moderate). • 🔬 Secondary Causes: Other interventions such as lifestyle modifications and management of underlying conditions may also play a role in preventing recurrent ischemic stroke, but the current evidence base is limited to observational studies with a confidence level of *** (LOW) as seen in \"10th European Stroke Organisation Conference Abstracts\" (PMID: PMC11157553). • 🩺 Diagnostic Tools: The use of diagnostic tools such as imaging studies and blood tests can help identify individuals at high risk of recurrent ischemic stroke, but the current evidence does not provide clear guidance on the most effective diagnostic approach. • ⚠️ Evidence Gaps: There is a need for high-quality studies, such as randomized controlled trials, to provide more definitive evidence on the most effective interventions for preventing recurrent ischemic stroke.";

  // Test the splitting logic
  const sections = sampleSummary.split('•').filter(section => section.trim());
  
  console.log('Found', sections.length, 'sections:');
  sections.forEach((section, i) => {
    const trimmed = section.trim();
    console.log(`\n--- Section ${i + 1} ---`);
    console.log('Raw:', trimmed.substring(0, 100) + '...');
    
    // Test section type detection
    if (trimmed.includes('Primary Cause:')) {
      console.log('Type: Primary Cause ✅');
    } else if (trimmed.includes('Secondary Causes:')) {
      console.log('Type: Secondary Causes ✅');
    } else if (trimmed.includes('Diagnostic Tools:')) {
      console.log('Type: Diagnostic Tools ✅');
    } else if (trimmed.includes('Evidence Gaps:')) {
      console.log('Type: Evidence Gaps ✅');
    } else {
      console.log('Type: Unknown ❌');
    }
    
    // Test arrow splitting
    const parts = trimmed.split(/→/).map(part => part.trim()).filter(Boolean);
    console.log('Arrow parts:', parts.length);
  });
};

console.log('Testing new clinical summary formatting...');
testNewFormatting();

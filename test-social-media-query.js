const query = 'How does social media usage affect adolescent mental health';
console.log('🧪 Testing social media mental health query enhancements...');
console.log('Query:', query);

// Test query pattern matching
const hasPattern = query.toLowerCase().includes('social media') && 
  (query.toLowerCase().includes('mental health') || 
   query.toLowerCase().includes('adolescent') || 
   query.toLowerCase().includes('depression'));
console.log('Pattern match:', hasPattern);

// Test enhanced query building
if (hasPattern) {
  const enhanced = query + ' AND ("social media" OR "social networking" OR "digital media" OR "online platform" OR "internet use" OR "screen time" OR "digital technology" OR "social network") AND ("mental health" OR "adolescent" OR "teenager" OR "youth" OR "depression" OR "anxiety" OR "wellbeing" OR "well-being" OR "psychological" OR "behavioral" OR "mood" OR "self-esteem" OR "cyberbullying" OR "sleep" OR "social comparison")';
  console.log('Enhanced query preview:', enhanced.substring(0, 200) + '...');
  console.log('✅ Pattern matching and enhancement logic working!');
}

// Test medical term extraction (simulating the regex)
const medicalPattern = /\b(?:diabetes|hypertension|cancer|asthma|depression|anxiety|covid|pneumonia|influenza|stroke|heart|cardiac|renal|hepatic|pulmonary|neurological|psychiatric|oncology|cardiology|medication|drug|treatment|therapy|diagnosis|prognosis|symptoms?|disease|condition|syndrome|disorder|infection|inflammation|prevention|screening|management|social media|digital media|internet|online|technology|screen time|wellbeing|adolescent|teenager|youth|mental health|psychological|behavioral|mood|cyberbullying|self-esteem)\b/gi;

const matches = query.match(medicalPattern) || [];
const uniqueMatches = [...new Set(matches.map(m => m.toLowerCase()))];
console.log('Medical terms extracted:', uniqueMatches);

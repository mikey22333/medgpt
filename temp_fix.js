const fs = require('fs');

// Read the file
const content = fs.readFileSync('f:/projects/medgpt/src/app/api/research/route.ts', 'utf8');
const lines = content.split('\n');

// Find line 1850 and keep everything before it
const keepLines = lines.slice(0, 1850);

// Add proper closing
const closure = [
  '  } catch (error) {',
  '    console.error("Research API error:", error);',
  '    return NextResponse.json(',
  '      { error: "Internal server error" },',
  '      { status: 500 }',
  '    );',
  '  }',
  '}'
];

const finalContent = [...keepLines, ...closure].join('\n');
fs.writeFileSync('f:/projects/medgpt/src/app/api/research/route.ts', finalContent);

console.log('File fixed successfully');

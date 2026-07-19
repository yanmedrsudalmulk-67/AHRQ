const fs = require('fs');
let content = fs.readFileSync('components/Dashboard.tsx', 'utf8');

// The block for 'analisa-data' button starts around 316 and ends at 328
const analisaMatch = content.match(/<button\s+onClick=\{\(\) => setActiveTab\('analisa-data'\)\}[\s\S]*?<\/button>/);
const inputMatch = content.match(/<button\s+onClick=\{\(\) => setActiveTab\('input'\)\}[\s\S]*?<\/button>/);

if (analisaMatch && inputMatch) {
  content = content.replace(analisaMatch[0], '%%%ANALISA_BUTTON%%%');
  content = content.replace(inputMatch[0], '%%%INPUT_BUTTON%%%');

  // We want INPUT then ANALISA
  content = content.replace('%%%ANALISA_BUTTON%%%', inputMatch[0]);
  content = content.replace('%%%INPUT_BUTTON%%%', analisaMatch[0]);
  
  fs.writeFileSync('components/Dashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Matches not found");
}

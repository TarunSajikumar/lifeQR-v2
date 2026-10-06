const fs = require('fs');
const content = fs.readFileSync('app/js/patient-dashboard.js', 'utf8');
const idMatches = [...content.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)/g)];
const ids = idMatches.map(m => m[1]);
console.log('symptomForm matches:', ids.filter(id => id.includes('symptom') || id.includes('History')));

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('symptomForm') || line.includes('addHistoryBtn') || line.includes('historyType')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

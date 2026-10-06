const fs = require('fs');
const js = fs.readFileSync('app/js/doctor-dashboard.js', 'utf8').split('\n');
js.forEach((l, i) => {
  if (l.includes('aiOutputContainer') || l.includes('aiOutput')) {
    console.log(`doctor-dashboard.js:${i+1}: ${l.trim()}`);
  }
});

const html = fs.readFileSync('app/doctor_dashboard.html', 'utf8').split('\n');
html.forEach((l, i) => {
  if (l.includes('aiOutput') || l.includes('ai-output') || l.includes('copilot') || l.includes('aiSummary')) {
    console.log(`doctor_dashboard.html:${i+1}: ${l.trim()}`);
  }
});

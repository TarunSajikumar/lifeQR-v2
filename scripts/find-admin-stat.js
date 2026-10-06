const fs = require('fs');
const js = fs.readFileSync('app/js/admin-dashboard.js', 'utf8').split('\n');
js.forEach((l, i) => {
  if (l.includes('statTotalSos') || l.includes('statTotal') || l.includes('stat')) {
    console.log(`admin-dashboard.js:${i+1}: ${l.trim()}`);
  }
});

const html = fs.readFileSync('app/admin_dashboard.html', 'utf8').split('\n');
html.forEach((l, i) => {
  if (l.includes('stat') || l.includes('Stat') || l.includes('SOS') || l.includes('sos')) {
    console.log(`admin_dashboard.html:${i+1}: ${l.trim()}`);
  }
});

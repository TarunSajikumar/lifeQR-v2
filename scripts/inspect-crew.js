const fs = require('fs');
const content = fs.readFileSync('app/js/crew-dashboard.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('patContactsList') || l.includes('emergencyMapContainer') || l.includes('emergencyMap') || l.includes('googleMapsLink')) {
    console.log(`crew-dashboard.js:${i+1}: ${l.trim()}`);
  }
});

const htmlContent = fs.readFileSync('app/CrewAmbulance_dashboard.html', 'utf8');
const htmlLines = htmlContent.split('\n');
htmlLines.forEach((l, i) => {
  if (l.includes('patContacts') || l.includes('emergencyMap') || l.includes('map') || l.includes('google')) {
    if (i < 300) { // filter
      console.log(`CrewAmbulance_dashboard.html:${i+1}: ${l.trim()}`);
    }
  }
});

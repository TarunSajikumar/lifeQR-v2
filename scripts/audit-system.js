const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('========================================');
console.log('🚑 LIFEQR COMPREHENSIVE SYSTEM AUDIT');
console.log('========================================\n');

// 1. Audit HTML files for dead links and buttons
const appDir = path.join(__dirname, '../app');
const websiteDir = path.join(__dirname, '../website');
const jsDir = path.join(appDir, 'js');

const htmlFiles = fs.readdirSync(appDir).filter(f => f.endsWith('.html') && !f.endsWith('~'));

console.log('--- 1. AUDITING HTML FILES FOR DEAD LINKS & BUTTONS ---');
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(appDir, file), 'utf8');
  
  // Find href="#" or empty href
  const hashMatches = [...content.matchAll(/<a[^>]*href=["'](#[^"']*|)["'][^>]*>(.*?)<\/a>/gis)];
  const deadAnchors = hashMatches.filter(m => {
    const raw = m[0];
    // check if it has onclick or data attribute or if it's purely dead
    return !raw.includes('onclick=') && !raw.includes('data-');
  });
  
  if (deadAnchors.length > 0) {
    console.log(`⚠️  [${file}] has ${deadAnchors.length} potentially unhandled anchor(s):`);
    deadAnchors.slice(0, 5).forEach(m => {
      const text = m[2].replace(/<[^>]+>/g, '').trim().substring(0, 40);
      console.log(`    - href="${m[1]}" text="${text}"`);
    });
  }

  // Find buttons without id and without onclick
  const buttonMatches = [...content.matchAll(/<button([^>]*)>(.*?)<\/button>/gis)];
  const unhookedButtons = [];
  buttonMatches.forEach(b => {
    const attrs = b[1];
    const text = b[2].replace(/<[^>]+>/g, '').trim().substring(0, 40);
    const hasId = attrs.includes('id=');
    const hasOnClick = attrs.includes('onclick=');
    const isSubmit = attrs.includes('type="submit"') || attrs.includes("type='submit'");
    const hasData = attrs.includes('data-');
    if (!hasId && !hasOnClick && !isSubmit && !hasData) {
      unhookedButtons.push({ text, attrs: attrs.trim().substring(0, 50) });
    }
  });

  if (unhookedButtons.length > 0) {
    console.log(`⚠️  [${file}] has ${unhookedButtons.length} unhooked button(s) (no id, no onclick, not submit):`);
    unhookedButtons.slice(0, 5).forEach(b => {
      console.log(`    - "${b.text}" attrs: [${b.attrs}]`);
    });
  }
});

// 2. Audit JS files for missing DOM element IDs
console.log('\n--- 2. AUDITING JS CONTROLLERS FOR MISSING DOM IDs ---');

const pageMapping = {
  'patient-dashboard.js': 'patient_dashboard.html',
  'crew-dashboard.js': 'CrewAmbulance_dashboard.html',
  'doctor-dashboard.js': 'doctor_dashboard.html',
  'er-dashboard.js': 'er_dashboard.html',
  'hospital-dashboard.js': 'hospital_dashboard.html',
  'admin-dashboard.js': 'admin_dashboard.html',
  'emergency-access.js': 'emergency_access.html',
  'patient-app.js': 'patient_app.html'
};

Object.entries(pageMapping).forEach(([jsFile, htmlFile]) => {
  const jsPath = path.join(jsDir, jsFile);
  const htmlPath = path.join(appDir, htmlFile);
  if (!fs.existsSync(jsPath) || !fs.existsSync(htmlPath)) return;

  const jsContent = fs.readFileSync(jsPath, 'utf8');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Find all document.getElementById('...')
  const idMatches = [...jsContent.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)/g)];
  const queriedIds = [...new Set(idMatches.map(m => m[1]))];

  const missingIds = [];
  queriedIds.forEach(id => {
    // Check if ID exists in HTML
    const regex = new RegExp(`id=["']${id}["']`, 'i');
    if (!regex.test(htmlContent)) {
      // Also check if dynamically created in the JS itself
      const dynamicRegex = new RegExp(`id=["']${id}["']|id=\\\\?['"]\\$\\{?${id}|id="${id}"`, 'i');
      if (!dynamicRegex.test(jsContent)) {
        missingIds.push(id);
      }
    }
  });

  if (missingIds.length > 0) {
    console.log(`🚨 [${jsFile} -> ${htmlFile}] queries missing DOM element ID(s):`);
    missingIds.forEach(id => console.log(`    ❌ #${id}`));
  } else {
    console.log(`✅ [${jsFile} -> ${htmlFile}] all ${queriedIds.length} queried IDs exist.`);
  }
});

// 3. Audit API Fetch calls in JS controllers vs backend routes
console.log('\n--- 3. AUDITING API CALLS IN JS CONTROLLERS ---');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('~'));
const allEndpoints = new Set();

jsFiles.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const fetchMatches = [...content.matchAll(/(?:authFetch|fetch|getApiUrl)\s*\(\s*[`'"](\/api\/v1\/[^`'"]+)[`'"]/g)];
  fetchMatches.forEach(m => {
    const rawEp = m[1].split('?')[0]; // strip query params
    allEndpoints.add({ file, endpoint: rawEp });
  });
});

console.log(`Found ${allEndpoints.size} unique API endpoints called across frontend scripts.`);

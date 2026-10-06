const fs = require('fs');
const content = fs.readFileSync('website/index.html', 'utf8');
const idMatches = [...content.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Section IDs in website/index.html:');
const navLinks = ['how-it-works', 'portals', 'who-needs-it', 'capabilities', 'security'];
navLinks.forEach(link => {
  const found = idMatches.includes(link);
  console.log(`- #${link}: ${found ? 'EXISTS ✅' : 'MISSING ❌'}`);
});

console.log('\nAll IDs with "how", "portal", "need", "cap", "sec":');
console.log(idMatches.filter(id => /how|portal|need|cap|sec/i.test(id)));

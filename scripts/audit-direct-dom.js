const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '../app/js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('~'));

console.log('--- AUDITING DIRECT ACCESS ON getElementById WITHOUT NULL CHECK ---');

files.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Look for document.getElementById('...').something without preceding if or optional chaining
    const matches = line.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)\.([a-zA-Z0-9_]+)/g);
    for (const m of matches) {
      const id = m[1];
      const prop = m[2];
      console.log(`[${file}:${idx + 1}] document.getElementById('${id}').${prop}`);
    }
  });
});

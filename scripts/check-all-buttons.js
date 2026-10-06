const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');
const htmlFiles = fs.readdirSync(appDir).filter(f => f.endsWith('.html') && !f.endsWith('~'));

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(appDir, file), 'utf8');
  const buttonMatches = [...content.matchAll(/<button([^>]*)>(.*?)<\/button>/gis)];
  const deadButtons = [];

  buttonMatches.forEach(b => {
    const attrs = b[1];
    const text = b[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const hasId = attrs.includes('id=');
    const hasOnClick = attrs.includes('onclick=');
    const isSubmit = attrs.includes('type="submit"') || attrs.includes("type='submit'");
    const hasData = attrs.includes('data-');
    if (!hasId && !hasOnClick && !isSubmit && !hasData) {
      deadButtons.push({ text: text.substring(0, 50), attrs: attrs.trim() });
    }
  });

  if (deadButtons.length > 0) {
    console.log(`\n=== ${file} (${deadButtons.length} unhooked buttons) ===`);
    deadButtons.forEach(b => {
      console.log(`  Button: "${b.text}"`);
      console.log(`    Attrs: ${b.attrs.substring(0, 100)}`);
    });
  }
});

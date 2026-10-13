const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('Using chrome at:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/website/cinematic-video.html', { waitUntil: 'domcontentloaded' });
  const voices = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let v = speechSynthesis.getVoices();
      if (v.length > 0) return resolve(v.map(x => ({ name: x.name, lang: x.lang })));
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices().map(x => ({ name: x.name, lang: x.lang })));
      };
      setTimeout(() => {
        resolve(speechSynthesis.getVoices().map(x => ({ name: x.name, lang: x.lang })));
      }, 1500);
    });
  });
  console.log('Found', voices.length, 'voices');
  fs.writeFileSync('temp_voices.json', JSON.stringify(voices, null, 2));
  await browser.close();
}

main().catch(err => {
  console.error('ERROR:', err);
  fs.writeFileSync('temp_voices.json', 'Error: ' + err.message);
});

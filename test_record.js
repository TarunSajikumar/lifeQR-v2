const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const TEST_OUT = path.join(__dirname, 'test_export');
if (!fs.existsSync(TEST_OUT)) fs.mkdirSync(TEST_OUT, { recursive: true });

async function testRecord() {
  console.log('Testing 5-second video recording from http://localhost:3000/website/cinematic-video.html...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: TEST_OUT
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/website/cinematic-video.html', { waitUntil: 'networkidle0' });

  await page.waitForFunction(() => window.motionPlayer && window.motionPlayer.canvas);

  console.log('Setting language to en_in...');
  await page.evaluate(() => {
    window.motionPlayer.setLanguage('en_in');
  });

  console.log('Starting export for 5 seconds...');
  await page.evaluate(() => {
    window.motionPlayer.startExport();
  });

  await new Promise(r => setTimeout(r, 6000));

  console.log('Stopping export...');
  await page.evaluate(() => {
    window.motionPlayer.stopExport();
  });

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();

  const files = fs.readdirSync(TEST_OUT);
  console.log('Files in test_export:', files);
  files.forEach(f => {
    const stat = fs.statSync(path.join(TEST_OUT, f));
    console.log(`- ${f}: ${stat.size} bytes`);
  });
}

testRecord().catch(console.error);

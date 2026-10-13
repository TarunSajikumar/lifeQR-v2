/**
 * LifeQR Cinematic Motion Engine — Headless Still & Video Frame Renderer
 * Inspired by the "Motion as Code" renderer workflow from the reference PDF:
 * Usage:
 *   node scripts/render-cinematic-video.js --stills 4.0,15.0,26.0,38.0,50.0,62.0,74.0,84.0,93.0 --out out/stills
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const OUT_DIR = path.join(__dirname, '../out/stills');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Parse CLI arguments
const args = process.argv.slice(2);
let timestamps = [4.0, 15.0, 26.0, 38.0, 50.0, 62.0, 74.0, 84.0, 93.0]; // Default 1 still per plate
let targetLang = 'en_in';

const langIdx = args.indexOf('--lang');
if (langIdx !== -1 && args[langIdx + 1]) {
  targetLang = args[langIdx + 1].trim();
}

const stillsIdx = args.indexOf('--stills');
if (stillsIdx !== -1 && args[stillsIdx + 1]) {
  timestamps = args[stillsIdx + 1].split(',').map(s => parseFloat(s.trim()));
}

async function renderStills() {
  console.log('================================================================');
  console.log('🎬 LIFEQR MOTION AS CODE: HEADLESS 1080P STILL RENDERER');
  console.log('Browser:', CHROME_PATH);
  console.log('Language:', targetLang);
  console.log('Output Directory:', OUT_DIR);
  console.log('Target Timestamps:', timestamps);
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const htmlPath = path.resolve(__dirname, '../website/cinematic-video.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('Loading Motion Studio:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Wait for canvas and engine initialization
  await page.waitForFunction(() => window.motionPlayer && window.motionPlayer.canvas);

  // Set Language
  await page.evaluate((lang) => {
    window.motionPlayer.setLanguage(lang);
  }, targetLang);

  console.log(`Engine initialized with language [${targetLang}]! Rendering stills frame-by-frame...\n`);

  console.log('Engine initialized! Rendering stills frame-by-frame...\n');

  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    console.log(`[${i + 1}/${timestamps.length}] Seeking to t=${t.toFixed(2)}s...`);

    // Seek to exact timestamp in the deterministic engine
    await page.evaluate((time) => {
      window.motionPlayer.seekTo(time);
    }, t);

    // Wait a brief tick for full canvas buffer flush
    await new Promise(r => setTimeout(r, 400));

    // Get plate metadata
    const plateInfo = await page.evaluate(() => {
      const { plate, index } = window.motionPlayer.timeline.getPlateAt(window.motionPlayer.currentTime);
      return { id: plate.id, title: plate.title, index };
    });

    const filename = `plate_${plateInfo.index + 1}_${plateInfo.id}_${targetLang}_t${t.toFixed(1)}s.png`;
    const destPath = path.join(OUT_DIR, filename);

    // Capture the exact 1920x1080 canvas element
    const canvasElement = await page.$('#motionCanvas');
    if (canvasElement) {
      await canvasElement.screenshot({ path: destPath, type: 'png' });
    } else {
      await page.screenshot({ path: destPath, type: 'png' });
    }

    console.log(`   ✓ Saved: ${filename} ("${plateInfo.title}")`);
  }

  await browser.close();
  console.log('\n================================================================');
  console.log('🎉 ALL MOTION AS CODE STILLS RENDERED SUCCESSFULLY!');
  console.log('Check files in:', OUT_DIR);
  console.log('================================================================');
}

renderStills().catch(err => {
  console.error('Fatal rendering error:', err);
  process.exit(1);
});

/**
 * LifeQR Cinematic Motion Engine — Batch 1080p 60fps Broadcast Video Generator
 * Produces full 98-second broadcast-ready videos for all 3 languages:
 * 1. Indian English (EN_IN)
 * 2. Simple Kannada (KN)
 * 3. Simple Hindi (HI)
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const OUT_DIRS = [
  path.join(__dirname, '../website/videos'),
  path.join(__dirname, '../presentation_and_project_details/videos'),
  path.join(__dirname, '../out/videos')
];

OUT_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const TARGET_LANGS = [
  { code: 'en_in', name: 'Indian English' },
  { code: 'kn', name: 'Simple Kannada' },
  { code: 'hi', name: 'Simple Hindi' }
];

const FULL_DURATION = 98; // Full 98-second complete project presentation

async function recordSingleLanguage(browser, langCode, langName) {
  console.log(`\n================================================================`);
  console.log(`🎬 RECORDING 1080P 60FPS: [${langName.toUpperCase()}] (${langCode})`);
  console.log(`Target Duration: ${FULL_DURATION} seconds (Full 9-Plate Sequence)`);
  console.log(`================================================================`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const targetUrl = 'http://localhost:3000/website/cinematic-video.html';
  console.log('Loading studio player...');
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });

  await page.waitForFunction(() => window.motionPlayer && window.motionPlayer.canvas);

  console.log(`Preloading authentic audio narration for [${langCode}]...`);
  await page.evaluate(async (lang) => {
    window.motionPlayer.setLanguage(lang);
    if (window.motionPlayer.audio) {
      window.motionPlayer.audio.ensureContext();
      await window.motionPlayer.audio.preloadLanguage(lang);
    }
  }, langCode);

  await new Promise(r => setTimeout(r, 1200));

  console.log(`Starting 1080p 60fps recording stream...`);
  await page.evaluate(() => {
    window.motionPlayer.startExport();
  });

  const startTime = Date.now();
  const totalMs = (FULL_DURATION - 1.5) * 1000;

  while (Date.now() - startTime < totalMs) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const progress = Math.min(100, Math.floor((elapsed / (FULL_DURATION - 1.5)) * 100));
    process.stdout.write(`\rRecording [${langCode.toUpperCase()}]: ${progress}% (${elapsed}s / ${FULL_DURATION}s)`);
    await new Promise(r => setTimeout(r, 1000));
  }
  process.stdout.write('\n');

  console.log(`Finalizing MediaRecorder stream for [${langCode.toUpperCase()}]...`);

  const base64Data = await page.evaluate(async () => {
    return await window.motionPlayer.stopExportAsync();
  });

  await page.close();

  if (!base64Data) {
    throw new Error(`MediaRecorder returned empty data for ${langCode}`);
  }

  const videoBuffer = Buffer.from(base64Data, 'base64');
  const sizeMb = (videoBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`Stream encoded successfully! Size: ${sizeMb} MB`);

  const fileName = `LifeQR_Project_Plan_Cinematic_${langCode.toUpperCase()}_1080p60.webm`;

  OUT_DIRS.forEach(dir => {
    const fullPath = path.join(dir, fileName);
    fs.writeFileSync(fullPath, videoBuffer);
    console.log(`  ✓ Written: ${fullPath}`);
  });

  console.log(`✓ Completed [${langCode.toUpperCase()}] package!`);
}

async function runBatch() {
  console.log('================================================================');
  console.log('🚀 STARTING LIFEQR MULTI-LANGUAGE BATCH CINEMATIC VIDEO EXPORT');
  console.log('Browser:', CHROME_PATH);
  console.log('Languages to generate:', TARGET_LANGS.map(l => l.name).join(', '));
  console.log('================================================================');

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

  for (const lang of TARGET_LANGS) {
    await recordSingleLanguage(browser, lang.code, lang.name);
    // Cool down between encodes
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();

  console.log('\n================================================================');
  console.log('🎉 ALL 3 MULTI-LANGUAGE CINEMATIC VIDEOS GENERATED SUCCESSFULLY!');
  console.log('1. LifeQR_Project_Plan_Cinematic_EN_IN_1080p60.webm (Indian English)');
  console.log('2. LifeQR_Project_Plan_Cinematic_KN_1080p60.webm (Simple Kannada)');
  console.log('3. LifeQR_Project_Plan_Cinematic_HI_1080p60.webm (Simple Hindi)');
  console.log('================================================================');
}

runBatch().catch(err => {
  console.error('Fatal batch export error:', err);
  process.exit(1);
});

/**
 * LifeQR Cinematic Motion Engine — Headless 1080p 60fps Video Exporter
 * Automates recording the full cinematic sequence with authentic audio and motion graphics.
 * Usage:
 *   node scripts/record-cinematic-video.js --lang <en_in|kn|hi> --duration 98
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

// Parse CLI arguments
const args = process.argv.slice(2);
let targetLang = 'en_in';
let duration = 98; // Full 98-second project plan sequence

const langIdx = args.indexOf('--lang');
if (langIdx !== -1 && args[langIdx + 1]) {
  targetLang = args[langIdx + 1].trim();
}

const durIdx = args.indexOf('--duration');
if (durIdx !== -1 && args[durIdx + 1]) {
  duration = parseFloat(args[durIdx + 1].trim());
}

async function recordVideo() {
  console.log('================================================================');
  console.log('🎬 LIFEQR MOTION AS CODE: HEADLESS 1080P 60FPS VIDEO RECORDER');
  console.log('Browser:', CHROME_PATH);
  console.log('Language:', targetLang.toUpperCase());
  console.log('Duration:', duration, 'seconds');
  console.log('================================================================\n');

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
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Tailwind') && !text.includes('WebSocket')) {
      console.log(`[Browser Console]: ${text}`);
    }
  });

  const targetUrl = 'http://localhost:3000/website/cinematic-video.html';
  console.log('Navigating to Studio:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });

  // Wait for canvas and engine initialization
  await page.waitForFunction(() => window.motionPlayer && window.motionPlayer.canvas);

  console.log(`Preloading audio buffers for [${targetLang}]...`);
  await page.evaluate(async (lang) => {
    window.motionPlayer.setLanguage(lang);
    if (window.motionPlayer.audio) {
      window.motionPlayer.audio.ensureContext();
      await window.motionPlayer.audio.preloadLanguage(lang);
    }
  }, targetLang);

  // Give 1 second for decodeAudioData to settle
  await new Promise(r => setTimeout(r, 1000));

  console.log(`Engine ready! Starting 1080p 60fps MediaRecorder stream for ${duration}s...`);

  // Start video recording
  await page.evaluate(() => {
    window.motionPlayer.startExport();
  });

  // Monitor progress
  const startTime = Date.now();
  const totalMs = duration * 1000;

  while (Date.now() - startTime < totalMs) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
    process.stdout.write(`\rRecording 1080p: ${progress}% (${elapsed}s / ${duration}s)`);
    await new Promise(r => setTimeout(r, 1000));
  }
  process.stdout.write('\n');

  console.log('Sequence complete! Finalizing MediaRecorder buffer and encoding...');

  // Stop export and retrieve base64 data directly
  const base64Data = await page.evaluate(async () => {
    return await window.motionPlayer.stopExportAsync();
  });

  await browser.close();

  if (!base64Data) {
    throw new Error('MediaRecorder returned empty video data.');
  }

  const videoBuffer = Buffer.from(base64Data, 'base64');
  console.log(`Successfully generated video stream! Buffer size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

  const fileName = `LifeQR_Project_Plan_Cinematic_${targetLang.toUpperCase()}_1080p60.webm`;

  OUT_DIRS.forEach(dir => {
    const fullPath = path.join(dir, fileName);
    fs.writeFileSync(fullPath, videoBuffer);
    console.log(`  ✓ Saved: ${fullPath} (${videoBuffer.length} bytes)`);
  });

  console.log('\n================================================================');
  console.log(`🎉 1080P 60FPS VIDEO FOR [${targetLang.toUpperCase()}] PACKAGED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

recordVideo().catch(err => {
  console.error('Fatal recording error:', err);
  process.exit(1);
});

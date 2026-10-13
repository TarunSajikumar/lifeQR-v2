const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('dialog', async dialog => {
    console.log('BROWSER DIALOG ALERT:', dialog.message());
    await dialog.dismiss();
  });

  await page.goto('http://localhost:3000/website/cinematic-video.html', { waitUntil: 'networkidle0' });

  const result = await page.evaluate(async () => {
    try {
      if (!window.motionPlayer) return { error: 'No motionPlayer' };
      const res = {};
      res.hasMediaRecorder = !!window.MediaRecorder;
      res.hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
      
      const canvasStream = window.motionPlayer.canvas.captureStream(60);
      res.canvasVideoTracks = canvasStream.getVideoTracks().length;
      
      const audioTrack = window.motionPlayer.audio.getAudioStreamTrack();
      res.hasAudioTrack = !!audioTrack;
      
      return res;
    } catch (e) {
      return { error: e.stack || e.message };
    }
  });

  console.log('Check result:', JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(console.error);

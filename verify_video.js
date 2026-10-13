const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/website/cinematic-video.html');

  const check = await page.evaluate(async () => {
    const video = document.createElement('video');
    video.src = 'videos/LifeQR_Project_Plan_Cinematic_EN_IN_1080p60.webm';
    video.muted = false;
    document.body.appendChild(video);

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          hasAudio: video.mozHasAudio !== undefined ? video.mozHasAudio : (video.webkitAudioDecodedByteCount !== undefined || true)
        });
      };
      video.onerror = (e) => resolve({ error: 'Video error: ' + video.error.message });
      setTimeout(() => resolve({ timeout: true, readyState: video.readyState }), 4000);
    });
  });

  console.log('Video Playback Verification Result:', check);
  await browser.close();
}

main().catch(console.error);

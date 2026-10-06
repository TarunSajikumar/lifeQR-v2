const puppeteer = require('puppeteer-core');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\tarun\\.gemini\\antigravity-ide\\brain\\61086aaf-aa0d-49ed-ad16-150ae5d8679b';

function loginAndGetToken(email, password) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        let token = null;
        if (cookies) {
          for (const c of cookies) {
            const m = c.match(/token=([^;]+)/);
            if (m) { token = m[1]; break; }
          }
        }
        resolve(token);
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function captureHelpScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  // 1. Doctor Dashboard
  console.log('1. Authenticating as Doctor...');
  const docToken = await loginAndGetToken('doctor@lifeqr.com', 'Password@123');
  await page.setCookie({
    name: 'token',
    value: docToken,
    url: 'http://localhost:5000'
  });

  console.log('Navigating to doctor_dashboard.html...');
  await page.goto('http://localhost:5000/doctor_dashboard.html', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    if (window.openHelpModal) window.openHelpModal();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'doctor_help_modal.png') });
  console.log('Saved doctor_help_modal.png');

  await page.evaluate(() => {
    if (window.switchHelpTab) window.switchHelpTab('history');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'doctor_help_history.png') });
  console.log('Saved doctor_help_history.png');

  // 2. Admin Dashboard
  console.log('\n2. Authenticating as Admin...');
  const currentCookies = await page.cookies();
  if (currentCookies.length > 0) {
    await page.deleteCookie(...currentCookies);
  }

  const adminToken = await loginAndGetToken('admin@lifeqr.com', 'Password@123');
  await page.setCookie({
    name: 'token',
    value: adminToken,
    url: 'http://localhost:5000'
  });

  console.log('Navigating to admin_dashboard.html...');
  await page.goto('http://localhost:5000/admin_dashboard.html', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to helpTickets tab
  await page.evaluate(() => {
    if (window.switchTab) window.switchTab('helpTickets');
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_help_tickets_tab.png') });
  console.log('Saved admin_help_tickets_tab.png');

  // Open Inspect / Resolve modal on the first ticket
  await page.evaluate(() => {
    const btn = document.querySelector('#helpTicketsTableBody button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_ticket_resolve_modal.png') });
  console.log('Saved admin_ticket_resolve_modal.png');

  // 3. Patient Dashboard
  console.log('\n3. Authenticating as Patient...');
  const currentCookies2 = await page.cookies();
  if (currentCookies2.length > 0) {
    await page.deleteCookie(...currentCookies2);
  }

  const patToken = await loginAndGetToken('patient@lifeqr.com', 'Password@123');
  await page.setCookie({
    name: 'token',
    value: patToken,
    url: 'http://localhost:5000'
  });

  console.log('Navigating to patient_dashboard.html...');
  await page.goto('http://localhost:5000/patient_dashboard.html', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    if (window.openPatientHelpModal) window.openPatientHelpModal();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'patient_help_modal.png') });
  console.log('Saved patient_help_modal.png');

  await browser.close();
  console.log('\nALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureHelpScreenshots().catch(console.error);

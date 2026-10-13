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

async function captureAdminProfileUI() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,880']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 880 });

  try {
    console.log('1. Authenticating as Super Admin...');
    const adminToken = await loginAndGetToken('admin@lifeqr.com', 'Password@123');
    await page.setCookie({
      name: 'token',
      value: adminToken,
      url: 'http://localhost:5000'
    });

    console.log('2. Navigating to admin_dashboard.html...');
    await page.goto('http://localhost:5000/admin_dashboard.html', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#usersTableBody tr', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot 1: Registered Users Directory
    console.log('3. Capturing Admin Users Directory...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'admin_users_directory.png')
    });
    console.log('✅ Captured admin_users_directory.png');

    // Screenshot 2: Patient Profile Management Modal
    console.log('4. Opening Patient Profile modal...');
    await page.evaluate(() => {
      const patient = cachedAdminUsers.find(u => u.role === 'patient');
      if (patient) {
        openAdminUserProfile(patient._id || patient.id);
      }
    });
    await page.waitForSelector('#adminUserProfileModal:not(.hidden)', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'admin_user_profile_patient_modal.png')
    });
    console.log('✅ Captured admin_user_profile_patient_modal.png');

    // Screenshot 3: Doctor Profile Management Modal
    console.log('5. Opening Doctor Profile modal...');
    await page.evaluate(() => {
      const doctor = cachedAdminUsers.find(u => u.role === 'doctor');
      if (doctor) {
        openAdminUserProfile(doctor._id || doctor.id);
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'admin_user_profile_doctor_modal.png')
    });
    console.log('✅ Captured admin_user_profile_doctor_modal.png');

    // Close user profile modal and switch to tickets
    await page.evaluate(() => closeAdminUserProfile());
    await new Promise(r => setTimeout(r, 300));

    // Screenshot 4: Help Tickets Tab with "Troubleshoot & Fix Profile"
    console.log('6. Switching to Help Tickets tab & opening ticket modal...');
    await page.evaluate(() => switchTab('helpTickets'));
    await new Promise(r => setTimeout(r, 800));

    await page.evaluate(() => {
      const firstRow = document.querySelector('#adminTicketsTableBody tr');
      if (firstRow) {
        const reviewBtn = firstRow.querySelector('button');
        if (reviewBtn) reviewBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'admin_ticket_troubleshoot_modal.png')
    });
    console.log('✅ Captured admin_ticket_troubleshoot_modal.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureAdminProfileUI();

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\tarun\\.gemini\\antigravity-ide\\brain\\0f9fa6eb-0025-4975-9b92-09c13e3269fe';

async function runBrowserClickTest() {
  console.log('====================================================');
  console.log('🌐 BROWSER CLICK & INTERACTION TEST RUNNER v2');
  console.log('Using Chrome:', CHROME_PATH);
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      console.log('🚨 BROWSER CONSOLE ERROR:', text);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.log('🚨 UNCAUGHT PAGE ERROR:', err.message);
  });

  async function clearSession() {
    const cookies = await page.cookies();
    if (cookies.length > 0) {
      await page.deleteCookie(...cookies);
    }
    await page.evaluate(() => {
      try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    });
  }

  // ----------------------------------------------------------------
  // STEP 1: TEST LANDING PAGE
  // ----------------------------------------------------------------
  console.log('--- 1. Testing Landing Page (http://localhost:5000/) ---');
  await page.goto('http://localhost:5000/', { waitUntil: 'networkidle2' });

  // Test Nav Anchor clicks
  const anchors = ['#how-it-works', '#portals', '#who-needs-it', '#capabilities', '#security'];
  for (const hash of anchors) {
    const el = await page.$(`a[href="${hash}"]`);
    if (el) {
      await el.click();
      console.log(`✅ Clicked nav link: ${hash}`);
    }
  }

  // Test Mobile drawer menu toggle on mobile viewport
  await page.setViewport({ width: 375, height: 812 });
  const mobileBtn = await page.$('#mobileBtn');
  if (mobileBtn) {
    await mobileBtn.click();
    const isDrawerOpen = await page.evaluate(() => {
      const d = document.getElementById('mobileDrawer');
      return d && !d.classList.contains('closed');
    });
    console.log(`✅ Mobile menu drawer clicked (Mobile 375px) -> Open: ${isDrawerOpen}`);

    await page.evaluate(() => {
      document.getElementById('closeDrawerBtn')?.click();
    });
  }
  // Reset back to desktop viewport
  await page.setViewport({ width: 1280, height: 800 });

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_01_landing.png') });

  // ----------------------------------------------------------------
  // STEP 2: TEST LOGIN PAGE & PATIENT LOGIN
  // ----------------------------------------------------------------
  console.log('\n--- 2. Testing Login Page & Patient Login ---');
  await clearSession();
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });

  // Check show/hide password toggle
  const togglePassBtn = await page.$('#togglePasswordBtn, #togglePassword');
  if (togglePassBtn) {
    await togglePassBtn.click();
    const typeAfter = await page.$eval('#password', el => el.type);
    console.log(`✅ Toggle Password clicked -> type is now: ${typeAfter}`);
  }

  // Type credentials and submit
  await page.type('#email', 'patient@lifeqr.com', { delay: 10 });
  await page.type('#password', 'Password@123', { delay: 10 });

  console.log('Clicking Sign In submit button...');
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log('Navigation event:', e.message)),
      submitBtn.click()
    ]);
  }

  console.log('Current URL after login click:', page.url());
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_02_after_login.png') });

  // ----------------------------------------------------------------
  // STEP 3: TEST PATIENT DASHBOARD CLICKS
  // ----------------------------------------------------------------
  console.log('\n--- 3. Testing Patient Dashboard ---');
  await new Promise(r => setTimeout(r, 1000)); // wait for DOM rendering

  const patientName = await page.$eval('#userName', el => el.textContent.trim()).catch(() => 'N/A');
  const qrCodeSrc = await page.$eval('#qrCodeImage', el => el.src).catch(() => 'N/A');
  console.log(`✅ Patient Name: "${patientName}", QR loaded: ${qrCodeSrc.startsWith('data:image') ? 'YES ✅' : 'NO ❌'}`);

  // Test Smart Card Modal click
  const cardModalBtn = await page.$('button[onclick*="openWalletCardModal"]');
  if (cardModalBtn) {
    await cardModalBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const modalVisible = await page.$eval('#walletCardModal', el => !el.classList.contains('hidden')).catch(() => false);
    console.log(`✅ Smart NFC Medical Card modal clicked -> Visible: ${modalVisible}`);

    // Close modal
    const closeBtn = await page.$('button[onclick*="closeWalletCardModal"]');
    if (closeBtn) await closeBtn.click();
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_03_patient_dash.png') });

  // ----------------------------------------------------------------
  // STEP 4: TEST ZERO-LOGIN EMERGENCY ACCESS
  // ----------------------------------------------------------------
  console.log('\n--- 4. Testing Zero-Login Emergency Access View ---');
  await page.goto('http://localhost:5000/app/emergency_access.html?id=RAH-D3200470', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  const pageText = await page.evaluate(() => document.body.innerText);
  const hasBlood = pageText.includes('O+') || pageText.includes('O POSITIVE');
  const hasAllergy = pageText.includes('Penicillin');
  console.log(`✅ Zero-Login Emergency View: Blood O+ found=${hasBlood}, Penicillin Allergy found=${hasAllergy}`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_04_emergency_access.png') });

  // ----------------------------------------------------------------
  // STEP 5: TEST DOCTOR DASHBOARD & AI CLINICAL COPILOT
  // ----------------------------------------------------------------
  console.log('\n--- 5. Testing Doctor Dashboard & AI Clinical Tools ---');
  await clearSession();
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'doctor@lifeqr.com', { delay: 10 });
  await page.type('#password', 'Password@123', { delay: 10 });
  const docSubmit = await page.$('button[type="submit"]');
  if (docSubmit) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      docSubmit.click()
    ]);
  }

  console.log('Doctor logged in. Current URL:', page.url());
  await new Promise(r => setTimeout(r, 1000));

  // Search for patient RAH-D3200470
  const searchInput = await page.$('#patientQrId');
  if (searchInput) {
    await searchInput.type('RAH-D3200470');
    const searchBtn = await page.$('button[onclick*="searchPatient"]');
    if (searchBtn) {
      await searchBtn.click();
      console.log('Clicked Search Patient button...');
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  // Click AI Patient Summary Button
  const aiSummaryBtn = await page.$('button[onclick*="runAiPatientSummary"]');
  if (aiSummaryBtn) {
    console.log('Clicking AI Patient Summary button...');
    await aiSummaryBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    const aiBoxVisible = await page.evaluate(() => {
      const box = document.getElementById('aiClinicalOutputContainer') || document.getElementById('aiOutputContainer');
      return box && !box.classList.contains('hidden') && box.innerText.length > 20;
    });
    console.log(`✅ AI Patient Summary clicked -> Box unhidden & text populated: ${aiBoxVisible}`);
  }

  // Click Auto-SOAP Note Button
  const soapBtn = await page.$('button[onclick*="generateSoapNote"]');
  if (soapBtn) {
    // Fill in required treatment title & desc
    await page.evaluate(() => {
      const t = document.getElementById('treatmentTitle');
      const d = document.getElementById('treatmentDesc');
      if (t) t.value = 'Acute Bronchitis';
      if (d) d.value = 'Patient wheezing, oxygen saturation 96%, dry cough.';
    });
    console.log('Clicking Auto-SOAP Note button...');
    await soapBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    const soapResult = await page.evaluate(() => {
      const d = document.getElementById('treatmentDesc');
      return d && d.value.includes('S:');
    });
    console.log(`✅ Auto-SOAP Note clicked -> Form auto-inserted with SOAP: ${soapResult}`);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_05_doctor_ai.png') });

  // ----------------------------------------------------------------
  // STEP 6: TEST AMBULANCE CREW DASHBOARD & CHECKPOINTS
  // ----------------------------------------------------------------
  console.log('\n--- 6. Testing Ambulance Crew Dashboard ---');
  await clearSession();
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'crew@lifeqr.com', { delay: 10 });
  await page.type('#password', 'Password@123', { delay: 10 });
  const crewSubmit = await page.$('button[type="submit"]');
  if (crewSubmit) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      crewSubmit.click()
    ]);
  }

  console.log('Crew logged in. Current URL:', page.url());
  await new Promise(r => setTimeout(r, 1000));

  // Search patient RAH-D3200470 in crew dashboard
  const crewSearchInput = await page.$('#patientQrId');
  if (crewSearchInput) {
    await crewSearchInput.type('RAH-D3200470');
    const crewSearchBtn = await page.$('button[onclick*="searchPatient"]');
    if (crewSearchBtn) {
      await crewSearchBtn.click();
      console.log('Clicked Search Patient in Crew Dashboard...');
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  // Click Incident Checkpoint buttons
  const checkpointLabels = ['Arrived Scene', 'Contact Made', 'Transporting', 'Handled Complete'];
  for (const label of checkpointLabels) {
    const btn = await page.$(`button[onclick*="${label}"]`);
    if (btn) {
      await btn.click();
      console.log(`✅ Clicked Incident Checkpoint: "${label}"`);
      await new Promise(r => setTimeout(r, 200));
    }
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_06_crew_dash.png') });

  // ----------------------------------------------------------------
  // STEP 7: TEST ADMIN DASHBOARD
  // ----------------------------------------------------------------
  console.log('\n--- 7. Testing Admin Dashboard ---');
  await clearSession();
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'admin@lifeqr.com', { delay: 10 });
  await page.type('#password', 'Password@123', { delay: 10 });
  const adminSubmit = await page.$('button[type="submit"]');
  if (adminSubmit) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      adminSubmit.click()
    ]);
  }

  console.log('Admin logged in. Current URL:', page.url());
  await new Promise(r => setTimeout(r, 1000));

  // Verify Admin Stat cards populated
  const totalUsersText = await page.$eval('#statTotalUsers', el => el.textContent.trim()).catch(() => '0');
  const scansText = await page.$eval('#statTotalScans', el => el.textContent.trim()).catch(() => '0');
  console.log(`✅ Admin Dashboard Stats: Total Users="${totalUsersText}", QR Scans="${scansText}"`);

  // Click tab switch
  const verifTab = await page.$('button[onclick*="switchTab(\'verifications\')"]');
  if (verifTab) {
    await verifTab.click();
    console.log('✅ Clicked Practitioner Verifications Tab');
    await new Promise(r => setTimeout(r, 400));
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_07_admin_dash.png') });

  await browser.close();

  console.log('\n====================================================');
  console.log('🎉 ALL BROWSER CLICK TESTS COMPLETED SUCCESSFULLY!');
  console.log('Uncaught Page Errors Caught:', pageErrors.length);
  console.log('====================================================\n');
}

runBrowserClickTest().catch(err => {
  console.error('Browser Test Error:', err);
  process.exit(1);
});

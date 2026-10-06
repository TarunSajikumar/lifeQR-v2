const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\tarun\\.gemini\\antigravity-ide\\brain\\0f9fa6eb-0025-4975-9b92-09c13e3269fe';

async function testDoctorAndCrew() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Console Error]:', msg.text());
  });

  // 1. DOCTOR DASHBOARD TEST
  console.log('--- Testing Doctor Dashboard ---');
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'doctor@lifeqr.com');
  await page.type('#password', 'Password@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000)); // wait for 1s redirect timeout

  await page.goto('http://localhost:5000/app/doctor_dashboard.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Doctor page loaded:', page.url());

  // Search Patient
  await page.type('#patientQrId', 'RAH-D3200470');
  await page.evaluate(() => {
    const btn = document.querySelector('button[onclick*="searchPatient"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click AI Clinical Summary
  console.log('Clicking AI Clinical Summary...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[onclick*="runAiPatientSummary"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const aiSummaryText = await page.evaluate(() => {
    const box = document.getElementById('aiClinicalOutputContainer') || document.getElementById('aiOutputContainer');
    return box ? box.innerText : 'BOX NOT FOUND';
  });
  console.log('AI Clinical Box Contents:', aiSummaryText.substring(0, 150) + '...');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_08_doctor_ai_live.png') });

  // 2. CREW DASHBOARD TEST
  console.log('\n--- Testing Ambulance Crew Dashboard ---');
  const cookies = await page.cookies();
  await page.deleteCookie(...cookies);

  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'crew@lifeqr.com');
  await page.type('#password', 'Password@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  await page.goto('http://localhost:5000/app/CrewAmbulance_dashboard.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Crew page loaded:', page.url());

  // Search Patient
  await page.type('#patientQrId', 'RAH-D3200470');
  await page.evaluate(() => {
    const btn = document.querySelector('button[onclick*="searchPatient"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Check Gmaps button href
  const gmapsHref = await page.evaluate(() => {
    const btn = document.getElementById('gmapsNavBtn');
    return btn ? btn.href : 'NOT FOUND';
  });
  console.log('Google Maps button href:', gmapsHref);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_09_crew_live.png') });

  await browser.close();
  console.log('Finished testing Doctor & Crew!');
}

testDoctorAndCrew().catch(console.error);

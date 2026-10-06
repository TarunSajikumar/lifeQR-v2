const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\tarun\\.gemini\\antigravity-ide\\brain\\0f9fa6eb-0025-4975-9b92-09c13e3269fe';

async function testClickPatientIn() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'doctor@lifeqr.com');
  await page.type('#password', 'Password@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  await page.goto('http://localhost:5000/app/doctor_dashboard.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  console.log('Clicking "CALL PATIENT IN" on Token 1 (Rahul Sharma)...');
  await page.evaluate(() => {
    // find button with text CALL PATIENT IN
    const btns = Array.from(document.querySelectorAll('button'));
    const callBtn = btns.find(b => b.innerText.includes('CALL PATIENT IN'));
    if (callBtn) callBtn.click();
    else if (window.selectPatientFromQueue) window.selectPatientFromQueue('RAH-D3200470');
  });
  await new Promise(r => setTimeout(r, 2000));

  // Now click AI Clinical Summary
  console.log('Clicking AI Patient Summary with active patient...');
  await page.evaluate(() => {
    const aiBtn = document.querySelector('button[onclick*="runAiPatientSummary"]');
    if (aiBtn) aiBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => {
    const box = document.getElementById('aiClinicalOutputContainer') || document.getElementById('aiOutputContainer');
    return box ? box.innerText : 'BOX NOT FOUND';
  });
  console.log('Resulting AI Summary text:', text);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_10_doctor_patient_loaded.png') });
  await browser.close();
}

testClickPatientIn().catch(console.error);

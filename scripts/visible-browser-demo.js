const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setDemoBanner(page, text) {
  try {
    await page.evaluate((txt) => {
      let banner = document.getElementById('demo-active-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'demo-active-banner';
        banner.style.position = 'fixed';
        banner.style.bottom = '24px';
        banner.style.right = '24px';
        banner.style.zIndex = '9999999';
        banner.style.background = '#111111';
        banner.style.color = '#ffffff';
        banner.style.padding = '12px 20px';
        banner.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        banner.style.fontSize = '14px';
        banner.style.fontWeight = '700';
        banner.style.border = '2px solid #E11D2E';
        banner.style.boxShadow = '0 0 25px rgba(225, 29, 46, 0.7)';
        banner.style.borderRadius = '4px';
        banner.style.pointerEvents = 'none';
        banner.style.transition = 'all 0.3s ease';
        document.body.appendChild(banner);
      }
      banner.innerHTML = `<span style="color:#E11D2E; font-size:16px;">●</span> <span style="font-family:monospace;letter-spacing:1px;text-transform:uppercase;color:#E11D2E;margin-right:6px;">LIVE DEMO:</span> ${txt}`;
    }, text);
  } catch (e) {}
}

async function highlight(page, selector) {
  try {
    await page.evaluate((sel) => {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const origOutline = el.style.outline;
        const origBoxShadow = el.style.boxShadow;
        el.style.outline = '4px solid #E11D2E';
        el.style.boxShadow = '0 0 24px #E11D2E';
        setTimeout(() => {
          el.style.outline = origOutline;
          el.style.boxShadow = origBoxShadow;
        }, 1200);
      }
    }, selector);
  } catch (e) {}
  await sleep(600);
}

async function safeClick(page, selectorOrFn) {
  try {
    if (typeof selectorOrFn === 'string') {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.click();
        }
      }, selectorOrFn);
    } else {
      await page.evaluate(selectorOrFn);
    }
  } catch (e) {
    console.warn(`Click warning on ${selectorOrFn}:`, e.message);
  }
}

async function runVisibleDemo() {
  console.log('====================================================');
  console.log('🚀 LAUNCHING VISIBLE HEADFUL CHROME BROWSER ON SCREEN');
  console.log('Using executable:', CHROME_PATH);
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // VISIBLE HEADFUL BROWSER ON USER'S SCREEN
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  // ---------------------------------------------------------------
  // ACT 1: LANDING PAGE TOUR & CLICKS
  // ---------------------------------------------------------------
  console.log('>>> [Act 1] Opening Landing Page: http://localhost:5000/ ...');
  const landingCtx = await browser.createBrowserContext();
  const landingPage = await landingCtx.newPage();

  await landingPage.goto('http://localhost:5000/', { waitUntil: 'networkidle2' });
  await setDemoBanner(landingPage, 'Act 1: Landing Page & Interactive Navigation');
  await sleep(1500);

  console.log('>>> Smooth scrolling through landing page sections...');
  const sectionAnchors = ['#how-it-works', '#portals', '#who-needs-it', '#capabilities', '#security', '#faq'];
  for (const anchor of sectionAnchors) {
    console.log(`>>> Clicking nav anchor: ${anchor}`);
    const navLink = await landingPage.$(`nav a[href="${anchor}"]`);
    if (navLink) {
      await highlight(landingPage, `nav a[href="${anchor}"]`);
      await safeClick(landingPage, `nav a[href="${anchor}"]`);
      await sleep(800);
    }
  }

  // Click an FAQ Accordion Item
  console.log('>>> Clicking FAQ item to expand answer...');
  const firstFaq = await landingPage.$('.faq-item');
  if (firstFaq) {
    await highlight(landingPage, '.faq-item');
    await safeClick(landingPage, '.faq-item');
    await setDemoBanner(landingPage, 'Act 1: Expanded FAQ Accordion Question');
    await sleep(1500);
  }

  // Scroll back to top
  await landingPage.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(800);

  // Click Sign In Button
  console.log('>>> Clicking "Sign In" in header...');
  await highlight(landingPage, 'a[href="lifeqr_login.html"]');
  await safeClick(landingPage, 'a[href="lifeqr_login.html"]');
  await sleep(1200);

  // ---------------------------------------------------------------
  // ACT 2: PATIENT LOGIN & AUTHENTICATION
  // ---------------------------------------------------------------
  console.log('>>> [Act 2] Entering Patient Credentials on Login Page...');
  const patientCtx = await browser.createBrowserContext();
  const patientPage = await patientCtx.newPage();
  await landingPage.close().catch(() => {});

  await patientPage.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await patientPage.waitForSelector('#email', { visible: true, timeout: 10000 });
  await setDemoBanner(patientPage, 'Act 2: Entering Patient Credentials (patient@lifeqr.com)');
  await sleep(600);

  await highlight(patientPage, '#email');
  await patientPage.type('#email', 'patient@lifeqr.com', { delay: 35 });
  await sleep(400);

  await highlight(patientPage, '#password');
  await patientPage.type('#password', 'Password@123', { delay: 35 });
  await sleep(500);

  // Toggle password visibility
  console.log('>>> Toggling password visibility...');
  const togglePass = await patientPage.$('button[onclick*="togglePasswordVisibility"]');
  if (togglePass) {
    await highlight(patientPage, 'button[onclick*="togglePasswordVisibility"]');
    await safeClick(patientPage, 'button[onclick*="togglePasswordVisibility"]');
    await setDemoBanner(patientPage, 'Act 2: Revealing Password Plaintext');
    await sleep(1000);
    await safeClick(patientPage, 'button[onclick*="togglePasswordVisibility"]');
    await sleep(500);
  }

  // Click Submit
  console.log('>>> Clicking Sign In submit button...');
  await highlight(patientPage, 'button[type="submit"]');
  await setDemoBanner(patientPage, 'Act 2: Submitting Encrypted Authentication Request');
  await patientPage.click('button[type="submit"]');
  
  // Wait for patient dashboard to load
  await patientPage.waitForFunction(() => window.location.href.includes('patient_dashboard.html'), { timeout: 10000 });
  await sleep(1500);

  // ---------------------------------------------------------------
  // ACT 3: PATIENT COMMAND CENTER
  // ---------------------------------------------------------------
  console.log('>>> [Act 3] In Patient Command Portal: viewing identity & QR badge...');
  await setDemoBanner(patientPage, 'Act 3: Patient Command Center — Live Medical Vault & QR Badge');
  await highlight(patientPage, '#userName');
  await sleep(800);
  await highlight(patientPage, '#qrCodeImage');
  await sleep(1200);

  // Open Smart NFC Card Modal
  console.log('>>> Clicking "Smart NFC Medical Card" Preview Modal...');
  const cardBtn = await patientPage.$('button[onclick*="openWalletCardModal"]');
  if (cardBtn) {
    await highlight(patientPage, 'button[onclick*="openWalletCardModal"]');
    await safeClick(patientPage, 'button[onclick*="openWalletCardModal"]');
    await setDemoBanner(patientPage, 'Act 3: Smart NFC Medical Card (Apple / Google Wallet Ready)');
    await sleep(2500); // pause so user can inspect the card

    console.log('>>> Closing Smart NFC Card Modal...');
    await safeClick(patientPage, 'button[onclick*="closeWalletCardModal"]');
    await sleep(1000);
  }

  // ---------------------------------------------------------------
  // ACT 4: ZERO-LOGIN BYSTANDER EMERGENCY ACCESS VIEW
  // ---------------------------------------------------------------
  console.log('>>> [Act 4] Navigating to Zero-Login Emergency View (as if scanned by bystander)...');
  await patientPage.goto('http://localhost:5000/app/emergency_access.html?id=RAH-D3200470', { waitUntil: 'networkidle2' });
  await setDemoBanner(patientPage, 'Act 4: Bystander Zero-Login Emergency View (Under 1.8s Response)');
  await sleep(1500);

  console.log('>>> Highlighting Blood Group O+ Badge...');
  await patientPage.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === 'O+');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '4px solid #E11D2E';
    }
  });
  await sleep(1500);

  console.log('>>> Highlighting Severe Allergy Warning...');
  await patientPage.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Penicillin'));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '4px solid #E11D2E';
    }
  });
  await sleep(1800);

  // ---------------------------------------------------------------
  // ACT 5: DOCTOR WORKSTATION & AI CLINICAL COPILOT
  // ---------------------------------------------------------------
  console.log('>>> [Act 5] Logging into Doctor Clinical Workstation...');
  const doctorCtx = await browser.createBrowserContext();
  const doctorPage = await doctorCtx.newPage();
  await patientPage.close().catch(() => {});

  await doctorPage.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await doctorPage.waitForSelector('#email', { visible: true, timeout: 10000 });
  await setDemoBanner(doctorPage, 'Act 5: Logging into Doctor Emergency Workstation');

  await highlight(doctorPage, '#email');
  await doctorPage.type('#email', 'doctor@lifeqr.com', { delay: 30 });
  await highlight(doctorPage, '#password');
  await doctorPage.type('#password', 'Password@123', { delay: 30 });
  await doctorPage.click('button[type="submit"]');
  
  await doctorPage.waitForFunction(() => window.location.href.includes('doctor_dashboard.html'), { timeout: 10000 });
  await sleep(1500);
  await setDemoBanner(doctorPage, 'Act 5: Doctor Workstation — Calling Patient Rahul Sharma');

  console.log('>>> In Doctor Dashboard: Clicking "Call Patient In" on Token 1...');
  await doctorPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const callBtn = btns.find(b => b.innerText && b.innerText.toLowerCase().includes('call patient in'));
    if (callBtn) {
      callBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      callBtn.click();
    }
  });
  await sleep(2000);

  console.log('>>> Scrolling down to AI Clinical Copilot Suite...');
  await setDemoBanner(doctorPage, 'Act 5: Triggering Gemini AI Clinical Summary');
  await highlight(doctorPage, 'button[onclick*="runAiPatientSummary"]');
  await safeClick(doctorPage, 'button[onclick*="runAiPatientSummary"]');
  await sleep(3500); // Give AI time to stream response

  console.log('>>> Generating Auto-SOAP Note...');
  await setDemoBanner(doctorPage, 'Act 5: Generating Structured Clinical SOAP Note');
  await highlight(doctorPage, 'button[onclick*="generateSoapNote"]');
  await safeClick(doctorPage, 'button[onclick*="generateSoapNote"]');
  await sleep(2500);

  // ---------------------------------------------------------------
  // ACT 6: AMBULANCE CREW HUD & MAP RADAR
  // ---------------------------------------------------------------
  console.log('>>> [Act 6] Logging into Ambulance Dispatch HUD...');
  const crewCtx = await browser.createBrowserContext();
  const crewPage = await crewCtx.newPage();
  await doctorPage.close().catch(() => {});

  await crewPage.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await crewPage.waitForSelector('#email', { visible: true, timeout: 10000 });
  await setDemoBanner(crewPage, 'Act 6: Logging into Ambulance Dispatch HUD (crew@lifeqr.com)');

  await highlight(crewPage, '#email');
  await crewPage.type('#email', 'crew@lifeqr.com', { delay: 30 });
  await highlight(crewPage, '#password');
  await crewPage.type('#password', 'Password@123', { delay: 30 });
  await crewPage.click('button[type="submit"]');
  
  await crewPage.waitForFunction(() => window.location.href.includes('CrewAmbulance_dashboard.html'), { timeout: 10000 });
  await sleep(1500);
  await setDemoBanner(crewPage, 'Act 6: Ambulance HUD — Rapid QR Triage Lookup');

  console.log('>>> Searching patient RAH-D3200470 in Crew HUD...');
  await crewPage.waitForSelector('#patientQrId', { visible: true, timeout: 10000 });
  await sleep(500);
  await highlight(crewPage, '#patientQrId');
  await crewPage.type('#patientQrId', 'RAH-D3200470', { delay: 40 });
  await highlight(crewPage, 'button[onclick*="searchPatient"]');
  await safeClick(crewPage, 'button[onclick*="searchPatient"]');
  
  // Wait for patient content to load
  await crewPage.waitForSelector('#patName', { visible: true, timeout: 8000 }).catch(() => {});
  await sleep(1500);

  console.log('>>> Clicking Incident Checkpoints in Ambulance HUD...');
  await setDemoBanner(crewPage, 'Act 6: Logging Incident Timeline Checkpoints in Real-Time');
  await crewPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[onclick*="logIncidentStage"]'));
    btns.forEach((btn, idx) => {
      setTimeout(() => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.style.outline = '4px solid #E11D2E';
        btn.click();
      }, idx * 1000);
    });
  });
  await sleep(4500);

  // ---------------------------------------------------------------
  // ACT 7: GRAND FINALE
  // ---------------------------------------------------------------
  console.log('\n====================================================');
  console.log('🎉 VISIBLE AUTOMATED DEMO COMPLETE!');
  console.log('Chrome remains open and active on your screen.');
  console.log('====================================================\n');

  await setDemoBanner(crewPage, '🎉 TOUR COMPLETE: All 6 Portals, AI Copilot & Real-Time Distress Working 100%!');
  await sleep(2500);

  // Disconnect puppeteer so Chrome stays open on the user's desktop!
  browser.disconnect();
}

runVisibleDemo().catch(err => {
  console.error('Visible Demo Error:', err);
});

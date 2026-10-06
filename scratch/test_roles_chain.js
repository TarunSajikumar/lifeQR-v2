const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[Console]:', msg.text()));
  page.on('request', req => {
    if (req.url().includes('/auth/login') && req.method() === 'POST') {
      console.log('[Login Request Body]:', req.postData());
    }
  });

  async function loginAs(email, password, expectedUrl) {
    console.log(`\n=== Logging in as ${email} ===`);
    await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
    // Clear cookies & storage on origin
    await page.evaluate(async () => {
      try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch(e){}
      try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    });
    const cookies = await page.cookies();
    if (cookies.length > 0) await page.deleteCookie(...cookies);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#email', { visible: true, timeout: 8000 });
    
    // Fill credentials cleanly
    await page.evaluate(() => {
      document.querySelector('#email').value = '';
      document.querySelector('#password').value = '';
    });
    await page.type('#email', email);
    await page.type('#password', password);
    
    // Click submit
    await page.click('#submitBtn');

    // Wait for redirect to expected dashboard
    await page.waitForFunction((urlPart) => window.location.href.includes(urlPart), { timeout: 10000 }, expectedUrl);
    console.log(`✅ Success! Navigated to: ${page.url()}`);
  }

  // 1. Patient
  await loginAs('patient@lifeqr.com', 'Password@123', 'patient_dashboard.html');
  const patientName = await page.$eval('#userName', el => el.innerText);
  console.log('Patient loaded:', patientName);

  // 2. Doctor
  await loginAs('doctor@lifeqr.com', 'Password@123', 'doctor_dashboard.html');
  const hasQueue = await page.$('#patientQueueContainer');
  console.log('Doctor queue container present:', !!hasQueue);

  // 3. Crew
  await loginAs('crew@lifeqr.com', 'Password@123', 'CrewAmbulance_dashboard.html');
  await page.waitForSelector('#patientQrId', { timeout: 10000 });
  console.log('Crew triage input present: true');

  await browser.close();
  console.log('\n🎉 ALL 3 ROLES LOGGED IN AND VERIFIED SEQUENTIALLY!');
})();

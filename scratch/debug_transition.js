const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[Console]:', msg.text()));

  // Act 5: Doctor Login
  console.log('--- Doctor Login ---');
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'doctor@lifeqr.com');
  await page.type('#password', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.href.includes('doctor_dashboard.html'), { timeout: 8000 });
  console.log('Doctor URL:', page.url());

  // Clear session like visible-browser-demo does
  console.log('--- Clearing Session ---');
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  await page.evaluate(async () => {
    try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
    localStorage.clear();
    sessionStorage.clear();
  });

  // Act 6: Crew Login
  console.log('--- Crew Login ---');
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  console.log('Login Page URL:', page.url());

  await page.waitForSelector('#email', { visible: true, timeout: 8000 });
  await page.type('#email', 'crew@lifeqr.com');
  await page.type('#password', 'Password@123');
  
  // Submit
  await page.evaluate(() => {
    const el = document.querySelector('button[type="submit"]');
    if (el) el.click();
  });
  console.log('Submitted crew login form');

  try {
    await page.waitForFunction(() => window.location.href.includes('CrewAmbulance_dashboard.html'), { timeout: 8000 });
    console.log('Crew URL after wait:', page.url());
  } catch (err) {
    console.log('Timeout waiting for CrewAmbulance_dashboard. Current URL is:', page.url());
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('Body Text:', bodyText);
  }

  console.log('Waiting for #patientQrId with timeout 15000ms...');
  const el = await page.waitForSelector('#patientQrId', { timeout: 15000 });
  console.log('Successfully found #patientQrId!', !!el);

  await browser.close();
})();

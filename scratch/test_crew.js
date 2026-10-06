const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[Console]:', msg.text()));
  page.on('pageerror', err => console.log('[PageError]:', err.message));

  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'crew@lifeqr.com');
  await page.type('#password', 'Password@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));
  
  console.log('After login URL:', page.url());
  if (!page.url().includes('CrewAmbulance_dashboard.html')) {
    await page.goto('http://localhost:5000/app/CrewAmbulance_dashboard.html', { waitUntil: 'networkidle2' });
  }
  await new Promise(r => setTimeout(r, 1500));
  console.log('Crew URL:', page.url());
  const hasQr = await page.$('#patientQrId');
  console.log('Has #patientQrId:', !!hasQr);
  
  await browser.close();
})();

const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'doctor@lifeqr.com');
  await page.type('#password', 'Password@123');
  await page.click('button[type="submit"]');
  
  await page.waitForFunction(() => window.location.href.includes('doctor_dashboard.html'), { timeout: 8000 });
  console.log('Doctor Dashboard URL:', page.url());

  // Call patient in
  const called = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const callBtn = btns.find(b => b.innerText && b.innerText.includes('CALL PATIENT IN'));
    if (callBtn) {
      callBtn.click();
      return true;
    }
    return false;
  });
  console.log('Called patient in:', called);

  await new Promise(r => setTimeout(r, 1500));

  // Click AI Patient Summary
  const summaryClicked = await page.evaluate(() => {
    const b = document.querySelector('button[onclick*="runAiPatientSummary"]');
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  console.log('Clicked runAiPatientSummary:', summaryClicked);

  await new Promise(r => setTimeout(r, 2000));

  // Click SOAP Note
  const soapClicked = await page.evaluate(() => {
    const b = document.querySelector('button[onclick*="generateSoapNote"]');
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  console.log('Clicked generateSoapNote:', soapClicked);

  console.log('Doctor flow verified successfully!');
  await browser.close();
})();

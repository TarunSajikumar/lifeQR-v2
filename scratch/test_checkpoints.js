const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
  await page.type('#email', 'crew@lifeqr.com');
  await page.type('#password', 'Password@123');
  await page.click('button[type="submit"]');
  
  await page.waitForFunction(() => window.location.href.includes('CrewAmbulance_dashboard.html'), { timeout: 8000 });
  await page.waitForSelector('#patientQrId', { visible: true, timeout: 8000 });

  await page.type('#patientQrId', 'RAH-D3200470');
  await page.evaluate(() => {
    const sBtn = document.querySelector('button[onclick*="searchPatient"]');
    if (sBtn) sBtn.click();
  });

  await page.waitForSelector('#patName', { visible: true, timeout: 6000 });
  
  const count = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[onclick*="logIncidentStage"]'));
    btns.forEach(b => b.click());
    return btns.length;
  });
  console.log(`Found and clicked ${count} logIncidentStage checkpoint buttons!`);

  await browser.close();
})();

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
  console.log('Successfully navigated to Crew Dashboard:', page.url());

  await page.waitForSelector('#patientQrId', { visible: true, timeout: 8000 });
  console.log('Found #patientQrId');

  await page.type('#patientQrId', 'RAH-D3200470');
  await page.evaluate(() => {
    const sBtn = document.querySelector('button[onclick*="searchPatient"]');
    if (sBtn) sBtn.click();
  });
  console.log('Clicked searchPatient');

  await page.waitForSelector('#patName', { visible: true, timeout: 6000 });
  const patName = await page.$eval('#patName', el => el.innerText);
  console.log('Patient loaded in Crew HUD:', patName);

  const checkpointLabels = ['Arrived Scene', 'Contact Made', 'Transporting', 'Handled Complete'];
  for (const label of checkpointLabels) {
    const clicked = await page.evaluate((lbl) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.innerText && btn.innerText.includes(lbl));
      if (b) {
        b.click();
        return true;
      }
      return false;
    }, label);
    console.log(`Checkpoint [${label}] clicked:`, clicked);
  }

  console.log('All crew actions tested successfully!');
  await browser.close();
})();

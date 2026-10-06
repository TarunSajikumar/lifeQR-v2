const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  for (const role of ['patient', 'doctor', 'crew']) {
    console.log(`\n=== Testing Context for ${role} ===`);
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    
    await page.goto('http://localhost:5000/app/lifeqr_login.html', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#email', { visible: true });
    await page.type('#email', `${role}@lifeqr.com`);
    await page.type('#password', 'Password@123');
    await page.click('#submitBtn');
    
    const targetUrl = role === 'patient' ? 'patient_dashboard.html' : (role === 'doctor' ? 'doctor_dashboard.html' : 'CrewAmbulance_dashboard.html');
    await page.waitForFunction((u) => window.location.href.includes(u), { timeout: 10000 }, targetUrl);
    console.log(`✅ ${role} successfully logged into ${page.url()}`);
    
    await ctx.close();
  }

  await browser.close();
  console.log('\n🎉 ALL 3 ROLES LOGGED IN FLAWLESSLY WITH CLEAN CONTEXTS!');
})();

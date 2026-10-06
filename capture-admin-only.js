const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\tarun\\.gemini\\antigravity-ide\\brain\\61086aaf-aa0d-49ed-ad16-150ae5d8679b';

async function captureAdminScreenshots() {
  const tempProfile = path.join(__dirname, '.chrome-temp-admin');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-crash-reporter',
      '--disable-breakpad',
      `--user-data-dir=${tempProfile}`,
      '--window-size=1360,860'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 860 });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:5000/lifeqr_login.html', { waitUntil: 'load' });
  await page.type('#email', 'admin@lifeqr.com');
  await page.type('#password', 'Password@123');

  console.log('Submitting login form...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.click('button[type="submit"]')
  ]);
  console.log('Current URL after login:', page.url());
  await new Promise(r => setTimeout(r, 1500));

  // If not on admin_dashboard.html, navigate there
  if (!page.url().includes('admin_dashboard.html')) {
    await page.goto('http://localhost:5000/admin_dashboard.html', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1500));
  }

  // Switch to helpTickets tab
  console.log('Switching to Help Tickets tab...');
  await page.evaluate(() => {
    if (window.switchTab) window.switchTab('helpTickets');
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_help_tickets_tab.png') });
  console.log('Saved admin_help_tickets_tab.png');

  // Open Inspect / Resolve modal on the first ticket
  console.log('Opening Inspect modal...');
  await page.evaluate(() => {
    const btn = document.querySelector('#helpTicketsTableBody button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_ticket_resolve_modal.png') });
  console.log('Saved admin_ticket_resolve_modal.png');

  await browser.close();
  console.log('Admin screenshots complete!');
}

captureAdminScreenshots().catch(console.error);

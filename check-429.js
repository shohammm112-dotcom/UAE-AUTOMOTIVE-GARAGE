import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', res => {
    if (res.status() === 429) {
      console.log(`429: ${res.url()}`);
    }
  });

  await page.goto('http://localhost:3000/staff/dashboard', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();

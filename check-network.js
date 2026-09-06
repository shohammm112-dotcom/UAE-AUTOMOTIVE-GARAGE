import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let requestCount = 0;
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      requestCount++;
      // console.log('REQ:', req.method(), req.url());
    }
  });

  page.on('response', res => {
    if (res.status() === 429) {
      console.log('429 ON:', res.url());
    }
  });
  
  await page.goto('http://localhost:3000/staff/jobs/job-123');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('TOTAL API REQUESTS:', requestCount);
  await browser.close();
})();

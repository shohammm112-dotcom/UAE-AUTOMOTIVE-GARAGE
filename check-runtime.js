import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/login');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking staff login...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Login as Service Advisor')) {
      await btn.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Navigating to jobs page...');
  await page.goto('http://localhost:3000/staff/jobs');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to jobs detail page...');
  await page.goto('http://localhost:3000/staff/jobs/job-123');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to estimates page...');
  await page.goto('http://localhost:3000/staff/estimates');
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();

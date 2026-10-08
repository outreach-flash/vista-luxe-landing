const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 500, height: 713});
  await page.goto('http://localhost:4321/');
  
  await page.evaluate(() => {
    document.getElementById('manifesto-section').scrollIntoView();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'manifesto1.png'});
  
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'manifesto2.png'});
  
  await browser.close();
})();

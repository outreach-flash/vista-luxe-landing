const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 500, height: 713});
  await page.goto('http://localhost:4321/');
  
  // scroll to manifesto section
  await page.evaluate(() => {
    document.getElementById('manifesto-section').scrollIntoView();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  const color1 = await page.evaluate(() => {
    return window.getComputedStyle(document.querySelector('.mword')).color;
  });
  
  // scroll down 400px
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  const color2 = await page.evaluate(() => {
    return window.getComputedStyle(document.querySelector('.mword')).color;
  });
  
  console.log(`Color 1: ${color1}, Color 2: ${color2}`);
  
  await browser.close();
})();

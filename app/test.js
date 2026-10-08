const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({width: 500, height: 713});
  await page.goto('http://localhost:4321/');
  
  // scroll to manifesto section
  await page.evaluate(() => {
    document.getElementById('manifesto-section').scrollIntoView();
  });
  
  await page.waitForTimeout(500);
  
  const opacity1 = await page.evaluate(() => {
    return window.getComputedStyle(document.querySelector('.mword')).opacity;
  });
  
  // scroll down 400px
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  
  await page.waitForTimeout(500);
  
  const opacity2 = await page.evaluate(() => {
    return window.getComputedStyle(document.querySelector('.mword')).opacity;
  });
  
  console.log(`Opacity 1: ${opacity1}, Opacity 2: ${opacity2}`);
  
  await browser.close();
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3080');
  
  const pricingTabParent = await page.$eval('#pricingTab', el => el.parentElement.tagName + '#' + el.parentElement.id + '.' + el.parentElement.className);
  const materialsTabParent = await page.$eval('#materialsTab', el => el.parentElement.tagName + '#' + el.parentElement.id + '.' + el.parentElement.className);
  
  console.log('PricingTab Parent:', pricingTabParent);
  console.log('MaterialsTab Parent:', materialsTabParent);
  
  await browser.close();
})();

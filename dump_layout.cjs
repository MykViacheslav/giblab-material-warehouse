const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3080');
  
  await page.click('button.tab[data-tab="materials"]');
  await page.waitForTimeout(500);
  
  const layout = await page.$eval('.layout', el => JSON.stringify(el.getBoundingClientRect()));
  const treePanel = await page.$eval('.tree-panel', el => JSON.stringify(el.getBoundingClientRect()));
  const contentPanel = await page.$eval('.content-panel', el => JSON.stringify(el.getBoundingClientRect()));
  const materialsTab = await page.$eval('#materialsTab', el => JSON.stringify(el.getBoundingClientRect()));
  const materialForm = await page.$eval('#materialForm', el => JSON.stringify(el.getBoundingClientRect()));
  
  const formStyles = await page.$eval('#materialForm', el => {
    const s = window.getComputedStyle(el);
    return JSON.stringify({
      marginLeft: s.marginLeft,
      marginRight: s.marginRight,
      width: s.width,
      display: s.display,
      justifyContent: s.justifyContent,
      gridTemplateColumns: s.gridTemplateColumns,
    });
  });

  const tabStyles = await page.$eval('#materialsTab', el => {
    const s = window.getComputedStyle(el);
    return JSON.stringify({
      display: s.display,
      flexDirection: s.flexDirection,
      alignItems: s.alignItems,
      justifyContent: s.justifyContent,
    });
  });

  console.log('Layout:', layout);
  console.log('TreePanel:', treePanel);
  console.log('ContentPanel:', contentPanel);
  console.log('MaterialsTab:', materialsTab);
  console.log('MaterialForm:', materialForm);
  console.log('FormStyles:', formStyles);
  console.log('TabStyles:', tabStyles);
  
  await browser.close();
})();

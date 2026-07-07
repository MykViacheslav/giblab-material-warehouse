const fs = require('fs');

let css = fs.readFileSync('public/styles.css', 'utf8');

// Replace the animation on .tab-page.active with display: flex
css = css.replace(/\.tab-page\.active\s*\{\s*animation:\s*fadeIn[^}]+\}/, `
.tab-page.active {
  display: flex !important;
  flex-direction: column;
  height: 100%;
  animation: fadeIn 0.4s ease-out;
}
`);

// Also ensure dashboard panels show up properly
css = css.replace(/\.dashboard-panel\.active\s*\{\s*display:\s*block;\s*\}/, `
.dashboard-panel.active {
  display: block !important;
}
`);

fs.writeFileSync('public/styles.css', css, 'utf8');

// Cache bust index.html
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css');
html = html.replace('styles.css', 'styles.css?v=' + Date.now());
fs.writeFileSync('public/index.html', html, 'utf8');

console.log("CSS fixed");

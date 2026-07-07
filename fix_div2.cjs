const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/<\/div>\s*<\/section>\s*<section id="pricingTab"/g, '</div>\n          </div>\n        </section>\n\n        <section id="pricingTab"');
fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Fixed index.html div tag');

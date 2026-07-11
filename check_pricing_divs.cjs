const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('<section id="pricingTab"');
const end = html.indexOf('</section>', start);
const block = html.substring(start, end);

const open = (block.match(/<div/g) || []).length;
const close = (block.match(/<\/div>/g) || []).length;

console.log('pricingTab divs open:', open, 'close:', close);

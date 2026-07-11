const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('<section id="pricingTab"');
const end = html.indexOf('</section>', start);
console.log(html.substring(start, end));

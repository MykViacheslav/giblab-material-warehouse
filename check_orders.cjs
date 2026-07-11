const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('<section id="ordersTab"');
const end = html.indexOf('</section>', start);

console.log(html.substring(end-200, end+10));

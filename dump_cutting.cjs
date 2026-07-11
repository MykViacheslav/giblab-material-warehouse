const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('<section id="cuttingTab"');
const end = html.indexOf('<section id="materialsTab"');

console.log(html.substring(start, end));

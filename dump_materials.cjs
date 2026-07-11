const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('<section id="materialsTab"');
const end = html.indexOf('</section>', html.indexOf('materialsBody', start));

console.log(html.substring(start, end+10));

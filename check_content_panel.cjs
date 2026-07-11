const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const match = html.match(/<section class=["']panel content-panel["'].*?>/i);
console.log(match ? match[0] : 'Not found');

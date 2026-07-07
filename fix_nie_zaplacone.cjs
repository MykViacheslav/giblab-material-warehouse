const fs = require('fs');
let t = fs.readFileSync('public/app.js', 'utf8');
t = t.replaceAll('Nie zapÄąâ€šacone', 'Nie zapłacone');
fs.writeFileSync('public/app.js', t, 'utf8');
console.log('Fixed Nie zaplacone in app.js');

const fs = require('fs');

let t = fs.readFileSync('server.js', 'utf8');

t = t.replace('Zamówienie czeka na wycenę i opłacenie.', 'Płatność do uregulowania przy odbiorze.');

fs.writeFileSync('server.js', t, 'utf8');
console.log('Fixed SMS message in server.js');

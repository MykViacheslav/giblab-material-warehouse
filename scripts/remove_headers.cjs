const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace using literal match for the corrupt characters
html = html.replace(/<th>Zamwienie<\/th>\s*/, '');
html = html.replace(/<th>Klient<\/th>\s*/, '');

// Also just in case, let's use wildcards
html = html.replace(/<th>Z.*wienie<\/th>\s*/, '');
html = html.replace(/<th>Klient<\/th>\s*/, '');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Headers removed!");

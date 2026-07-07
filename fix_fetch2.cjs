const fs = require('fs');
let t = fs.readFileSync('public/app.js', 'utf8');
t = t.replace(
  /async function fetchJson\(url, options = \{\}\) \{\n\s*const response = await fetch\(url, options\);/,
  'async function fetchJson(url, options = {}) {\n  const sep = url.includes("?") ? "&" : "?";\n  const response = await fetch(url + sep + "_t=" + Date.now(), options);'
);
fs.writeFileSync('public/app.js', t, 'utf8');
console.log('Fixed fetchJson cache bug 2');

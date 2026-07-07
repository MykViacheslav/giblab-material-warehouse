const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// Use regex to safely comment out or remove the event listeners for the deleted buttons
appJs = appJs.replace(/elements\.newOrderBtn\.addEventListener/g, '// elements.newOrderBtn.addEventListener');
appJs = appJs.replace(/elements\.addOrderPositionBtn\.addEventListener/g, '// elements.addOrderPositionBtn.addEventListener');

fs.writeFileSync('public/app.js', appJs, 'utf8');

let domJs = fs.readFileSync('public/js/dom.js', 'utf8');
domJs = domJs.replace(/newOrderBtn: document\.querySelector\("#newOrderBtn"\),/g, '// newOrderBtn removed');
domJs = domJs.replace(/addOrderPositionBtn: document\.querySelector\("#addOrderPositionBtn"\),/g, '// addOrderPositionBtn removed');

fs.writeFileSync('public/js/dom.js', domJs, 'utf8');

// We should also cache bust index.html to load the new app.js/dom.js if it was cached
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/app\.js\?v=[0-9.]+/g, 'app.js');
html = html.replace('app.js', 'app.js?v=' + Date.now());
html = html.replace(/dom\.js\?v=[0-9.]+/g, 'dom.js');
html = html.replace('dom.js', 'dom.js?v=' + Date.now());
fs.writeFileSync('public/index.html', html, 'utf8');

console.log("Fixed JS errors caused by removed buttons");

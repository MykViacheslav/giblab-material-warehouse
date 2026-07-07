const fs = require('fs');

let js = fs.readFileSync('public/app.js', 'utf8');

const regexPatternOld = 'const looseQuantity = tail.match(/^[\s\-?"?"(]*(\d+(?:[,.]\d+)?)[)\s]*(.*)$/);';
const regexPatternNew = 'const looseQuantity = tail.match(/^[\\s\\-?"?"(]*(\\d+(?:[,.]\\d+)?)\\s*(?:sztuk|szt\\.?|szt|pcs)?[)\\s]*(.*)$/i);';

js = js.replace(regexPatternOld, regexPatternNew);

// Also clean up tail: if tail is just "szt" or "szt.", remove it.
const namePatternOld = 'name: baseName || tail || "",';
const namePatternNew = 'name: baseName || tail.replace(/^(?:sztuk|szt\\.?|szt|pcs)$/i, "") || "",';

js = js.replace(namePatternOld, namePatternNew);

fs.writeFileSync('public/app.js', js, 'utf8');
console.log("Improved parser logic in app.js");

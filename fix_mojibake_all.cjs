const fs = require('fs');

function fixMojibake(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/Nie zap[^a-z"]*acone/g, 'Nie zapłacone');
  content = content.replace(/Op[^a-z"]*acone/g, 'Opłacone');
  content = content.replace(/Zwi[^a-z"]*folder/g, 'Zwiń folder');
  content = content.replace(/Rozwi[^a-z"]*folder/g, 'Rozwiń folder');
  content = content.replace(/P[^a-z"]*atno[^a-z"]*/g, 'Płatnośc');
  content = content.replace(/Płatnośc/g, 'Płatność'); // Fix the c -> ć
  fs.writeFileSync(file, content, 'utf8');
}

fixMojibake('server.js');
fixMojibake('public/app.js');
fixMojibake('public/index.html');
console.log('Fixed mojibake');

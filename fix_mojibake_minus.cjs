const fs = require('fs');

function fixMojibake(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/Ă˘ďż˝â€™/g, '-');
  content = content.replace(/Ă˘/g, '-');
  fs.writeFileSync(file, content, 'utf8');
}

fixMojibake('public/app.js');
console.log('Fixed minus sign mojibake');

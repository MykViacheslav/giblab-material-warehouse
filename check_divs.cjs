const fs=require('fs');
const html=fs.readFileSync('public/index.html','utf8');
const sections = html.split('<section');
for(let i=1; i<sections.length; i++) {
  const s = sections[i];
  const idMatch = s.match(/id=\"([^\"]+)\"/);
  const id = idMatch ? idMatch[1] : 'unknown';
  const opens = (s.match(/<div\b/g)||[]).length;
  const closes = (s.match(/<\/div>/g)||[]).length;
  if (opens !== closes) console.log(id, 'Opens:', opens, 'Closes:', closes, 'Diff:', opens - closes);
}

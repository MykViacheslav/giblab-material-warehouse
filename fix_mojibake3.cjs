const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

const replacements = {
  // Common things I see from node output
  "ÄąÄ˝eby": "żeby",
  "zobaczyĂ„â€ˇ": "zobaczyć",
  "powiĂ„â€¦zane": "powiązane",
  "usunÄ…Ä‡": "usunąć",
  "UsunÄ…Ä‡": "Usunąć",
  "zobaczĂ„â€ˇ": "zobaczyć",
  "Zaznacz klienta, ÄąÄ˝eby zobaczyĂ„â€ˇ powiĂ„â€¦zane dokumenty.": "Zaznacz klienta, żeby zobaczyć powiązane dokumenty.",
  "Zaznacz klienta, eby zobaczy\"? powi\"?|zane dokumenty.": "Zaznacz klienta, żeby zobaczyć powiązane dokumenty.",
  "Zaznacz klienta, eby zobaczy\"? powi\"?|zane dokumenty.": "Zaznacz klienta, żeby zobaczyć powiązane dokumenty."
};

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let text = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // also do a more aggressive regex for "Zaznacz klienta... dokumenty"
  const regex1 = /Zaznacz klienta[^]+?dokumenty\./g;
  text = text.replace(regex1, "Zaznacz klienta, żeby zobaczyć powiązane dokumenty.");
  
  const regex2 = /Zaznacz.+?klienta.+?zobaczy.+?dokumenty/gi;
  text = text.replace(regex2, "Zaznacz klienta, żeby zobaczyć powiązane dokumenty");
  
  for (const [bad, good] of Object.entries(replacements)) {
    if (text.includes(bad)) {
      text = text.replaceAll(bad, good);
      changed = true;
    }
  }
  
  fs.writeFileSync(filePath, text, 'utf8');
  if (changed) console.log('Fixed', filePath);
}

processFile('public/app.js');
processFile('public/index.html');
processFile('public/js/dom.js');
processFile('public/js/state.js');
processFile('public/js/cutTextParser.js');
console.log('Done!');

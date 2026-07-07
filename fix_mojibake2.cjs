const fs = require('fs');

let text = fs.readFileSync('public/app.js', 'utf8');

const replacements = {
  "zamkniĂ„â„˘te": "zamknięte",
  "zamkni\"\"te": "zamknięte",
  "zamkniÄ™te": "zamknięte",
  "materiaÄąâ€šĂ‚Ĺ‚w": "materiałów",
  "bÄ‚â€šÄ‚â€žÄ…d": "błąd",
  "BÄ‚â€šÄ‚â€žÄ…d": "Błąd",
  "usunÄ‚â€žÄ…Ä‚â€žÄ…Ä‚â€žÄ…": "usunąć",
  "UsunÄ‚â€žÄ…Ä‚â€žÄ…Ä‚â€žÄ…": "Usunąć",
  "powiÄ‚â€žÄ…zane": "powiązane",
  "PowiÄ‚â€žÄ…zane": "Powiązane",
  "pozycjÄ‚â€žÄ…": "pozycję",
  "PozycjÄ‚â€žÄ…": "Pozycję",
  "usuniÄ‚â€žÄ…cia": "usunięcia",
  "usuniÄ‚â€žÄ…te": "usunięte",
  "UsuniÄ‚â€žÄ…to": "Usunięto",
  "policzyÄ‚â€žÄ…Ä‚â€žÄ…": "policzyć"
};

for (const [bad, good] of Object.entries(replacements)) {
  text = text.replaceAll(bad, good);
}

fs.writeFileSync('public/app.js', text, 'utf8');
console.log('Fixed more mojibake!');

const fs = require('fs');

let text = fs.readFileSync('public/app.js', 'utf8');

const replacements = {
  'Wybierz pozycjĂ„â„˘': 'Wybierz pozycję',
  'Wybierz pÄąâ€šacĂ„â€¦cego': 'Wybierz płacącego',
  'Wybierz materiaÄąâ€š': 'Wybierz materiał',
  'Wybierz zaksiĂ„â„˘gowanĂ„â€¦ dostawĂ„â„˘': 'Wybierz zaksięgowaną dostawę',
  'utwÄ‚Ĺ‚rz korektĂ„â„˘': 'utwórz korektę',
  'policzyĂ„â€ˇ wycenĂ„â„˘': 'policzyć wycenę',
  'Wybierz okleinĂ„â„˘': 'Wybierz okleinę',
  'dostawĂ„â„˘': 'dostawę',
  'korektĂ„â„˘': 'korektę',
  'pozycjĂ„â„˘': 'pozycję',
  'okleinĂ„â„˘': 'okleinę',
  'wycenĂ„â„˘': 'wycenę',
  'zaksiĂ„â„˘gowanĂ„â€¦': 'zaksięgowaną',
  'materiaÄąâ€š': 'materiał',
  'policzyĂ„â€ˇ': 'policzyć'
};

for (const [bad, good] of Object.entries(replacements)) {
  text = text.replaceAll(bad, good);
}

fs.writeFileSync('public/app.js', text, 'utf8');
console.log('Fixed final mojibake in app.js!');

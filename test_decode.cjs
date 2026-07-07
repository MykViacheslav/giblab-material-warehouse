const fs = require('fs');
let text = fs.readFileSync('public/app.js', 'utf8');

const replacements = {
  // Common corrupted strings found in app.js
  "zamÄ‚Ĺ‚wieÄąâ€ž": "zamówień",
  "ZamÄ‚Ĺ‚wieÄąâ€ž": "Zamówień",
  "zamÄ‚Ĺ‚wienie": "zamówienie",
  "ZamÄ‚Ĺ‚wienie": "Zamówienie",
  "zamÄ‚Ĺ‚wienia": "zamówienia",
  "ZamÄ‚Ĺ‚wienia": "Zamówienia",
  "zamÄ‚Ĺ‚wiÄ‚â€žÄąâ€š": "zamówił",
  "ZamÄ‚Ĺ‚wiÄ‚â€žÄąâ€š": "Zamówił",
  
  "NieopÄąâ€šacone": "Nieopłacone",
  "nieopÄąâ€šacone": "nieopłacone",
  "OpÄąâ€šacone": "Opłacone",
  "opÄąâ€šacone": "opłacone",
  
  "materiaÄąâ€šy": "materiały",
  "MateriaÄąâ€šy": "Materiały",
  "materiaÄąâ€šĂ‚Ĺ‚w": "materiałów",
  
  "wycenÄ‚â€žÄ…": "wyceną",
  "WycenÄ‚â€žÄ…": "Wyceną",
  "wycenÄ‚â€žÄ…": "wycenę",
  "WycenÄ‚â€žÄ…": "Wycenę", // wait, "wycenĂ„â„˘" is wycenę
  
  "zamkniÄ‚â€žÄ…te": "zamknięte",
  "ZamkniÄ‚â€žÄ…te": "Zamknięte",
  "zamkniÄ‚â€žÄ…te": "zamknięte",
  
  "pÄąâ€šatnoÄąâ€şci": "płatności",
  "PÄąâ€šatnoÄąâ€şci": "Płatności",
  
  "zÄąâ€š": "zł",
  "ZÄąâ€š": "Zł",
  
  "UsunÄ‚â€žÄ…Ä‚â€žÄ…Ä‚â€žÄ…": "Usunąć",
  "usunÄ‚â€žÄ…Ä‚â€žÄ…Ä‚â€žÄ…": "usunąć",
  
  "powiÄ‚â€žÄ…zane": "powiązane",
  "PowiÄ‚â€žÄ…zane": "Powiązane",
  
  "caÄąâ€šy": "cały",
  "CaÄąâ€šy": "Cały",
  
  "wpÄąâ€šaty": "wpłaty",
  "WpÄąâ€šaty": "Wpłaty",
  
  "pozycjÄ‚â€žÄ…": "pozycję",
  "PozycjÄ‚â€žÄ…": "Pozycję",
  
  "usuniÄ‚â€žÄ…cia": "usunięcia",
  "usuniÄ‚â€žÄ…te": "usunięte",
  "UsuniÄ‚â€žÄ…to": "Usunięto",
  
  "poniÄ‚ĹĽej": "poniżej",
  
  "bÄ‚â€šÄ‚â€žÄ…d": "błąd",
  "BÄ‚â€šÄ‚â€žÄ…d": "Błąd",
  
  "zgÄąâ€šoszenia": "zgłoszenia",
  "ZgÄąâ€šoszenia": "Zgłoszenia",
  
  "OdÄąâ€şwieÄ‚ĹĽ": "Odśwież",
  "odÄąâ€şwieÄ‚ĹĽ": "odśwież",
  
  "policzyÄ‚â€žÄ…Ä‚â€žÄ…": "policzyć",
  "wedÄąâ€šug": "według",
  
  "szczegÄ‚Ĺ‚Äąâ€šy": "szczegóły",
  "SzczegÄ‚Ĺ‚Äąâ€šy": "Szczegóły",
};

// Also I can just reverse the mojibake directly by doing exactly the opposite of what I did.
// But first, let's look at the actual string to see if we can just reverse it:
// The string was read as utf8, then written by Set-Content.
// Then read by fs.readFileSync (which gives bytes).
// Then decoded with win1250 to a string.
// Then written as utf8.

// To reverse the second step:
// Read as utf8 (gives string).
// Encode as win1250 (gives bytes).
// Treat those bytes as the file contents!

const fileBytes = fs.readFileSync('public/app.js');
const text2 = fileBytes.toString('utf8');
const originalBytes = iconv.encode(text2, 'win1250');
// Now originalBytes should be what Set-Content wrote!

// Now to reverse Set-Content:
// Set-Content wrote these bytes using PowerShell's default encoding (win1250).
// Which means PowerShell had a string, and it encoded it as win1250.
// So to get the string PowerShell had, we decode the bytes as win1250:
const psString = iconv.decode(originalBytes, 'win1250');

// PowerShell got this string by reading the original UTF-8 file without BOM.
// So it took the original UTF-8 bytes and decoded them as win1250.
// To get the original UTF-8 bytes, we encode the string as win1250!
const trueOriginalBytes = iconv.encode(psString, 'win1250');

// And finally, decode those bytes as UTF-8!
const trueOriginalText = iconv.decode(trueOriginalBytes, 'utf8');

// Let's test if this produces valid polish characters!
const lines = trueOriginalText.split('\n');
console.log(lines[2339] || "No line 2339");
console.log(lines[2340] || "No line 2340");
console.log(lines[1752] || "No line 1752");

const fs = require('fs');
let t = fs.readFileSync('public/app.js', 'utf8');

t = t.replace(/<option value="">Cena us[^<]+z cennika<\/option>/g, '<option value="">Cena usługi z cennika</option>');
t = t.replace(/<option value="">Materia[^<]+z listy GibLab<\/option>/g, '<option value="">Materiał z listy GibLab</option>');
t = t.replace(/<option value="">Grubo[^<]+<\/option>/g, '<option value="">Grubość</option>');
t = t.replace(/Grubo[^<:"]+: wszystkie/g, 'Grubość: wszystkie');
t = t.replace(/<option value="">Wybierz oklein[^<]+<\/option>/g, '<option value="">Wybierz okleinę z bazy</option>');
t = t.replace(/<option value="">Wybierz zam[^<]+wienie<\/option>/g, '<option value="">Wybierz zamówienie</option>');
t = t.replace(/Wybierz z listy zam[^<]+wienie/g, 'Wybierz z listy zamówienie');

fs.writeFileSync('public/app.js', t, 'utf8');
console.log('Fixed app.js mojibake');

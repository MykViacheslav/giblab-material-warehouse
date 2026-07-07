const fs = require('fs');

let text = fs.readFileSync('public/app.js', 'utf8');

// Replace these precise string chunks based on the grep output
text = text.replaceAll('Wybierz p?ac"?|cego', 'Wybierz płacącego');
text = text.replaceAll('Wybierz materia?', 'Wybierz materiał');
text = text.replaceAll('Wybierz oklein""', 'Wybierz okleinę');
text = text.replaceAll('wybierz dostaw""', 'wybierz dostawę');
text = text.replaceAll('zaksi""gowan"?| dostaw""', 'zaksięgowaną dostawę');
text = text.replaceAll('wybierz korekt""', 'wybierz korektę');
text = text.replaceAll('pozycj"" z cennika', 'pozycję z cennika');
text = text.replaceAll('zamwienie', 'zamówienie');
text = text.replaceAll('zam?wienie', 'zamówienie');
text = text.replaceAll('pozycj"" formatek', 'pozycję formatek');

fs.writeFileSync('public/app.js', text, 'utf8');
console.log('Fixed app.js');

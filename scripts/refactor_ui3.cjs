const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Remove <h3>I. ZAMÓWIENIE (Eksport i Wycena)</h3>
html = html.replace('<h3 style="margin-top: 0; margin-bottom: 16px; color: var(--primary);">I. ZAMÓWIENIE (Eksport i Wycena)</h3>\n', '');
html = html.replace('<h3 style="margin-top: 0; margin-bottom: 16px; color: var(--primary);">I. ZAMWIENIE (Eksport i Wycena)</h3>\n', '');
// Using a regex in case of encoding issues
html = html.replace(/<h3[^>]*>I\. ZAM[^<]*<\/h3>\s*/, '');

// 2. Remove <button id="newCutJobBtn" type="button">Nowa pozycja</button> from its current location
html = html.replace(/<button id="newCutJobBtn"[^>]*>Nowa pozycja<\/button>\s*/, '');

// 3. Insert it into the top toolbar-row
const topToolbarStart = '<select id="globalCutOrderSelect" style="flex: 1; max-width: 400px; font-weight: bold; font-size: 1.1em;"></select>';
const newBtnHtml = `\n                <button id="newCutJobBtn" type="button" style="background: var(--blue); color: white; font-weight: bold;">+ Dodaj nową pozycję</button>`;
html = html.replace(topToolbarStart, topToolbarStart + newBtnHtml);

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("HTML updated based on the latest screenshot.");

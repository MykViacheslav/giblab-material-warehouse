const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// I will just replace the specific strings I added
html = html.replace('<div class="notify-panel" style="margin-bottom: 20px; border: 1px solid var(--border-color); padding: 15px; border-radius: 8px;">', '<div style="margin-bottom: 20px; border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: var(--panel-bg);">');

html = html.replace('<div class="notify-panel" style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px;">', '<div style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; background: var(--panel-bg);">');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Fixed index.html notify-panel classes');

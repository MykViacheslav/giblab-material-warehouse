const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// The top panel currently starts with:
// <div class="panel" style="margin-bottom: 8px; border: 1px solid var(--line-strong); padding: 8px 16px; border-radius: 8px;">

html = html.replace(
  '<div class="panel" style="margin-bottom: 8px; border: 1px solid var(--line-strong); padding: 8px 16px; border-radius: 8px;">',
  '<div class="panel" style="margin-bottom: 8px; border: 1px solid var(--line-strong); padding: 8px 16px; border-radius: 8px; min-height: auto;">'
);

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Fixed min-height issue!");

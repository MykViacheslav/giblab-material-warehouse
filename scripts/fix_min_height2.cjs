const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace min-height: auto with min-height: 0 !important;
html = html.replace(
  'min-height: auto;',
  'min-height: 0 !important;'
);

// Just in case it's not enough, ensure the top panel has strict height constraints
html = html.replace(
  '<div class="panel" style="margin-bottom: 8px; border: 1px solid var(--line-strong); padding: 8px 16px; border-radius: 8px; min-height: 0 !important;">',
  '<div class="panel" style="margin-bottom: 8px; border: 1px solid var(--line-strong); padding: 8px 16px; border-radius: 8px; min-height: 0 !important; height: auto;">'
);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Fixed min-height to 0 !important");

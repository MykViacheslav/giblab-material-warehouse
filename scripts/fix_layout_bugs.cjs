const fs = require('fs');

// 1. Fix app.js renderCutJobs
let js = fs.readFileSync('public/app.js', 'utf8');

const tableRenderPattern = `elements.cutJobsBody.innerHTML = rows.map((row) => \`
    <tr data-id="\${row.id}" class="\${row.id === jobId ? "active-row" : ""}">
      <td>\${row.id}</td>
      <td>\${escapeHtml(row.order_number)}</td>
      <td>\${escapeHtml(row.customer_name)}</td>
      <td>\${escapeHtml(row.name)}</td>`;

const tableRenderFix = `elements.cutJobsBody.innerHTML = rows.map((row) => \`
    <tr data-id="\${row.id}" class="\${row.id === jobId ? "active-row" : ""}">
      <td>\${row.id}</td>
      <td>\${escapeHtml(row.name)}</td>`;

js = js.replace(tableRenderPattern, tableRenderFix);

// Just in case it was already partially replaced or formatted differently:
js = js.replace(/<td>\${escapeHtml\(row\.order_number\)}<\/td>\s*/, '');
js = js.replace(/<td>\${escapeHtml\(row\.customer_name\)}<\/td>\s*/, '');

fs.writeFileSync('public/app.js', js, 'utf8');

// 2. Fix index.html margins
let html = fs.readFileSync('public/index.html', 'utf8');

// The top panel has style="margin-bottom: 24px; border: 1px solid var(--line-strong); padding: 16px; border-radius: 8px;"
// Let's remove the margin-bottom: 24px and padding: 16px to make it smaller
html = html.replace(
  '<div class="panel" style="margin-bottom: 24px; border: 1px solid var(--line-strong); padding: 16px; border-radius: 8px;">',
  '<div class="panel" style="margin-bottom: 8px; border: 1px solid var(--line-strong); padding: 8px 16px; border-radius: 8px;">'
);

// The cuttingPositionsPanel has style="border: 1px solid var(--line); padding: 16px; border-radius: 8px; display: none;"
// I'll make the padding smaller
html = html.replace(
  '<div id="cuttingPositionsPanel" class="panel" style="border: 1px solid var(--line); padding: 16px; border-radius: 8px; display: none;">',
  '<div id="cuttingPositionsPanel" class="panel" style="border: 1px solid var(--line); padding: 8px 16px; border-radius: 8px; display: none;">'
);

// The table-wrap for cutJobsBody has max-height: 250px; margin-bottom: 16px;
// I'll leave it, it's fine.
// The form has margin-bottom: 16px;
html = html.replace(
  'margin-bottom: 16px;">\n              <div style="flex: 1; min-width: 150px;">',
  'margin-bottom: 8px;">\n              <div style="flex: 1; min-width: 150px;">'
);

// The cutPartsBody table also might have a max height
// Let's find the split-tables inside cuttingPositionsPanel if any.
// Currently the parts table is outside of split-tables.
// Wait, the bottom tables:
// <div class="split-tables">
//   <div class="table-wrap quote-table">
//     <table> ... <thead> ... <th>D</th><th>S</th><th>ILOŚĆ</th> ... <tbody id="cutPartsBody">

html = html.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');

console.log("Fixed empty space and table rendering!");

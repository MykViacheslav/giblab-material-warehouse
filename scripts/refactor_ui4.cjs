const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Remove <h3>II. POZYCJE (Materiały i Formatki)</h3>
html = html.replace(/<h3[^>]*>II\. POZYCJE[^<]*<\/h3>\s*/, '');

// 2. Move the filter bar
// The filter bar is a div with class="toolbar-row" and style="margin-bottom: 8px; justify-content: flex-start;"
// Let's find it. It contains id="cutMaterialSearch".
const filterBarPattern = /<div class="toolbar-row" style="margin-bottom: 8px; justify-content: flex-start;">\s*<input id="cutMaterialSearch".*?<\/div>/s;

const filterMatch = html.match(filterBarPattern);
if (filterMatch) {
    const filterHtml = filterMatch[0];
    
    // Remove it from its current position
    html = html.replace(filterHtml, '');
    
    // Insert it right before <form id="cutJobForm" ...>
    const formStart = html.indexOf('<form id="cutJobForm"');
    if (formStart !== -1) {
        html = html.substring(0, formStart) + filterHtml + '\n            ' + html.substring(formStart);
    }
}

// 3. I notice in the screenshot that the table still has "ZAMÓWIENIE" and "KLIENT".
// Wait, my previous script removed those from `app.js` but maybe I messed up the HTML table header in `index.html`?
// Let's double check. My previous script: html = html.replace(oldHeaders, newHeaders);
// The user might not have refreshed with Shift+F5, or my replace didn't match exactly because of formatting.
// Let's force replace Zamówienie and Klient from the `cutJobsBody` table headers just in case.

const headersStartPattern = `<th>ID</th>`;
const headersIdx = html.indexOf(headersStartPattern);
if (headersIdx !== -1) {
    const endHeaders = html.indexOf('</tr>', headersIdx);
    let thead = html.substring(headersIdx, endHeaders);
    // strip out Zamówienie and Klient using regex ignoring whitespace
    thead = thead.replace(/<th>Zamówienie<\/th>\s*/, '');
    thead = thead.replace(/<th>Klient<\/th>\s*/, '');
    html = html.substring(0, headersIdx) + thead + html.substring(endHeaders);
}

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("HTML updated.");

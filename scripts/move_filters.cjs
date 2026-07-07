const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// The elements to extract from cutPartForm
const searchInputStr = '              <input id="cutMaterialSearch" class="cut-material-search" placeholder="Szukaj pyty">\r\n';
const producerSelectStr = '              <select id="cutProducerFilter" class="cut-filter-select"></select>\r\n';
const thicknessSelectStr = '              <select id="cutThicknessFilter" class="cut-filter-select"></select>\r\n';
const edgeSearchInputStr = '              <input id="cutEdgeMaterialSearch" class="cut-material-search" placeholder="Szukaj okleiny">\r\n';

// Because of possible CRLF issues, we use regex to extract safely
function extractAndRemove(id) {
    const regex = new RegExp(`[ \\t]*<input[^>]*id="${id}"[^>]*>[ \\t]*\\r?\\n?|[ \\t]*<select[^>]*id="${id}"[^>]*><\\/select>[ \\t]*\\r?\\n?`);
    const match = html.match(regex);
    if (match) {
        html = html.replace(match[0], '');
        return match[0].trim();
    }
    return '';
}

const cutMaterialSearchHTML = extractAndRemove('cutMaterialSearch');
const cutProducerFilterHTML = extractAndRemove('cutProducerFilter');
const cutThicknessFilterHTML = extractAndRemove('cutThicknessFilter');
const cutEdgeMaterialSearchHTML = extractAndRemove('cutEdgeMaterialSearch');

// Now we create the new toolbar row
const newToolbar = `
            <div class="toolbar-row" style="margin-bottom: 8px; justify-content: flex-start;">
              ${cutMaterialSearchHTML}
              ${cutProducerFilterHTML}
              ${cutThicknessFilterHTML}
              ${cutEdgeMaterialSearchHTML.replace('cut-material-search', 'cut-edge-search')}
            </div>
`;

// Insert it right above cutJobForm
const cutJobFormMarker = '<form id="cutJobForm" class="grid-form order-grid">';
html = html.replace(cutJobFormMarker, newToolbar + '            ' + cutJobFormMarker);

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Moved filters in index.html");

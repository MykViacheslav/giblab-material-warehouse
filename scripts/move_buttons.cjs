const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// The exact string to remove
const notifyRight = `            <div class="notify-right" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button id="markPaidBtn" type="button" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">Oznacz opłacone</button>
              <button id="markUnpaidBtn" type="button" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white;">Oznacz nie zapłacone</button>
            </div>`;

// The exact string to find for selection-actions
const selectionActions = `<div class="selection-actions">
            <button id="editSelectedOrderBtn" class="outline-action" type="button">EDYTUJ</button>
            <button id="deleteSelectedOrderBtn" class="outline-action danger-outline" type="button">USUŃ</button>
          </div>`;

// New selection actions with the buttons moved
const newSelectionActions = `<div class="selection-actions" style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px; align-items: center;">
            <button id="markPaidBtn" type="button" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">Oznacz opłacone</button>
            <button id="markUnpaidBtn" type="button" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; margin-right: auto;">Oznacz nie zapłacone</button>
            <button id="editSelectedOrderBtn" class="outline-action" type="button">EDYTUJ</button>
            <button id="deleteSelectedOrderBtn" class="outline-action danger-outline" type="button">USUŃ</button>
          </div>`;

// Remove notifyRight
if (html.includes(notifyRight)) {
  html = html.replace(notifyRight + '\n', '');
  html = html.replace(notifyRight, '');
} else {
  console.log("Could not find notifyRight block. Maybe line endings differ. Using regex...");
  html = html.replace(/<div class="notify-right"[\s\S]*?<\/div>/, '');
}

// Replace selectionActions
if (html.includes(selectionActions)) {
  html = html.replace(selectionActions, newSelectionActions);
} else {
  console.log("Could not find selectionActions block exactly. Using regex...");
  const oldSel = /<div class="selection-actions">[\s\S]*?<button id="editSelectedOrderBtn"[\s\S]*?<button id="deleteSelectedOrderBtn"[\s\S]*?<\/div>/;
  html = html.replace(oldSel, newSelectionActions);
}

// Cache bust again just in case
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css');
html = html.replace('styles.css', 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Moved buttons to selection-actions!");

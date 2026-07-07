const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// Update cutJobForm class
html = html.replace(
  '<form id="cutJobForm" class="grid-form order-grid">',
  '<form id="cutJobForm" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; padding: 12px; background: var(--bg-elevated); border: 1px solid var(--line); border-radius: 6px; margin-bottom: 16px;">'
);

// Add style to cutJobForm inputs so they don't look weird
const cutJobFormInner = `
              <div style="flex: 1; min-width: 150px;">
                <label style="font-size: 0.8em; color: var(--text-muted); margin-bottom: 4px; display: block;">Nazwa pozycji</label>
                <input name="name" placeholder="np. Pozycja 1" required style="width: 100%;">
              </div>
              <div style="flex: 2; min-width: 200px;">
                <label style="font-size: 0.8em; color: var(--text-muted); margin-bottom: 4px; display: block;">Materiał (baza)</label>
                <select name="material_id" style="width: 100%;"></select>
              </div>
              <div style="flex: 1; min-width: 150px;">
                <label style="font-size: 0.8em; color: var(--text-muted); margin-bottom: 4px; display: block;">Materiał (ręcznie)</label>
                <input name="material_name" placeholder="Płyta z Excela / ręcznie" style="width: 100%;">
              </div>
              <div style="flex: 2; min-width: 200px;">
                <label style="font-size: 0.8em; color: var(--text-muted); margin-bottom: 4px; display: block;">Okleina (baza)</label>
                <select name="edge_material_id" style="width: 100%;"></select>
              </div>
              <div style="flex: 1; min-width: 150px;">
                <label style="font-size: 0.8em; color: var(--text-muted); margin-bottom: 4px; display: block;">Okleina (ręcznie)</label>
                <input name="edge_material_name" placeholder="Okleina z Excela" style="width: 100%;">
              </div>
              <div style="flex: 1; min-width: 120px;">
                <label style="font-size: 0.8em; color: var(--text-muted); margin-bottom: 4px; display: block;">Status</label>
                <select name="status" style="width: 100%;">
                  <option>Robocze</option>
                  <option>Zaimportowane formatki</option>
                  <option>Wyeksportowane do GibLab</option>
                  <option>Wynik z GibLab zaimportowany</option>
                </select>
              </div>
              <div style="flex: 1; min-width: 150px;">
                <label style="font-size: 0.8em; color: var(--text-muted); margin-bottom: 4px; display: block;">Notatki</label>
                <input name="notes" placeholder="Notatki" style="width: 100%;">
              </div>
              <div class="actions" style="flex: 100%; display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; border-top: 1px solid var(--line); padding-top: 12px;">
                <button type="submit">Zapisz pozycję</button>
                <button id="newCutJobBtn" type="button">Nowa pozycja</button>
                <button id="deleteCutJobBtn" class="danger" type="button">Usuń pozycję</button>
                <button id="clearCutJobBtn" type="button">Wyczyść</button>
              </div>
`;

// Replace everything inside cutJobForm
const formStart = html.indexOf('<form id="cutJobForm"');
const formInnerStart = html.indexOf('>', formStart) + 1;
const formEnd = html.indexOf('</form>', formInnerStart);
html = html.substring(0, formInnerStart) + cutJobFormInner + html.substring(formEnd);


// Remove ZAMÓWIENIE and KLIENT from the table headers
const oldHeaders = `<th>ID</th>
                      <th>Zamówienie</th>
                      <th>Klient</th>
                      <th>Pozycja</th>`;
const newHeaders = `<th>ID</th>
                      <th>Pozycja</th>`;
html = html.replace(oldHeaders, newHeaders);

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');


// 2. Update app.js
let js = fs.readFileSync('public/app.js', 'utf8');

// In app.js, find renderCutJobs() where it maps the table rows and remove the two columns:
// <td>${escapeHtml(row.order_number)}</td>
// <td>${escapeHtml(row.customer_name)}</td>
// Let's use string replace for this chunk.

const trStartPattern = `<td>\${row.id}</td>`;
const trIndex = js.indexOf(trStartPattern);

if (trIndex !== -1) {
  const trEndIndex = js.indexOf('</tr>', trIndex);
  let trContent = js.substring(trIndex, trEndIndex);
  
  // Remove those two <td> lines
  trContent = trContent.replace(/<td>\${escapeHtml\(row\.order_number\)}<\/td>\s*/g, '');
  trContent = trContent.replace(/<td>\${escapeHtml\(row\.customer_name\)}<\/td>\s*/g, '');
  
  js = js.substring(0, trIndex) + trContent + js.substring(trEndIndex);
  fs.writeFileSync('public/app.js', js, 'utf8');
  console.log("HTML and JS updated successfully.");
} else {
  console.log("Could not find trStartPattern in app.js");
}

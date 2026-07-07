const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// Normalize line endings for regex
html = html.replace(/\r\n/g, '\n');

// Remove redundant order buttons
html = html.replace(/.*<button id="newOrderBtn".*\n?/g, '');
html = html.replace(/.*<button id="addOrderPositionBtn".*\n?/g, '');

// Extract and remove topbar
const topbarRegex = /<header class="topbar">[\s\S]*?<\/header>/;
const match = html.match(topbarRegex);

if (match) {
  html = html.replace(topbarRegex, '');
  
  const bottomSidebar = `
        <div class="sidebar-bottom" style="margin-top: auto; padding: 16px;">
          <details>
            <summary style="color: var(--text-muted); cursor: pointer; font-size: 0.9rem; padding: 8px; border-radius: 8px; transition: background 0.2s;">⚙ Narzędzia GibLab</summary>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
              <button id="importDefaultBtn" class="secondary" style="width: 100%; justify-content: center;">Import GibLab</button>
              <button id="polishCatalogBtn" class="secondary" style="width: 100%; justify-content: center;">Spolszcz</button>
              <label class="file-button secondary" style="width: 100%; text-align: center; display: inline-block;">
                Plik XLS
                <input id="goodsFile" type="file" accept=".xls,.xlsx" style="display:none;">
              </label>
              <button id="exportBtn" class="secondary" style="width: 100%; justify-content: center;">Test Eksport</button>
              <button id="exportGiblabBtn" class="secondary" style="width: 100%; justify-content: center;">Zapisz do GibLab</button>
            </div>
          </details>
        </div>
      </aside>`;
      
  html = html.replace('</aside>', bottomSidebar);
}

// Convert back to \r\n
html = html.replace(/\n/g, '\r\n');

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/g, 'styles.css');
html = html.replace('styles.css', 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Cleanup complete!");

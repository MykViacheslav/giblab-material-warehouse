const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('<section id="cuttingTab"');
const end = html.indexOf('</section>', start) + '</section>'.length;

const newCuttingTab = `
        <section id="cuttingTab" class="tab-page mockup-page">
          
          <!-- I. ZAMÓWIENIE -->
          <div class="ui-section">
            <div class="ui-section-header">
              <h3>I. ZAMÓWIENIE</h3>
              <div class="ui-section-actions">
                <button id="exportCutExcelBtn" type="button" class="outline-action">WYŚLIJ POZYCJĘ</button>
                <button id="exportCutOrderBtn" type="button" class="outline-action">WYŚLIJ ZAMÓWIENIE</button>
                <button id="importExportedProjectBtn" type="button" class="outline-action">ODBIERZ WYNIK</button>
                <input id="cutProjectFile" type="file" accept=".project,.xml" hidden>
                <button id="quoteCutJobBtn" type="button" class="outline-action">WYCEŃ</button>
              </div>
            </div>
            <div class="ui-section-content">
              <select id="globalCutOrderSelect" class="large-select order-select">
                 <!-- options populated by JS -->
              </select>
            </div>
          </div>

          <!-- II. POZYCJE W ZAMÓWIENIU -->
          <div class="ui-section">
            <div class="ui-section-header">
              <h3>II. POZYCJE W ZAMÓWIENIU</h3>
              <div class="ui-section-actions">
                <label class="file-button outline-action">
                  IMPORT FORMATEK EXCEL
                  <input id="cutExcelFile" type="file" accept=".xls,.xlsx,.csv">
                </label>
                <button id="cutTextImportToggleBtn" type="button" class="outline-action">UKRYJ IMPORT TEKST / ZDJĘCIE</button>
                <span id="cutStatus" class="hint"></span>
              </div>
            </div>
            <div class="ui-section-content">
              <form id="cutJobForm" class="grid-form mockup-grid">
                <select name="order_id" style="display:none;"></select>
                <select name="operation_type" title="Typ operacji" style="display:none;">
                   <option value="CN" selected>(CN) Nesting</option>
                </select>

                <!-- Row 1 -->
                <input name="name" placeholder="Pozycja 1" required>
                <input id="cutJobMaterialSearch" class="cut-material-search" placeholder="Szukaj płyty">
                <select id="cutJobProducerFilter" class="cut-filter-select"><option value="">Producent</option></select>
                <select id="cutJobThicknessFilter" class="cut-filter-select"><option value="">Grubość</option></select>
                <select name="material_id" class="cut-material-select"><option value="">Materiał z listy GibLab</option></select>
                <input name="material_name" placeholder="Płyta z Excela">
                
                <!-- Row 2 -->
                <input id="cutJobEdgeMaterialSearch" class="cut-material-search" placeholder="Szukaj okleiny">
                <select name="edge_material_id" class="cut-material-select"><option value="">Wybierz okleinę z bazy</option></select>
                <input name="edge_material_name" placeholder="Okleina z Excela / ręcznie">
                <select name="status">
                  <option>Robocze</option>
                  <option>Zaimportowane formatki</option>
                  <option>Wyeksportowane do GibLab</option>
                  <option>Wynik z GibLab zaimportowany</option>
                </select>
                <div class="mockup-empty-cell"></div>
                <div class="mockup-empty-cell"></div>

                <!-- Row 3 -->
                <input name="notes" placeholder="Notatki" style="grid-column: 1 / -1;">

                <!-- Row 4 -->
                <div class="mockup-actions" style="grid-column: 1 / -1;">
                  <button type="submit" class="blue-btn">ZAPISZ POZYCJĘ</button>
                  <button id="newCutJobBtn" type="button" class="outline-action">NOWA POZYCJA</button>
                  <button id="deleteCutJobBtn" class="danger red-btn" type="button">USUŃ POZYCJĘ</button>
                  <button id="clearCutJobBtn" type="button" class="outline-action">WYCZYŚĆ</button>
                </div>
              </form>
            </div>
          </div>

          <!-- III. ŹRÓDŁO IMPORTU -->
          <div id="cutTextImportPanel" class="ui-section">
            <div class="ui-section-content text-import-layout">
              <div class="text-import-left">
                <textarea id="cutTextImport" placeholder="240 x 450 sztuk 1 frez&#10;1621 x 746 sztuk 1 frez"></textarea>
              </div>
              <div class="text-import-right">
                <div class="photo-import-box">
                  <h4 class="small-title">ŹRÓDŁO IMPORTU</h4>
                  <div class="photo-preview-area">
                    <label class="file-button outline-action">
                      IMPORT ZE ZDJĘCIA
                      <input id="cutPhotoFile" type="file" accept="image/*">
                    </label>
                    <button id="importCutTextBtn" type="button" class="outline-action">DODAJ DO TABELI</button>
                  </div>
                  <span id="cutTextImportStatus" class="hint"></span>
                </div>
              </div>
            </div>
            
            <div class="bulk-actions-panel">
              <div class="bulk-checks">
                <label class="mockup-check"><input type="checkbox"> Frez</label>
                <label class="mockup-check"><input type="checkbox"> Otwór</label>
                <label class="mockup-check"><input type="checkbox"> Lakier</label>
                <label class="mockup-check"><input type="checkbox"> Skos / inne</label>
                <select class="outline-select"><option>Technologia / uwagi dla la</option></select>
              </div>
              <button class="blue-btn full-width" type="button">ZASTOSUJ DO ZAZNACZONYCH</button>
            </div>
          </div>

          <!-- Hidden manual form -->
          <form id="cutPartForm" class="stock-form cutting-part-form" style="display:none;">
            <input id="cutMaterialSearch">
            <select id="cutProducerFilter"></select>
            <select id="cutThicknessFilter"></select>
            <select name="material_id"></select>
            <input name="material_code">
            <input name="material_name">
            <input id="cutEdgeMaterialSearch">
            <select name="edge_material_id"></select>
            <input name="edge_material_code">
            <input name="edge_material_name">
            <input name="thickness">
            <input name="length">
            <input name="width">
            <input name="quantity">
            <input name="texture" type="checkbox">
            <input name="name">
            <input id="edgeAll" type="checkbox">
            <input name="edge_top" type="checkbox">
            <input name="edge_bottom" type="checkbox">
            <input name="edge_left" type="checkbox">
            <input name="edge_right" type="checkbox">
            <input name="description">
            <button type="submit">Dodaj formatkę</button>
          </form>

          <!-- IV. TABLES -->
          <div class="split-tables mockup-tables">
            <div class="table-wrap quote-table mockup-table-box">
              <h4 class="table-title">POZYCJE ZAMÓWIENIA</h4>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Zamówienie</th>
                    <th>Klient</th>
                    <th>Pozycja</th>
                    <th>Materiał</th>
                    <th>Status</th>
                    <th>Szt.</th>
                    <th>m2 formatek</th>
                    <th>GibLab ark./m2</th>
                    <th>Okleina mb</th>
                  </tr>
                </thead>
                <tbody id="cutJobsBody"></tbody>
              </table>
            </div>
            <div class="table-wrap quote-table mockup-table-box">
              <h4 class="table-title">FORMATKI W WYBRANEJ POZYCJI</h4>
              <table>
                <thead>
                  <tr>
                    <th>Lp.</th>
                    <th>D</th>
                    <th>S</th>
                    <th>Ilość</th>
                    <th>Tkt</th>
                    <th>OB</th>
                    <th>OH</th>
                    <th>OL</th>
                    <th>OP</th>
                    <th>Frez</th>
                    <th>Otw.</th>
                    <th>Lak.</th>
                    <th>Inne</th>
                    <th>Typ</th>
                    <th>Tech.</th>
                    <th>Str.</th>
                    <th>Nazwa</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="cutPartsBody"></tbody>
              </table>
            </div>
          </div>

          <!-- V. BOTTOM PRICING -->
          <div class="cut-bottom-panel mockup-bottom-panel">
            <div id="cutMaterialChips" class="material-chips"></div>
            <form id="cutQuoteForm" class="stock-form quote-form mockup-prices">
              <input name="material_price" placeholder="Cena materiału / m2">
              <input name="cut_price" placeholder="Cena cięcia / szt.">
              <input name="edge_price" placeholder="Cena oklejania / mb">
              <input name="milling_price" placeholder="Cena frezowania / szt.">
              <input name="drilling_price" placeholder="Cena otworu / szt.">
              <input name="lacquer_price" placeholder="Cena lakierowania / m2">
              <input name="other_price" placeholder="Cena innej pracy / szt.">
              <select name="service_price_item_id" class="service-price-select" style="display:none;"></select>
              <select name="service_price_target" class="service-target-select" style="display:none;">
                <option value="cut_price">Cięcie / szt.</option>
                <option value="edge_price">Oklejanie / mb</option>
              </select>
              <button id="applyServicePriceBtn" type="button" class="outline-action">Cena z cennika</button>
              <button id="addCutQuoteBtn" type="button" class="outline-action">Dodaj robociznę</button>
              <button id="openCutExportFolderBtn" type="button" class="outline-action">Pokaż plik importu</button>
              <span id="cutTotals" class="quote-summary"></span>
            </form>
            <div class="table-wrap cut-quote-table" style="display:none;">
              <table>
                <thead>
                  <tr>
                    <th>Robocizna / cena</th>
                    <th>J.m.</th>
                    <th>Ilość</th>
                    <th>Cena</th>
                    <th>Wartość</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="cutQuoteLinesBody"></tbody>
              </table>
            </div>
          </div>

        </section>`;

const updatedHtml = html.substring(0, start) + newCuttingTab + html.substring(end);
fs.writeFileSync('public/index.html', updatedHtml, 'utf8');
console.log('Successfully updated cuttingTab in index.html');

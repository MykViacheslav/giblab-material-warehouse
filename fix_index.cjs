const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Remove extra </div> in calendarTab
html = html.replace('</tbody>\r\n            </table>\r\n          </div>\r\n          </div>\r\n        </section>', '</tbody>\r\n            </table>\r\n          </div>\r\n        </section>');

html = html.replace('</tbody>\n            </table>\n          </div>\n          </div>\n        </section>', '</tbody>\n            </table>\n          </div>\n        </section>');

// 2. Add missing </div> in cuttingTab
html = html.replace('Po rozkroju użyj "Importuj wynik rozkroju".\r\n            </p>\r\n          </div>\r\n        </section>', 'Po rozkroju użyj "Importuj wynik rozkroju".\r\n            </p>\r\n          </div>\r\n          </div>\r\n        </section>');

html = html.replace('Po rozkroju użyj "Importuj wynik rozkroju".\n            </p>\n          </div>\n        </section>', 'Po rozkroju użyj "Importuj wynik rozkroju".\n            </p>\n          </div>\n          </div>\n        </section>');

// 3. Replace cutJobForm
const oldForm = `<form id="cutJobForm" class="grid-form order-grid" style="margin-bottom: 15px;">
              <select name="order_id" style="display:none;"></select>
              <input name="name" placeholder="Nazwa pozycji, np. Pozycja 1" required>
              <select name="material_id"></select>
              <input name="material_name" placeholder="Płyta z Excela / ręcznie">
              <select name="edge_material_id"></select>
              <input name="edge_material_name" placeholder="Okleina z Excela / ręcznie">
              <select name="status">
                <option>Robocze</option>
                <option>Zaimportowane formatki</option>
                <option>Wyeksportowane do GibLab</option>
                <option>Wynik z GibLab zaimportowany</option>
              </select>
              <input name="notes" placeholder="Notatki">
              <div class="actions">
                <button type="submit">Zapisz pozycję</button>
                <button id="newCutJobBtn" type="button">Nowa pozycja</button>
                <button id="deleteCutJobBtn" class="danger" type="button">Usuń pozycję</button>
                <button id="clearCutJobBtn" type="button">Wyczyść</button>
              </div>
            </form>`;

const newForm = `<form id="cutJobForm" class="grid-form order-grid" style="margin-bottom: 15px;">
              <select name="order_id" style="display:none;"></select>
              <input name="name" placeholder="Nazwa pozycji, np. Pozycja 1" required>
              
              <input id="cutJobMaterialSearch" class="cut-material-search" placeholder="Szukaj płyty">
              <select id="cutJobProducerFilter" class="cut-filter-select"></select>
              <select id="cutJobThicknessFilter" class="cut-filter-select"></select>
              <select name="material_id" class="cut-material-select"></select>
              <input name="material_name" placeholder="Płyta z Excela / ręcznie">
              
              <input id="cutJobEdgeMaterialSearch" class="cut-material-search" placeholder="Szukaj okleiny">
              <select name="edge_material_id" class="cut-material-select"></select>
              <input name="edge_material_name" placeholder="Okleina z Excela / ręcznie">
              
              <select name="status">
                <option>Robocze</option>
                <option>Zaimportowane formatki</option>
                <option>Wyeksportowane do GibLab</option>
                <option>Wynik z GibLab zaimportowany</option>
              </select>
              <input name="notes" placeholder="Notatki">
              
              <div class="actions" style="grid-column: 1 / -1; justify-content: flex-start; margin-top: 10px;">
                <button type="submit">Zapisz pozycję</button>
                <button id="newCutJobBtn" type="button">Nowa pozycja</button>
                <button id="deleteCutJobBtn" class="danger" type="button">Usuń pozycję</button>
                <button id="clearCutJobBtn" type="button">Wyczyść</button>
              </div>
            </form>`;

html = html.replace(oldForm, newForm);
html = html.replace(oldForm.replace(/\n/g, '\r\n'), newForm.replace(/\n/g, '\r\n'));

fs.writeFileSync('public/index.html', html);
console.log('Fixed index.html');

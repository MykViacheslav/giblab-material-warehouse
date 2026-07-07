const fs = require('fs');

let indexHtml = fs.readFileSync('public/index.html', 'utf8');

const newForm = `<form id="cutJobForm" class="grid-form order-grid" style="margin-bottom: 15px;">
              <select name="order_id" style="display:none;"></select>
              <input name="name" placeholder="Nazwa pozycji, np. Pozycja 1" required>
              
              <select name="operation_type" title="Typ operacji">
                 <option value="O">(O) Inne działania</option>
                 <option value="CS">(CS) Rozkrój płytowy</option>
                 <option value="CN" selected>(CN) Nesting</option>
                 <option value="CL">(CL) Rozkrój profili</option>
                 <option value="EL">(EL) Oklejanie</option>
                 <option value="SP">(SP) Obróbka pow.</option>
                 <option value="GR">(GR) Rowkowanie</option>
                 <option value="XNC">(XNC) Obróbka</option>
                 <option value="LB">(LB) Etykiety</option>
              </select>

              <select name="status">
                <option>Robocze</option>
                <option>Zaimportowane formatki</option>
                <option>Wyeksportowane do GibLab</option>
                <option>Wynik z GibLab zaimportowany</option>
              </select>

              <input id="cutJobMaterialSearch" class="cut-material-search" placeholder="Szukaj płyty">
              <select id="cutJobProducerFilter" class="cut-filter-select"></select>
              <select id="cutJobThicknessFilter" class="cut-filter-select"></select>
              <select name="material_id" class="cut-material-select"></select>
              <input name="material_name" placeholder="Płyta z Excela">
              
              <input id="cutJobEdgeMaterialSearch" class="cut-material-search" placeholder="Szukaj okleiny">
              <select name="edge_material_id" class="cut-material-select"></select>
              <input name="edge_material_name" placeholder="Okleina z Excela">
              
              <input name="notes" placeholder="Notatki">
              
              <div class="actions" style="grid-column: 1 / -1; justify-content: flex-start; margin-top: 5px;">
                <button type="submit">Zapisz pozycję</button>
                <button id="newCutJobBtn" type="button">Nowa pozycja</button>
                <button id="deleteCutJobBtn" class="danger" type="button">Usuń pozycję</button>
                <button id="clearCutJobBtn" type="button">Wyczyść</button>
              </div>
            </form>`;

const startIdx = indexHtml.indexOf('<form id="cutJobForm"');
const endIdx = indexHtml.indexOf('</form>', startIdx) + 7;

if (startIdx !== -1 && endIdx !== -1) {
    indexHtml = indexHtml.substring(0, startIdx) + newForm + indexHtml.substring(endIdx);
    fs.writeFileSync('public/index.html', indexHtml);
    console.log('Replaced cutJobForm correctly');
} else {
    console.log('Could not find cutJobForm start or end');
}

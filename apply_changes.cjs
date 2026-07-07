const fs = require('fs');

// 1. Update server.js to ensure operation_type column exists
let serverJs = fs.readFileSync('server.js', 'utf8');
if (!serverJs.includes('ensureColumn("cut_jobs", "operation_type"')) {
    serverJs = serverJs.replace(
        'ensureColumn("cut_jobs", "material_code", "TEXT DEFAULT \'\'");',
        'ensureColumn("cut_jobs", "material_code", "TEXT DEFAULT \'\'");\n  ensureColumn("cut_jobs", "operation_type", "TEXT DEFAULT \'CN\'");'
    );
    fs.writeFileSync('server.js', serverJs);
}

// 2. Update index.html
let indexHtml = fs.readFileSync('public/index.html', 'utf8');
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
              <input name="material_name" placeholder="Płyta (inna)">
              
              <input id="cutJobEdgeMaterialSearch" class="cut-material-search" placeholder="Szukaj okleiny">
              <select name="edge_material_id" class="cut-material-select"></select>
              <input name="edge_material_name" placeholder="Okleina (inna)">
              
              <input name="notes" placeholder="Notatki">
              
              <div class="actions" style="grid-column: 1 / -1; justify-content: flex-start; margin-top: 5px;">
                <button type="submit">Zapisz pozycję</button>
                <button id="newCutJobBtn" type="button">Nowa pozycja</button>
                <button id="deleteCutJobBtn" class="danger" type="button">Usuń pozycję</button>
                <button id="clearCutJobBtn" type="button">Wyczyść</button>
              </div>
            </form>`;

if(indexHtml.includes(oldForm)) {
    indexHtml = indexHtml.replace(oldForm, newForm);
} else if (indexHtml.includes(oldForm.replace(/\n/g, '\r\n'))) {
    indexHtml = indexHtml.replace(oldForm.replace(/\n/g, '\r\n'), newForm.replace(/\n/g, '\r\n'));
} else {
    console.log("Could not find cutJobForm in index.html to replace.");
}

fs.writeFileSync('public/index.html', indexHtml);

// 3. Update dom.js
let domJs = fs.readFileSync('public/js/dom.js', 'utf8');
if (!domJs.includes('cutJobMaterialSearch')) {
    domJs = domJs.replace(
        '  cutJobForm: document.querySelector("#cutJobForm"),',
        '  cutJobForm: document.querySelector("#cutJobForm"),\n  cutJobMaterialSearch: document.querySelector("#cutJobMaterialSearch"),\n  cutJobProducerFilter: document.querySelector("#cutJobProducerFilter"),\n  cutJobThicknessFilter: document.querySelector("#cutJobThicknessFilter"),\n  cutJobEdgeMaterialSearch: document.querySelector("#cutJobEdgeMaterialSearch"),'
    );
    fs.writeFileSync('public/js/dom.js', domJs);
}

console.log('Done replacing index and dom.');

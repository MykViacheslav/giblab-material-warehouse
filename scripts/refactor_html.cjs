const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const startPattern = '<section id="cuttingTab" class="tab-page">';
const endPattern = '<form id="cutJobForm" class="grid-form order-grid">';

const startIndex = html.indexOf(startPattern);
const endIndex = html.indexOf(endPattern, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find patterns");
    process.exit(1);
}

// We will reconstruct the whole upper part of cuttingTab up to the cutJobForm.
// We also need to remove the <select name="order_id"></select> from cutJobForm.

let topSection = `
          <section id="cuttingTab" class="tab-page">
            <div class="panel" style="margin-bottom: 24px; border: 1px solid var(--line-strong); padding: 16px; border-radius: 8px;">
              <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--primary);">I. ZAMÓWIENIE (Eksport i Wycena)</h3>
              <div class="toolbar-row">
                <select id="globalCutOrderSelect" style="flex: 1; max-width: 400px; font-weight: bold; font-size: 1.1em;"></select>
                <button id="exportCutExcelBtn" type="button">Wyślij do GibLab (.project)</button>
                <button id="importExportedProjectBtn" type="button">Odbierz wynik .project</button>
                <input id="cutProjectFile" type="file" accept=".project,.xml" hidden>
                <button id="quoteCutJobBtn" type="button">Wyceń formatki</button>
                <span id="cutStatus" class="hint"></span>
              </div>
            </div>

            <div id="cuttingPositionsPanel" class="panel" style="border: 1px solid var(--line); padding: 16px; border-radius: 8px; display: none;">
              <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--secondary);">II. POZYCJE (Materiały i Formatki)</h3>
              
              <div class="toolbar-row" style="margin-bottom: 8px; justify-content: flex-start;">
                <input id="cutMaterialSearch" class="cut-material-search" placeholder="Szukaj płyty">
                <select id="cutProducerFilter" class="cut-filter-select"></select>
                <select id="cutThicknessFilter" class="cut-filter-select"></select>
                <input id="cutEdgeMaterialSearch" class="cut-edge-search" placeholder="Szukaj okleiny">
              </div>
`;

// Replace everything from startPattern to endPattern with the new topSection
const originalTop = html.substring(startIndex, endIndex);
html = html.replace(originalTop, topSection);

// Now, we must remove <select name="order_id"></select> from inside cutJobForm
// Let's find cutJobForm and remove the first select name="order_id" inside it
const cutJobFormPattern = '<form id="cutJobForm" class="grid-form order-grid">';
const formStartIndex = html.indexOf(cutJobFormPattern);

if (formStartIndex !== -1) {
    const nextLineIndex = html.indexOf('<select name="order_id"></select>', formStartIndex);
    if (nextLineIndex !== -1 && nextLineIndex < formStartIndex + 200) {
        // Remove it
        const lineEnd = html.indexOf('\n', nextLineIndex) + 1;
        html = html.substring(0, nextLineIndex) + html.substring(lineEnd);
    }
}

// Next, let's move the Import buttons (Excel/Text) DOWN below cutJobForm, inside cuttingPositionsPanel.
// Wait, the originalTop had:
// <label class="file-button"> Import formatek Excel <input id="cutExcelFile" type="file" accept=".xls,.xlsx,.csv"></label>
// <button id="cutTextImportToggleBtn" type="button">Import tekst / zdjęcie</button>
// Where should we put them? The user requested: "Umieszczenie przycisków importu (Excel, Tekst) w kontekście wybranej pozycji"
// So we should put them after the `cutJobForm` actions.

// Let's find the closing of cutJobForm:
const cutJobFormEnd = '</form>';
let closingIndex = html.indexOf(cutJobFormEnd, formStartIndex);
if (closingIndex !== -1) {
    const importButtons = `
              <div class="toolbar-row" style="margin-top: 16px; margin-bottom: 16px;">
                <label class="file-button">
                  Import formatek Excel
                  <input id="cutExcelFile" type="file" accept=".xls,.xlsx,.csv">
                </label>
                <button id="cutTextImportToggleBtn" type="button">Import tekst / zdjęcie</button>
              </div>
`;
    // Insert after </form>
    html = html.substring(0, closingIndex + cutJobFormEnd.length) + importButtons + html.substring(closingIndex + cutJobFormEnd.length);
}

// Next, move the table of jobs.
// The user wants the table of positions to be ABOVE the form? Or below the form?
// Let's look at the implementation plan:
// 1. Lista Pozycji (Tabela)
// 2. Formularz Pozycji
// 3. Akcje Pozycji (Import Excel)
// 4. Formatki i Robocizna (cutPartForm, cutPartsBody)

// Let's find the `<div class="split-tables">` and cut the first `table-wrap quote-table` (which is cutJobsBody).
// Wait, doing this via string manipulation is error-prone. Let's do it carefully.
const splitTablesStart = '<div class="split-tables">';
const splitTablesIdx = html.indexOf(splitTablesStart);
if (splitTablesIdx !== -1) {
    // The cutJobs table is the first `<div class="table-wrap quote-table">` inside it.
    // Let's find its end. It ends with `</div>` right before the next `<div class="table-wrap quote-table">`.
    const firstWrapStart = html.indexOf('<div class="table-wrap quote-table">', splitTablesIdx);
    const secondWrapStart = html.indexOf('<div class="table-wrap quote-table">', firstWrapStart + 1);
    
    if (firstWrapStart !== -1 && secondWrapStart !== -1) {
        const cutJobsTableHTML = html.substring(firstWrapStart, secondWrapStart);
        // Remove it from the original place
        html = html.substring(0, firstWrapStart) + html.substring(secondWrapStart);
        
        // Insert it BEFORE cutJobForm
        const formIndex = html.indexOf('<form id="cutJobForm"');
        if (formIndex !== -1) {
            const tableToInsert = `
              <div class="table-wrap quote-table" style="max-height: 250px; margin-bottom: 16px;">
                ${cutJobsTableHTML.substring(36)}
            `;
            html = html.substring(0, formIndex) + tableToInsert + html.substring(formIndex);
        }
    }
}

// Add the closing div for cuttingPositionsPanel before the end of cuttingTab
const cuttingTabEnd = '</section>\n        <section id="materialsTab" class="tab-page">';
html = html.replace(cuttingTabEnd, '            </div>\n' + cuttingTabEnd);

// Cache bust
html = html.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=' + Date.now());

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("HTML structure refactored successfully.");

const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// 1. Update event listeners at the top
const oldEvents = `elements.cutMaterialSearch.addEventListener("input", renderCutMaterialLists);
elements.cutEdgeMaterialSearch.addEventListener("input", renderEdgeMaterialLists);
elements.cutProducerFilter.addEventListener("change", renderCutMaterialLists);
elements.cutThicknessFilter.addEventListener("change", renderCutMaterialLists);`;

const newEvents = `elements.cutMaterialSearch.addEventListener("input", renderCutPartMaterialSelect);
elements.cutEdgeMaterialSearch.addEventListener("input", renderEdgeMaterialLists);
elements.cutProducerFilter.addEventListener("change", renderCutPartMaterialSelect);
elements.cutThicknessFilter.addEventListener("change", renderCutPartMaterialSelect);

elements.cutJobMaterialSearch?.addEventListener("input", renderCutMaterialSelect);
elements.cutJobProducerFilter?.addEventListener("change", renderCutMaterialSelect);
elements.cutJobThicknessFilter?.addEventListener("change", renderCutMaterialSelect);
elements.cutJobEdgeMaterialSearch?.addEventListener("input", renderCutJobEdgeMaterialSelect);`;

if (appJs.includes(oldEvents)) {
    appJs = appJs.replace(oldEvents, newEvents);
}

// 2. Update filtering functions
const oldFilter = `function getFilteredCutMaterials() {
  const query = normalizeText(elements.cutMaterialSearch.value);
  const producer = elements.cutProducerFilter.value;
  const thickness = elements.cutThicknessFilter.value;`;

const newFilter = `function getFilteredCutMaterials(searchEl, producerEl, thicknessEl) {
  const query = normalizeText(searchEl?.value || "");
  const producer = producerEl?.value || "";
  const thickness = thicknessEl?.value || "";`;

if (appJs.includes(oldFilter)) {
    appJs = appJs.replace(oldFilter, newFilter);
}

// 3. Update renderCutMaterialSelect
const oldRenderSelect = `function renderCutMaterialSelect() {
  const select = elements.cutJobForm.elements.material_id;
  const currentValue = select.value;
  const materials = getFilteredCutMaterials();`;

const newRenderSelect = `function renderCutMaterialSelect() {
  const select = elements.cutJobForm.elements.material_id;
  if (!select) return;
  const currentValue = select.value;
  const materials = getFilteredCutMaterials(elements.cutJobMaterialSearch, elements.cutJobProducerFilter, elements.cutJobThicknessFilter);`;

if (appJs.includes(oldRenderSelect)) {
    appJs = appJs.replace(oldRenderSelect, newRenderSelect);
}

// 4. Update renderCutPartMaterialSelect
const oldRenderPartSelect = `function renderCutPartMaterialSelect() {
  const select = elements.cutPartForm.elements.material_id;
  const currentValue = select.value;
  const materials = getFilteredCutMaterials();`;

const newRenderPartSelect = `function renderCutPartMaterialSelect() {
  const select = elements.cutPartForm.elements.material_id;
  if (!select) return;
  const currentValue = select.value;
  const materials = getFilteredCutMaterials(elements.cutMaterialSearch, elements.cutProducerFilter, elements.cutThicknessFilter);`;

if (appJs.includes(oldRenderPartSelect)) {
    appJs = appJs.replace(oldRenderPartSelect, newRenderPartSelect);
}

// 6. Update renderEdgeMaterialLists
const oldEdgeList = `function renderEdgeMaterialLists() {
  const materials = getFilteredEdgeMaterials();
  const renderSelect = (select) => {
    if(!select) return;
    const current = select.value;
    select.innerHTML = \`<option value="">Wybierz okleinę z bazy</option>\` + materials.map((m) => \`
<option value="\${m.id}">\${escapeHtml(m.code + ' - ' + m.name)}</option>\`).join("");
    if(materials.some((m) => String(m.id) === current)) select.value = current;
  };
  renderSelect(elements.cutJobForm.elements.edge_material_id);
  renderSelect(elements.cutPartForm.elements.edge_material_id);
}`;

const newEdgeList = `function renderEdgeMaterialLists() {
  const materials = getFilteredEdgeMaterials();
  const renderSelect = (select) => {
    if(!select) return;
    const current = select.value;
    select.innerHTML = \`<option value="">Wybierz okleinę z bazy</option>\` + materials.map((m) => \`
<option value="\${m.id}">\${escapeHtml(m.code + ' - ' + m.name)}</option>\`).join("");
    if(materials.some((m) => String(m.id) === current)) select.value = current;
  };
  renderSelect(elements.cutPartForm.elements.edge_material_id);
}

function renderCutJobEdgeMaterialSelect() {
  const query = normalizeText(elements.cutJobEdgeMaterialSearch?.value || "");
  const materials = state.flat.filter((row) => {
    if (row.isfolder) return false;
    const searchText = normalizeText(\`\${row.code} \${row.name}\`);
    return !query || searchText.includes(query);
  });
  const select = elements.cutJobForm.elements.edge_material_id;
  if (!select) return;
  const current = select.value;
  select.innerHTML = \`<option value="">Wybierz okleinę z bazy</option>\` + materials.map((m) => \`
<option value="\${m.id}">\${escapeHtml(m.code + ' - ' + m.name)}</option>\`).join("");
  if(materials.some((m) => String(m.id) === current)) select.value = current;
}`;

if (appJs.includes(oldEdgeList)) {
    appJs = appJs.replace(oldEdgeList, newEdgeList);
}

// 7. Make sure populate logic is updated
const oldFillForm = `function fillCutJobForm(row) {
  const f = elements.cutJobForm;
  f.elements.name.value = row.name || "";
  f.elements.material_id.value = row.material_id || "";
  f.elements.material_name.value = row.material_name || "";
  f.elements.edge_material_id.value = row.edge_material_id || "";
  f.elements.edge_material_name.value = row.edge_material_name || "";
  f.elements.status.value = row.status || "Robocze";
  f.elements.notes.value = row.notes || "";
}`;

const newFillForm = `function fillCutJobForm(row) {
  const f = elements.cutJobForm;
  f.elements.name.value = row.name || "";
  
  if (elements.cutJobMaterialSearch) elements.cutJobMaterialSearch.value = "";
  if (elements.cutJobProducerFilter) elements.cutJobProducerFilter.value = "";
  if (elements.cutJobThicknessFilter) elements.cutJobThicknessFilter.value = "";
  if (elements.cutJobEdgeMaterialSearch) elements.cutJobEdgeMaterialSearch.value = "";
  
  renderCutMaterialSelect();
  if (typeof renderCutJobEdgeMaterialSelect === "function") renderCutJobEdgeMaterialSelect();
  
  f.elements.material_id.value = row.material_id || "";
  f.elements.material_name.value = row.material_name || "";
  f.elements.edge_material_id.value = row.edge_material_id || "";
  f.elements.edge_material_name.value = row.edge_material_name || "";
  f.elements.status.value = row.status || "Robocze";
  if (f.elements.operation_type) f.elements.operation_type.value = row.operation_type || "CN";
  f.elements.notes.value = row.notes || "";
}`;

if (appJs.includes(oldFillForm)) {
    appJs = appJs.replace(oldFillForm, newFillForm);
}

fs.writeFileSync('public/app.js', appJs);
console.log('App patched');

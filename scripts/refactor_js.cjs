const fs = require('fs');

let js = fs.readFileSync('public/app.js', 'utf8');

// 1. Add globalCutOrderSelect to dom.js ... wait, I can just add it to elements in app.js
// But dom.js exports elements. I can dynamically add it:
const domInjection = `
elements.globalCutOrderSelect = document.querySelector("#globalCutOrderSelect");
elements.cuttingPositionsPanel = document.querySelector("#cuttingPositionsPanel");

if (elements.globalCutOrderSelect) {
  elements.globalCutOrderSelect.addEventListener("change", (e) => {
    state.selectedOrderId = Number(e.target.value) || null;
    state.selectedCutJobId = null;
    state.cutParts = [];
    state.cutQuoteLines = [];
    if (elements.cutJobForm) elements.cutJobForm.reset();
    renderCutJobs();
    renderCutParts();
    renderCutQuoteLines();
    
    if (state.selectedOrderId) {
      elements.cuttingPositionsPanel.style.display = "block";
    } else {
      elements.cuttingPositionsPanel.style.display = "none";
    }
  });
}
`;

// Insert after imports
js = js.replace('initializeStationName();', 'initializeStationName();\n' + domInjection);

// 2. Replace elements.cutJobForm.elements.order_id with elements.globalCutOrderSelect where appropriate.
// In renderOrdersSelects:
js = js.replace(
    'const select = elements.cutJobForm.elements.order_id;',
    'const select = elements.globalCutOrderSelect;'
);

// In multiple places: `elements.cutJobForm.elements.order_id.value = ...`
js = js.replace(/elements\.cutJobForm\.elements\.order_id\.value/g, 'elements.globalCutOrderSelect.value');

// In cutJobForm submit:
const submitPattern = `const payload = formPayload(elements.cutJobForm);`;
const submitReplacement = `const payload = formPayload(elements.cutJobForm);\n  payload.order_id = state.selectedOrderId;`;
js = js.replace(submitPattern, submitReplacement);

// In "Najpierw wybierz zamówienie albo pozycję formatek":
// order_id is now in globalCutOrderSelect, which we already replaced.

// Remove the event listener for order_id from cutJobForm:
// elements.cutJobForm.elements.order_id.addEventListener("change", () => {
// ...
// });
// We replaced `elements.cutJobForm.elements.order_id.value`, so it might be partially mangled.
// Let's just find `elements.globalCutOrderSelect.addEventListener("change", () => {` (the one that was mangled from cutJobForm) and remove it.
const mangledListenerStart = 'elements.globalCutOrderSelect.addEventListener("change", () => {';
const mangledIndex = js.lastIndexOf(mangledListenerStart); // Since I added my own at the top, I want the OLD one at line 447.
if (mangledIndex > 1000) {
    const mangledEnd = js.indexOf('});', mangledIndex) + 3;
    js = js.substring(0, mangledIndex) + js.substring(mangledEnd);
}

// In activateTab("cutting"), we should show/hide the panel based on state.selectedOrderId
const activateTabPattern = `if (tabName === "cutting") {`;
const activateTabReplacement = `if (tabName === "cutting") {
    if (elements.globalCutOrderSelect) elements.globalCutOrderSelect.value = state.selectedOrderId ? String(state.selectedOrderId) : "";
    if (elements.cuttingPositionsPanel) elements.cuttingPositionsPanel.style.display = state.selectedOrderId ? "block" : "none";
`;
js = js.replace(activateTabPattern, activateTabReplacement);


// Verify resetCutJobForm doesn't break
// resetCutJobForm only calls elements.cutJobForm.reset(); and resets selected states. It doesn't clear order_id explicitly.
// But wait, there was: elements.cutJobForm.elements.order_id.value = String(orderId);
// That was replaced by elements.globalCutOrderSelect.value = String(orderId); 
// We should make sure `cuttingPositionsPanel` becomes visible when this happens!
const setOrderPattern = `elements.globalCutOrderSelect.value = String(orderId);`;
const setOrderReplacement = `elements.globalCutOrderSelect.value = String(orderId);
  if (elements.cuttingPositionsPanel && orderId) elements.cuttingPositionsPanel.style.display = "block";`;
js = js.replace(new RegExp(setOrderPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), setOrderReplacement);

const setOrderPattern2 = `elements.globalCutOrderSelect.value = String(id);`;
const setOrderReplacement2 = `elements.globalCutOrderSelect.value = String(id);
  if (elements.cuttingPositionsPanel && id) elements.cuttingPositionsPanel.style.display = "block";`;
js = js.replace(new RegExp(setOrderPattern2.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), setOrderReplacement2);


fs.writeFileSync('public/app.js', js, 'utf8');
console.log("app.js logic updated successfully.");

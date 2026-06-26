const state = {
  flat: [],
  tree: [],
  customers: [],
  orders: [],
  priceItems: [],
  supplies: [],
  quoteLines: [],
  cutJobs: [],
  cutParts: [],
  cutQuoteLines: [],
  deliveries: [],
  deliveryLines: [],
  deliveryCorrections: [],
  deliveryCorrectionLines: [],
  purchaseNeeds: { rows: [], summary: null },
  materialImportRows: [],
  selectedId: null,
  selectedCustomerId: null,
  selectedOrderId: null,
  selectedPriceItemId: null,
  selectedSupplyId: null,
  selectedOffcutId: null,
  selectedCutJobId: null,
  selectedDeliveryId: null,
  selectedDeliveryCorrectionId: null,
  collapsed: new Set()
};

const elements = {
  layout: document.querySelector(".layout"),
  tree: document.querySelector("#tree"),
  hideTreeBtn: document.querySelector("#hideTreeBtn"),
  showTreeBtn: document.querySelector("#showTreeBtn"),
  materialsBody: document.querySelector("#materialsBody"),
  stockBody: document.querySelector("#stockBody"),
  stockHistoryPanel: document.querySelector("#stockHistoryPanel"),
  offcutsBody: document.querySelector("#offcutsBody"),
  customersBody: document.querySelector("#customersBody"),
  ordersBody: document.querySelector("#ordersBody"),
  dashboardCards: document.querySelector("#dashboardCards"),
  dashboardTodayBody: document.querySelector("#dashboardTodayBody"),
  dashboardStockBody: document.querySelector("#dashboardStockBody"),
  dashboardPaymentsBody: document.querySelector("#dashboardPaymentsBody"),
  calendarBody: document.querySelector("#calendarBody"),
  calendarSummary: document.querySelector("#calendarSummary"),
  materialForm: document.querySelector("#materialForm"),
  materialImportFile: document.querySelector("#materialImportFile"),
  materialImportMode: document.querySelector("#materialImportMode"),
  materialImportFilter: document.querySelector("#materialImportFilter"),
  materialImportPreviewBtn: document.querySelector("#materialImportPreviewBtn"),
  materialImportCommitBtn: document.querySelector("#materialImportCommitBtn"),
  materialImportSelectValidBtn: document.querySelector("#materialImportSelectValidBtn"),
  materialImportClearSelectionBtn: document.querySelector("#materialImportClearSelectionBtn"),
  materialImportSummary: document.querySelector("#materialImportSummary"),
  materialImportPreviewBody: document.querySelector("#materialImportPreviewBody"),
  stockForm: document.querySelector("#stockForm"),
  deliveryForm: document.querySelector("#deliveryForm"),
  deliveryLineForm: document.querySelector("#deliveryLineForm"),
  deliveriesBody: document.querySelector("#deliveriesBody"),
  deliveryLinesBody: document.querySelector("#deliveryLinesBody"),
  deliveryStatus: document.querySelector("#deliveryStatus"),
  newDeliveryBtn: document.querySelector("#newDeliveryBtn"),
  postDeliveryBtn: document.querySelector("#postDeliveryBtn"),
  deliveryCorrectionForm: document.querySelector("#deliveryCorrectionForm"),
  deliveryCorrectionLineForm: document.querySelector("#deliveryCorrectionLineForm"),
  deliveryCorrectionsBody: document.querySelector("#deliveryCorrectionsBody"),
  deliveryCorrectionLinesBody: document.querySelector("#deliveryCorrectionLinesBody"),
  deliveryCorrectionStatus: document.querySelector("#deliveryCorrectionStatus"),
  newDeliveryCorrectionBtn: document.querySelector("#newDeliveryCorrectionBtn"),
  postDeliveryCorrectionBtn: document.querySelector("#postDeliveryCorrectionBtn"),
  purchaseNeedsBody: document.querySelector("#purchaseNeedsBody"),
  purchaseNeedsSummary: document.querySelector("#purchaseNeedsSummary"),
  purchaseSearch: document.querySelector("#purchaseSearch"),
  purchaseSupplierFilter: document.querySelector("#purchaseSupplierFilter"),
  purchaseProducerFilter: document.querySelector("#purchaseProducerFilter"),
  purchaseTypeFilter: document.querySelector("#purchaseTypeFilter"),
  refreshPurchaseNeedsBtn: document.querySelector("#refreshPurchaseNeedsBtn"),
  exportPurchaseNeedsCsvBtn: document.querySelector("#exportPurchaseNeedsCsvBtn"),
  sendPurchaseNeedsTelegramBtn: document.querySelector("#sendPurchaseNeedsTelegramBtn"),
  offcutForm: document.querySelector("#offcutForm"),
  supplyForm: document.querySelector("#supplyForm"),
  suppliesBody: document.querySelector("#suppliesBody"),
  clearSupplyBtn: document.querySelector("#clearSupplyBtn"),
  customerForm: document.querySelector("#customerForm"),
  orderForm: document.querySelector("#orderForm"),
  paymentForm: document.querySelector("#paymentForm"),
  priceItemForm: document.querySelector("#priceItemForm"),
  clearPriceItemBtn: document.querySelector("#clearPriceItemBtn"),
  quoteLineForm: document.querySelector("#quoteLineForm"),
  priceItemsBody: document.querySelector("#priceItemsBody"),
  quoteLinesBody: document.querySelector("#quoteLinesBody"),
  quoteSummary: document.querySelector("#quoteSummary"),
  cutJobForm: document.querySelector("#cutJobForm"),
  cutPartForm: document.querySelector("#cutPartForm"),
  cutQuoteForm: document.querySelector("#cutQuoteForm"),
  cutJobsBody: document.querySelector("#cutJobsBody"),
  cutPartsBody: document.querySelector("#cutPartsBody"),
  cutQuoteLinesBody: document.querySelector("#cutQuoteLinesBody"),
  cutStatus: document.querySelector("#cutStatus"),
  cutTotals: document.querySelector("#cutTotals"),
  cutMaterialChips: document.querySelector("#cutMaterialChips"),
  cutMaterialSearch: document.querySelector("#cutMaterialSearch"),
  cutPhotoFile: document.querySelector("#cutPhotoFile"),
  cutTextImport: document.querySelector("#cutTextImport"),
  cutTextImportStatus: document.querySelector("#cutTextImportStatus"),
  cutProducerFilter: document.querySelector("#cutProducerFilter"),
  cutThicknessFilter: document.querySelector("#cutThicknessFilter"),
  calcLength: document.querySelector("#calcLength"),
  calcWidth: document.querySelector("#calcWidth"),
  calcCount: document.querySelector("#calcCount"),
  notifyText: document.querySelector("#notifyText"),
  newOrderBtn: document.querySelector("#newOrderBtn"),
  addOrderPositionBtn: document.querySelector("#addOrderPositionBtn"),
  newCutJobBtn: document.querySelector("#newCutJobBtn"),
  openCutExportFolderBtn: document.querySelector("#openCutExportFolderBtn"),
  payerCustomerSelect: document.querySelector("#payerCustomerSelect"),
  remainderStatus: document.querySelector("#remainderStatus"),
  remainderLogs: document.querySelector("#remainderLogs"),
  toast: document.querySelector("#toast")
};

const treeHiddenSetting = localStorage.getItem("giblabTreeHidden") === "1";
setTreeHidden(treeHiddenSetting);

window.addEventListener("unhandledrejection", (event) => {
  const message = event.reason?.message || "Operacja nie powiodła się";
  showToast(message);
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
  });
});

function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  document.querySelectorAll(".tab-page").forEach((page) => page.classList.remove("active"));
  document.querySelector(`#${tabName}Tab`)?.classList.add("active");
}

elements.hideTreeBtn.addEventListener("click", () => setTreeHidden(true));
elements.showTreeBtn.addEventListener("click", () => setTreeHidden(false));
elements.stockForm.elements.event_type.value = "receive";
elements.stockForm.elements.event_type.querySelector('[value="use_reserved"]').textContent = "Zużycie rezerwacji";
document.querySelectorAll("#stockTab th")[5].textContent = "Dostępne";

document.querySelector("#importDefaultBtn").addEventListener("click", async () => {
  const result = await postJson("/api/import/goods", {});
  await refreshAll();
  showToast(`Zaimportowano ${result.imported} wierszy z ${result.source}`);
});

document.querySelector("#goodsFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const form = new FormData();
  form.append("goods", file);
  const result = await fetchJson("/api/import/goods", { method: "POST", body: form });
  await refreshAll();
  showToast(`Zaimportowano ${result.imported} wierszy z ${result.source}`);
});

document.querySelector("#exportBtn").addEventListener("click", async () => {
  const result = await postJson("/api/export/goods", {});
  showToast(`Wyeksportowano ${result.exported} pozycji do ${result.target}`);
});

document.querySelector("#exportGiblabBtn").addEventListener("click", async () => {
  const result = await postJson("/api/export/giblab", {});
  showToast(`Zapisano ${result.exported} pozycji do ${result.target}`);
});

document.querySelector("#polishCatalogBtn").addEventListener("click", async () => {
  const result = await postJson("/api/tools/polish-catalog", {});
  await refreshAll();
  showToast(`Spolszczono ${result.changedNames} nazw i ${result.changedCodes} kodów`);
});

document.querySelector("#clearFormBtn").addEventListener("click", () => {
  state.selectedId = null;
  elements.materialForm.reset();
  elements.materialForm.elements.is_active.checked = true;
});

document.querySelector("#clearCustomerBtn").addEventListener("click", () => {
  state.selectedCustomerId = null;
  elements.customerForm.reset();
});

document.querySelector("#clearOrderBtn").addEventListener("click", resetOrderWorkspace);
elements.newOrderBtn.addEventListener("click", resetOrderWorkspace);
elements.addOrderPositionBtn.addEventListener("click", openCutPositionForSelectedOrder);

elements.customerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.customerForm);
  const url = state.selectedCustomerId ? `/api/customers/${state.selectedCustomerId}` : "/api/customers";
  await postJson(url, payload, state.selectedCustomerId ? "PUT" : "POST");
  state.selectedCustomerId = null;
  elements.customerForm.reset();
  await refreshCrm();
  showToast("Klient zapisany");
});

elements.orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.orderForm);
  if (!state.selectedOrderId) delete payload.order_number;
  const url = state.selectedOrderId ? `/api/orders/${state.selectedOrderId}` : "/api/orders";
  await postJson(url, payload, state.selectedOrderId ? "PUT" : "POST");
  state.selectedOrderId = null;
  elements.orderForm.reset();
  setDefaultOrderDates();
  await loadNextOrderNumber();
  await refreshCrm();
  showToast("Zamówienie zapisane");
});

elements.paymentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.paymentForm);
  const orderId = payload.order_id;
  await postJson(`/api/orders/${orderId}/payments`, payload);
  elements.paymentForm.reset();
  setDefaultPaymentDate();
  await refreshCrm();
  showToast("Wpłata dodana");
});

elements.priceItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = state.selectedPriceItemId ? `/api/price-items/${state.selectedPriceItemId}` : "/api/price-items";
  await postJson(url, formPayload(elements.priceItemForm), state.selectedPriceItemId ? "PUT" : "POST");
  state.selectedPriceItemId = null;
  elements.priceItemForm.reset();
  await refreshPricing();
  showToast("Pozycja cennika zapisana");
});

elements.clearPriceItemBtn?.addEventListener("click", () => {
  state.selectedPriceItemId = null;
  elements.priceItemForm.reset();
});

elements.quoteLineForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.quoteLineForm);
  const orderId = payload.order_id || state.selectedOrderId;
  if (!orderId) return showToast("Wybierz zamówienie do wyceny");
  await postJson(`/api/orders/${orderId}/quote-lines`, payload);
  elements.quoteLineForm.elements.description.value = "";
  elements.quoteLineForm.elements.quantity.value = "";
  await refreshCrm();
  await loadQuoteLines(orderId);
  showToast("Pozycja dodana do wyceny");
});

elements.quoteLineForm.elements.order_id.addEventListener("change", async () => {
  const orderId = Number(elements.quoteLineForm.elements.order_id.value);
  if (!orderId) {
    state.quoteLines = [];
    renderQuoteLines();
    return;
  }
  state.selectedOrderId = orderId;
  await loadQuoteLines(orderId);
});

elements.quoteLineForm.elements.price_item_id.addEventListener("change", () => {
  const item = state.priceItems.find((row) => String(row.id) === elements.quoteLineForm.elements.price_item_id.value);
  if (!item) return;
  elements.quoteLineForm.elements.description.value = item.name;
  elements.quoteLineForm.elements.unit.value = item.unit;
  elements.quoteLineForm.elements.unit_price.value = String(item.unit_price).replace(".", ",");
});

document.querySelector("#calcAreaBtn").addEventListener("click", () => {
  const length = parseDecimal(elements.calcLength.value);
  const width = parseDecimal(elements.calcWidth.value);
  const count = parseDecimal(elements.calcCount.value || "1");
  if (!length || !width || !count) return showToast("Podaj długość, szerokość i ilość");
  elements.quoteLineForm.elements.quantity.value = formatDecimalInput((length * width * count) / 1000000);
  elements.quoteLineForm.elements.unit.value = "m2";
});

document.querySelector("#calcLinearBtn").addEventListener("click", () => {
  const length = parseDecimal(elements.calcLength.value);
  const count = parseDecimal(elements.calcCount.value || "1");
  if (!length || !count) return showToast("Podaj długość i ilość");
  elements.quoteLineForm.elements.quantity.value = formatDecimalInput((length * count) / 1000);
  elements.quoteLineForm.elements.unit.value = "mb";
});

elements.cutJobForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.cutJobForm);
  const wasNew = !state.selectedCutJobId;
  const url = state.selectedCutJobId ? `/api/cut-jobs/${state.selectedCutJobId}` : "/api/cut-jobs";
  const saved = await postJson(url, payload, state.selectedCutJobId ? "PUT" : "POST");
  state.selectedCutJobId = saved.id;
  await refreshCutting();
  await loadCutParts(saved.id);
  if (wasNew) {
    focusCutDraftStart();
  }
  showToast(wasNew ? "Nowa pozycja dodana. Teraz wpisz formatki." : "Pozycja zaktualizowana");
});

document.querySelector("#clearCutJobBtn").addEventListener("click", () => {
  resetCutJobForm();
});

elements.newCutJobBtn.addEventListener("click", () => {
  const orderId = Number(elements.cutJobForm.elements.order_id.value || state.selectedOrderId || 0);
  if (!orderId) return showToast("Najpierw wybierz zamówienie");
  prepareNewCutJob(orderId);
  showToast("Nowa pozycja gotowa do wpisania");
});

elements.cutPartForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz albo zapisz zlecenie formatek");
  const selectedMaterialId = elements.cutPartForm.elements.material_id.value || elements.cutJobForm.elements.material_id.value;
  await postJson(`/api/cut-jobs/${state.selectedCutJobId}/parts`, formPayload(elements.cutPartForm));
  prepareNextCutPartRow(selectedMaterialId);
  await loadCutParts(state.selectedCutJobId);
  await refreshCutting();
  showToast("Formatka dodana");
});

elements.cutPartForm.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey) return;
  if (event.target.tagName === "TEXTAREA") return;
  event.preventDefault();
  if (!focusNextCutPartField(event.target)) elements.cutPartForm.requestSubmit();
});

document.querySelector("#cutExcelFile").addEventListener("change", async (event) => {
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz albo zapisz zlecenie formatek");
  const file = event.target.files[0];
  if (!file) return;
  const form = new FormData();
  form.append("formatki", file);
  const result = await fetchJson(`/api/cut-jobs/${state.selectedCutJobId}/import-excel`, { method: "POST", body: form });
  await refreshCutting();
  await loadCutParts(state.selectedCutJobId);
  elements.cutStatus.textContent = `Zaimportowano ${result.imported} formatek z arkusza ${result.sheet}`;
  showToast(`Zaimportowano ${result.imported} formatek`);
});

document.querySelector("#importCutTextBtn").addEventListener("click", importCutPartsFromText);

elements.cutPhotoFile.addEventListener("change", importCutTextFromPhoto);
elements.cutTextImport.addEventListener("input", updateCutTextImportStatus);

document.querySelector("#exportCutExcelBtn").addEventListener("click", async () => {
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz zlecenie formatek");
  const result = await postJson(`/api/cut-jobs/${state.selectedCutJobId}/export-excel`, {});
  const folder = await postJson(`/api/cut-jobs/${state.selectedCutJobId}/open-export-folder`, {});
  await refreshCutting();
  elements.cutStatus.textContent = `Plik dla GibLab: ${result.target}. W GibLab kliknij Import z Excel i wybierz ten plik z folderu: ${folder.folder}`;
  showToast(`Wyeksportowano ${result.exported} formatek do Excela`);
});


elements.openCutExportFolderBtn.addEventListener("click", async () => {
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz zlecenie formatek");
  const result = await postJson(`/api/cut-jobs/${state.selectedCutJobId}/open-export-folder`, {});
  elements.cutStatus.textContent = result.target
    ? `Zaznaczony plik importu GibLab: ${result.target}`
    : `Folder importu GibLab: ${result.folder}`;
  showToast("Pokazano plik importu GibLab");
});
document.querySelector("#quoteCutJobBtn").addEventListener("click", async () => {
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz zlecenie formatek");
  const result = await postJson(`/api/cut-jobs/${state.selectedCutJobId}/quote`, formPayload(elements.cutQuoteForm));
  state.cutQuoteLines = result.lines || [];
  await refreshCrm();
  await refreshPricing();
  renderCutTotals(result);
  renderCutQuoteLines();
  showToast("Wycena formatek dodana do zamówienia");
});

document.querySelector("#addCutQuoteBtn").addEventListener("click", async () => {
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz zlecenie formatek");
  const result = await postJson(`/api/cut-jobs/${state.selectedCutJobId}/quote`, formPayload(elements.cutQuoteForm));
  state.cutQuoteLines = result.lines || [];
  await refreshCrm();
  await refreshPricing();
  renderCutTotals(result);
  renderCutQuoteLines();
  showToast("Wycena formatek dodana do zamówienia");
});

document.querySelector("#applyServicePriceBtn").addEventListener("click", () => {
  const itemId = elements.cutQuoteForm.elements.service_price_item_id.value;
  const target = elements.cutQuoteForm.elements.service_price_target.value;
  const item = state.priceItems.find((row) => String(row.id) === itemId);
  if (!item || !target) return showToast("Wybierz pozycję z cennika i pole ceny");
  elements.cutQuoteForm.elements[target].value = String(item.unit_price).replace(".", ",");
});

document.querySelector("#cutProjectFile").addEventListener("change", async (event) => {
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz zlecenie formatek");
  const file = event.target.files[0];
  if (!file) return;
  const form = new FormData();
  form.append("project", file);
  const result = await fetchJson(`/api/cut-jobs/${state.selectedCutJobId}/import-project`, { method: "POST", body: form });
  await refreshCutting();
  await refreshOffcuts();
  elements.cutStatus.textContent = `Odebrano wynik GibLab: ${result.offcuts || 0} resztek, ${result.usedMaterials || 0} materiałów`;
  showToast("Wynik .project zaimportowany");
});

document.querySelector("#markPaidBtn").addEventListener("click", () => setSelectedPaymentStatus("Opłacone"));
document.querySelector("#markUnpaidBtn").addEventListener("click", () => setSelectedPaymentStatus("Nie zapłacone"));
document.querySelector("#notifySmsBtn").addEventListener("click", () => openNotifyLink("sms"));
document.querySelector("#notifyWhatsappBtn").addEventListener("click", () => openNotifyLink("whatsapp"));
document.querySelector("#notifyTelegramBtn").addEventListener("click", () => openNotifyLink("telegram"));
document.querySelector("#notifyEmailBtn").addEventListener("click", () => openNotifyLink("email"));
document.querySelector("#importLatestProjectBtn").addEventListener("click", importLatestProject);
document.querySelector("#showRemainderLogsBtn").addEventListener("click", showRemainderLogs);

elements.payerCustomerSelect.addEventListener("change", () => {
  const customer = state.customers.find((item) => String(item.id) === elements.payerCustomerSelect.value);
  if (customer) elements.paymentForm.elements.payer_name.value = customer.name;
});

elements.cutJobForm.elements.order_id.addEventListener("change", () => {
  state.selectedOrderId = Number(elements.cutJobForm.elements.order_id.value) || null;
  state.selectedCutJobId = null;
  state.cutParts = [];
  renderCutJobs();
  renderCutParts();
  renderCutTotals();
});

elements.cutJobForm.elements.material_id.addEventListener("change", () => {
  const material = state.flat.find((item) => String(item.id) === elements.cutJobForm.elements.material_id.value);
  if (material) applyCutJobMaterial(material);
});

elements.cutPartForm.elements.material_id.addEventListener("change", () => {
  applyCutPartMaterial(elements.cutPartForm.elements.material_id.value);
});

elements.cutMaterialSearch.addEventListener("input", renderCutMaterialLists);
elements.cutProducerFilter.addEventListener("change", renderCutMaterialLists);
elements.cutThicknessFilter.addEventListener("change", renderCutMaterialLists);

document.querySelector("#edgeAll").addEventListener("change", (event) => {
  ["edge_top", "edge_bottom", "edge_left", "edge_right"].forEach((name) => {
    elements.cutPartForm.querySelector(`[name="${name}"]`).checked = event.target.checked;
  });
});

["edge_top", "edge_bottom", "edge_left", "edge_right"].forEach((name) => {
  elements.cutPartForm.querySelector(`[name="${name}"]`).addEventListener("change", () => {
    const edgeInputs = ["edge_top", "edge_bottom", "edge_left", "edge_right"].map((edgeName) => elements.cutPartForm.querySelector(`[name="${edgeName}"]`));
    document.querySelector("#edgeAll").checked = edgeInputs.every((input) => input.checked);
  });
});

elements.materialForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.materialForm);
  const url = state.selectedId ? `/api/materials/${state.selectedId}` : "/api/materials";
  await postJson(url, payload, state.selectedId ? "PUT" : "POST");
  state.selectedId = null;
  elements.materialForm.reset();
  elements.materialForm.elements.is_active.checked = true;
  await refreshAll();
  showToast("Pozycja katalogu zapisana");
});

elements.materialImportPreviewBtn?.addEventListener("click", previewMaterialCatalogImport);
elements.materialImportCommitBtn?.addEventListener("click", commitMaterialCatalogImport);
elements.materialImportFilter?.addEventListener("change", renderMaterialImportPreview);
elements.materialImportSelectValidBtn?.addEventListener("click", () => {
  state.materialImportRows.forEach((row) => {
    row.selected = Boolean(row.valid);
  });
  renderMaterialImportPreview();
});
elements.materialImportClearSelectionBtn?.addEventListener("click", () => {
  state.materialImportRows.forEach((row) => {
    row.selected = false;
  });
  renderMaterialImportPreview();
});

elements.stockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await postJson("/api/stock/event", formPayload(elements.stockForm));
  elements.stockForm.reset();
  elements.stockForm.elements.event_type.value = "receive";
  await refreshAll();
  showToast("Operacja magazynowa zapisana");
});

elements.deliveryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.deliveryForm);
  const url = state.selectedDeliveryId ? `/api/deliveries/${state.selectedDeliveryId}` : "/api/deliveries";
  const saved = await postJson(url, payload, state.selectedDeliveryId ? "PUT" : "POST");
  state.selectedDeliveryId = saved.id;
  await refreshDeliveries();
  await loadDeliveryLines(saved.id);
  showToast("Dostawa zapisana");
});

elements.deliveryLineForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedDeliveryId) return showToast("Najpierw zapisz albo wybierz dostawę");
  await postJson(`/api/deliveries/${state.selectedDeliveryId}/lines`, formPayload(elements.deliveryLineForm));
  elements.deliveryLineForm.reset();
  await refreshDeliveries();
  await loadDeliveryLines(state.selectedDeliveryId);
  showToast("Pozycja dostawy dodana");
});

elements.newDeliveryBtn?.addEventListener("click", resetDeliveryForm);

elements.postDeliveryBtn?.addEventListener("click", async () => {
  if (!state.selectedDeliveryId) return showToast("Najpierw wybierz dostawę");
  const result = await postJson(`/api/deliveries/${state.selectedDeliveryId}/post`, {});
  await refreshAll();
  state.selectedDeliveryId = result.id;
  await loadDeliveryLines(result.id);
  showToast("Dostawa zaksięgowana");
});

elements.deliveryCorrectionForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(elements.deliveryCorrectionForm);
  let saved;
  if (state.selectedDeliveryCorrectionId) {
    saved = await postJson(`/api/delivery-corrections/${state.selectedDeliveryCorrectionId}`, payload, "PUT");
  } else {
    const delivery = currentDelivery();
    if (!delivery) return showToast("Najpierw wybierz zaksięgowaną dostawę");
    if (delivery.status !== "posted") return showToast("Korektę można zrobić tylko do zaksięgowanej dostawy");
    saved = await postJson(`/api/deliveries/${delivery.id}/corrections`, payload);
  }
  state.selectedDeliveryCorrectionId = saved.id;
  await refreshDeliveries();
  await loadDeliveryCorrectionLines(saved.id);
  showToast("Korekta zapisana");
});

elements.deliveryCorrectionLineForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedDeliveryCorrectionId) return showToast("Najpierw zapisz albo wybierz korektę");
  await postJson(`/api/delivery-corrections/${state.selectedDeliveryCorrectionId}/lines`, formPayload(elements.deliveryCorrectionLineForm));
  elements.deliveryCorrectionLineForm.reset();
  await refreshDeliveries();
  await loadDeliveryCorrectionLines(state.selectedDeliveryCorrectionId);
  showToast("Pozycja korekty dodana");
});

elements.newDeliveryCorrectionBtn?.addEventListener("click", resetDeliveryCorrectionForm);

elements.postDeliveryCorrectionBtn?.addEventListener("click", async () => {
  if (!state.selectedDeliveryCorrectionId) return showToast("Najpierw wybierz korektę");
  const result = await postJson(`/api/delivery-corrections/${state.selectedDeliveryCorrectionId}/post`, {});
  await refreshAll();
  state.selectedDeliveryCorrectionId = result.id;
  await loadDeliveryCorrectionLines(result.id);
  showToast("Korekta zaksięgowana");
});

elements.refreshPurchaseNeedsBtn?.addEventListener("click", async () => {
  await refreshPurchaseNeeds();
  showToast("Raport zakupów odświeżony");
});

elements.exportPurchaseNeedsCsvBtn?.addEventListener("click", () => {
  window.location.href = `/api/purchase-needs.csv${purchaseFilterQuery()}`;
});

elements.sendPurchaseNeedsTelegramBtn?.addEventListener("click", () => {
  const rows = state.purchaseNeeds.rows || [];
  if (!rows.length) return showToast("Brak pozycji do wysłania");
  const text = buildPurchaseNeedsTelegramText(rows);
  window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, "_blank");
});

[elements.purchaseSearch, elements.purchaseSupplierFilter, elements.purchaseProducerFilter, elements.purchaseTypeFilter].forEach((input) => {
  input?.addEventListener("change", refreshPurchaseNeeds);
});

elements.purchaseSearch?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    refreshPurchaseNeeds();
  }
});

elements.offcutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = state.selectedOffcutId ? `/api/offcuts/${encodeURIComponent(state.selectedOffcutId)}` : "/api/offcuts";
  await postJson(url, formPayload(elements.offcutForm), state.selectedOffcutId ? "PUT" : "POST");
  state.selectedOffcutId = null;
  elements.offcutForm.reset();
  await refreshOffcuts();
  showToast("Resztka zapisana");
});

if (elements.supplyForm) {
  elements.supplyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formPayload(elements.supplyForm);
    const url = state.selectedSupplyId ? `/api/supplies/${state.selectedSupplyId}` : "/api/supplies";
    await postJson(url, payload, state.selectedSupplyId ? "PUT" : "POST");
    state.selectedSupplyId = null;
    elements.supplyForm.reset();
    await refreshSupplies();
    showToast("Pozycja katalogu zapisana");
  });
}

if (elements.clearSupplyBtn) {
  elements.clearSupplyBtn.addEventListener("click", () => {
    state.selectedSupplyId = null;
    elements.supplyForm?.reset();
  });
}

document.querySelector("#importProjectBtn").addEventListener("click", async () => {
  const file = document.querySelector("#projectFile").files[0];
  if (!file) return showToast("Wybierz plik .project");
  const form = new FormData();
  form.append("project", file);
  const result = await fetchJson("/api/project/import", { method: "POST", body: form });
  document.querySelector("#projectResult").textContent = JSON.stringify(result, null, 2);
  await refreshAll();
});

await refreshAll();
setDefaultOrderDates();
setDefaultPaymentDate();
await loadNextOrderNumber();
if (elements.deliveryForm?.elements.delivery_date && !elements.deliveryForm.elements.delivery_date.value) {
  elements.deliveryForm.elements.delivery_date.value = new Date().toISOString().slice(0, 10);
}

async function refreshAll() {
  const [flat, tree] = await Promise.all([
    fetchJson("/api/materials/flat"),
    fetchJson("/api/materials")
  ]);
  state.flat = flat;
  state.tree = tree;
  renderTree();
  renderMaterials();
  renderStock();
  await refreshCrm();
  await refreshPricing();
  await refreshSupplies();
  await refreshDeliveries();
  await refreshPurchaseNeeds();
  await refreshCutting();
  await refreshOffcuts();
  renderCalendar();
  renderDashboard();
}

async function refreshCrm() {
  const [customers, orders] = await Promise.all([
    fetchJson("/api/customers"),
    fetchJson("/api/orders")
  ]);
  state.customers = customers;
  state.orders = orders;
  renderCustomers();
  renderCustomerSelect();
  renderPayerCustomerSelect();
  renderQuoteOrderSelect();
  renderCutOrderSelect();
  renderOrders();
  renderCalendar();
  renderDashboard();
}

async function refreshPricing() {
  state.priceItems = await fetchJson("/api/price-items");
  renderPriceItems();
  renderPriceItemSelect();
  renderCutServicePriceSelect();
  if (state.selectedOrderId) await loadQuoteLines(state.selectedOrderId);
}

async function refreshSupplies() {
  state.supplies = elements.suppliesBody ? await fetchJson("/api/supplies") : [];
  renderSupplies();
  renderDashboard();
}

async function refreshDeliveries() {
  if (!elements.deliveriesBody) return;
  const [deliveries, corrections] = await Promise.all([
    fetchJson("/api/deliveries"),
    fetchJson("/api/delivery-corrections")
  ]);
  state.deliveries = deliveries;
  state.deliveryCorrections = corrections;
  renderDeliveryMaterialSelect();
  renderDeliveries();
  renderDeliveryCorrections();
  if (state.selectedDeliveryId) await loadDeliveryLines(state.selectedDeliveryId);
  if (state.selectedDeliveryCorrectionId) await loadDeliveryCorrectionLines(state.selectedDeliveryCorrectionId);
}

async function refreshPurchaseNeeds() {
  if (!elements.purchaseNeedsBody) return;
  state.purchaseNeeds = await fetchJson(`/api/purchase-needs${purchaseFilterQuery()}`);
  await renderPurchaseNeedFilters();
  renderPurchaseNeeds();
}

async function loadDeliveryLines(deliveryId) {
  state.deliveryLines = await fetchJson(`/api/deliveries/${deliveryId}/lines`);
  renderDeliveryLines();
}

async function loadDeliveryCorrectionLines(correctionId) {
  state.deliveryCorrectionLines = await fetchJson(`/api/delivery-corrections/${correctionId}/lines`);
  renderDeliveryCorrectionLines();
}

async function loadQuoteLines(orderId) {
  state.quoteLines = await fetchJson(`/api/orders/${orderId}/quote-lines`);
  elements.quoteLineForm.elements.order_id.value = String(orderId);
  renderQuoteLines();
}

async function refreshCutting() {
  state.cutJobs = await fetchJson("/api/cut-jobs");
  renderCutMaterialFilters();
  renderCutMaterialLists();
  renderCutJobs();
  if (state.selectedCutJobId) await loadCutParts(state.selectedCutJobId);
  renderDashboard();
}

async function loadCutParts(jobId) {
  state.cutParts = await fetchJson(`/api/cut-jobs/${jobId}/parts`);
  state.cutQuoteLines = await fetchJson(`/api/cut-jobs/${jobId}/quote-lines`);
  renderCutParts();
  renderCutTotals();
  renderCutQuoteLines();
}

async function refreshOffcuts() {
  const offcuts = await fetchJson("/api/offcuts");
  elements.offcutsBody.innerHTML = offcuts.map((row) => `
    <tr class="material-row" data-id="${escapeHtml(row.id)}">
      <td>${escapeHtml(row.id)}</td>
      <td>${escapeHtml(row.code)}</td>
      <td>${formatNumber(row.length)}</td>
      <td>${formatNumber(row.width)}</td>
      <td>${formatNumber(row.quantity)}</td>
      <td>${row.is_business ? "delowa" : "zwykła"}</td>
      <td>${escapeHtml(row.project_name)}</td>
      <td>${escapeHtml(row.status)}</td>
      <td>
        <button class="small" data-edit-offcut="${escapeHtml(row.id)}" type="button">Edytuj</button>
        <button class="small danger" data-delete-offcut="${escapeHtml(row.id)}" type="button">Usuń</button>
      </td>
    </tr>
  `).join("");
  elements.offcutsBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      fillOffcutForm(rowElement.dataset.id, offcuts);
    });
  });
  elements.offcutsBody.querySelectorAll("[data-edit-offcut]").forEach((button) => {
    button.addEventListener("click", () => fillOffcutForm(button.dataset.editOffcut, offcuts));
  });
  elements.offcutsBody.querySelectorAll("[data-delete-offcut]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Usunąć resztkę?")) return;
      await fetchJson(`/api/offcuts/${encodeURIComponent(button.dataset.deleteOffcut)}`, { method: "DELETE" });
      if (String(state.selectedOffcutId) === String(button.dataset.deleteOffcut)) {
        state.selectedOffcutId = null;
        elements.offcutForm.reset();
      }
      await refreshOffcuts();
      showToast("Resztka usunięta");
    });
  });
}

function renderTree() {
  elements.tree.innerHTML = renderTreeRows(state.tree);
  elements.tree.querySelectorAll(".tree-toggle").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = Number(button.dataset.id);
      if (state.collapsed.has(id)) state.collapsed.delete(id);
      else state.collapsed.add(id);
      renderTree();
    });
  });
  elements.tree.querySelectorAll(".tree-name").forEach((node) => {
    node.addEventListener("click", () => {
      const id = Number(node.dataset.id);
      if (document.querySelector("#cuttingTab").classList.contains("active")) applyCutPartMaterial(id);
      else fillMaterialForm(id);
    });
  });
}

function renderTreeRows(rows, depth = 0) {
  return rows.map((row) => {
    const hasChildren = Boolean(row.children?.length);
    const collapsed = state.collapsed.has(row.id);
    return `
    <div class="tree-row ${row.isfolder ? "folder" : ""}" style="padding-left:${depth * 14}px">
      ${hasChildren ? `<button class="tree-toggle" data-id="${row.id}" title="${collapsed ? "Rozwiń" : "Zwiń"}">${collapsed ? "+" : "−"}</button>` : `<span class="tree-leaf">•</span>`}
      <span class="tree-name" data-id="${row.id}">${escapeHtml(row.name)}</span>
    </div>
    ${hasChildren && !collapsed ? renderTreeRows(row.children, depth + 1) : ""}
  `;
  }).join("");
}

function setTreeHidden(hidden) {
  elements.layout.classList.toggle("tree-hidden", hidden);
  localStorage.setItem("giblabTreeHidden", hidden ? "1" : "0");
}

function renderMaterials() {
  elements.materialsBody.innerHTML = state.flat.map((row) => `
    <tr class="${row.isfolder ? "folder-row" : "material-row"}" data-id="${row.id}">
      <td>${row.id}</td>
      <td>${row.paren_id ?? ""}</td>
      <td>${row.isfolder ? "1" : "0"}</td>
      <td>${escapeHtml(row.code)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.producer || "")}</td>
      <td>${escapeHtml([row.decor_code, row.decor_name].filter(Boolean).join(" "))}</td>
      <td>${escapeHtml(row.structure || "")}</td>
      <td>${escapeHtml(row.material_type || "")}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>${formatNumber(row.price)}</td>
      <td>${formatNumber(row.thickness)}</td>
      <td>${formatNumber(row.length)}</td>
      <td>${formatNumber(row.width)}</td>
      <td>${formatNumber(row.min_stock)}</td>
      <td>${escapeHtml(row.location || "")}</td>
      <td>${row.is_active === 0 ? "0" : "1"}</td>
      <td>
        <button class="small" data-edit-material="${row.id}" type="button">Edytuj</button>
        <button class="small danger" data-delete-material="${row.id}" type="button">Usuń</button>
      </td>
    </tr>
  `).join("");
  elements.materialsBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      fillMaterialForm(Number(rowElement.dataset.id));
    });
  });
  elements.materialsBody.querySelectorAll("[data-edit-material]").forEach((button) => {
    button.addEventListener("click", () => fillMaterialForm(Number(button.dataset.editMaterial)));
  });
  elements.materialsBody.querySelectorAll("[data-delete-material]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Usunąć tę pozycję materiału?")) return;
      await fetchJson(`/api/materials/${button.dataset.deleteMaterial}`, { method: "DELETE" });
      if (String(state.selectedId) === String(button.dataset.deleteMaterial)) {
        state.selectedId = null;
        elements.materialForm.reset();
        elements.materialForm.elements.is_active.checked = true;
      }
      await refreshAll();
      showToast("Pozycja materiału usunięta");
    });
  });
}

function renderStock() {
  elements.stockBody.innerHTML = state.flat
    .filter((row) => !row.isfolder)
    .map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${escapeHtml(row.code)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${formatNumber(row.quantity)}</td>
        <td>${formatNumber(row.reserved)}</td>
        <td>${formatNumber(row.available)}</td>
        <td>${formatNumber(row.used)}</td>
        <td><button class="small" data-stock-history="${row.id}" type="button">Historia</button></td>
        <td><button class="small" data-stock-adjust="${row.id}" type="button">Koryguj</button></td>
      </tr>
    `).join("");
  elements.stockBody.querySelectorAll("[data-stock-history]").forEach((button) => {
    button.addEventListener("click", () => showStockHistory(Number(button.dataset.stockHistory)));
  });
  elements.stockBody.querySelectorAll("[data-stock-adjust]").forEach((button) => {
    button.addEventListener("click", () => {
      const material = state.flat.find((row) => String(row.id) === String(button.dataset.stockAdjust));
      elements.stockForm.elements.event_type.value = "adjust";
      elements.stockForm.elements.material_id.value = button.dataset.stockAdjust;
      elements.stockForm.elements.quantity.value = material?.quantity ?? "";
      elements.stockForm.elements.note.value = "Korekta ręczna";
      elements.stockForm.elements.quantity.focus();
      elements.stockForm.elements.quantity.select?.();
    });
  });
}

function renderMaterialImportPreview() {
  if (!elements.materialImportPreviewBody) return;
  const visibleRows = filterMaterialImportRows(state.materialImportRows, elements.materialImportFilter?.value || "all");
  elements.materialImportPreviewBody.innerHTML = visibleRows.map((row) => {
    const material = row.material || {};
    const messages = [...(row.errors || []), ...(row.warnings || [])].join(" ");
    return `
      <tr>
        <td><input type="checkbox" data-import-row="${row.row_number}" ${row.selected ? "checked" : ""} ${row.valid ? "" : "disabled"}></td>
        <td>${row.row_number}</td>
        <td>${escapeHtml(row.status)}</td>
        <td>${escapeHtml(material.code || "")}</td>
        <td>${escapeHtml(material.name || material.decor_name || "")}</td>
        <td>${escapeHtml(material.producer || "")}</td>
        <td>${escapeHtml([material.decor_code, material.decor_name].filter(Boolean).join(" "))}</td>
        <td>${escapeHtml(material.structure || "")}</td>
        <td>${formatNumber(material.thickness)}</td>
        <td>${escapeHtml(messages)}</td>
      </tr>
    `;
  }).join("");
  elements.materialImportPreviewBody.querySelectorAll("[data-import-row]").forEach((input) => {
    input.addEventListener("change", () => {
      const row = state.materialImportRows.find((item) => String(item.row_number) === input.dataset.importRow);
      if (row && row.valid) row.selected = input.checked;
      renderMaterialImportSummary();
    });
  });
  renderMaterialImportSummary(null, null, visibleRows);
}

function renderMaterialImportSummary(summary, result, visibleRows = null) {
  if (!elements.materialImportSummary) return;
  if (result) {
    elements.materialImportSummary.textContent =
      `Import: dodano ${result.added}, zaktualizowano ${result.updated}, pominięto ${result.skipped}, niezaznaczone ${result.skipped_unselected || 0}, błędy ${result.errors?.length || 0}.`;
    return;
  }
  const activeRows = state.materialImportRows || [];
  if (!summary && activeRows.length) {
    summary = summarizeMaterialImportRows(activeRows, visibleRows || filterMaterialImportRows(activeRows, elements.materialImportFilter?.value || "all"));
  }
  if (!summary || !summary.total) {
    elements.materialImportSummary.textContent = "Import aktualizuje tylko katalog materiałów. Stany magazynowe i historia stanów nie są zmieniane.";
    return;
  }
  elements.materialImportSummary.textContent =
    `Razem ${summary.total}, widoczne ${summary.visible ?? summary.total}, zaznaczone ${summary.selected || 0}, poprawne ${summary.valid}, błędne ${summary.invalid}, nowe ${summary.new}, istniejące ${summary.existing}, duplikaty ${summary.duplicates}, ostrzeżenia ${summary.warnings}.`;
}

async function previewMaterialCatalogImport() {
  const file = elements.materialImportFile?.files?.[0];
  if (!file) return showToast("Wybierz plik Excel albo CSV");
  const form = new FormData();
  form.append("catalog", file);
  const result = await fetchJson("/api/materials/import-preview", { method: "POST", body: form });
  state.materialImportRows = (result.rows || []).map((row) => ({ ...row, selected: Boolean(row.valid) }));
  renderMaterialImportPreview();
  showToast(`Podgląd importu: ${result.summary?.total || 0} wierszy`);
}

async function commitMaterialCatalogImport() {
  const rows = state.materialImportRows.map((row) => ({
    selected: Boolean(row.selected),
    material: row.material
  }));
  const selectedValidRows = state.materialImportRows.filter((row) => row.valid && row.selected);
  if (!selectedValidRows.length) return showToast("Brak zaznaczonych poprawnych wierszy do importu");
  if (!rows.length) return showToast("Brak poprawnych wierszy do importu");
  const result = await postJson("/api/materials/import-commit", {
    mode: elements.materialImportMode?.value || "upsert",
    rows
  });
  renderMaterialImportSummary(null, result);
  await refreshAll();
  showToast(`Import zapisany: ${result.added} dodano, ${result.updated} zaktualizowano`);
}

function filterMaterialImportRows(rows, filter) {
  if (filter === "valid") return rows.filter((row) => row.valid);
  if (filter === "invalid") return rows.filter((row) => !row.valid);
  if (filter === "new") return rows.filter((row) => row.status === "new");
  if (filter === "existing") return rows.filter((row) => row.status === "existing");
  if (filter === "duplicate") return rows.filter((row) => row.status === "duplicate" || row.file_duplicate);
  if (filter === "warning") return rows.filter((row) => row.status === "warning" || row.warnings?.length);
  if (filter === "selected") return rows.filter((row) => row.selected);
  return rows;
}

function summarizeMaterialImportRows(rows, visibleRows = rows) {
  return {
    total: rows.length,
    visible: visibleRows.length,
    selected: rows.filter((row) => row.valid && row.selected).length,
    valid: rows.filter((row) => row.valid).length,
    invalid: rows.filter((row) => !row.valid).length,
    new: rows.filter((row) => row.status === "new").length,
    existing: rows.filter((row) => row.status === "existing").length,
    duplicates: rows.filter((row) => row.status === "duplicate" || row.file_duplicate).length,
    warnings: rows.filter((row) => row.status === "warning" || row.warnings?.length).length
  };
}

async function showStockHistory(materialId) {
  const material = state.flat.find((row) => Number(row.id) === materialId);
  elements.stockHistoryPanel.textContent = "Laduję historię...";
  try {
    const events = await fetchJson(`/api/stock/${materialId}/events`);
    const title = `${material?.code || materialId} ${material?.name || ""}`.trim();
    elements.stockHistoryPanel.innerHTML = `
      <strong>Historia: ${escapeHtml(title)}</strong>
      ${events.length ? `
        <ul class="stock-history-list">
          ${events.slice(0, 30).map((event) => `
            <li>${escapeHtml(event.created_at || "")} | ${escapeHtml(event.type || "")} | ${formatNumber(event.quantity)}${event.note ? ` | ${escapeHtml(event.note)}` : ""}</li>
          `).join("")}
        </ul>
      ` : "<div>Brak historii dla tego materiału.</div>"}
    `;
  } catch (error) {
    elements.stockHistoryPanel.textContent = error.message || "Nie udało się pobrać historii";
  }
}

function renderCustomers() {
  elements.customersBody.innerHTML = state.customers.map((row) => {
    const debt = getCustomerDebt(row.id);
    const rowClass = debt.unpaidCount ? "customer-unpaid" : "";
    return `
      <tr class="material-row ${rowClass}" data-id="${row.id}">
        <td>${row.id}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.phone)}</td>
        <td>${escapeHtml(row.email)}</td>
        <td>${escapeHtml(row.tax_id)}</td>
        <td>${escapeHtml(row.address)}</td>
        <td>${debt.unpaidCount ? `<span class="customer-debt-badge">${formatNumber(debt.unpaidCount)}</span>` : ""}</td>
        <td class="${debt.balance > 0 ? "status-unpaid" : "status-paid"}">${formatMoney(debt.balance)}</td>
        <td>
          <button class="small" data-edit-customer="${row.id}" type="button">Edytuj</button>
          <button class="small danger" data-delete-customer="${row.id}" type="button">Usuń</button>
        </td>
      </tr>
    `;
  }).join("");
  elements.customersBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      fillCustomerForm(Number(rowElement.dataset.id));
    });
  });
  elements.customersBody.querySelectorAll("[data-edit-customer]").forEach((button) => {
    button.addEventListener("click", () => fillCustomerForm(Number(button.dataset.editCustomer)));
  });
  elements.customersBody.querySelectorAll("[data-delete-customer]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Usunąć klienta? Zamówienia zostaną bez przypisanego klienta.")) return;
      await fetchJson(`/api/customers/${button.dataset.deleteCustomer}`, { method: "DELETE" });
      if (String(state.selectedCustomerId) === String(button.dataset.deleteCustomer)) {
        state.selectedCustomerId = null;
        elements.customerForm.reset();
      }
      await refreshCrm();
      showToast("Klient usunięty");
    });
  });
}

function renderCustomerSelect() {
  const select = elements.orderForm.elements.customer_id;
  const currentValue = select.value;
  select.innerHTML = `<option value="">Wybierz klienta</option>` + state.customers.map((customer) => `
    <option value="${customer.id}">${escapeHtml(customer.name)}</option>
  `).join("");
  select.value = currentValue;
}

function renderPayerCustomerSelect() {
  const select = elements.payerCustomerSelect;
  const currentValue = select.value;
  select.innerHTML = `<option value="">Wybierz płacącego</option>` + state.customers.map((customer) => `
    <option value="${customer.id}">${escapeHtml(customer.name)}</option>
  `).join("");
  select.value = currentValue;
}

function renderQuoteOrderSelect() {
  const select = elements.quoteLineForm.elements.order_id;
  const currentValue = select.value || (state.selectedOrderId ? String(state.selectedOrderId) : "");
  select.innerHTML = `<option value="">Wybierz zamówienie</option>` + state.orders.map((order) => `
    <option value="${order.id}">${escapeHtml(order.order_number)} - ${escapeHtml(order.customer_name)} - ${escapeHtml(order.title)}</option>
  `).join("");
  select.value = currentValue;
}

function renderPriceItemSelect() {
  const select = elements.quoteLineForm.elements.price_item_id;
  const currentValue = select.value;
  select.innerHTML = `<option value="">Pozycja z cennika</option>` + state.priceItems.map((item) => `
    <option value="${item.id}">${escapeHtml(item.name)} / ${formatMoney(item.unit_price)} ${escapeHtml(item.unit)}</option>
  `).join("");
  select.value = currentValue;
}

function renderCutServicePriceSelect() {
  const select = elements.cutQuoteForm.elements.service_price_item_id;
  if (!select) return;
  const currentValue = select.value;
  const allowedServiceCodes = new Set(["CUT", "EDGE", "MILL", "DRILL", "LACQUER", "OTHER"]);
  const serviceItems = state.priceItems.filter((item) =>
    !looksLikeMaterialPrice(item) && allowedServiceCodes.has(String(item.code || "").toUpperCase())
  );
  select.innerHTML = `<option value="">Cena usługi z cennika</option>` + serviceItems.map((item) => `
    <option value="${item.id}">${escapeHtml(item.category || "Usługa")} | ${escapeHtml(item.name)} / ${formatMoney(item.unit_price)} ${escapeHtml(item.unit)}</option>
  `).join("");
  if (serviceItems.some((item) => String(item.id) === currentValue)) select.value = currentValue;
}

function looksLikeMaterialPrice(item) {
  const text = normalizeText(`${item.category} ${item.name}`);
  return text.includes("material") || text.includes("plyt");
}

function renderPriceItems() {
  elements.priceItemsBody.innerHTML = state.priceItems.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${escapeHtml(row.category)}</td>
      <td>${escapeHtml(row.code)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>${formatMoney(row.unit_price)}</td>
      <td>
        <button class="small" data-edit-price="${row.id}" type="button">Edytuj</button>
        <button class="small danger" data-delete-price="${row.id}" type="button">Usuń</button>
      </td>
    </tr>
  `).join("");
  elements.priceItemsBody.querySelectorAll("[data-edit-price]").forEach((button) => {
    button.addEventListener("click", () => fillPriceItemForm(Number(button.dataset.editPrice)));
  });
  elements.priceItemsBody.querySelectorAll("[data-delete-price]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Usunąć pozycję cennika?")) return;
      await fetchJson(`/api/price-items/${button.dataset.deletePrice}`, { method: "DELETE" });
      if (String(state.selectedPriceItemId) === String(button.dataset.deletePrice)) {
        state.selectedPriceItemId = null;
        elements.priceItemForm.reset();
      }
      await refreshPricing();
      showToast("Pozycja cennika usunięta");
    });
  });
}

function renderSupplies() {
  if (!elements.suppliesBody) return;
  elements.suppliesBody.innerHTML = state.supplies.map((row) => `
    <tr class="material-row" data-id="${row.id}">
      <td>${row.id}</td>
      <td>${escapeHtml(row.category)}</td>
      <td>${escapeHtml(row.code)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>${formatMoney(row.price)}</td>
      <td>${formatNumber(row.quantity)}</td>
      <td>${escapeHtml(row.notes)}</td>
      <td><button class="small danger" data-delete-supply="${row.id}" type="button">Usuń</button></td>
    </tr>
  `).join("");
  elements.suppliesBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      fillSupplyForm(Number(rowElement.dataset.id));
    });
  });
  elements.suppliesBody.querySelectorAll("[data-delete-supply]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetchJson(`/api/supplies/${button.dataset.deleteSupply}`, { method: "DELETE" });
      if (String(state.selectedSupplyId) === String(button.dataset.deleteSupply)) {
        state.selectedSupplyId = null;
        elements.supplyForm?.reset();
      }
      await refreshSupplies();
      showToast("Pozycja usunięta");
    });
  });
}

function renderDeliveryMaterialSelect() {
  const select = elements.deliveryLineForm?.elements.material_id;
  const correctionSelect = elements.deliveryCorrectionLineForm?.elements.material_id;
  if (!select && !correctionSelect) return;
  const currentValue = select?.value || "";
  const correctionValue = correctionSelect?.value || "";
  const materials = state.flat.filter((row) => !row.isfolder);
  const options = `<option value="">Wybierz materiał</option>` + materials.map((material) => `
    <option value="${material.id}">${escapeHtml([material.code, material.name].filter(Boolean).join(" - "))}</option>
  `).join("");
  if (select) {
    select.innerHTML = options;
    if (materials.some((material) => String(material.id) === currentValue)) select.value = currentValue;
  }
  if (correctionSelect) {
    correctionSelect.innerHTML = options;
    if (materials.some((material) => String(material.id) === correctionValue)) correctionSelect.value = correctionValue;
  }
}

function renderPurchaseNeeds() {
  if (!elements.purchaseNeedsBody) return;
  const rows = state.purchaseNeeds.rows || [];
  const summary = state.purchaseNeeds.summary || {};
  elements.purchaseNeedsSummary.textContent = rows.length
    ? `Do zamówienia: ${rows.length} pozycji, razem ${formatNumber(summary.total_order_quantity)} jednostek.`
    : "Brak materiałów poniżej minimum magazynowego.";
  elements.purchaseNeedsBody.innerHTML = rows.length
    ? rows.map((row) => `
      <tr class="stock-alert">
        <td>${escapeHtml(row.supplier || "")}</td>
        <td>${escapeHtml(row.producer || "")}</td>
        <td>${escapeHtml(row.code || "")}</td>
        <td>${escapeHtml(row.name || "")}</td>
        <td>${escapeHtml([row.decor_code, row.decor_name].filter(Boolean).join(" "))}</td>
        <td>${escapeHtml(row.structure || "")}</td>
        <td>${formatNumber(row.thickness)}</td>
        <td>${formatNumber(row.quantity)}</td>
        <td>${formatNumber(row.reserved)}</td>
        <td>${formatNumber(row.available)}</td>
        <td>${formatNumber(row.min_stock)}</td>
        <td><strong>${formatNumber(row.order_quantity)}</strong></td>
        <td>${escapeHtml(row.location || "")}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="13">Wszystkie aktywne materiały są na poziomie minimum albo powyżej.</td></tr>`;
}

function buildPurchaseNeedsTelegramText(rows) {
  const lines = rows.map((row) => {
    const material = [row.code, row.name].filter(Boolean).join(" - ");
    const supplier = row.supplier ? ` | ${row.supplier}` : "";
    return `${material}: zamówić ${formatNumber(row.order_quantity)} ${row.unit || ""}${supplier}`;
  });
  return [`Lista zakupów (${rows.length})`, ...lines].join("\n");
}

async function renderPurchaseNeedFilters() {
  if (!elements.purchaseSupplierFilter) return;
  const unfiltered = await fetchJson("/api/purchase-needs");
  fillFilterSelect(elements.purchaseSupplierFilter, "Dostawca: wszyscy", uniqueValues(unfiltered.rows, "supplier"), elements.purchaseSupplierFilter.value);
  fillFilterSelect(elements.purchaseProducerFilter, "Producent: wszyscy", uniqueValues(unfiltered.rows, "producer"), elements.purchaseProducerFilter.value);
  fillFilterSelect(elements.purchaseTypeFilter, "Typ: wszystkie", uniqueValues(unfiltered.rows, "material_type"), elements.purchaseTypeFilter.value);
}

function fillFilterSelect(select, label, values, currentValue) {
  if (!select) return;
  select.innerHTML = `<option value="">${escapeHtml(label)}</option>` + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  if (values.includes(currentValue)) select.value = currentValue;
}

function uniqueValues(rows, field) {
  return [...new Set(rows.map((row) => row[field] || "").filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, "pl"));
}

function purchaseFilterQuery() {
  const params = new URLSearchParams();
  if (elements.purchaseSearch?.value.trim()) params.set("search", elements.purchaseSearch.value.trim());
  if (elements.purchaseSupplierFilter?.value) params.set("supplier", elements.purchaseSupplierFilter.value);
  if (elements.purchaseProducerFilter?.value) params.set("producer", elements.purchaseProducerFilter.value);
  if (elements.purchaseTypeFilter?.value) params.set("material_type", elements.purchaseTypeFilter.value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function renderDeliveries() {
  if (!elements.deliveriesBody) return;
  elements.deliveriesBody.innerHTML = state.deliveries.map((row) => `
    <tr class="material-row ${String(row.id) === String(state.selectedDeliveryId) ? "selected-row" : ""}" data-id="${row.id}">
      <td>${row.id}</td>
      <td>${escapeHtml(row.delivery_date || "")}</td>
      <td>${escapeHtml(row.supplier || "")}</td>
      <td>${escapeHtml(row.document_number || "")}</td>
      <td>${escapeHtml(row.status || "")}</td>
      <td>${formatNumber(row.line_count)}</td>
      <td>${formatNumber(row.total_quantity)}</td>
      <td>${formatMoney(row.total_value)}</td>
    </tr>
  `).join("");
  elements.deliveriesBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", () => selectDelivery(Number(rowElement.dataset.id)));
  });
}

function renderDeliveryLines() {
  if (!elements.deliveryLinesBody) return;
  const delivery = currentDelivery();
  elements.deliveryLinesBody.innerHTML = state.deliveryLines.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${escapeHtml(row.material_code || "")}</td>
      <td>${escapeHtml(row.material_name || "")}</td>
      <td>${formatNumber(row.quantity)}</td>
      <td>${formatMoney(row.unit_price)}</td>
      <td>${delivery?.status === "posted" ? "" : `<button class="small danger" data-delete-delivery-line="${row.id}" type="button">Usuń</button>`}</td>
    </tr>
  `).join("");
  elements.deliveryLinesBody.querySelectorAll("[data-delete-delivery-line]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetchJson(`/api/delivery-lines/${button.dataset.deleteDeliveryLine}`, { method: "DELETE" });
      await refreshDeliveries();
      showToast("Pozycja dostawy usunięta");
    });
  });
  updateDeliveryStatusText();
}

function renderDeliveryCorrections() {
  if (!elements.deliveryCorrectionsBody) return;
  elements.deliveryCorrectionsBody.innerHTML = state.deliveryCorrections.map((row) => `
    <tr class="material-row ${String(row.id) === String(state.selectedDeliveryCorrectionId) ? "selected-row" : ""}" data-id="${row.id}">
      <td>${row.id}</td>
      <td>${escapeHtml(row.original_document_number || row.original_delivery_id || "")}</td>
      <td>${escapeHtml(row.correction_number || "")}</td>
      <td>${escapeHtml(row.reason || "")}</td>
      <td>${escapeHtml(row.status || "")}</td>
      <td>${formatNumber(row.total_quantity_delta)}</td>
    </tr>
  `).join("");
  elements.deliveryCorrectionsBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", () => selectDeliveryCorrection(Number(rowElement.dataset.id)));
  });
}

function renderDeliveryCorrectionLines() {
  if (!elements.deliveryCorrectionLinesBody) return;
  const correction = currentDeliveryCorrection();
  elements.deliveryCorrectionLinesBody.innerHTML = state.deliveryCorrectionLines.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${escapeHtml(row.material_code || "")}</td>
      <td>${escapeHtml(row.material_name || "")}</td>
      <td>${formatNumber(row.quantity_delta)}</td>
      <td>${formatMoney(row.unit_price_net)}</td>
      <td>${correction?.status === "draft" ? `<button class="small danger" data-delete-correction-line="${row.id}" type="button">Usuń</button>` : ""}</td>
    </tr>
  `).join("");
  elements.deliveryCorrectionLinesBody.querySelectorAll("[data-delete-correction-line]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetchJson(`/api/delivery-correction-lines/${button.dataset.deleteCorrectionLine}`, { method: "DELETE" });
      await refreshDeliveries();
      showToast("Pozycja korekty usunięta");
    });
  });
  updateDeliveryCorrectionStatusText();
}

function selectDelivery(id) {
  const delivery = state.deliveries.find((row) => row.id === id);
  if (!delivery) return;
  state.selectedDeliveryId = id;
  for (const field of elements.deliveryForm.elements) {
    if (!field.name) continue;
    field.value = delivery[field.name] ?? "";
  }
  loadDeliveryLines(id);
  renderDeliveries();
  updateDeliveryStatusText();
}

function selectDeliveryCorrection(id) {
  const correction = state.deliveryCorrections.find((row) => row.id === id);
  if (!correction) return;
  state.selectedDeliveryCorrectionId = id;
  for (const field of elements.deliveryCorrectionForm.elements) {
    if (!field.name) continue;
    field.value = correction[field.name] ?? "";
  }
  loadDeliveryCorrectionLines(id);
  renderDeliveryCorrections();
  updateDeliveryCorrectionStatusText();
}

function currentDelivery() {
  return state.deliveries.find((row) => String(row.id) === String(state.selectedDeliveryId));
}

function currentDeliveryCorrection() {
  return state.deliveryCorrections.find((row) => String(row.id) === String(state.selectedDeliveryCorrectionId));
}

function resetDeliveryForm() {
  state.selectedDeliveryId = null;
  state.deliveryLines = [];
  elements.deliveryForm?.reset();
  if (elements.deliveryForm?.elements.delivery_date) elements.deliveryForm.elements.delivery_date.value = new Date().toISOString().slice(0, 10);
  elements.deliveryLineForm?.reset();
  renderDeliveries();
  renderDeliveryLines();
  updateDeliveryStatusText();
}

function resetDeliveryCorrectionForm() {
  state.selectedDeliveryCorrectionId = null;
  state.deliveryCorrectionLines = [];
  elements.deliveryCorrectionForm?.reset();
  elements.deliveryCorrectionLineForm?.reset();
  renderDeliveryCorrections();
  renderDeliveryCorrectionLines();
  updateDeliveryCorrectionStatusText();
}

function updateDeliveryStatusText() {
  if (!elements.deliveryStatus) return;
  const delivery = currentDelivery();
  if (!delivery) {
    elements.deliveryStatus.textContent = "Utwórz albo wybierz dostawę. Szkic nie zmienia magazynu.";
    return;
  }
  elements.deliveryStatus.textContent = delivery.status === "posted"
    ? `Dostawa ${delivery.id} jest zaksięgowana. Stany zostały zwiększone, a historia magazynu zapisana.`
    : `Dostawa ${delivery.id} jest szkicem. Stan rośnie dopiero po kliknięciu „Zaksięguj dostawę”.`;
}

function updateDeliveryCorrectionStatusText() {
  if (!elements.deliveryCorrectionStatus) return;
  const correction = currentDeliveryCorrection();
  if (!correction) {
    elements.deliveryCorrectionStatus.textContent = "Wybierz zaksięgowaną dostawę i utwórz korektę. Szkic korekty nie zmienia magazynu.";
    return;
  }
  elements.deliveryCorrectionStatus.textContent = correction.status === "posted"
    ? `Korekta ${correction.id} jest zaksięgowana. Historia magazynu została zapisana.`
    : `Korekta ${correction.id} jest szkicem. Ujemna delta zużyje tylko dostępny stan, bez naruszania rezerwacji.`;
}

function renderQuoteLines() {
  const total = state.quoteLines.reduce((sum, row) => sum + Number(row.line_total || 0), 0);
  const order = state.orders.find((row) => String(row.id) === String(elements.quoteLineForm.elements.order_id.value));
  const balance = total - Number(order?.paid_amount || 0);
  elements.quoteSummary.textContent = order
    ? `Zamówienie ${order.order_number}: ${formatMoney(total)} zł według cennika. Wpłacono: ${formatMoney(order.paid_amount)} zł, do zapłaty: ${formatMoney(balance)} zł.`
    : "Wybierz zamówienie, żeby policzyć wycenę.";
  elements.quoteLinesBody.innerHTML = state.quoteLines.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${escapeHtml(row.description)}</td>
      <td>${formatNumber(row.quantity)}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>${formatMoney(row.unit_price)}</td>
      <td>${formatMoney(row.line_total)}</td>
      <td><button class="small danger" data-delete-quote="${row.id}" type="button">Usuń</button></td>
    </tr>
  `).join("");
  elements.quoteLinesBody.querySelectorAll("[data-delete-quote]").forEach((button) => {
    button.addEventListener("click", async () => {
      const orderId = elements.quoteLineForm.elements.order_id.value;
      await fetchJson(`/api/quote-lines/${button.dataset.deleteQuote}`, { method: "DELETE" });
      await refreshCrm();
      await loadQuoteLines(orderId);
      showToast("Pozycja wyceny usunięta");
    });
  });
}

function renderCutOrderSelect() {
  const select = elements.cutJobForm.elements.order_id;
  const currentValue = select.value || (state.selectedOrderId ? String(state.selectedOrderId) : "");
  select.innerHTML = `<option value="">Wybierz zamówienie / klienta</option>` + state.orders.map((order) => `
    <option value="${order.id}">${escapeHtml(order.order_number)} - ${escapeHtml(order.customer_name)} - ${escapeHtml(order.title)}</option>
  `).join("");
  select.value = currentValue;
}

function renderCutMaterialSelect() {
  const select = elements.cutJobForm.elements.material_id;
  const currentValue = select.value;
  const materials = getFilteredCutMaterials();
  select.innerHTML = `<option value="">Materiał z listy GibLab</option>` + materials.map((material) => `
    <option value="${material.id}">${escapeHtml(materialSelectLabel(material))}</option>
  `).join("");
  if (materials.some((material) => String(material.id) === currentValue)) select.value = currentValue;
}


function renderCutPartMaterialSelect() {
  const select = elements.cutPartForm.elements.material_id;
  const currentValue = select.value;
  const materials = getFilteredCutMaterials();
  select.innerHTML = `<option value="">Wybierz materiał z bazy</option>` + materials.map((material) => `
    <option value="${material.id}">${escapeHtml(materialSelectLabel(material))}</option>
  `).join("");
  if (materials.some((material) => String(material.id) === currentValue)) select.value = currentValue;
}

function getFilteredCutMaterials() {
  const query = normalizeText(elements.cutMaterialSearch.value);
  const producer = elements.cutProducerFilter.value;
  const thickness = elements.cutThicknessFilter.value;
  return state.flat.filter((row) => {
    if (row.isfolder) return false;
    const rowProducer = getMaterialProducer(row);
    const rowThickness = row.thickness === null || row.thickness === undefined ? "" : String(row.thickness);
    const searchText = normalizeText(`${row.code} ${row.name} ${rowProducer} ${rowThickness}`);
    return (!query || searchText.includes(query))
      && (!producer || rowProducer === producer)
      && (!thickness || rowThickness === thickness);
  });
}

function renderCutMaterialLists() {
  renderCutMaterialSelect();
  renderCutPartMaterialSelect();
}

function renderCutMaterialFilters() {
  const currentProducer = elements.cutProducerFilter.value;
  const currentThickness = elements.cutThicknessFilter.value;
  const materials = state.flat.filter((row) => !row.isfolder);
  const producers = [...new Set(materials.map(getMaterialProducer).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
  const thicknesses = [...new Set(materials.map((row) => row.thickness === null || row.thickness === undefined ? "" : String(row.thickness)).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
  elements.cutProducerFilter.innerHTML = `<option value="">Producent</option>` + producers.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  elements.cutThicknessFilter.innerHTML = `<option value="">Grubość</option>` + thicknesses.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(formatNumber(value))} mm</option>`).join("");
  elements.cutProducerFilter.value = producers.includes(currentProducer) ? currentProducer : "";
  elements.cutThicknessFilter.value = thicknesses.includes(currentThickness) ? currentThickness : "";
}

function getMaterialProducer(material) {
  const byId = new Map(state.flat.map((row) => [Number(row.id), row]));
  const path = [];
  const visited = new Set();
  let current = material;
  while (current && !visited.has(Number(current.id))) {
    visited.add(Number(current.id));
    path.unshift(current);
    current = byId.get(Number(current.paren_id));
  }
  const folders = path.filter((row) => row.isfolder);
  return folders[1]?.name || folders[0]?.name || "";
}

function materialSelectLabel(material) {
  return [
    getMaterialProducer(material),
    material.thickness ? `${formatNumber(material.thickness)} mm` : "",
    material.length && material.width ? `${formatNumber(material.length)}x${formatNumber(material.width)}` : "",
    material.code,
    material.name
  ].filter(Boolean).join(" | ");
}

function cutJobMaterialLabel(job) {
  const material = state.flat.find((row) => String(row.id) === String(job.material_id));
  if (material) {
    return [
      material.code,
      material.thickness ? `${formatNumber(material.thickness)} mm` : "",
      material.length && material.width ? `${formatNumber(material.length)}x${formatNumber(material.width)}` : "",
      compactMaterialName(material.name)
    ].filter(Boolean).join(" | ");
  }
  return [job.material_code, compactMaterialName(job.material_name)].filter(Boolean).join(" | ");
}

function compactMaterialName(name) {
  return String(name || "")
    .replace(/\bPłyta\s+laminowana\b/gi, "Płyta")
    .replace(/\bPłyta\s+wiórowa\b/gi, "Płyta")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return String(value || "")
    .replaceAll("ł", "l")
    .replaceAll("Ł", "L")
    .replaceAll("Ł", "L")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function applyCutPartMaterial(id) {
  const material = state.flat.find((item) => String(item.id) === String(id));
  if (!material || material.isfolder) return;
  const field = (name) => elements.cutPartForm.querySelector(`[name="${name}"]`);
  field("material_id").value = String(material.id);
  field("material_code").value = material.code || "";
  field("material_name").value = material.name || "";
  field("thickness").value = material.thickness ?? "";
  if (material.length) field("length").value = material.length;
  if (material.width) field("width").value = material.width;
  if (elements.cutJobForm.elements.material_id) {
    elements.cutJobForm.elements.material_id.value = String(material.id);
    elements.cutJobForm.elements.material_name.value = material.name || "";
  }
  renderMaterialChips(material);
  if (material.price !== null && material.price !== undefined && material.price !== "") {
    elements.cutQuoteForm.elements.material_price.value = String(material.price).replace(".", ",");
  }
}

function applyCutJobMaterial(material) {
  if (!material || material.isfolder) return;
  elements.cutJobForm.elements.material_name.value = material.name || "";
  elements.cutMaterialSearch.value = "";
  elements.cutProducerFilter.value = getMaterialProducer(material);
  elements.cutThicknessFilter.value = material.thickness === null || material.thickness === undefined ? "" : String(material.thickness);
  renderCutMaterialLists();
  renderMaterialChips(material);
  applyCutPartMaterial(material.id);
  if (material.price !== null && material.price !== undefined && material.price !== "") {
    elements.cutQuoteForm.elements.material_price.value = String(material.price).replace(".", ",");
  }
}

function renderCutJobs() {
  const selectedOrderId = Number(elements.cutJobForm.elements.order_id.value || state.selectedOrderId || 0);
  const rows = selectedOrderId ? state.cutJobs.filter((row) => Number(row.order_id) === selectedOrderId) : state.cutJobs;
  elements.cutJobsBody.innerHTML = rows.map((row) => `
    <tr class="material-row ${row.id === state.selectedCutJobId ? "selected-row" : ""}" data-id="${row.id}">
      <td>${row.id}</td>
      <td>${escapeHtml(row.order_number || "")}</td>
      <td>${escapeHtml(row.customer_name || "")}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(cutJobMaterialLabel(row))}</td>
      <td>${escapeHtml(row.status)}</td>
      <td>${formatNumber(row.part_count)}</td>
      <td>${formatNumber(row.area_m2)}</td>
    </tr>
  `).join("");
  elements.cutJobsBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", () => fillCutJobForm(Number(rowElement.dataset.id)));
  });
}

function renderMaterialChips(material) {
  if (!elements.cutMaterialChips) return;
  if (!material) {
    elements.cutMaterialChips.innerHTML = "";
    return;
  }
  const chips = [
    getMaterialProducer(material),
    material.thickness ? `${formatNumber(material.thickness)} mm` : "",
    material.length && material.width ? `${formatNumber(material.length)}x${formatNumber(material.width)}` : "",
    material.code || "",
    material.name || ""
  ].filter(Boolean);
  elements.cutMaterialChips.innerHTML = chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("");
}

function renderCutParts() {
  elements.cutPartsBody.innerHTML = state.cutParts.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><input class="cut-table-input cut-table-number" data-cut-id="${row.id}" data-cut-field="length" value="${escapeHtml(formatDecimalInput(row.length))}"></td>
      <td><input class="cut-table-input cut-table-number" data-cut-id="${row.id}" data-cut-field="width" value="${escapeHtml(formatDecimalInput(row.width))}"></td>
      <td><input class="cut-table-input cut-table-number" data-cut-id="${row.id}" data-cut-field="quantity" value="${escapeHtml(formatDecimalInput(row.quantity))}"></td>
      <td><input class="cut-table-check" data-cut-id="${row.id}" data-cut-field="texture" type="checkbox" ${row.texture ? "checked" : ""}></td>
      <td><input class="cut-table-check" data-cut-id="${row.id}" data-cut-field="edge_top" type="checkbox" ${row.edge_top ? "checked" : ""}></td>
      <td><input class="cut-table-check" data-cut-id="${row.id}" data-cut-field="edge_bottom" type="checkbox" ${row.edge_bottom ? "checked" : ""}></td>
      <td><input class="cut-table-check" data-cut-id="${row.id}" data-cut-field="edge_left" type="checkbox" ${row.edge_left ? "checked" : ""}></td>
      <td><input class="cut-table-check" data-cut-id="${row.id}" data-cut-field="edge_right" type="checkbox" ${row.edge_right ? "checked" : ""}></td>
      <td><input class="cut-table-input cut-table-name" data-cut-id="${row.id}" data-cut-field="name" value="${escapeHtml(row.name)}"></td>
      <td><button class="small danger" data-delete-cut-part="${row.id}" type="button">Usuń</button></td>
    </tr>
  `).join("") + renderCutPartDraftRow();
  elements.cutPartsBody.querySelectorAll("[data-delete-cut-part]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetchJson(`/api/cut-parts/${button.dataset.deleteCutPart}`, { method: "DELETE" });
      await loadCutParts(state.selectedCutJobId);
      await refreshCutting();
      showToast("Formatka usunięta");
    });
  });
  elements.cutPartsBody.querySelectorAll("[data-cut-field]").forEach((field) => {
    field.addEventListener("keydown", handleCutTableKeydown);
    field.addEventListener(field.type === "checkbox" ? "change" : "blur", handleCutTableFieldSave);
  });
  elements.cutPartsBody.querySelectorAll("[data-save-new-cut-part]").forEach((button) => {
    button.addEventListener("click", async () => {
      const saved = await saveDraftCutPart(button.closest("tr"));
      if (saved) focusCutDraftStart();
    });
  });
}

function renderCutPartDraftRow() {
  const index = state.cutParts.length + 1;
  return `
    <tr class="cut-new-row" data-new-cut-row="1">
      <td>${index}</td>
      <td><input class="cut-table-input cut-table-number" data-cut-new="1" data-cut-field="length" placeholder="D"></td>
      <td><input class="cut-table-input cut-table-number" data-cut-new="1" data-cut-field="width" placeholder="S"></td>
      <td><input class="cut-table-input cut-table-number" data-cut-new="1" data-cut-field="quantity" value="1"></td>
      <td><input class="cut-table-check" data-cut-new="1" data-cut-field="texture" type="checkbox" checked></td>
      <td><input class="cut-table-check" data-cut-new="1" data-cut-field="edge_top" type="checkbox"></td>
      <td><input class="cut-table-check" data-cut-new="1" data-cut-field="edge_bottom" type="checkbox"></td>
      <td><input class="cut-table-check" data-cut-new="1" data-cut-field="edge_left" type="checkbox"></td>
      <td><input class="cut-table-check" data-cut-new="1" data-cut-field="edge_right" type="checkbox"></td>
      <td><input class="cut-table-input cut-table-name" data-cut-new="1" data-cut-field="name" placeholder="Nazwa"></td>
      <td><button class="small" data-save-new-cut-part type="button">Dodaj</button></td>
    </tr>
  `;
}

async function handleCutTableKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey) return;
  event.preventDefault();
  const row = event.target.closest("tr");
  if (event.target.dataset.cutNew) {
    const isLastDraftField = event.target.dataset.cutField === "name";
    if (isLastDraftField) {
      const saved = await saveDraftCutPart(row);
      if (saved) focusCutDraftStart();
      return;
    }
  } else {
    await saveExistingCutPart(event.target);
  }
  focusNextCutTableField(event.target);
}

async function handleCutTableFieldSave(event) {
  const field = event.target;
  if (field.dataset.cutNew) return;
  await saveExistingCutPart(field);
}

async function saveExistingCutPart(field) {
  const id = Number(field.dataset.cutId);
  if (!id) return;
  const row = field.closest("tr");
  const payload = cutPartPayloadFromTableRow(row);
  await postJson(`/api/cut-parts/${id}`, payload, "PUT");
  const existing = state.cutParts.find((part) => Number(part.id) === id);
  if (existing) Object.assign(existing, payload);
  await refreshCutting();
}

async function saveDraftCutPart(row) {
  if (!state.selectedCutJobId) {
    showToast("Najpierw wybierz albo zapisz zlecenie formatek");
    return false;
  }
  const payload = { ...cutPartMaterialPayload(), ...cutPartPayloadFromTableRow(row) };
  if (!payload.length || !payload.width || !payload.quantity) {
    showToast("Podaj D, S i ilość");
    return false;
  }
  await postJson(`/api/cut-jobs/${state.selectedCutJobId}/parts`, payload);
  await loadCutParts(state.selectedCutJobId);
  await refreshCutting();
  showToast("Formatka dodana");
  return true;
}

function cutPartPayloadFromTableRow(row) {
  const field = (name) => row.querySelector(`[data-cut-field="${name}"]`);
  const checked = (name) => Boolean(field(name)?.checked);
  return {
    length: parseDecimal(field("length")?.value),
    width: parseDecimal(field("width")?.value),
    quantity: parseDecimal(field("quantity")?.value || "1") || 1,
    texture: checked("texture"),
    edge_top: checked("edge_top") ? "1" : "",
    edge_bottom: checked("edge_bottom") ? "1" : "",
    edge_left: checked("edge_left") ? "1" : "",
    edge_right: checked("edge_right") ? "1" : "",
    name: field("name")?.value || ""
  };
}

function cutPartMaterialPayload() {
  const materialId = Number(elements.cutJobForm.elements.material_id.value || elements.cutPartForm.elements.material_id.value || 0);
  const material = state.flat.find((item) => Number(item.id) === materialId);
  return {
    material_id: materialId || null,
    material_code: material?.code || elements.cutPartForm.elements.material_code.value || "",
    material_name: material?.name || elements.cutJobForm.elements.material_name.value || "",
    thickness: material?.thickness ?? (elements.cutPartForm.elements.thickness.value || null),
    work_milling: false,
    work_drilling: false,
    work_lacquer: false,
    work_other: false,
    description: ""
  };
}

function focusNextCutTableField(currentField) {
  const fields = [...elements.cutPartsBody.querySelectorAll("[data-cut-field]")]
    .filter((field) => field.offsetParent !== null);
  const index = fields.indexOf(currentField);
  const next = fields[index + 1];
  if (!next) return false;
  next.focus();
  next.select?.();
  return true;
}

function focusCutDraftStart() {
  setTimeout(() => {
    const field = elements.cutPartsBody.querySelector('[data-cut-new="1"][data-cut-field="length"]');
    field?.focus();
    field?.select?.();
  }, 0);
}

function focusNextCutPartField(currentField) {
  const fields = [...elements.cutPartForm.querySelectorAll("input, select, button")]
    .filter((field) => !field.disabled && field.offsetParent !== null && field.type !== "hidden");
  const currentIndex = fields.indexOf(currentField);
  if (currentIndex < 0) return false;
  const nextField = fields[currentIndex + 1];
  if (!nextField || nextField.type === "submit") return false;
  nextField.focus();
  nextField.select?.();
  return true;
}

function renderCutQuoteLines() {
  if (!elements.cutQuoteLinesBody) return;
  elements.cutQuoteLinesBody.innerHTML = state.cutQuoteLines.map((row) => `
    <tr>
      <td>${escapeHtml(row.description)}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>${formatNumber(row.quantity)}</td>
      <td>${formatMoney(row.unit_price)}</td>
      <td>${formatMoney(row.line_total)}</td>
      <td><button class="small danger" data-delete-cut-quote="${row.id}" type="button">Usuń</button></td>
    </tr>
  `).join("");
  elements.cutQuoteLinesBody.querySelectorAll("[data-delete-cut-quote]").forEach((button) => {
    button.addEventListener("click", async () => {
      await fetchJson(`/api/quote-lines/${button.dataset.deleteCutQuote}`, { method: "DELETE" });
      if (state.selectedCutJobId) {
        state.cutQuoteLines = await fetchJson(`/api/cut-jobs/${state.selectedCutJobId}/quote-lines`);
      }
      renderCutQuoteLines();
      await refreshCrm();
      await refreshPricing();
      showToast("Robocizna usunięta");
    });
  });
}

function edgeMark(value) {
  return value ? "✓" : "";
}

function renderCutTotals(serverTotals) {
  const totals = serverTotals || state.cutParts.reduce((result, part) => {
    const quantity = Number(part.quantity || 0);
    const length = Number(part.length || 0);
    const width = Number(part.width || 0);
    result.part_count += quantity;
    result.area_m2 += length * width * quantity / 1000000;
    if (part.edge_top) result.edge_mb += length * quantity / 1000;
    if (part.edge_bottom) result.edge_mb += length * quantity / 1000;
    if (part.edge_left) result.edge_mb += width * quantity / 1000;
    if (part.edge_right) result.edge_mb += width * quantity / 1000;
    return result;
  }, { part_count: 0, area_m2: 0, edge_mb: 0, milling_count: 0, drilling_count: 0, lacquer_m2: 0, other_count: 0 });
  elements.cutTotals.textContent = `Formatki: ${formatNumber(totals.part_count)} szt. | Płyta: ${formatNumber(totals.area_m2)} m2 | Okleina: ${formatNumber(totals.edge_mb)} mb | Frez: ${formatNumber(totals.milling_count)} szt. | Otwory: ${formatNumber(totals.drilling_count)} szt.`;
}

function renderOrders() {
  elements.ordersBody.innerHTML = state.orders.map((row) => {
    const balanceClass = Number(row.balance) > 0 ? "status-unpaid" : "status-paid";
    const paymentClass = paymentStatusClass(row.payment_status);
    return `
      <tr class="material-row ${paymentClass}" data-id="${row.id}">
        <td>${row.id}</td>
        <td>${escapeHtml(row.order_number)}</td>
        <td>${escapeHtml(row.customer_name)}</td>
        <td>${escapeHtml(row.title)}</td>
        <td>${escapeHtml(row.due_date)}</td>
        <td>${escapeHtml(row.production_status)}</td>
        <td><span class="payment-badge ${paymentClass}">${escapeHtml(row.payment_status)}</span></td>
        <td>${formatMoney(row.total_amount)}</td>
        <td>${formatMoney(row.paid_amount)}</td>
        <td class="${balanceClass}">${formatMoney(row.balance)}</td>
        <td>
          <button class="small" data-edit-order="${row.id}" type="button">Edytuj</button>
          <button class="small danger" data-delete-order="${row.id}" type="button">Usuń</button>
        </td>
      </tr>
    `;
  }).join("");
  elements.ordersBody.querySelectorAll("tr").forEach((rowElement) => {
    rowElement.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      fillOrderForm(Number(rowElement.dataset.id));
    });
  });
  elements.ordersBody.querySelectorAll("[data-edit-order]").forEach((button) => {
    button.addEventListener("click", () => fillOrderForm(Number(button.dataset.editOrder)));
  });
  elements.ordersBody.querySelectorAll("[data-delete-order]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Usunąć zamówienie razem z jego pozycjami, wyceną i wpłatami?")) return;
      await fetchJson(`/api/orders/${button.dataset.deleteOrder}`, { method: "DELETE" });
      if (String(state.selectedOrderId) === String(button.dataset.deleteOrder)) {
        await resetOrderWorkspace();
      }
      await refreshAll();
      showToast("Zamówienie usunięte");
    });
  });
}

function renderCalendar() {
  if (!elements.calendarBody || !elements.calendarSummary) return;
  const days = new Map();
  for (const order of state.orders) {
    const day = order.due_date || order.order_date || "Bez terminu";
    if (!days.has(day)) {
      days.set(day, {
        day,
        orders: [],
        jobCount: 0,
        partCount: 0,
        areaM2: 0,
        unpaidCount: 0,
        totalAmount: 0,
        work: []
      });
    }
    const bucket = days.get(day);
    bucket.orders.push(order);
    bucket.totalAmount += Number(order.total_amount || 0);
    if (isUnpaidStatus(order.payment_status)) bucket.unpaidCount += 1;
  }
  for (const job of state.cutJobs) {
    const order = state.orders.find((item) => Number(item.id) === Number(job.order_id));
    const day = order?.due_date || order?.order_date || "Bez terminu";
    if (!days.has(day)) {
      days.set(day, {
        day,
        orders: [],
        jobCount: 0,
        partCount: 0,
        areaM2: 0,
        unpaidCount: 0,
        totalAmount: 0,
        work: []
      });
    }
    const bucket = days.get(day);
    bucket.jobCount += 1;
    bucket.partCount += Number(job.part_count || 0);
    bucket.areaM2 += Number(job.area_m2 || 0);
    bucket.work.push([job.order_number, job.name, job.material_name].filter(Boolean).join(" / "));
  }

  const rows = [...days.values()].sort((first, second) => {
    if (first.day === "Bez terminu") return 1;
    if (second.day === "Bez terminu") return -1;
    return String(first.day).localeCompare(String(second.day));
  });
  const today = new Date().toISOString().slice(0, 10);
  const totalOrders = state.orders.length;
  const unpaidOrders = state.orders.filter((order) => isUnpaidStatus(order.payment_status)).length;
  const todayBucket = rows.find((row) => row.day === today);
  elements.calendarSummary.innerHTML = `
    <div><strong>Dzisiaj:</strong> ${formatCalendarDate(today)} | zamówienia: ${todayBucket?.orders.length || 0} | pozycje: ${todayBucket?.jobCount || 0} | m2: ${formatNumber(todayBucket?.areaM2 || 0)}</div>
    <div><strong>Razem:</strong> zamówienia: ${formatNumber(totalOrders)} | nie zapłacone: ${formatNumber(unpaidOrders)}</div>
  `;
  elements.calendarBody.innerHTML = rows.map((row) => {
    const hasUnpaid = row.unpaidCount > 0;
    const isPast = row.day !== "Bez terminu" && row.day < today;
    const rowClass = [hasUnpaid ? "calendar-unpaid" : "", isPast ? "calendar-past" : ""].filter(Boolean).join(" ");
    const ordersText = row.orders.map((order) => escapeHtml(`${order.order_number} - ${order.customer_name || ""} - ${order.title || ""}`)).join("<br>");
    const workText = row.work.length ? row.work.map(escapeHtml).join("<br>") : "Brak pozycji formatek";
    return `
      <tr class="${rowClass}">
        <td>${escapeHtml(formatCalendarDate(row.day))}</td>
        <td>${ordersText}</td>
        <td>${formatNumber(row.jobCount)}</td>
        <td>${formatNumber(row.partCount)}</td>
        <td>${formatNumber(row.areaM2)}</td>
        <td>${formatNumber(row.unpaidCount)}</td>
        <td>${formatMoney(row.totalAmount)}</td>
        <td>${workText}</td>
      </tr>
    `;
  }).join("");
}

function renderDashboard() {
  if (!elements.dashboardCards) return;
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = state.orders.filter((order) => (order.due_date || order.order_date) === today);
  const todayJobs = state.cutJobs.filter((job) => {
    const order = state.orders.find((item) => Number(item.id) === Number(job.order_id));
    return (order?.due_date || order?.order_date) === today;
  });
  const unpaidOrders = state.orders.filter((order) => orderHasDebt(order));
  const paidOrders = state.orders.filter((order) => !orderHasDebt(order) && paymentStatusClass(order.payment_status) === "payment-paid");
  const stockAlerts = getStockAlerts();
  const todayArea = todayJobs.reduce((sum, job) => sum + Number(job.area_m2 || 0), 0);
  const unpaidBalance = unpaidOrders.reduce((sum, order) => sum + Math.max(0, Number(order.balance || 0)), 0);

  elements.dashboardCards.innerHTML = [
    dashboardCard("Dzisiaj", `${todayOrders.length} zam. / ${todayJobs.length} poz.`, `${formatNumber(todayArea)} m2`, todayJobs.length ? "warning" : "success"),
    dashboardCard("Nieopłacone", `${unpaidOrders.length} zamówień`, `${formatMoney(unpaidBalance)} zł`, unpaidOrders.length ? "danger" : "success"),
    dashboardCard("Opłacone", `${paidOrders.length} zamówień`, "zamknięte płatności", "success"),
    dashboardCard("Braki magazynu", `${stockAlerts.length} pozycji`, "materiały potrzebne do aktywnych zamówień", stockAlerts.length ? "danger" : "success")
  ].join("");

  elements.dashboardTodayBody.innerHTML = todayJobs.length
    ? todayJobs.map((job) => {
      const order = state.orders.find((item) => Number(item.id) === Number(job.order_id));
      return `
        <tr class="${orderHasDebt(order) ? "dashboard-unpaid" : ""}">
          <td>${escapeHtml(formatCalendarDate(order?.due_date || order?.order_date || ""))}</td>
          <td>${escapeHtml(job.order_number || order?.order_number || "")}</td>
          <td>${escapeHtml(job.customer_name || order?.customer_name || "")}</td>
          <td>${escapeHtml(job.name || "")}</td>
          <td>${formatNumber(job.area_m2)}</td>
          <td>${escapeHtml(job.status || order?.production_status || "")}</td>
        </tr>
      `;
    }).join("")
    : `<tr><td colspan="6">Brak pozycji formatek na dzisiaj.</td></tr>`;

  elements.dashboardStockBody.innerHTML = stockAlerts.length
    ? stockAlerts.slice(0, 30).map((row) => `
      <tr class="stock-alert">
        <td>${escapeHtml(row.code)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${formatNumber(row.quantity)}</td>
        <td>${formatNumber(row.required)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">Brak brakujących materiałów dla aktywnych zamówień.</td></tr>`;

  elements.dashboardPaymentsBody.innerHTML = unpaidOrders.length
    ? unpaidOrders.slice(0, 30).map((order) => `
      <tr class="${paymentStatusClass(order.payment_status)}">
        <td>${escapeHtml(order.order_number)}</td>
        <td>${escapeHtml(order.customer_name)}</td>
        <td><span class="payment-badge ${paymentStatusClass(order.payment_status)}">${escapeHtml(order.payment_status)}</span></td>
        <td class="status-unpaid">${formatMoney(order.balance)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">Brak nieopłaconych zamówień.</td></tr>`;
}

function dashboardCard(title, value, details, type = "") {
  return `
    <div class="dashboard-card ${type}">
      <div>${escapeHtml(title)}</div>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(details)}</span>
    </div>
  `;
}

function getStockAlerts() {
  const materialRows = state.flat.filter((row) => !row.isfolder);
  const materialsById = new Map(materialRows.map((row) => [Number(row.id), row]));
  const materialsByCode = new Map(materialRows.filter((row) => row.code).map((row) => [String(row.code), row]));
  const activeOrderIds = new Set(state.orders
    .filter((order) => isActiveProductionStatus(order.production_status))
    .map((order) => Number(order.id)));
  const needed = new Map();

  state.cutJobs
    .filter((job) => activeOrderIds.has(Number(job.order_id)))
    .filter((job) => isActiveCutJobStatus(job.status))
    .forEach((job) => {
      const material = materialsById.get(Number(job.material_id)) || materialsByCode.get(String(job.material_code || ""));
      if (!material) return;
      const materialKey = String(material.id);
      const sheetArea = Number(material.length || 0) > 0 && Number(material.width || 0) > 0
        ? Number(material.length) * Number(material.width) / 1000000
        : 0;
      const jobArea = Number(job.area_m2 || 0);
      const required = sheetArea > 0 && jobArea > 0 ? Math.max(1, Math.ceil(jobArea / sheetArea)) : 1;
      const current = needed.get(materialKey) || { ...material, required: 0, jobs: 0 };
      current.required += required;
      current.jobs += 1;
      needed.set(materialKey, current);
    });

  return [...needed.values()]
    .filter((row) => {
      const available = Number(row.quantity || 0) - Number(row.reserved || 0);
      return available < Number(row.required || 0);
    })
    .sort((first, second) => String(first.code || first.name).localeCompare(String(second.code || second.name), "pl"));
}

function isActiveProductionStatus(status) {
  const normalized = normalizeText(status || "");
  return !normalized.includes("gotowe")
    && !normalized.includes("zamontowane")
    && !normalized.includes("zamkniete")
    && !normalized.includes("anul");
}

function isActiveCutJobStatus(status) {
  const normalized = normalizeText(status || "Robocze");
  return !normalized.includes("wynik")
    && !normalized.includes("zamkniete")
    && !normalized.includes("gotowe")
    && !normalized.includes("anul");
}

function getCustomerDebt(customerId) {
  const orders = state.orders.filter((order) => Number(order.customer_id) === Number(customerId));
  const unpaidOrders = orders.filter((order) => orderHasDebt(order));
  return {
    unpaidCount: unpaidOrders.length,
    balance: unpaidOrders.reduce((sum, order) => sum + Math.max(0, Number(order.balance || 0)), 0)
  };
}

function orderHasDebt(order) {
  if (!order) return false;
  return isUnpaidStatus(order.payment_status) || Number(order.balance || 0) > 0;
}

function fillMaterialForm(id) {
  const row = state.flat.find((item) => item.id === id);
  if (!row) return;
  state.selectedId = id;
  for (const field of elements.materialForm.elements) {
    if (!field.name) continue;
    if (field.type === "checkbox") field.checked = Boolean(row[field.name]);
    else field.value = row[field.name] ?? "";
  }
}

function fillCustomerForm(id) {
  const row = state.customers.find((item) => item.id === id);
  if (!row) return;
  state.selectedCustomerId = id;
  for (const field of elements.customerForm.elements) {
    if (!field.name) continue;
    field.value = row[field.name] ?? "";
  }
}

function fillPriceItemForm(id) {
  const row = state.priceItems.find((item) => item.id === id);
  if (!row) return;
  state.selectedPriceItemId = id;
  for (const field of elements.priceItemForm.elements) {
    if (!field.name) continue;
    field.value = row[field.name] ?? "";
  }
}

function fillOffcutForm(id, rows = []) {
  const row = rows.find((item) => String(item.id) === String(id));
  if (!row) return;
  state.selectedOffcutId = row.id;
  for (const field of elements.offcutForm.elements) {
    if (!field.name) continue;
    if (field.type === "checkbox") field.checked = Boolean(row[field.name]);
    else field.value = row[field.name] ?? "";
  }
}

function fillSupplyForm(id) {
  if (!elements.supplyForm) return;
  const row = state.supplies.find((item) => item.id === id);
  if (!row) return;
  state.selectedSupplyId = id;
  for (const field of elements.supplyForm.elements) {
    if (!field.name) continue;
    field.value = row[field.name] ?? "";
  }
}

function fillOrderForm(id) {
  const row = state.orders.find((item) => item.id === id);
  if (!row) return;
  state.selectedOrderId = id;
  elements.paymentForm.elements.order_id.value = id;
  elements.quoteLineForm.elements.order_id.value = String(id);
  elements.cutJobForm.elements.order_id.value = String(id);
  for (const field of elements.orderForm.elements) {
    if (!field.name) continue;
    if (field.type === "checkbox") field.checked = Boolean(row[field.name]);
    else field.value = row[field.name] ?? "";
  }
  prepareNotification(id);
  loadQuoteLines(id);
  renderCutJobs();
}

async function resetOrderWorkspace() {
  state.selectedOrderId = null;
  state.quoteLines = [];
  elements.orderForm.reset();
  elements.paymentForm.reset();
  elements.quoteLineForm.reset();
  renderQuoteLines();
  setDefaultOrderDates();
  setDefaultPaymentDate();
  await loadNextOrderNumber();
  elements.notifyText.value = "";
}

function openCutPositionForSelectedOrder() {
  if (!state.selectedOrderId) return showToast("Najpierw kliknij zamówienie");
  prepareNewCutJob(state.selectedOrderId);
  activateTab("cutting");
}

function prepareNewCutJob(orderId) {
  const count = state.cutJobs.filter((job) => Number(job.order_id) === Number(orderId)).length + 1;
  state.selectedCutJobId = null;
  state.cutParts = [];
  state.cutQuoteLines = [];
  elements.cutJobForm.reset();
  elements.cutPartForm.reset();
  renderMaterialChips(null);
  elements.cutJobForm.elements.order_id.value = String(orderId);
  elements.cutJobForm.elements.name.value = `Pozycja ${count}`;
  elements.cutPartForm.elements.quantity.value = "1";
  elements.cutPartForm.querySelector('[name="texture"]').checked = true;
  renderCutJobs();
  renderCutParts();
  renderCutTotals();
  renderCutQuoteLines();
}

function prepareNextCutPartRow(selectedMaterialId) {
  const search = elements.cutMaterialSearch.value;
  elements.cutPartForm.reset();
  elements.cutMaterialSearch.value = search;
  elements.cutPartForm.elements.quantity.value = "1";
  elements.cutPartForm.querySelector('[name="texture"]').checked = true;
  document.querySelector("#edgeAll").checked = false;
  if (selectedMaterialId) applyCutPartMaterial(selectedMaterialId);
  setTimeout(() => {
    const field = elements.cutPartForm.elements.length || elements.cutPartForm.elements.material_id;
    field?.focus();
    field?.select?.();
  }, 0);
}

function resetCutJobForm() {
  state.selectedCutJobId = null;
  state.cutParts = [];
  state.cutQuoteLines = [];
  elements.cutJobForm.reset();
  elements.cutPartForm.reset();
  renderMaterialChips(null);
  elements.cutPartForm.elements.quantity.value = "1";
  elements.cutPartForm.querySelector('[name="texture"]').checked = true;
  document.querySelector("#edgeAll").checked = false;
  renderCutJobs();
  renderCutParts();
  renderCutTotals();
  renderCutQuoteLines();
}

function fillCutJobForm(id) {
  const row = state.cutJobs.find((item) => item.id === id);
  if (!row) return;
  state.selectedCutJobId = id;
  for (const field of elements.cutJobForm.elements) {
    if (!field.name) continue;
    field.value = row[field.name] ?? "";
  }
  if (row.material_id) {
    const material = state.flat.find((item) => String(item.id) === String(row.material_id));
    if (material) applyCutJobMaterial(material);
  }
  loadCutParts(id);
  renderCutJobs();
}

async function importCutTextFromPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  elements.cutTextImportStatus.textContent = "Czytam zdjęcie...";
  const form = new FormData();
  form.append("photo", file);
  try {
    const result = await fetchJson("/api/ocr/cut-text", { method: "POST", body: form });
    elements.cutTextImport.value = result.text || "";
    elements.cutTextImportStatus.textContent = result.text
      ? "Tekst ze zdjęcia gotowy do sprawdzenia"
      : "Nie znaleziono tekstu na zdjęciu";
    showToast("Tekst ze zdjęcia wstawiony do pola");
    if (result.text) updateCutTextImportStatus();
  } catch (error) {
    elements.cutTextImportStatus.textContent = error.message || "Nie udało się odczytać zdjęcia";
    showToast("Nie udało się odczytać zdjęcia");
  } finally {
    event.target.value = "";
  }
}

function updateCutTextImportStatus() {
  const text = elements.cutTextImport.value || "";
  if (!text.trim()) {
    elements.cutTextImportStatus.textContent = "";
    return;
  }
  const count = parseCutTextRows(text).length;
  elements.cutTextImportStatus.textContent = count
    ? `Znaleziono ${count} prostych formatek w tekscie`
    : "Tekst jest odczytany, ale nie widze prostych formatek D x S";
}

async function importCutPartsFromText() {
  if (!state.selectedCutJobId) return showToast("Najpierw wybierz albo zapisz zlecenie formatek");
  const text = elements.cutTextImport.value || "";
  const rows = parseCutTextRows(text);
  if (!rows.length) {
    elements.cutTextImportStatus.textContent = "Nie znaleziono formatek w tekscie";
    return showToast("Wklej linie typu: 240 x 450 sztuk 1 frez");
  }

  const basePayload = buildCutTextBasePayload();
  for (const row of rows) {
    await postJson(`/api/cut-jobs/${state.selectedCutJobId}/parts`, { ...basePayload, ...row });
  }

  prepareNextCutPartRow(basePayload.material_id);
  elements.cutTextImport.value = "";
  await loadCutParts(state.selectedCutJobId);
  await refreshCutting();
  elements.cutTextImportStatus.textContent = `Dodano ${rows.length} formatek z tekstu`;
  showToast(`Dodano ${rows.length} formatek z tekstu`);
}

function buildCutTextBasePayload() {
  const payload = formPayload(elements.cutPartForm);
  const jobMaterialId = elements.cutJobForm.elements.material_id.value;
  if (!payload.material_id && jobMaterialId) {
    applyCutPartMaterial(jobMaterialId);
    Object.assign(payload, formPayload(elements.cutPartForm));
  }
  payload.quantity = payload.quantity || "1";
  payload.texture = Boolean(payload.texture);
  return payload;
}

function parseCutTextRows(text) {
  const color = (text.match(/kolor\s*:\s*([^\n\r]+)/i)?.[1] || "").trim();
  const isLacqueredFront = /fronty\s+lakierowane/i.test(text);
  const baseName = [isLacqueredFront ? "Front lakierowany" : "", color].filter(Boolean).join(" ");
  const defaultMilling = /\bfrez/i.test(text);
  return text
    .split(/\r?\n/)
    .map((line) => parseCutTextLineSmart(line, baseName, isLacqueredFront, defaultMilling))
    .filter(Boolean);
}

function parseCutTextLineSmart(line, baseName, isLacqueredFront, defaultMilling = false) {
  const normalizedLine = String(line || "")
    .replace(/[×*]/g, "x")
    .replace(/\b[zż]t\b/gi, "szt")
    .replace(/\s+/g, " ")
    .trim();
  const match = normalizedLine.match(/^\s*(\d+(?:[,.]\d+)?)\s*[xX]\s*(\d+(?:[,.]\d+)?)(?:\s*(?:sztuk|szt\.?|szt|pcs)\s*(\d+(?:[,.]\d+)?))?(.*)$/i);
  if (!match) return null;
  const length = parseImportedNumber(match[1]);
  const width = parseImportedNumber(match[2]);
  let tail = String(match[4] || "").trim();
  let quantity = parseImportedNumber(match[3] || "1");
  if (!match[3]) {
    const looseQuantity = tail.match(/^[\s\-–—(]*(\d+(?:[,.]\d+)?)[)\s]*(.*)$/);
    if (looseQuantity) {
      quantity = parseImportedNumber(looseQuantity[1]);
      tail = looseQuantity[2].trim();
    }
  }
  if (!length || !width || !quantity) return null;
  const description = [tail, baseName].filter(Boolean).join(" | ");
  return {
    length,
    width,
    quantity,
    name: baseName || tail || "",
    description,
    work_milling: defaultMilling || /\bfrez/i.test(tail),
    work_drilling: /wierc/i.test(tail),
    work_lacquer: isLacqueredFront || /lakier/i.test(tail)
  };
}

function parseCutTextLine(line, baseName, isLacqueredFront, defaultMilling = false) {
  const match = String(line || "").match(/^\s*(\d+(?:[,.]\d+)?)\s*[xX×]\s*(\d+(?:[,.]\d+)?)(?:\s*(?:sztuk|szt\.?|szt|pcs)\s*(\d+(?:[,.]\d+)?))?(.*)$/i);
  if (!match) return null;
  const length = parseImportedNumber(match[1]);
  const width = parseImportedNumber(match[2]);
  let tail = String(match[4] || "").trim();
  let quantity = parseImportedNumber(match[3] || "1");
  if (!match[3]) {
    const looseQuantity = tail.match(/^-?\s*(\d+(?:[,.]\d+)?)\b(.*)$/);
    if (looseQuantity) {
      quantity = parseImportedNumber(looseQuantity[1]);
      tail = looseQuantity[2].trim();
    }
  }
  if (!length || !width || !quantity) return null;
  const description = [tail, baseName].filter(Boolean).join(" | ");
  return {
    length,
    width,
    quantity,
    name: baseName || tail || "",
    description,
    work_milling: defaultMilling || /\bfrez/i.test(tail),
    work_drilling: /wierc/i.test(tail),
    work_lacquer: isLacqueredFront || /lakier/i.test(tail)
  };
}

function parseImportedNumber(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function formPayload(form) {
  const data = new FormData(form);
  const payload = {};
  for (const [key, value] of data.entries()) payload[key] = value;
  form.querySelectorAll("input[type='checkbox']").forEach((input) => {
    if (!input.name) return;
    payload[input.name] = input.checked;
  });
  return payload;
}

async function postJson(url, payload, method = "POST") {
  return fetchJson(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    const blockerText = Array.isArray(error.blockers) && error.blockers.length
      ? ` ${error.blockers.map((blocker) => blocker.message).join(" ")}`
      : "";
    throw new Error(`${error.error || response.statusText}${blockerText}`.trim());
  }
  if (response.status === 204) return null;
  return response.json();
}

async function setSelectedPaymentStatus(status) {
  if (!state.selectedOrderId) return showToast("Najpierw kliknij zamówienie");
  await postJson(`/api/orders/${state.selectedOrderId}/payment-status`, { payment_status: status });
  await refreshCrm();
  showToast(`Status płatności: ${status}`);
}

async function importLatestProject() {
  const result = await postJson("/api/project/import-latest", {});
  await refreshOffcuts();
  elements.remainderStatus.textContent = `Zaimportowano ${result.offcuts} resztek z ${result.projectName}`;
  showToast(`Import projektu: ${result.offcuts} resztek`);
}

async function showRemainderLogs() {
  const logs = await fetchJson("/api/integration/remainder-logs");
  elements.remainderLogs.textContent = logs.length
    ? logs.map((log) => `${log.created_at} ${log.event_type} ${log.result_json}\n${log.body}`).join("\n\n")
    : "Brak żądań z GibLab do naszej aplikacji. To znaczy, że GibLab nie wysłał danych na http://localhost:3080/giblab/remainders.";
}

async function prepareNotification(orderId) {
  const data = await fetchJson(`/api/orders/${orderId}/notify`);
  elements.notifyText.value = data.message;
  elements.notifyText.dataset.sms = data.sms;
  elements.notifyText.dataset.whatsapp = data.whatsapp;
  elements.notifyText.dataset.telegram = data.telegram;
  elements.notifyText.dataset.email = data.email;
}

function openNotifyLink(kind) {
  if (!state.selectedOrderId) return showToast("Najpierw kliknij zamówienie");
  const url = elements.notifyText.dataset[kind];
  if (!url) return showToast("Brakuje telefonu lub emaila klienta");
  window.open(url, "_blank", "noopener");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 3600);
}

function paymentStatusClass(status) {
  const normalized = normalizeText(status);
  if (normalized.includes("po terminie")) return "payment-overdue";
  if (normalized.includes("zaliczka")) return "payment-deposit";
  if (normalized.includes("oplacone") || normalized.includes("opłacone")) return "payment-paid";
  if (normalized.includes("nie zaplacone") || normalized.includes("nie zapłacone")) return "payment-unpaid";
  return "";
}

function isUnpaidStatus(status) {
  const cssClass = paymentStatusClass(status);
  return cssClass === "payment-unpaid" || cssClass === "payment-overdue" || cssClass === "payment-deposit";
}

function formatCalendarDate(value) {
  if (!value || value === "Bez terminu") return "Bez terminu";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toLocaleString("pl-PL", { maximumFractionDigits: 3 });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDecimal(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function formatDecimalInput(value) {
  return Number(value || 0).toFixed(3).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
}

function setDefaultOrderDates() {
  if (elements.orderForm?.elements.order_date && !elements.orderForm.elements.order_date.value) {
    elements.orderForm.elements.order_date.value = new Date().toISOString().slice(0, 10);
  }
}

async function loadNextOrderNumber() {
  if (state.selectedOrderId) return;
  const data = await fetchJson("/api/orders/next-number");
  elements.orderForm.elements.order_number.value = data.order_number;
}

function setDefaultPaymentDate() {
  if (elements.paymentForm?.elements.payment_date) {
    elements.paymentForm.elements.payment_date.value = new Date().toISOString().slice(0, 10);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

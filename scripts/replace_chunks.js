import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

// The boundaries
const boundsList = [
  {
    name: "backups",
    start: 'app.get("/api/backups",',
    next: 'app.get("/api/materials",',
    mount: 'app.use("/api/backups", createBackupsRouter({ db, dbPath, backupDir, appState }));'
  },
  {
    name: "materials",
    start: 'app.get("/api/materials",',
    next: 'app.post("/api/stock/event",',
    mount: `app.use("/", createMaterialsRouter({
  db, upload, selectMaterials, selectMaterial, selectStock, selectStockById,
  insertMaterialSql, updateMaterialSql, materialValues, materialUpdateValues,
  nextMaterialId, buildTree, withAvailableStock, buildFilteredPurchaseNeedsReport,
  purchaseNeedsToCsv, readCatalogImportRows, previewMaterialImport, commitMaterialImport,
  normalizeMaterial, getMaterialDeleteBlockers
}));`
  },
  {
    name: "stock",
    start: 'app.post("/api/stock/event",',
    next: 'app.get("/api/offcuts",',
    mount: 'app.use("/api/stock", createStockRouter({ db, selectMaterial, selectStockById, runInTransaction }));'
  },
  {
    name: "offcuts",
    start: 'app.get("/api/offcuts",',
    next: 'app.post("/api/import/goods",',
    mount: `app.use("/", createOffcutsRouter({
  db, runInTransaction, normalizeOffcutStorageLocation, storageLocationErrorMessage,
  normalizeOffcut, assignOffcutStorageLocation, normalizeStationName, requestStation
}));`
  },
  {
    name: "customers",
    start: 'app.get("/api/customers",',
    next: 'app.get("/api/orders",',
    mount: 'app.use("/api/customers", createCustomersRouter({ db, selectCustomers, selectCustomer, normalizeCustomer, getCustomerRelatedDocuments }));'
  },
  {
    name: "orders_part1",
    start: 'app.get("/api/orders",',
    next: 'app.get("/api/price-items",',
    mount: '' // We will mount orders later
  },
  {
    name: "deliveries",
    start: 'app.get("/api/price-items",',
    next: 'app.get("/api/orders/:id/quote-lines",',
    mount: `app.use("/", createDeliveriesRouter({
  db, selectDeliveries, selectDelivery, selectDeliveryLines, selectDeliveryCorrections,
  selectDeliveryCorrection, selectDeliveryCorrectionLines, normalizeDelivery,
  normalizeDeliveryLine, normalizeDeliveryCorrection, normalizeDeliveryCorrectionLine,
  postDeliveryToDatabase, postDeliveryCorrectionToDatabase, DeliveryError, runInTransaction, StockMovementError
}));`
  },
  {
    name: "orders_part2",
    start: 'app.get("/api/orders/:id/quote-lines",',
    next: 'app.get("/api/integration/remainder-logs",',
    mount: `app.use("/", createOrdersRouter({
  allocateProjectActualsToJobs, assignOffcutStorageLocation, attrValue, buildReadyMessage, buildTree, cleanNumber, cleanProjectNumber, codeSlug, deleteOrderBundle, detectCsvDelimiter, distributeAmount, distributeTotal, distributeUsage, ensureColumn, ensureRoot, escapeXml, exportCutJobProject, findExcelSheetName, findProducer, getCustomerRelatedDocuments, getCutJobTotals, handleGibLabRemainders, importGoodsRows, importProject, importRemaindersReport, logIntegration, materialTypeCode, materialUpdateValues, materialValues, nextMaterialId, nextOrderNumber, normalizeCustomer, normalizeCutJob, normalizeCutPart, normalizeEdgeValue, normalizeExistingTextValues, normalizeLooseKey, normalizeMaterial, normalizeOcrText, normalizeOffcut, normalizeOffcutStatus, normalizeOffcutStorageLocation, normalizeOrder, normalizePayment, normalizePaymentStatus, normalizePhone, normalizePriceItem, normalizeQuoteLine, normalizeRemainderRequestType, normalizeStationName, normalizeSupply, offcutStorageLocations, parseAttributes, parseCsvLine, parseCsvRows, parseProjectActuals, pickValue, polishFolderCode, polishMaterialCode, polishMaterialName, polishUnit, readCatalogImportRows, readProjectNumber, refreshPaymentStatus, requestStation, resolveExportEdgeMaterial, resolveExportMaterial, runInTransaction, safeFileName, seedDefaultOffcutStorageLocations, seedDefaultPriceItems, sendStockMovementError, storageLocationErrorMessage, toGoodsRow, toMoneyNumber, toNonNegativeNumber, toNullableNumber, toPositiveNumber, truthyNumber, updateOrderTotalFromQuote, writeGoodsFile,
  selectCustomer, selectCustomers, selectDeliveries, selectDelivery, selectDeliveryCorrection, selectDeliveryCorrectionLines, selectDeliveryCorrections, selectDeliveryLines, selectMaterial, selectMaterials, selectOrder, selectOrders, selectStock, selectStockById,
  db, upload, getOrderDeleteBlockers, buildCutQuoteLines, normalizeCutQuotePrices, createWorker, XLSX, path,
  copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, spawn
}));`
  }
];

// We must extract exactly, without modifying content first.
for (const b of boundsList) {
  const startIndex = content.indexOf(b.start);
  const endIndex = content.indexOf(b.next);
  if (startIndex === -1 || endIndex === -1) {
    console.error("Failed to find bounds for", b.name);
    process.exit(1);
  }
  const codeToReplace = content.slice(startIndex, endIndex);
  
  if (b.name === 'orders_part1') {
    // just remove it, mount will be at orders_part2
    content = content.replace(codeToReplace, '');
  } else {
    content = content.replace(codeToReplace, b.mount + '\n\n');
  }
}

fs.writeFileSync('server.js', content, 'utf8');
console.log("server.js updated perfectly with exact string replacement.");

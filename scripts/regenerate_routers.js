import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

// The boundaries
const bounds = {
  materials: {
    start: 'app.get("/api/materials",',
    next: 'app.post("/api/stock/event",'
  },
  offcuts: {
    start: 'app.get("/api/offcuts",',
    next: 'app.post("/api/import/goods",'
  },
  deliveries: {
    start: 'app.get("/api/price-items",',
    next: 'app.get("/api/orders/:id/quote-lines",'
  },
  orders: {
    start: 'app.get("/api/orders",',
    next: 'app.get("/giblab/remainders",'
  }
};

function extractAndReplace(name, config, routerDeps, mountCode) {
  const startIndex = content.indexOf(config.start);
  const endIndex = content.indexOf(config.next);
  if (startIndex === -1 || endIndex === -1) {
    console.error(`Could not find bounds for ${name}`, startIndex, endIndex);
    process.exit(1);
  }
  
  let routeCode = content.slice(startIndex, endIndex).trim();
  routeCode = routeCode
    .replace(/app\.get\("/g, 'router.get("')
    .replace(/app\.post\("/g, 'router.post("')
    .replace(/app\.put\("/g, 'router.put("')
    .replace(/app\.delete\("/g, 'router.delete("');

  const routerTemplate = `import { Router } from "express";

export function create${name.charAt(0).toUpperCase() + name.slice(1)}Router(deps) {
  const router = Router();
  const {
    ${routerDeps.join(",\n    ")}
  } = deps;

${routeCode}

  return router;
}
`;

  fs.writeFileSync(`routes/${name}.js`, routerTemplate, 'utf8');

  content = content.slice(0, startIndex) + mountCode + '\n\n' + content.slice(endIndex);
}

// 1. Materials
extractAndReplace("materials", bounds.materials, [
  "db", "upload", "selectMaterials", "selectMaterial", "selectStock", "selectStockById",
  "insertMaterialSql", "updateMaterialSql", "materialValues", "materialUpdateValues",
  "nextMaterialId", "buildTree", "withAvailableStock", "buildFilteredPurchaseNeedsReport",
  "purchaseNeedsToCsv", "readCatalogImportRows", "previewMaterialImport", "commitMaterialImport",
  "normalizeMaterial", "getMaterialDeleteBlockers"
], `app.use("/", createMaterialsRouter({
  db, upload, selectMaterials, selectMaterial, selectStock, selectStockById,
  insertMaterialSql, updateMaterialSql, materialValues, materialUpdateValues,
  nextMaterialId, buildTree, withAvailableStock, buildFilteredPurchaseNeedsReport,
  purchaseNeedsToCsv, readCatalogImportRows, previewMaterialImport, commitMaterialImport,
  normalizeMaterial, getMaterialDeleteBlockers
}));`);

// 2. Offcuts
extractAndReplace("offcuts", bounds.offcuts, [
  "db", "runInTransaction", "normalizeOffcutStorageLocation", "storageLocationErrorMessage",
  "normalizeOffcut", "assignOffcutStorageLocation", "normalizeStationName", "requestStation"
], `app.use("/", createOffcutsRouter({
  db, runInTransaction, normalizeOffcutStorageLocation, storageLocationErrorMessage,
  normalizeOffcut, assignOffcutStorageLocation, normalizeStationName, requestStation
}));`);

// 3. Deliveries
extractAndReplace("deliveries", bounds.deliveries, [
  "db", "selectDeliveries", "selectDelivery", "selectDeliveryLines", "selectDeliveryCorrections",
  "selectDeliveryCorrection", "selectDeliveryCorrectionLines", "normalizeDelivery",
  "normalizeDeliveryLine", "normalizeDeliveryCorrection", "normalizeDeliveryCorrectionLine",
  "postDeliveryToDatabase", "postDeliveryCorrectionToDatabase", "DeliveryError", "runInTransaction", "StockMovementError"
], `app.use("/", createDeliveriesRouter({
  db, selectDeliveries, selectDelivery, selectDeliveryLines, selectDeliveryCorrections,
  selectDeliveryCorrection, selectDeliveryCorrectionLines, normalizeDelivery,
  normalizeDeliveryLine, normalizeDeliveryCorrection, normalizeDeliveryCorrectionLine,
  postDeliveryToDatabase, postDeliveryCorrectionToDatabase, DeliveryError, runInTransaction, StockMovementError
}));`);

// 4. Orders
// For orders we need everything
const ordersDeps = [
  "allocateProjectActualsToJobs", "assignOffcutStorageLocation", "attrValue", "buildReadyMessage", "buildTree", "cleanNumber", "cleanProjectNumber", "codeSlug", "deleteOrderBundle", "detectCsvDelimiter", "distributeAmount", "distributeTotal", "distributeUsage", "ensureColumn", "ensureRoot", "escapeXml", "exportCutJobProject", "findExcelSheetName", "findProducer", "getCustomerRelatedDocuments", "getCutJobTotals", "handleGibLabRemainders", "importGoodsRows", "importProject", "importRemaindersReport", "logIntegration", "materialTypeCode", "materialUpdateValues", "materialValues", "nextMaterialId", "nextOrderNumber", "normalizeCustomer", "normalizeCutJob", "normalizeCutPart", "normalizeEdgeValue", "normalizeExistingTextValues", "normalizeLooseKey", "normalizeMaterial", "normalizeOcrText", "normalizeOffcut", "normalizeOffcutStatus", "normalizeOffcutStorageLocation", "normalizeOrder", "normalizePayment", "normalizePaymentStatus", "normalizePhone", "normalizePriceItem", "normalizeQuoteLine", "normalizeRemainderRequestType", "normalizeStationName", "normalizeSupply", "offcutStorageLocations", "parseAttributes", "parseCsvLine", "parseCsvRows", "parseProjectActuals", "pickValue", "polishFolderCode", "polishMaterialCode", "polishMaterialName", "polishUnit", "readCatalogImportRows", "readProjectNumber", "refreshPaymentStatus", "requestStation", "resolveExportEdgeMaterial", "resolveExportMaterial", "runInTransaction", "safeFileName", "seedDefaultOffcutStorageLocations", "seedDefaultPriceItems", "sendStockMovementError", "storageLocationErrorMessage", "toGoodsRow", "toMoneyNumber", "toNonNegativeNumber", "toNullableNumber", "toPositiveNumber", "truthyNumber", "updateOrderTotalFromQuote", "writeGoodsFile",
  "selectCustomer", "selectCustomers", "selectDeliveries", "selectDelivery", "selectDeliveryCorrection", "selectDeliveryCorrectionLines", "selectDeliveryCorrections", "selectDeliveryLines", "selectMaterial", "selectMaterials", "selectOrder", "selectOrders", "selectStock", "selectStockById",
  "db", "upload", "getOrderDeleteBlockers", "buildCutQuoteLines", "normalizeCutQuotePrices", "createWorker", "XLSX", "path",
  "copyFileSync", "existsSync", "mkdirSync", "readFileSync", "readdirSync", "statSync", "writeFileSync", "spawn"
];

extractAndReplace("orders", bounds.orders, ordersDeps, `app.use("/", createOrdersRouter({
  ${ordersDeps.join(", ")}
}));`);

// Also add imports for materials, offcuts, deliveries, orders if they are not there
if (!content.includes('import { createMaterialsRouter }')) {
  content = content.replace(
    'import { createStockRouter } from "./routes/stock.js";',
    'import { createStockRouter } from "./routes/stock.js";\nimport { createMaterialsRouter } from "./routes/materials.js";\nimport { createOffcutsRouter } from "./routes/offcuts.js";\nimport { createDeliveriesRouter } from "./routes/deliveries.js";\nimport { createOrdersRouter } from "./routes/orders.js";'
  );
}

// And replace stock, backups, customers properly
content = content.replace(
  'app.post("/api/stock/event"',
  `app.use("/api/stock", createStockRouter({ db, selectMaterial, selectStockById, runInTransaction }));\n\napp.post("/api/stock/event"`
);

const stockNext = 'app.get("/api/offcuts",';
const stockStart = 'app.post("/api/stock/event",';
const ssi = content.indexOf(stockStart);
const eei = content.indexOf(stockNext);
if (ssi !== -1 && eei !== -1) {
  content = content.slice(0, ssi) + content.slice(eei);
}

// For customers and backups, they were already extracted manually using write_to_file but we must mount them in server.js!
const bStart = 'app.get("/api/backups",';
const bEnd = 'app.get("/api/customers",';
const bSi = content.indexOf(bStart);
const bEi = content.indexOf(bEnd);
if (bSi !== -1 && bEi !== -1) {
  content = content.slice(0, bSi) + `app.use("/api/backups", createBackupsRouter({ db, dbPath, backupDir, appState }));\n\n` + content.slice(bEi);
}

const cStart = 'app.get("/api/customers",';
const cEnd = 'app.get("/api/orders",';
const cSi = content.indexOf(cStart);
const cEi = content.indexOf(cEnd);
if (cSi !== -1 && cEi !== -1) {
  content = content.slice(0, cSi) + `app.use("/api/customers", createCustomersRouter({ db, selectCustomers, selectCustomer, normalizeCustomer, getCustomerRelatedDocuments }));\n\n` + content.slice(cEi);
}

fs.writeFileSync('server.js', content, 'utf8');
console.log("All routes regenerated and server.js rebuilt perfectly.");

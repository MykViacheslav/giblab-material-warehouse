import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

// Replace appState first
content = content.replace(
  'let restoreRequiresRestart = false;',
  'export const appState = { restoreRequiresRestart: false };'
);
content = content.replace(/restoreRequiresRestart = true;/g, 'appState.restoreRequiresRestart = true;');
content = content.replace(/if \(restoreRequiresRestart\)/g, 'if (appState.restoreRequiresRestart)');
content = content.replace(/restoreRequiresRestart: restoreRequiresRestart/g, 'restoreRequiresRestart: appState.restoreRequiresRestart');

// Imports
const importTarget = 'import { buildFilteredPurchaseNeedsReport, purchaseNeedsToCsv } from "./src/purchaseNeeds.js";';
const importsToAdd = `
import { createBackupsRouter } from "./routes/backups.js";
import { createCustomersRouter } from "./routes/customers.js";
import { createStockRouter } from "./routes/stock.js";
import { createMaterialsRouter } from "./routes/materials.js";
import { createOffcutsRouter } from "./routes/offcuts.js";
import { createDeliveriesRouter } from "./routes/deliveries.js";
import { createOrdersRouter } from "./routes/orders.js";
`;

if (!content.includes('import { createBackupsRouter }')) {
  content = content.replace(importTarget, importTarget + importsToAdd);
}

// Extract boundaries from ORIGINAL file so we don't mess up slicing by mutating content
const materialsStart = content.indexOf('app.get("/api/materials",');
const stockStart = content.indexOf('app.post("/api/stock/event",');
const offcutsStart = content.indexOf('app.get("/api/offcuts",');
const importGoodsStart = content.indexOf('app.post("/api/import/goods",');
const deliveriesStart = content.indexOf('app.get("/api/price-items",');
const orders2Start = content.indexOf('app.get("/api/orders/:id/quote-lines",');
const ordersStart = content.indexOf('app.get("/api/orders",');
const remaindersStart = content.indexOf('app.get("/giblab/remainders",');
const backupsStart = content.indexOf('app.get("/api/backups",');
const customersStart = content.indexOf('app.get("/api/customers",');

// Helpers to format routes
function formatRoutes(code) {
  return code.trim()
    .replace(/app\.get\("/g, 'router.get("')
    .replace(/app\.post\("/g, 'router.post("')
    .replace(/app\.put\("/g, 'router.put("')
    .replace(/app\.delete\("/g, 'router.delete("');
}

// 1. Materials
const materialsCode = formatRoutes(content.slice(materialsStart, stockStart));
// 2. Offcuts
const offcutsCode = formatRoutes(content.slice(offcutsStart, importGoodsStart));
// 3. Deliveries
const deliveriesCode = formatRoutes(content.slice(deliveriesStart, orders2Start));
// 4. Orders
const ordersPart1 = formatRoutes(content.slice(ordersStart, deliveriesStart));
const ordersPart2 = formatRoutes(content.slice(orders2Start, remaindersStart));
const ordersCode = ordersPart1 + '\n\n' + ordersPart2;

function saveRouter(name, deps, code) {
  const tpl = `import { Router } from "express";

export function create${name.charAt(0).toUpperCase() + name.slice(1)}Router(deps) {
  const router = Router();
  const {
    ${deps.join(",\n    ")}
  } = deps;

${code}

  return router;
}
`;
  fs.writeFileSync(\`routes/\${name}.js\`, tpl, 'utf8');
}

saveRouter("materials", [
  "db", "upload", "selectMaterials", "selectMaterial", "selectStock", "selectStockById",
  "insertMaterialSql", "updateMaterialSql", "materialValues", "materialUpdateValues",
  "nextMaterialId", "buildTree", "withAvailableStock", "buildFilteredPurchaseNeedsReport",
  "purchaseNeedsToCsv", "readCatalogImportRows", "previewMaterialImport", "commitMaterialImport",
  "normalizeMaterial", "getMaterialDeleteBlockers"
], materialsCode);

saveRouter("offcuts", [
  "db", "runInTransaction", "normalizeOffcutStorageLocation", "storageLocationErrorMessage",
  "normalizeOffcut", "assignOffcutStorageLocation", "normalizeStationName", "requestStation"
], offcutsCode);

saveRouter("deliveries", [
  "db", "selectDeliveries", "selectDelivery", "selectDeliveryLines", "selectDeliveryCorrections",
  "selectDeliveryCorrection", "selectDeliveryCorrectionLines", "normalizeDelivery",
  "normalizeDeliveryLine", "normalizeDeliveryCorrection", "normalizeDeliveryCorrectionLine",
  "postDeliveryToDatabase", "postDeliveryCorrectionToDatabase", "DeliveryError", "runInTransaction", "StockMovementError"
], deliveriesCode);

saveRouter("orders", [
  "allocateProjectActualsToJobs", "assignOffcutStorageLocation", "attrValue", "buildReadyMessage", "buildTree", "cleanNumber", "cleanProjectNumber", "codeSlug", "deleteOrderBundle", "detectCsvDelimiter", "distributeAmount", "distributeTotal", "distributeUsage", "ensureColumn", "ensureRoot", "escapeXml", "exportCutJobProject", "findExcelSheetName", "findProducer", "getCustomerRelatedDocuments", "getCutJobTotals", "handleGibLabRemainders", "importGoodsRows", "importProject", "importRemaindersReport", "logIntegration", "materialTypeCode", "materialUpdateValues", "materialValues", "nextMaterialId", "nextOrderNumber", "normalizeCustomer", "normalizeCutJob", "normalizeCutPart", "normalizeEdgeValue", "normalizeExistingTextValues", "normalizeLooseKey", "normalizeMaterial", "normalizeOcrText", "normalizeOffcut", "normalizeOffcutStatus", "normalizeOffcutStorageLocation", "normalizeOrder", "normalizePayment", "normalizePaymentStatus", "normalizePhone", "normalizePriceItem", "normalizeQuoteLine", "normalizeRemainderRequestType", "normalizeStationName", "normalizeSupply", "offcutStorageLocations", "parseAttributes", "parseCsvLine", "parseCsvRows", "parseProjectActuals", "pickValue", "polishFolderCode", "polishMaterialCode", "polishMaterialName", "polishUnit", "readCatalogImportRows", "readProjectNumber", "refreshPaymentStatus", "requestStation", "resolveExportEdgeMaterial", "resolveExportMaterial", "runInTransaction", "safeFileName", "seedDefaultOffcutStorageLocations", "seedDefaultPriceItems", "sendStockMovementError", "storageLocationErrorMessage", "toGoodsRow", "toMoneyNumber", "toNonNegativeNumber", "toNullableNumber", "toPositiveNumber", "truthyNumber", "updateOrderTotalFromQuote", "writeGoodsFile",
  "selectCustomer", "selectCustomers", "selectDeliveries", "selectDelivery", "selectDeliveryCorrection", "selectDeliveryCorrectionLines", "selectDeliveryCorrections", "selectDeliveryLines", "selectMaterial", "selectMaterials", "selectOrder", "selectOrders", "selectStock", "selectStockById",
  "db", "upload", "getOrderDeleteBlockers", "buildCutQuoteLines", "normalizeCutQuotePrices", "createWorker", "XLSX", "path",
  "copyFileSync", "existsSync", "mkdirSync", "readFileSync", "readdirSync", "statSync", "writeFileSync", "spawn"
], ordersCode);

// Now rebuild server.js
// We replace the slices with the app.use statements!
// We can just construct the content manually by concatenating pieces!
let finalContent = "";
finalContent += content.slice(0, backupsStart);
finalContent += \`app.use("/api/backups", createBackupsRouter({ db, dbPath, backupDir, appState }));\n\n\`;

finalContent += \`app.use("/api/customers", createCustomersRouter({ db, selectCustomers, selectCustomer, normalizeCustomer, getCustomerRelatedDocuments }));\n\n\`;
finalContent += \`app.use("/api/orders", createOrdersRouter({ ...deps })); // wait, let's just use the huge deps object directly\n\`;
// Actually we can just output the correct string:
const ordersDeps = saveRouter.toString(); // Just copy deps from above
const mounts = \`
app.use("/api/stock", createStockRouter({ db, selectMaterial, selectStockById, runInTransaction }));
app.use("/", createMaterialsRouter({
  db, upload, selectMaterials, selectMaterial, selectStock, selectStockById,
  insertMaterialSql, updateMaterialSql, materialValues, materialUpdateValues,
  nextMaterialId, buildTree, withAvailableStock, buildFilteredPurchaseNeedsReport,
  purchaseNeedsToCsv, readCatalogImportRows, previewMaterialImport, commitMaterialImport,
  normalizeMaterial, getMaterialDeleteBlockers
}));
app.use("/", createOffcutsRouter({
  db, runInTransaction, normalizeOffcutStorageLocation, storageLocationErrorMessage,
  normalizeOffcut, assignOffcutStorageLocation, normalizeStationName, requestStation
}));
app.use("/", createDeliveriesRouter({
  db, selectDeliveries, selectDelivery, selectDeliveryLines, selectDeliveryCorrections,
  selectDeliveryCorrection, selectDeliveryCorrectionLines, normalizeDelivery,
  normalizeDeliveryLine, normalizeDeliveryCorrection, normalizeDeliveryCorrectionLine,
  postDeliveryToDatabase, postDeliveryCorrectionToDatabase, DeliveryError, runInTransaction, StockMovementError
}));
app.use("/", createOrdersRouter({
  allocateProjectActualsToJobs: allocateProjectActualsToJobs, assignOffcutStorageLocation: assignOffcutStorageLocation, attrValue: attrValue, buildReadyMessage: buildReadyMessage, buildTree: buildTree, cleanNumber: cleanNumber, cleanProjectNumber: cleanProjectNumber, codeSlug: codeSlug, deleteOrderBundle: deleteOrderBundle, detectCsvDelimiter: detectCsvDelimiter, distributeAmount: distributeAmount, distributeTotal: distributeTotal, distributeUsage: distributeUsage, ensureColumn: ensureColumn, ensureRoot: ensureRoot, escapeXml: escapeXml, exportCutJobProject: exportCutJobProject, findExcelSheetName: findExcelSheetName, findProducer: findProducer, getCustomerRelatedDocuments: getCustomerRelatedDocuments, getCutJobTotals: getCutJobTotals, handleGibLabRemainders: handleGibLabRemainders, importGoodsRows: importGoodsRows, importProject: importProject, importRemaindersReport: importRemaindersReport, logIntegration: logIntegration, materialTypeCode: materialTypeCode, materialUpdateValues: materialUpdateValues, materialValues: materialValues, nextMaterialId: nextMaterialId, nextOrderNumber: nextOrderNumber, normalizeCustomer: normalizeCustomer, normalizeCutJob: normalizeCutJob, normalizeCutPart: normalizeCutPart, normalizeEdgeValue: normalizeEdgeValue, normalizeExistingTextValues: normalizeExistingTextValues, normalizeLooseKey: normalizeLooseKey, normalizeMaterial: normalizeMaterial, normalizeOcrText: normalizeOcrText, normalizeOffcut: normalizeOffcut, normalizeOffcutStatus: normalizeOffcutStatus, normalizeOffcutStorageLocation: normalizeOffcutStorageLocation, normalizeOrder: normalizeOrder, normalizePayment: normalizePayment, normalizePaymentStatus: normalizePaymentStatus, normalizePhone: normalizePhone, normalizePriceItem: normalizePriceItem, normalizeQuoteLine: normalizeQuoteLine, normalizeRemainderRequestType: normalizeRemainderRequestType, normalizeStationName: normalizeStationName, normalizeSupply: normalizeSupply, offcutStorageLocations: offcutStorageLocations, parseAttributes: parseAttributes, parseCsvLine: parseCsvLine, parseCsvRows: parseCsvRows, parseProjectActuals: parseProjectActuals, pickValue: pickValue, polishFolderCode: polishFolderCode, polishMaterialCode: polishMaterialCode, polishMaterialName: polishMaterialName, polishUnit: polishUnit, readCatalogImportRows: readCatalogImportRows, readProjectNumber: readProjectNumber, refreshPaymentStatus: refreshPaymentStatus, requestStation: requestStation, resolveExportEdgeMaterial: resolveExportEdgeMaterial, resolveExportMaterial: resolveExportMaterial, runInTransaction: runInTransaction, safeFileName: safeFileName, seedDefaultOffcutStorageLocations: seedDefaultOffcutStorageLocations, seedDefaultPriceItems: seedDefaultPriceItems, sendStockMovementError: sendStockMovementError, storageLocationErrorMessage: storageLocationErrorMessage, toGoodsRow: toGoodsRow, toMoneyNumber: toMoneyNumber, toNonNegativeNumber: toNonNegativeNumber, toNullableNumber: toNullableNumber, toPositiveNumber: toPositiveNumber, truthyNumber: truthyNumber, updateOrderTotalFromQuote: updateOrderTotalFromQuote, writeGoodsFile: writeGoodsFile,
  selectCustomer: selectCustomer, selectCustomers: selectCustomers, selectDeliveries: selectDeliveries, selectDelivery: selectDelivery, selectDeliveryCorrection: selectDeliveryCorrection, selectDeliveryCorrectionLines: selectDeliveryCorrectionLines, selectDeliveryCorrections: selectDeliveryCorrections, selectDeliveryLines: selectDeliveryLines, selectMaterial: selectMaterial, selectMaterials: selectMaterials, selectOrder: selectOrder, selectOrders: selectOrders, selectStock: selectStock, selectStockById: selectStockById,
  db: db, upload: upload, getOrderDeleteBlockers: getOrderDeleteBlockers, buildCutQuoteLines: buildCutQuoteLines, normalizeCutQuotePrices: normalizeCutQuotePrices, createWorker: createWorker, XLSX: XLSX, path: path,
  copyFileSync: copyFileSync, existsSync: existsSync, mkdirSync: mkdirSync, readFileSync: readFileSync, readdirSync: readdirSync, statSync: statSync, writeFileSync: writeFileSync, spawn: spawn
}));
\`;

finalContent += mounts;

finalContent += content.slice(customersStart, ordersStart); // customers block already replaced above
// wait! The backups, customers, stock, materials, offcuts... are not perfectly contiguous!
\`;

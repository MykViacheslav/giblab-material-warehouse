import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

const routeStart = 'app.get("/api/orders", (request, response) => {';
const nextRouteStart = 'app.get("/giblab/remainders", (request, response) => {';

const startIndex = content.indexOf(routeStart);
const endIndex = content.indexOf(nextRouteStart);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find boundaries for orders routes.", startIndex, endIndex);
  process.exit(1);
}

const ordersRoutesCode = content.slice(startIndex, endIndex).trim();

// Get all functions and variables
const allFunctions = [
  "allocateProjectActualsToJobs", "assignOffcutStorageLocation", "attrValue", "buildReadyMessage", "buildTree", "cleanNumber", "cleanProjectNumber", "codeSlug", "deleteOrderBundle", "detectCsvDelimiter", "distributeAmount", "distributeTotal", "distributeUsage", "ensureColumn", "ensureRoot", "escapeXml", "exportCutJobProject", "findExcelSheetName", "findProducer", "getCustomerRelatedDocuments", "getCutJobTotals", "handleGibLabRemainders", "importGoodsRows", "importProject", "importRemaindersReport", "logIntegration", "materialTypeCode", "materialUpdateValues", "materialValues", "nextMaterialId", "nextOrderNumber", "normalizeCustomer", "normalizeCutJob", "normalizeCutPart", "normalizeEdgeValue", "normalizeExistingTextValues", "normalizeLooseKey", "normalizeMaterial", "normalizeOcrText", "normalizeOffcut", "normalizeOffcutStatus", "normalizeOffcutStorageLocation", "normalizeOrder", "normalizePayment", "normalizePaymentStatus", "normalizePhone", "normalizePriceItem", "normalizeQuoteLine", "normalizeRemainderRequestType", "normalizeStationName", "normalizeSupply", "offcutStorageLocations", "parseAttributes", "parseCsvLine", "parseCsvRows", "parseProjectActuals", "pickValue", "polishFolderCode", "polishMaterialCode", "polishMaterialName", "polishUnit", "readCatalogImportRows", "readProjectNumber", "refreshPaymentStatus", "requestStation", "resolveExportEdgeMaterial", "resolveExportMaterial", "runInTransaction", "safeFileName", "seedDefaultOffcutStorageLocations", "seedDefaultPriceItems", "sendStockMovementError", "storageLocationErrorMessage", "toGoodsRow", "toMoneyNumber", "toNonNegativeNumber", "toNullableNumber", "toPositiveNumber", "truthyNumber", "updateOrderTotalFromQuote", "writeGoodsFile"
];

const allSelects = [
  "selectCustomer", "selectCustomers", "selectDeliveries", "selectDelivery", "selectDeliveryCorrection", "selectDeliveryCorrectionLines", "selectDeliveryCorrections", "selectDeliveryLines", "selectMaterial", "selectMaterials", "selectOrder", "selectOrders", "selectStock", "selectStockById"
];

const otherDeps = [
  "db", "upload", "getOrderDeleteBlockers", "buildCutQuoteLines", "normalizeCutQuotePrices", "createWorker", "XLSX", "path",
  "copyFileSync", "existsSync", "mkdirSync", "readFileSync", "readdirSync", "statSync", "writeFileSync", "spawn"
];

const allDeps = [...otherDeps, ...allSelects, ...allFunctions];

// Now create routes/orders.js
const ordersRouterTemplate = `import { Router } from "express";

export function createOrdersRouter(deps) {
  const router = Router();
  const {
    ${allDeps.join(",\n    ")}
  } = deps;

${ordersRoutesCode
  .replace(/app\.get\("/g, 'router.get("/')
  .replace(/app\.post\("/g, 'router.post("/')
  .replace(/app\.put\("/g, 'router.put("/')
  .replace(/app\.delete\("/g, 'router.delete("/')
  .replace(/\/\/\/api\//g, '/api/') // just in case
}

  return router;
}
`;

fs.writeFileSync('routes/orders.js', ordersRouterTemplate, 'utf8');

// Modify server.js
if (!content.includes('import { createOrdersRouter }')) {
  content = content.replace(
    'import { createDeliveriesRouter } from "./routes/deliveries.js";',
    'import { createDeliveriesRouter } from "./routes/deliveries.js";\nimport { createOrdersRouter } from "./routes/orders.js";'
  );
}

const actualMountPoint = 'app.use("/", createDeliveriesRouter(';
const routerMount = `
app.use("/", createOrdersRouter({
  ${allDeps.join(",\n  ")}
}));
`;
content = content.replace(actualMountPoint, routerMount.trim() + '\n' + actualMountPoint);
content = content.slice(0, startIndex) + content.slice(endIndex);

fs.writeFileSync('server.js', content, 'utf8');
console.log("Refactored orders routes successfully.");

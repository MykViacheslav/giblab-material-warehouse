import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

const routeStart = 'app.get("/api/materials", (request, response) => {';
const nextRouteStart = 'app.use("/api/stock", createStockRouter';

const startIndex = content.indexOf(routeStart);
const endIndex = content.indexOf(nextRouteStart);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find boundaries for materials routes.", startIndex, endIndex);
  process.exit(1);
}

const materialsRoutesCode = content.slice(startIndex, endIndex).trim();

// Now create routes/materials.js
const materialsRouterTemplate = `import { Router } from "express";

export function createMaterialsRouter({
  db,
  upload,
  selectMaterials,
  selectMaterial,
  selectStock,
  selectStockById,
  insertMaterialSql,
  updateMaterialSql,
  materialValues,
  materialUpdateValues,
  nextMaterialId,
  buildTree,
  withAvailableStock,
  buildFilteredPurchaseNeedsReport,
  purchaseNeedsToCsv,
  readCatalogImportRows,
  previewMaterialImport,
  commitMaterialImport,
  normalizeMaterial,
  getMaterialDeleteBlockers
}) {
  const router = Router();

${materialsRoutesCode
  .replace(/app\.get\("/g, 'router.get("/')
  .replace(/app\.post\("/g, 'router.post("/')
  .replace(/app\.put\("/g, 'router.put("/')
  .replace(/app\.delete\("/g, 'router.delete("/')
  .replace(/\/\/\/api\//g, '/api/') // just in case
}

  return router;
}
`;

fs.writeFileSync('routes/materials.js', materialsRouterTemplate, 'utf8');

// Modify server.js
if (!content.includes('import { createMaterialsRouter }')) {
  content = content.replace(
    'import { createOffcutsRouter } from "./routes/offcuts.js";',
    'import { createOffcutsRouter } from "./routes/offcuts.js";\nimport { createMaterialsRouter } from "./routes/materials.js";'
  );
}

const actualMountPoint = 'app.use("/", createOffcutsRouter(';
const routerMount = `
app.use("/", createMaterialsRouter({
  db,
  upload,
  selectMaterials,
  selectMaterial,
  selectStock,
  selectStockById,
  insertMaterialSql,
  updateMaterialSql,
  materialValues,
  materialUpdateValues,
  nextMaterialId,
  buildTree,
  withAvailableStock,
  buildFilteredPurchaseNeedsReport,
  purchaseNeedsToCsv,
  readCatalogImportRows,
  previewMaterialImport,
  commitMaterialImport,
  normalizeMaterial,
  getMaterialDeleteBlockers
}));
`;
content = content.replace(actualMountPoint, routerMount.trim() + '\n' + actualMountPoint);
content = content.slice(0, startIndex) + content.slice(endIndex);

fs.writeFileSync('server.js', content, 'utf8');
console.log("Refactored materials routes successfully.");

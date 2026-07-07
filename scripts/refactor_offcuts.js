import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

const routeStart = 'app.get("/api/offcuts", (request, response) => {';
const nextRouteStart = 'app.post("/api/import/goods", upload.single("goods"), (request, response) => {';

const startIndex = content.indexOf(routeStart);
const endIndex = content.indexOf(nextRouteStart);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find boundaries for offcuts routes.", startIndex, endIndex);
  process.exit(1);
}

const offcutsRoutesCode = content.slice(startIndex, endIndex).trim();

// Now create routes/offcuts.js
const offcutsRouterTemplate = `import { Router } from "express";

export function createOffcutsRouter({
  db,
  runInTransaction,
  normalizeOffcutStorageLocation,
  storageLocationErrorMessage,
  normalizeOffcut,
  assignOffcutStorageLocation,
  normalizeStationName,
  requestStation
}) {
  const router = Router();

${offcutsRoutesCode
  .replace(/app\.get\("/g, 'router.get("/')
  .replace(/app\.post\("/g, 'router.post("/')
  .replace(/app\.put\("/g, 'router.put("/')
  .replace(/app\.delete\("/g, 'router.delete("/')
  .replace(/\/\/\/api\//g, '/api/') // just in case
}

  return router;
}
`;

fs.writeFileSync('routes/offcuts.js', offcutsRouterTemplate, 'utf8');

// Modify server.js
if (!content.includes('import { createOffcutsRouter }')) {
  content = content.replace(
    'import { createStockRouter } from "./routes/stock.js";',
    'import { createStockRouter } from "./routes/stock.js";\nimport { createOffcutsRouter } from "./routes/offcuts.js";'
  );
}

const mountPoint = 'app.use("/api/stock", createStockRouter({ db, selectMaterial, selectStockById, runInTransaction }));';
const routerMount = `
app.use("/", createOffcutsRouter({
  db,
  runInTransaction,
  normalizeOffcutStorageLocation,
  storageLocationErrorMessage,
  normalizeOffcut,
  assignOffcutStorageLocation,
  normalizeStationName,
  requestStation
}));
`;
content = content.replace(mountPoint, mountPoint + '\n' + routerMount.trim());
content = content.slice(0, startIndex) + content.slice(endIndex);

fs.writeFileSync('server.js', content, 'utf8');
console.log("Refactored offcuts routes successfully.");

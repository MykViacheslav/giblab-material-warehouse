import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

const routeStart = 'app.get("/api/price-items", (request, response) => {';
const nextRouteStart = 'app.get("/api/orders/:id/quote-lines", (request, response) => {';

const startIndex = content.indexOf(routeStart);
const endIndex = content.indexOf(nextRouteStart);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find boundaries for deliveries routes.", startIndex, endIndex);
  process.exit(1);
}

const deliveriesRoutesCode = content.slice(startIndex, endIndex).trim();

// Now create routes/deliveries.js
const deliveriesRouterTemplate = `import { Router } from "express";

export function createDeliveriesRouter({
  db,
  selectDeliveries,
  selectDelivery,
  selectDeliveryLines,
  selectDeliveryCorrections,
  selectDeliveryCorrection,
  selectDeliveryCorrectionLines,
  normalizeDelivery,
  normalizeDeliveryLine,
  normalizeDeliveryCorrection,
  normalizeDeliveryCorrectionLine,
  postDeliveryToDatabase,
  postDeliveryCorrectionToDatabase,
  DeliveryError,
  runInTransaction
}) {
  const router = Router();

${deliveriesRoutesCode
  .replace(/app\.get\("/g, 'router.get("/')
  .replace(/app\.post\("/g, 'router.post("/')
  .replace(/app\.put\("/g, 'router.put("/')
  .replace(/app\.delete\("/g, 'router.delete("/')
  .replace(/\/\/\/api\//g, '/api/') // just in case
}

  return router;
}
`;

fs.writeFileSync('routes/deliveries.js', deliveriesRouterTemplate, 'utf8');

// Modify server.js
if (!content.includes('import { createDeliveriesRouter }')) {
  content = content.replace(
    'import { createMaterialsRouter } from "./routes/materials.js";',
    'import { createMaterialsRouter } from "./routes/materials.js";\nimport { createDeliveriesRouter } from "./routes/deliveries.js";'
  );
}

const actualMountPoint = 'app.use("/", createMaterialsRouter(';
const routerMount = `
app.use("/", createDeliveriesRouter({
  db,
  selectDeliveries,
  selectDelivery,
  selectDeliveryLines,
  selectDeliveryCorrections,
  selectDeliveryCorrection,
  selectDeliveryCorrectionLines,
  normalizeDelivery,
  normalizeDeliveryLine,
  normalizeDeliveryCorrection,
  normalizeDeliveryCorrectionLine,
  postDeliveryToDatabase,
  postDeliveryCorrectionToDatabase,
  DeliveryError,
  runInTransaction
}));
`;
content = content.replace(actualMountPoint, routerMount.trim() + '\n' + actualMountPoint);
content = content.slice(0, startIndex) + content.slice(endIndex);

fs.writeFileSync('server.js', content, 'utf8');
console.log("Refactored deliveries routes successfully.");

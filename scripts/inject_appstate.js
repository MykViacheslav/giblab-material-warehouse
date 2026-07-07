import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

// Replace let restoreRequiresRestart = false; with export const appState = { restoreRequiresRestart: false };
content = content.replace(
  'let restoreRequiresRestart = false;',
  'export const appState = { restoreRequiresRestart: false };'
);

// Replace all occurrences of restoreRequiresRestart with appState.restoreRequiresRestart
content = content.replace(/restoreRequiresRestart = true;/g, 'appState.restoreRequiresRestart = true;');
content = content.replace(/if \(restoreRequiresRestart\)/g, 'if (appState.restoreRequiresRestart)');
content = content.replace(/restoreRequiresRestart: restoreRequiresRestart/g, 'restoreRequiresRestart: appState.restoreRequiresRestart');

// Add imports
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

fs.writeFileSync('server.js', content, 'utf8');
console.log("Appstate and imports injected correctly.");

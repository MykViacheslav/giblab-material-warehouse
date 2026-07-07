import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

// 1. Add import at the top
if (!content.includes('import { createBackupsRouter }')) {
  content = content.replace(
    'import { buildFilteredPurchaseNeedsReport, purchaseNeedsToCsv } from "./src/purchaseNeeds.js";',
    'import { buildFilteredPurchaseNeedsReport, purchaseNeedsToCsv } from "./src/purchaseNeeds.js";\nimport { createBackupsRouter } from "./routes/backups.js";'
  );
}

// 2. Change `let restoreRequiresRestart = false;` to `const appState = { restoreRequiresRestart: false };`
content = content.replace(
  'let restoreRequiresRestart = false;',
  'export const appState = { restoreRequiresRestart: false };'
);

// Update usages of restoreRequiresRestart
content = content.replace(/restoreRequiresRestart/g, 'appState.restoreRequiresRestart');
content = content.replace(/appState\.appState\.restoreRequiresRestart/g, 'appState.restoreRequiresRestart'); // fix double replace just in case

// 3. Remove the backups routes block
const backupRouteStart = 'app.get("/api/backups", (request, response) => {';
const nextRouteStart = 'app.get("/api/materials", (request, response) => {';

const startIndex = content.indexOf(backupRouteStart);
const endIndex = content.indexOf(nextRouteStart);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.slice(0, startIndex) + content.slice(endIndex);
  content = newContent;
} else {
  console.error("Could not find boundaries for backups routes.");
  process.exit(1);
}

// 4. Register the router
const mountPoint = 'app.use(express.static(path.join(rootDir, "public"), {';
const routerMount = `
app.use("/api/backups", createBackupsRouter({ db, dbPath, backupDir, appState }));
`;
content = content.replace(mountPoint, routerMount.trim() + '\n\n' + mountPoint);

fs.writeFileSync('server.js', content, 'utf8');
console.log("Refactored backups routes successfully.");

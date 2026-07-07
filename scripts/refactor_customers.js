import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

// 1. Add import at the top
if (!content.includes('import { createCustomersRouter }')) {
  content = content.replace(
    'import { createBackupsRouter } from "./routes/backups.js";',
    'import { createBackupsRouter } from "./routes/backups.js";\nimport { createCustomersRouter } from "./routes/customers.js";'
  );
}

// 2. Remove the customers routes block
const routeStart = 'app.get("/api/customers", (request, response) => {';
const nextRouteStart = 'app.get("/api/orders", (request, response) => {';

const startIndex = content.indexOf(routeStart);
const endIndex = content.indexOf(nextRouteStart);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex);
} else {
  console.error("Could not find boundaries for customers routes.");
  process.exit(1);
}

// 3. Register the router
const mountPoint = 'app.use("/api/backups", createBackupsRouter({ db, dbPath, backupDir, appState }));';
const routerMount = `
app.use("/api/customers", createCustomersRouter({ db, selectCustomers, selectCustomer, normalizeCustomer, getCustomerRelatedDocuments }));
`;
content = content.replace(mountPoint, mountPoint + '\n' + routerMount.trim());

fs.writeFileSync('server.js', content, 'utf8');
console.log("Refactored customers routes successfully.");

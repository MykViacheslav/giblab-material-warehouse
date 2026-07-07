import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

if (!content.includes('import { createStockRouter }')) {
  content = content.replace(
    'import { createCustomersRouter } from "./routes/customers.js";',
    'import { createCustomersRouter } from "./routes/customers.js";\nimport { createStockRouter } from "./routes/stock.js";'
  );
}

const routeStart = 'app.post("/api/stock/event", (request, response) => {';
const nextRouteStart = 'app.get("/api/offcuts", (request, response) => {';

const startIndex = content.indexOf(routeStart);
const endIndex = content.indexOf(nextRouteStart);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex);
} else {
  console.error("Could not find boundaries for stock routes.");
  process.exit(1);
}

const mountPoint = 'app.use("/api/customers", createCustomersRouter({ db, selectCustomers, selectCustomer, normalizeCustomer, getCustomerRelatedDocuments }));';
const routerMount = `
app.use("/api/stock", createStockRouter({ db, selectMaterial, selectStockById, runInTransaction }));
`;
content = content.replace(mountPoint, mountPoint + '\n' + routerMount.trim());

fs.writeFileSync('server.js', content, 'utf8');
console.log("Refactored stock routes successfully.");

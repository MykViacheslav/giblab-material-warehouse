import express from "express";
import multer from "multer";
import { DatabaseSync } from "node:sqlite";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createWorker } from "tesseract.js";
import XLSX from "xlsx";
import { assertCanUseStock, parseNonNegativeQuantity, parsePositiveQuantity, StockMovementError } from "./src/stockLogic.js";
import { applyStockEventToDatabase, listStockEvents, withAvailableStock } from "./src/stockRepository.js";
import { MATERIAL_CATALOG_COLUMNS, MATERIAL_CATALOG_FIELD_NAMES, normalizeMaterialCatalogFields } from "./src/materialCatalog.js";
import { commitMaterialImport, previewMaterialImport } from "./src/materialImport.js";
import { buildCutQuoteLines, normalizeCutQuotePrices } from "./src/cutQuote.js";
import { getCustomerDeleteBlockers, getMaterialDeleteBlockers, getOrderDeleteBlockers } from "./src/deleteSafety.js";
import {
  createBackup,
  createDailyAutoBackup,
  enforceBackupRetention,
  listBackups,
  resolveBackupPath,
  restoreBackup
} from "./src/backupService.js";
import {
  DeliveryError,
  normalizeDelivery,
  normalizeDeliveryCorrection,
  normalizeDeliveryCorrectionLine,
  normalizeDeliveryLine,
  postDeliveryCorrectionToDatabase,
  postDeliveryToDatabase
} from "./src/deliveryLogic.js";
import { buildFilteredPurchaseNeedsReport, purchaseNeedsToCsv } from "./src/purchaseNeeds.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT || 3080);
const host = process.env.HOST || "0.0.0.0";
const rootDir = path.resolve(".");
const dataDir = process.env.WAREHOUSE_DATA_DIR
  ? path.resolve(process.env.WAREHOUSE_DATA_DIR)
  : path.join(rootDir, "data");
const dbPath = process.env.WAREHOUSE_DB_PATH
  ? path.resolve(process.env.WAREHOUSE_DB_PATH)
  : path.join(dataDir, "warehouse.sqlite");
const dbDir = path.dirname(dbPath);
const backupDir = path.join(dataDir, "backups");
const defaultGoodsPath = process.env.GIBLAB_GOODS_PATH || "C:\\GibLabLocal\\goods.xls";
let restoreRequiresRestart = false;

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY,
    paren_id INTEGER,
    isfolder INTEGER NOT NULL DEFAULT 0,
    code TEXT DEFAULT '',
    name TEXT NOT NULL,
    unit TEXT DEFAULT '',
    price REAL,
    thickness REAL,
    length REAL,
    width REAL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stock (
    material_id INTEGER PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
    quantity REAL NOT NULL DEFAULT 0,
    reserved REAL NOT NULL DEFAULT 0,
    used REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS offcuts (
    id TEXT PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    code TEXT DEFAULT '',
    length REAL NOT NULL,
    width REAL NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    is_business INTEGER NOT NULL DEFAULT 0,
    project_name TEXT DEFAULT '',
    project_path TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'available',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    tax_id TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    project_path TEXT DEFAULT '',
    order_date TEXT DEFAULT '',
    due_date TEXT DEFAULT '',
    production_status TEXT NOT NULL DEFAULT 'Nowe',
    payment_status TEXT NOT NULL DEFAULT 'Nie zapłacone',
    payment_status_manual INTEGER NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL DEFAULT CURRENT_DATE,
    method TEXT DEFAULT '',
    payer_name TEXT DEFAULT '',
    received_by TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS integration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    headers_json TEXT DEFAULT '',
    body TEXT DEFAULT '',
    result_json TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS price_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT DEFAULT '',
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'szt.',
    unit_price REAL NOT NULL DEFAULT 0,
    category TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS supplies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL DEFAULT '',
    code TEXT DEFAULT '',
    name TEXT NOT NULL,
    unit TEXT DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    quantity REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier TEXT DEFAULT '',
    document_number TEXT DEFAULT '',
    delivery_date TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT DEFAULT '',
    posted_at TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delivery_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    material_code TEXT DEFAULT '',
    material_name TEXT DEFAULT '',
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delivery_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    correction_number TEXT DEFAULT '',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    note TEXT DEFAULT '',
    total_net_delta REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    posted_at TEXT DEFAULT '',
    cancelled_at TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS delivery_correction_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correction_id INTEGER NOT NULL REFERENCES delivery_corrections(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    quantity_delta REAL NOT NULL,
    unit_price_net REAL DEFAULT 0,
    line_total_net_delta REAL DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quote_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    cut_job_id INTEGER REFERENCES cut_jobs(id) ON DELETE SET NULL,
    price_item_id INTEGER REFERENCES price_items(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'szt.',
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    line_total REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cut_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    material_code TEXT DEFAULT '',
    material_name TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Robocze',
    source_file TEXT DEFAULT '',
    export_path TEXT DEFAULT '',
    project_path TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cut_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cut_job_id INTEGER NOT NULL REFERENCES cut_jobs(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    material_code TEXT DEFAULT '',
    material_name TEXT DEFAULT '',
    thickness REAL,
    length REAL NOT NULL,
    width REAL NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    texture INTEGER NOT NULL DEFAULT 1,
    name TEXT DEFAULT '',
    edge_top TEXT DEFAULT '',
    edge_bottom TEXT DEFAULT '',
    edge_left TEXT DEFAULT '',
    edge_right TEXT DEFAULT '',
    work_milling INTEGER NOT NULL DEFAULT 0,
    work_drilling INTEGER NOT NULL DEFAULT 0,
    work_lacquer INTEGER NOT NULL DEFAULT 0,
    work_other INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

ensureColumn("orders", "payment_status_manual", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("payments", "payer_name", "TEXT DEFAULT ''");
ensureColumn("payments", "received_by", "TEXT DEFAULT ''");
for (const [columnName, definition] of MATERIAL_CATALOG_COLUMNS) {
  ensureColumn("materials", columnName, definition);
}
ensureColumn("quote_lines", "cut_job_id", "INTEGER REFERENCES cut_jobs(id) ON DELETE SET NULL");
ensureColumn("cut_parts", "material_id", "INTEGER REFERENCES materials(id) ON DELETE SET NULL");
ensureColumn("cut_parts", "material_code", "TEXT DEFAULT ''");
ensureColumn("cut_parts", "thickness", "REAL");
ensureColumn("cut_parts", "work_milling", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("cut_parts", "work_drilling", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("cut_parts", "work_lacquer", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("cut_parts", "work_other", "INTEGER NOT NULL DEFAULT 0");
normalizeExistingTextValues();
seedDefaultPriceItems();
try {
  db.exec("PRAGMA wal_checkpoint(FULL)");
  createDailyAutoBackup({ dbPath, backupDir });
  enforceBackupRetention({ backupDir, keep: 30 });
} catch (error) {
  console.warn("Could not create startup backup:", error.message);
}

const selectMaterials = db.prepare("SELECT * FROM materials ORDER BY sort_order, id");
const selectMaterial = db.prepare("SELECT * FROM materials WHERE id = ?");
const materialBaseColumns = ["id", "paren_id", "isfolder", "code", "name", "unit", "price", "thickness", "length", "width"];
const materialWriteColumns = [...materialBaseColumns, ...MATERIAL_CATALOG_FIELD_NAMES];
const materialUpdateColumns = materialWriteColumns.filter((column) => column !== "id");
const insertMaterialSql = `
  INSERT INTO materials (${[...materialWriteColumns, "sort_order"].join(", ")})
  VALUES (${[...materialWriteColumns, "sort_order"].map(() => "?").join(", ")})
`;
const updateMaterialSql = `
  UPDATE materials
  SET ${materialUpdateColumns.map((column) => `${column} = ?`).join(", ")}
  WHERE id = ?
`;
const selectStock = db.prepare(`
  SELECT m.*, COALESCE(s.quantity, 0) AS quantity, COALESCE(s.reserved, 0) AS reserved, COALESCE(s.used, 0) AS used
  FROM materials m
  LEFT JOIN stock s ON s.material_id = m.id
  ORDER BY m.sort_order, m.id
`);
const selectStockById = db.prepare(`
  SELECT m.*, COALESCE(s.quantity, 0) AS quantity, COALESCE(s.reserved, 0) AS reserved, COALESCE(s.used, 0) AS used
  FROM materials m
  LEFT JOIN stock s ON s.material_id = m.id
  WHERE m.id = ?
`);
const selectCustomers = db.prepare("SELECT * FROM customers ORDER BY name COLLATE NOCASE, id");
const selectCustomer = db.prepare("SELECT * FROM customers WHERE id = ?");
const selectDeliveries = db.prepare(`
  SELECT d.*,
         COUNT(dl.id) AS line_count,
         COALESCE(SUM(dl.quantity), 0) AS total_quantity,
         COALESCE(SUM(dl.quantity * dl.unit_price), 0) AS total_value
  FROM deliveries d
  LEFT JOIN delivery_lines dl ON dl.delivery_id = d.id
  GROUP BY d.id
  ORDER BY d.created_at DESC, d.id DESC
`);
const selectDelivery = db.prepare("SELECT * FROM deliveries WHERE id = ?");
const selectDeliveryLines = db.prepare("SELECT * FROM delivery_lines WHERE delivery_id = ? ORDER BY id");
const selectDeliveryCorrections = db.prepare(`
  SELECT c.*,
         d.document_number AS original_document_number,
         d.supplier AS original_supplier,
         COUNT(l.id) AS line_count,
         COALESCE(SUM(l.quantity_delta), 0) AS total_quantity_delta
  FROM delivery_corrections c
  LEFT JOIN deliveries d ON d.id = c.original_delivery_id
  LEFT JOIN delivery_correction_lines l ON l.correction_id = c.id
  GROUP BY c.id
  ORDER BY c.created_at DESC, c.id DESC
`);
const selectDeliveryCorrection = db.prepare("SELECT * FROM delivery_corrections WHERE id = ?");
const selectDeliveryCorrectionLines = db.prepare(`
  SELECT l.*, m.code AS material_code, m.name AS material_name
  FROM delivery_correction_lines l
  LEFT JOIN materials m ON m.id = l.material_id
  WHERE l.correction_id = ?
  ORDER BY l.id
`);
const selectOrders = db.prepare(`
  SELECT o.*, c.name AS customer_name, COALESCE(SUM(p.amount), 0) AS paid_amount,
         o.total_amount - COALESCE(SUM(p.amount), 0) AS balance
  FROM orders o
  LEFT JOIN customers c ON c.id = o.customer_id
  LEFT JOIN payments p ON p.order_id = o.id
  GROUP BY o.id
  ORDER BY o.created_at DESC, o.id DESC
`);
const selectOrder = db.prepare(`
  SELECT o.*, c.name AS customer_name, COALESCE(SUM(p.amount), 0) AS paid_amount,
         o.total_amount - COALESCE(SUM(p.amount), 0) AS balance
  FROM orders o
  LEFT JOIN customers c ON c.id = o.customer_id
  LEFT JOIN payments p ON p.order_id = o.id
  WHERE o.id = ?
  GROUP BY o.id
`);

app.use(express.json({ limit: "4mb" }));
app.use("/giblab/remainders", express.text({ type: "*/*", limit: "4mb" }));
app.use((request, response, next) => {
  if (restoreRequiresRestart && request.path !== "/api/health") {
    return response.status(503).json({ error: "Database was restored. Please restart the server.", restart_required: true });
  }
  next();
});
app.use((request, response, next) => {
  if (request.path === "/" || request.path.endsWith(".html") || request.path.endsWith(".js") || request.path.endsWith(".css")) {
    response.set("Cache-Control", "no-store");
  }
  next();
});
app.use(express.static(path.join(rootDir, "public"), {
  setHeaders(response, filePath) {
    response.setHeader("Cache-Control", "no-store");
    if (filePath.endsWith(".html")) response.setHeader("Content-Type", "text/html; charset=utf-8");
    if (filePath.endsWith(".js")) response.setHeader("Content-Type", "application/javascript; charset=utf-8");
    if (filePath.endsWith(".css")) response.setHeader("Content-Type", "text/css; charset=utf-8");
  }
}));

app.get("/api/health", (request, response) => {
  response.json({ ok: true, dbPath, defaultGoodsPath, restart_required: restoreRequiresRestart });
});

app.get("/api/backups", (request, response) => {
  response.json(listBackups(backupDir));
});

app.post("/api/backups", (request, response) => {
  db.exec("PRAGMA wal_checkpoint(FULL)");
  const backup = createBackup({ dbPath, backupDir });
  enforceBackupRetention({ backupDir, keep: 30 });
  response.status(201).json({ filename: backup.filename, message: "Backup created" });
});

app.get("/api/backups/:filename/download", (request, response) => {
  try {
    const filename = request.params.filename;
    const filePath = resolveBackupPath(backupDir, filename);
    if (!existsSync(filePath)) return response.status(404).json({ error: "Backup file not found" });
    response.setHeader("Content-Type", "application/octet-stream");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.sendFile(filePath);
  } catch (error) {
    response.status(400).json({ error: error.message || "Invalid backup filename" });
  }
});

app.post("/api/backups/:filename/restore", (request, response) => {
  let databaseClosed = false;
  try {
    const backupPath = resolveBackupPath(backupDir, request.params.filename);
    if (!existsSync(backupPath)) return response.status(404).json({ error: "Backup file not found" });

    db.exec("PRAGMA wal_checkpoint(FULL)");
    db.close();
    databaseClosed = true;
    const result = restoreBackup({ dbPath, backupDir, filename: request.params.filename });
    restoreRequiresRestart = true;
    response.json({
      ...result,
      message: "Database restored. Please restart the server.",
      restart_required: true
    });
  } catch (error) {
    if (databaseClosed) restoreRequiresRestart = true;
    response.status(400).json({
      error: error.message || "Could not restore backup",
      restart_required: restoreRequiresRestart
    });
  }
});

app.get("/api/materials", (request, response) => {
  response.json(buildTree(selectStock.all().map(withAvailableStock)));
});

app.get("/api/materials/flat", (request, response) => {
  response.json(selectStock.all().map(withAvailableStock));
});

app.get("/api/purchase-needs", (request, response) => {
  response.json(buildFilteredPurchaseNeedsReport(selectStock.all().map(withAvailableStock), request.query));
});

app.get("/api/purchase-needs.csv", (request, response) => {
  const report = buildFilteredPurchaseNeedsReport(selectStock.all().map(withAvailableStock), request.query);
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", "attachment; filename=\"purchase-needs.csv\"");
  response.send(`\uFEFF${purchaseNeedsToCsv(report.rows)}`);
});

app.post("/api/materials/import-preview", upload.single("catalog"), (request, response) => {
  if (!request.file?.buffer) return response.status(400).json({ error: "Import file is required" });
  try {
    const rows = readCatalogImportRows(request.file.buffer, request.file.originalname);
    const preview = previewMaterialImport(rows, selectMaterials.all());
    response.json({
      filename: request.file.originalname,
      ...preview
    });
  } catch (error) {
    console.error(error);
    response.status(400).json({ error: "Could not parse material catalog file" });
  }
});

app.post("/api/materials/import-commit", (request, response) => {
  const rows = Array.isArray(request.body.rows) ? request.body.rows : [];
  const mode = String(request.body.mode || "upsert");
  if (!rows.length) return response.status(400).json({ error: "No import rows supplied" });
  try {
    const result = commitMaterialImport(db, rows, mode, { existingMaterials: selectMaterials.all() });
    response.json(result);
  } catch (error) {
    console.error(error);
    response.status(400).json({ error: error.message || "Could not commit material catalog import" });
  }
});

app.post("/api/materials", (request, response) => {
  const payload = normalizeMaterial(request.body);
  const id = payload.id !== null ? payload.id : nextMaterialId(payload.isfolder);
  db.prepare(insertMaterialSql).run(...materialValues({ ...payload, id }), id);
  db.prepare("INSERT OR IGNORE INTO stock (material_id) VALUES (?)").run(id);
  response.status(201).json(withAvailableStock(selectStockById.get(id)));
});

app.put("/api/materials/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectMaterial.get(id)) return response.status(404).json({ error: "Material not found" });
  const payload = normalizeMaterial({ ...request.body, id });
  db.prepare(updateMaterialSql).run(...materialUpdateValues(payload), id);
  response.json(withAvailableStock(selectStockById.get(id)));
});

app.delete("/api/materials/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectMaterial.get(id)) return response.status(404).json({ error: "Material not found" });
  const blockers = getMaterialDeleteBlockers(db, id);
  if (blockers.length) return response.status(409).json({ error: "Material cannot be deleted safely", blockers });
  db.prepare("DELETE FROM stock WHERE material_id = ?").run(id);
  db.prepare("DELETE FROM materials WHERE id = ?").run(id);
  response.status(204).end();
});

app.post("/api/stock/event", (request, response) => {
  const materialId = Number(request.body.material_id);
  const eventType = String(request.body.event_type || "");
  const note = String(request.body.note || "");
  if (!materialId || !["receive", "reserve", "release", "use", "use_reserved", "adjust"].includes(eventType)) {
    return response.status(400).json({ error: "Invalid stock event" });
  }
  if (!selectMaterial.get(materialId)) return response.status(404).json({ error: "Material not found" });
  try {
    const quantity = eventType === "adjust"
      ? parseNonNegativeQuantity(request.body.quantity)
      : parsePositiveQuantity(request.body.quantity);
    const updated = runInTransaction(() => {
      applyStockEventToDatabase(db, { materialId, eventType, quantity, note });
      return withAvailableStock(selectStockById.get(materialId));
    });
    response.json(updated);
  } catch (error) {
    if (error instanceof StockMovementError) return response.status(400).json({ error: error.message, details: error.details });
    throw error;
  }
});

app.get("/api/stock/:materialId/events", (request, response) => {
  const materialId = Number(request.params.materialId);
  if (!materialId) return response.status(400).json({ error: "Invalid material id" });
  if (!selectMaterial.get(materialId)) return response.status(404).json({ error: "Material not found" });
  try {
    response.json(listStockEvents(db, materialId));
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Could not load stock history" });
  }
});

app.get("/api/offcuts", (request, response) => {
  response.json(db.prepare("SELECT * FROM offcuts ORDER BY created_at DESC").all());
});

app.post("/api/offcuts", (request, response) => {
  const payload = normalizeOffcut(request.body);
  db.prepare(`
    INSERT OR REPLACE INTO offcuts (id, material_id, code, length, width, quantity, is_business, project_name, project_path, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(payload.id, payload.material_id, payload.code, payload.length, payload.width, payload.quantity, payload.is_business, payload.project_name, payload.project_path, payload.status);
  response.status(201).json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(payload.id));
});

app.put("/api/offcuts/:id", (request, response) => {
  const id = String(request.params.id || "").trim();
  const existing = db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  const payload = normalizeOffcut({ ...existing, ...request.body, id });
  db.prepare(`
    UPDATE offcuts
    SET material_id = ?, code = ?, length = ?, width = ?, quantity = ?, is_business = ?, project_name = ?, project_path = ?, status = ?
    WHERE id = ?
  `).run(payload.material_id, payload.code, payload.length, payload.width, payload.quantity, payload.is_business, payload.project_name, payload.project_path, payload.status, id);
  response.json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id));
});

app.delete("/api/offcuts/:id", (request, response) => {
  const id = String(request.params.id || "");
  const existing = db.prepare("SELECT id FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  db.prepare("DELETE FROM offcuts WHERE id = ?").run(id);
  response.status(204).end();
});

app.post("/api/import/goods", upload.single("goods"), (request, response) => {
  const source = request.file?.buffer || readFileSync(String(request.body.path || defaultGoodsPath));
  const workbook = XLSX.read(source, { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  importGoodsRows(rows);
  response.json({ imported: rows.length, source: request.file?.originalname || request.body.path || defaultGoodsPath });
});

app.post("/api/export/goods", (request, response) => {
  const target = String(request.body.path || path.join(dataDir, "goods.xls"));
  const rows = writeGoodsFile(target);
  response.json({ exported: rows.length, target });
});

app.post("/api/export/giblab", (request, response) => {
  const target = String(request.body.path || defaultGoodsPath);
  if (existsSync(target)) {
    const backupDir = path.join(path.dirname(target), "warehouse-backups");
    mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `goods.${new Date().toISOString().replace(/[:.]/g, "-")}.xls`);
    copyFileSync(target, backupPath);
  }
  const rows = writeGoodsFile(target);
  response.json({ exported: rows.length, target });
});

app.post("/api/tools/polish-material-names", (request, response) => {
  const rows = selectMaterials.all();
  const update = db.prepare("UPDATE materials SET name = ? WHERE id = ?");
  let changed = 0;
  for (const row of rows) {
    const nextName = polishMaterialName(row.name);
    if (nextName && nextName !== row.name) {
      update.run(nextName, row.id);
      changed += 1;
    }
  }
  response.json({ changed });
});

app.post("/api/tools/polish-catalog", (request, response) => {
  const rows = selectMaterials.all();
  const byId = new Map(rows.map((row) => [row.id, row]));
  const update = db.prepare("UPDATE materials SET name = ?, code = ?, unit = ? WHERE id = ?");
  let changedNames = 0;
  let changedCodes = 0;
  let changedUnits = 0;
  for (const row of rows) {
    const nextName = polishMaterialName(row.name);
    const nextCode = row.isfolder ? polishFolderCode(nextName, row, byId) : polishMaterialCode(row, byId);
    const nextUnit = polishUnit(row.unit);
    if (nextName !== row.name) changedNames += 1;
    if (nextCode !== row.code) changedCodes += 1;
    if (nextUnit !== row.unit) changedUnits += 1;
    update.run(nextName, nextCode, nextUnit, row.id);
  }
  response.json({ changedNames, changedCodes, changedUnits });
});

app.post("/api/producers", (request, response) => {
  const name = String(request.body.name || "").trim();
  const prefix = String(request.body.prefix || "").trim().toUpperCase();
  const materialType = String(request.body.material_type || "sheet");
  if (!name) return response.status(400).json({ error: "Producer name is required" });

  const rootId = ensureRoot(materialType === "edge" ? "Okleiny" : "Materiał płytowy");
  const producerId = nextMaterialId(1);
  db.prepare(`
    INSERT INTO materials (id, paren_id, isfolder, code, name, sort_order)
    VALUES (?, ?, 1, ?, ?, ?)
  `).run(producerId, rootId, prefix, name, producerId);
  db.prepare("INSERT OR IGNORE INTO stock (material_id) VALUES (?)").run(producerId);
  response.status(201).json(selectStockById.get(producerId));
});

app.get("/api/customers", (request, response) => {
  response.json(selectCustomers.all());
});

app.post("/api/customers", (request, response) => {
  const payload = normalizeCustomer(request.body);
  const result = db.prepare(`
    INSERT INTO customers (name, phone, email, address, tax_id, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(payload.name, payload.phone, payload.email, payload.address, payload.tax_id, payload.notes);
  response.status(201).json(selectCustomer.get(result.lastInsertRowid));
});

app.put("/api/customers/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectCustomer.get(id)) return response.status(404).json({ error: "Customer not found" });
  const payload = normalizeCustomer(request.body);
  db.prepare(`
    UPDATE customers
    SET name = ?, phone = ?, email = ?, address = ?, tax_id = ?, notes = ?
    WHERE id = ?
  `).run(payload.name, payload.phone, payload.email, payload.address, payload.tax_id, payload.notes, id);
  response.json(selectCustomer.get(id));
});

app.delete("/api/customers/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectCustomer.get(id)) return response.status(404).json({ error: "Customer not found" });
  const blockers = getCustomerDeleteBlockers(db, id);
  if (blockers.length) return response.status(409).json({ error: "Customer cannot be deleted safely", blockers });
  db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  response.status(204).end();
});

app.get("/api/orders", (request, response) => {
  response.json(selectOrders.all());
});

app.get("/api/orders/next-number", (request, response) => {
  response.json({ order_number: nextOrderNumber() });
});

app.post("/api/orders", (request, response) => {
  const payload = normalizeOrder(request.body);
  const orderNumber = payload.order_number || nextOrderNumber();
  const result = db.prepare(`
    INSERT INTO orders (order_number, customer_id, title, project_path, order_date, due_date, production_status, payment_status, total_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNumber, payload.customer_id, payload.title, payload.project_path, payload.order_date, payload.due_date, payload.production_status, payload.payment_status, payload.total_amount, payload.notes);
  refreshPaymentStatus(result.lastInsertRowid);
  response.status(201).json(selectOrder.get(result.lastInsertRowid));
});

app.put("/api/orders/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectOrder.get(id)) return response.status(404).json({ error: "Order not found" });
  const payload = normalizeOrder(request.body);
  const orderNumber = payload.order_number || selectOrder.get(id).order_number;
  db.prepare(`
    UPDATE orders
    SET order_number = ?, customer_id = ?, title = ?, project_path = ?, order_date = ?, due_date = ?,
        production_status = ?, payment_status = ?, payment_status_manual = ?, total_amount = ?, notes = ?
    WHERE id = ?
  `).run(orderNumber, payload.customer_id, payload.title, payload.project_path, payload.order_date, payload.due_date, payload.production_status, payload.payment_status, payload.payment_status_manual, payload.total_amount, payload.notes, id);
  if (!payload.payment_status_manual) refreshPaymentStatus(id);
  response.json(selectOrder.get(id));
});

app.post("/api/orders/:id/payment-status", (request, response) => {
  const id = Number(request.params.id);
  if (!selectOrder.get(id)) return response.status(404).json({ error: "Order not found" });
  const status = normalizePaymentStatus(request.body.payment_status || "Nie zapłacone");
  if (!["Nie zapłacone", "Zaliczka", "Opłacone", "Po terminie"].includes(status)) {
    return response.status(400).json({ error: "Invalid payment status" });
  }
  db.prepare("UPDATE orders SET payment_status = ?, payment_status_manual = 1 WHERE id = ?").run(status, id);
  response.json(selectOrder.get(id));
});

app.delete("/api/orders/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectOrder.get(id)) return response.status(404).json({ error: "Order not found" });
  const blockers = getOrderDeleteBlockers(db, id);
  if (blockers.length) return response.status(409).json({ error: "Order cannot be deleted safely", blockers });
  db.prepare("DELETE FROM orders WHERE id = ?").run(id);
  response.status(204).end();
});

app.get("/api/orders/:id/payments", (request, response) => {
  response.json(db.prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC, id DESC").all(Number(request.params.id)));
});

app.post("/api/orders/:id/payments", (request, response) => {
  const orderId = Number(request.params.id);
  if (!selectOrder.get(orderId)) return response.status(404).json({ error: "Order not found" });
  const payload = normalizePayment(request.body);
  const result = db.prepare(`
    INSERT INTO payments (order_id, amount, payment_date, method, payer_name, received_by, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, payload.amount, payload.payment_date, payload.method, payload.payer_name, payload.received_by, payload.note);
  refreshPaymentStatus(orderId);
  response.status(201).json(db.prepare("SELECT * FROM payments WHERE id = ?").get(result.lastInsertRowid));
});

app.get("/api/orders/:id/notify", (request, response) => {
  const order = selectOrder.get(Number(request.params.id));
  if (!order) return response.status(404).json({ error: "Order not found" });
  const customer = order.customer_id ? selectCustomer.get(order.customer_id) : null;
  const message = buildReadyMessage(order, customer);
  const phone = normalizePhone(customer?.phone || "");
  const email = customer?.email || "";
  response.json({
    message,
    sms: phone ? `sms:${phone}?body=${encodeURIComponent(message)}` : "",
    whatsapp: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "",
    telegram: `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`,
    email: email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Zamówienie ${order.order_number} gotowe do odbioru`)}&body=${encodeURIComponent(message)}` : ""
  });
});

app.delete("/api/payments/:id", (request, response) => {
  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(Number(request.params.id));
  if (!payment) return response.status(404).json({ error: "Payment not found" });
  db.prepare("DELETE FROM payments WHERE id = ?").run(payment.id);
  refreshPaymentStatus(payment.order_id);
  response.status(204).end();
});

app.get("/api/price-items", (request, response) => {
  response.json(db.prepare("SELECT * FROM price_items WHERE active = 1 ORDER BY category, name").all());
});

app.post("/api/price-items", (request, response) => {
  const payload = normalizePriceItem(request.body);
  const result = db.prepare(`
    INSERT INTO price_items (code, name, unit, unit_price, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(payload.code, payload.name, payload.unit, payload.unit_price, payload.category);
  response.status(201).json(db.prepare("SELECT * FROM price_items WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/price-items/:id", (request, response) => {
  const id = Number(request.params.id);
  const payload = normalizePriceItem(request.body);
  db.prepare(`
    UPDATE price_items
    SET code = ?, name = ?, unit = ?, unit_price = ?, category = ?, active = ?
    WHERE id = ?
  `).run(payload.code, payload.name, payload.unit, payload.unit_price, payload.category, payload.active, id);
  response.json(db.prepare("SELECT * FROM price_items WHERE id = ?").get(id));
});

app.delete("/api/price-items/:id", (request, response) => {
  const id = Number(request.params.id);
  const item = db.prepare("SELECT * FROM price_items WHERE id = ?").get(id);
  if (!item) return response.status(404).json({ error: "Price item not found" });
  db.prepare("UPDATE price_items SET active = 0 WHERE id = ?").run(id);
  response.status(204).end();
});

app.get("/api/supplies", (request, response) => {
  response.json(db.prepare("SELECT * FROM supplies WHERE active = 1 ORDER BY category, name, id").all());
});

app.post("/api/supplies", (request, response) => {
  const payload = normalizeSupply(request.body);
  const result = db.prepare(`
    INSERT INTO supplies (category, code, name, unit, price, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(payload.category, payload.code, payload.name, payload.unit, payload.price, payload.quantity, payload.notes);
  response.status(201).json(db.prepare("SELECT * FROM supplies WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/supplies/:id", (request, response) => {
  const id = Number(request.params.id);
  const payload = normalizeSupply(request.body);
  db.prepare(`
    UPDATE supplies
    SET category = ?, code = ?, name = ?, unit = ?, price = ?, quantity = ?, notes = ?, active = ?
    WHERE id = ?
  `).run(payload.category, payload.code, payload.name, payload.unit, payload.price, payload.quantity, payload.notes, payload.active, id);
  response.json(db.prepare("SELECT * FROM supplies WHERE id = ?").get(id));
});

app.delete("/api/supplies/:id", (request, response) => {
  db.prepare("UPDATE supplies SET active = 0 WHERE id = ?").run(Number(request.params.id));
  response.status(204).end();
});

app.get("/api/deliveries", (request, response) => {
  response.json(selectDeliveries.all());
});

app.post("/api/deliveries", (request, response) => {
  const payload = normalizeDelivery(request.body);
  const result = db.prepare(`
    INSERT INTO deliveries (supplier, document_number, delivery_date, status, notes)
    VALUES (?, ?, ?, 'draft', ?)
  `).run(payload.supplier, payload.document_number, payload.delivery_date, payload.notes);
  response.status(201).json(selectDelivery.get(result.lastInsertRowid));
});

app.put("/api/deliveries/:id", (request, response) => {
  const id = Number(request.params.id);
  const delivery = selectDelivery.get(id);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be edited" });
  const payload = normalizeDelivery(request.body);
  db.prepare(`
    UPDATE deliveries
    SET supplier = ?, document_number = ?, delivery_date = ?, notes = ?
    WHERE id = ?
  `).run(payload.supplier, payload.document_number, payload.delivery_date, payload.notes, id);
  response.json(selectDelivery.get(id));
});

app.delete("/api/deliveries/:id", (request, response) => {
  const id = Number(request.params.id);
  const delivery = selectDelivery.get(id);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be deleted" });
  db.prepare("DELETE FROM deliveries WHERE id = ?").run(id);
  response.status(204).end();
});

app.post("/api/deliveries/:id/cancel", (request, response) => {
  const delivery = selectDelivery.get(Number(request.params.id));
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  return response.status(400).json({ error: "Posted deliveries cannot be cancelled directly. Create a delivery correction instead." });
});

app.get("/api/deliveries/:id/lines", (request, response) => {
  const id = Number(request.params.id);
  if (!selectDelivery.get(id)) return response.status(404).json({ error: "Delivery not found" });
  response.json(selectDeliveryLines.all(id));
});

app.post("/api/deliveries/:id/lines", (request, response) => {
  const deliveryId = Number(request.params.id);
  const delivery = selectDelivery.get(deliveryId);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be edited" });
  try {
    const payload = normalizeDeliveryLine(request.body);
    const material = selectMaterial.get(payload.material_id);
    if (!material || material.isfolder) return response.status(400).json({ error: "Valid material is required" });
    const result = db.prepare(`
      INSERT INTO delivery_lines (delivery_id, material_id, material_code, material_name, quantity, unit_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      deliveryId,
      material.id,
      material.code || payload.material_code,
      material.name || payload.material_name,
      payload.quantity,
      payload.unit_price,
      payload.notes
    );
    response.status(201).json(db.prepare("SELECT * FROM delivery_lines WHERE id = ?").get(result.lastInsertRowid));
  } catch (error) {
    if (error instanceof StockMovementError) return response.status(400).json({ error: error.message, details: error.details });
    throw error;
  }
});

app.delete("/api/delivery-lines/:id", (request, response) => {
  const id = Number(request.params.id);
  const line = db.prepare("SELECT * FROM delivery_lines WHERE id = ?").get(id);
  if (!line) return response.status(404).json({ error: "Delivery line not found" });
  const delivery = selectDelivery.get(line.delivery_id);
  if (delivery?.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be edited" });
  db.prepare("DELETE FROM delivery_lines WHERE id = ?").run(id);
  response.status(204).end();
});

app.post("/api/deliveries/:id/post", (request, response) => {
  const id = Number(request.params.id);
  try {
    const delivery = postDeliveryToDatabase(db, id);
    response.json({
      ...delivery,
      lines: selectDeliveryLines.all(id),
      stock: selectStock.all().map(withAvailableStock)
    });
  } catch (error) {
    if (error instanceof DeliveryError || error instanceof StockMovementError) {
      return response.status(400).json({ error: error.message, details: error.details });
    }
    throw error;
  }
});

app.get("/api/delivery-corrections", (request, response) => {
  response.json(selectDeliveryCorrections.all());
});

app.post("/api/deliveries/:id/corrections", (request, response) => {
  const deliveryId = Number(request.params.id);
  const delivery = selectDelivery.get(deliveryId);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status !== "posted") return response.status(400).json({ error: "Only posted deliveries can be corrected" });
  const payload = normalizeDeliveryCorrection(request.body);
  if (!payload.reason) return response.status(400).json({ error: "Correction reason is required" });
  const result = db.prepare(`
    INSERT INTO delivery_corrections (original_delivery_id, correction_number, reason, status, note)
    VALUES (?, ?, ?, 'draft', ?)
  `).run(deliveryId, payload.correction_number, payload.reason, payload.note);
  response.status(201).json(selectDeliveryCorrection.get(result.lastInsertRowid));
});

app.put("/api/delivery-corrections/:id", (request, response) => {
  const id = Number(request.params.id);
  const correction = selectDeliveryCorrection.get(id);
  if (!correction) return response.status(404).json({ error: "Delivery correction not found" });
  if (correction.status !== "draft") return response.status(400).json({ error: "Posted correction cannot be edited" });
  const payload = normalizeDeliveryCorrection(request.body);
  if (!payload.reason) return response.status(400).json({ error: "Correction reason is required" });
  db.prepare(`
    UPDATE delivery_corrections
    SET correction_number = ?, reason = ?, note = ?
    WHERE id = ?
  `).run(payload.correction_number, payload.reason, payload.note, id);
  response.json(selectDeliveryCorrection.get(id));
});

app.get("/api/delivery-corrections/:id/lines", (request, response) => {
  const id = Number(request.params.id);
  if (!selectDeliveryCorrection.get(id)) return response.status(404).json({ error: "Delivery correction not found" });
  response.json(selectDeliveryCorrectionLines.all(id));
});

app.post("/api/delivery-corrections/:id/lines", (request, response) => {
  const correctionId = Number(request.params.id);
  const correction = selectDeliveryCorrection.get(correctionId);
  if (!correction) return response.status(404).json({ error: "Delivery correction not found" });
  if (correction.status !== "draft") return response.status(400).json({ error: "Posted correction cannot be edited" });
  try {
    const payload = normalizeDeliveryCorrectionLine(request.body);
    const material = selectMaterial.get(payload.material_id);
    if (!material || material.isfolder) return response.status(400).json({ error: "Valid material is required" });
    const result = db.prepare(`
      INSERT INTO delivery_correction_lines (correction_id, material_id, quantity_delta, unit_price_net, line_total_net_delta, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(correctionId, material.id, payload.quantity_delta, payload.unit_price_net, payload.line_total_net_delta, payload.note);
    response.status(201).json(selectDeliveryCorrectionLines.all(correctionId).find((line) => line.id === result.lastInsertRowid));
  } catch (error) {
    if (error instanceof DeliveryError) return response.status(400).json({ error: error.message });
    throw error;
  }
});

app.delete("/api/delivery-correction-lines/:id", (request, response) => {
  const id = Number(request.params.id);
  const line = db.prepare("SELECT * FROM delivery_correction_lines WHERE id = ?").get(id);
  if (!line) return response.status(404).json({ error: "Delivery correction line not found" });
  const correction = selectDeliveryCorrection.get(line.correction_id);
  if (correction?.status !== "draft") return response.status(400).json({ error: "Posted correction cannot be edited" });
  db.prepare("DELETE FROM delivery_correction_lines WHERE id = ?").run(id);
  response.status(204).end();
});

app.post("/api/delivery-corrections/:id/post", (request, response) => {
  const id = Number(request.params.id);
  try {
    const correction = postDeliveryCorrectionToDatabase(db, id);
    response.json({
      ...correction,
      lines: selectDeliveryCorrectionLines.all(id),
      stock: selectStock.all().map(withAvailableStock)
    });
  } catch (error) {
    if (error instanceof DeliveryError || error instanceof StockMovementError) {
      return response.status(400).json({ error: error.message, details: error.details });
    }
    throw error;
  }
});

app.get("/api/orders/:id/quote-lines", (request, response) => {
  response.json(db.prepare("SELECT * FROM quote_lines WHERE order_id = ? ORDER BY id").all(Number(request.params.id)));
});

app.post("/api/orders/:id/quote-lines", (request, response) => {
  const orderId = Number(request.params.id);
  if (!selectOrder.get(orderId)) return response.status(404).json({ error: "Order not found" });
  const payload = normalizeQuoteLine(request.body);
  const result = db.prepare(`
    INSERT INTO quote_lines (order_id, price_item_id, description, unit, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, payload.price_item_id, payload.description, payload.unit, payload.quantity, payload.unit_price, payload.line_total);
  updateOrderTotalFromQuote(orderId);
  response.status(201).json(db.prepare("SELECT * FROM quote_lines WHERE id = ?").get(result.lastInsertRowid));
});

app.delete("/api/quote-lines/:id", (request, response) => {
  const line = db.prepare("SELECT * FROM quote_lines WHERE id = ?").get(Number(request.params.id));
  if (!line) return response.status(404).json({ error: "Quote line not found" });
  db.prepare("DELETE FROM quote_lines WHERE id = ?").run(line.id);
  updateOrderTotalFromQuote(line.order_id);
  response.status(204).end();
});

app.post("/api/orders/:id/recalculate-quote", (request, response) => {
  const orderId = Number(request.params.id);
  updateOrderTotalFromQuote(orderId);
  response.json(selectOrder.get(orderId));
});

app.get("/api/cut-jobs", (request, response) => {
  response.json(db.prepare(`
    SELECT j.*, o.order_number, o.title AS order_title, c.name AS customer_name,
      COUNT(p.id) AS part_rows,
      COALESCE(SUM(p.quantity), 0) AS part_count,
      COALESCE(SUM(p.length * p.width * p.quantity / 1000000.0), 0) AS area_m2
    FROM cut_jobs j
    LEFT JOIN orders o ON o.id = j.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN cut_parts p ON p.cut_job_id = j.id
    GROUP BY j.id
    ORDER BY j.created_at DESC, j.id DESC
  `).all());
});

app.post("/api/cut-jobs", (request, response) => {
  const payload = normalizeCutJob(request.body);
  const result = db.prepare(`
    INSERT INTO cut_jobs (order_id, name, material_id, material_code, material_name, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(payload.order_id, payload.name, payload.material_id, payload.material_code, payload.material_name, payload.status, payload.notes);
  response.status(201).json(db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/cut-jobs/:id", (request, response) => {
  const id = Number(request.params.id);
  const payload = normalizeCutJob(request.body);
  db.prepare(`
    UPDATE cut_jobs
    SET order_id = ?, name = ?, material_id = ?, material_code = ?, material_name = ?, status = ?, notes = ?
    WHERE id = ?
  `).run(payload.order_id, payload.name, payload.material_id, payload.material_code, payload.material_name, payload.status, payload.notes, id);
  response.json(db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(id));
});

app.delete("/api/cut-jobs/:id", (request, response) => {
  db.prepare("DELETE FROM cut_jobs WHERE id = ?").run(Number(request.params.id));
  response.status(204).end();
});

app.get("/api/cut-jobs/:id/parts", (request, response) => {
  response.json(db.prepare("SELECT * FROM cut_parts WHERE cut_job_id = ? ORDER BY sort_order, id").all(Number(request.params.id)));
});

app.post("/api/cut-jobs/:id/parts", (request, response) => {
  const jobId = Number(request.params.id);
  if (!db.prepare("SELECT id FROM cut_jobs WHERE id = ?").get(jobId)) return response.status(404).json({ error: "Cut job not found" });
  const payload = normalizeCutPart(request.body);
  const nextSort = db.prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort FROM cut_parts WHERE cut_job_id = ?").get(jobId).next_sort;
  const result = db.prepare(`
    INSERT INTO cut_parts (cut_job_id, material_id, material_code, material_name, thickness, length, width, quantity, texture, name, edge_top, edge_bottom, edge_left, edge_right, work_milling, work_drilling, work_lacquer, work_other, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(jobId, payload.material_id, payload.material_code, payload.material_name, payload.thickness, payload.length, payload.width, payload.quantity, payload.texture, payload.name, payload.edge_top, payload.edge_bottom, payload.edge_left, payload.edge_right, payload.work_milling, payload.work_drilling, payload.work_lacquer, payload.work_other, payload.description, nextSort);
  response.status(201).json(db.prepare("SELECT * FROM cut_parts WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/cut-parts/:id", (request, response) => {
  const id = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM cut_parts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Cut part not found" });
  const payload = normalizeCutPart({ ...existing, ...request.body });
  db.prepare(`
    UPDATE cut_parts
    SET material_id = ?, material_code = ?, material_name = ?, thickness = ?, length = ?, width = ?, quantity = ?, texture = ?, name = ?,
      edge_top = ?, edge_bottom = ?, edge_left = ?, edge_right = ?, work_milling = ?, work_drilling = ?, work_lacquer = ?, work_other = ?, description = ?
    WHERE id = ?
  `).run(
    payload.material_id,
    payload.material_code,
    payload.material_name,
    payload.thickness,
    payload.length,
    payload.width,
    payload.quantity,
    payload.texture,
    payload.name,
    payload.edge_top,
    payload.edge_bottom,
    payload.edge_left,
    payload.edge_right,
    payload.work_milling,
    payload.work_drilling,
    payload.work_lacquer,
    payload.work_other,
    payload.description,
    id
  );
  response.json(db.prepare("SELECT * FROM cut_parts WHERE id = ?").get(id));
});

app.delete("/api/cut-parts/:id", (request, response) => {
  db.prepare("DELETE FROM cut_parts WHERE id = ?").run(Number(request.params.id));
  response.status(204).end();
});

app.post("/api/cut-jobs/:id/import-excel", upload.single("formatki"), (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  if (!request.file?.buffer) return response.status(400).json({ error: "Missing Excel file" });
  const workbook = XLSX.read(request.file.buffer, { type: "buffer", cellDates: false });
  const sheetName = findExcelSheetName(workbook, ["detale", "detali", "детали"]) || workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: true });
  const parts = rows.map((row) => normalizeCutPart(row)).filter((part) => part.length && part.width && part.quantity);
  runInTransaction(() => {
    db.prepare("DELETE FROM cut_parts WHERE cut_job_id = ?").run(jobId);
    const insert = db.prepare(`
      INSERT INTO cut_parts (cut_job_id, material_id, material_code, material_name, thickness, length, width, quantity, texture, name, edge_top, edge_bottom, edge_left, edge_right, work_milling, work_drilling, work_lacquer, work_other, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    parts.forEach((part, index) => insert.run(jobId, part.material_id, part.material_code, part.material_name, part.thickness, part.length, part.width, part.quantity, part.texture, part.name, part.edge_top, part.edge_bottom, part.edge_left, part.edge_right, part.work_milling, part.work_drilling, part.work_lacquer, part.work_other, part.description, index + 1));
    db.prepare("UPDATE cut_jobs SET source_file = ?, status = ? WHERE id = ?").run(request.file.originalname || "", "Zaimportowane formatki", jobId);
  });
  response.json({ imported: parts.length, sheet: sheetName });
});

app.post("/api/ocr/cut-text", upload.single("photo"), async (request, response) => {
  try {
    if (!request.file?.buffer) return response.status(400).json({ error: "Missing photo" });
    const worker = await createWorker("pol+eng");
    const result = await worker.recognize(request.file.buffer);
    await worker.terminate();
    response.json({ text: normalizeOcrText(result.data.text || "") });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Nie udało się odczytać tekstu ze zdjęcia" });
  }
});

app.post("/api/cut-jobs/:id/export-excel", (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare(`
    SELECT j.*, o.order_number, o.title AS order_title, c.name AS customer_name, c.phone AS customer_phone
    FROM cut_jobs j
    LEFT JOIN orders o ON o.id = j.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE j.id = ?
  `).get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  const parts = db.prepare("SELECT * FROM cut_parts WHERE cut_job_id = ? ORDER BY sort_order, id").all(jobId);
  const target = exportCutJobExcel(job, parts, request.body?.target);
  db.prepare("UPDATE cut_jobs SET export_path = ?, status = ? WHERE id = ?").run(target, "Wyeksportowane do GibLab", jobId);
  response.json({ exported: parts.length, target });
});

app.post("/api/cut-jobs/:id/open-export-folder", (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT export_path FROM cut_jobs WHERE id = ?").get(jobId);
  const target = job?.export_path || path.join("C:\\GibLabLocal\\projects\\warehouse-formatki", "formatki.xls");
  const folder = path.dirname(target);
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  if (process.platform === "win32") {
    const args = existsSync(target) ? [`/select,${target}`] : [folder];
    spawn("explorer.exe", args, { detached: true, stdio: "ignore" }).unref();
  }
  response.json({ folder, target: existsSync(target) ? target : "" });
});

app.get("/api/cut-jobs/:id/quote-lines", (request, response) => {
  response.json(db.prepare("SELECT * FROM quote_lines WHERE cut_job_id = ? ORDER BY id").all(Number(request.params.id)));
});

app.post("/api/cut-jobs/:id/quote", (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  if (!job.order_id) return response.status(400).json({ error: "Cut job is not linked to an order" });
  const totals = getCutJobTotals(jobId);
  const quoteRows = buildCutQuoteLines(job, totals, normalizeCutQuotePrices(request.body));
  const insert = db.prepare(`
    INSERT INTO quote_lines (order_id, cut_job_id, description, unit, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  runInTransaction(() => {
    db.prepare("DELETE FROM quote_lines WHERE cut_job_id = ?").run(jobId);
    quoteRows.forEach((row) => {
      insert.run(job.order_id, jobId, row.description, row.unit, row.quantity, row.unit_price, row.line_total);
    });
    updateOrderTotalFromQuote(job.order_id);
  });
  const lines = db.prepare("SELECT * FROM quote_lines WHERE cut_job_id = ? ORDER BY id").all(jobId);
  response.json({ ...totals, lines, order: selectOrder.get(job.order_id) });
});

app.post("/api/cut-jobs/:id/import-project", upload.single("project"), (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  const xml = request.file?.buffer.toString("utf8") || String(request.body.xml || "");
  if (!xml.trim()) return response.status(400).json({ error: "Missing project XML" });
  const name = request.file?.originalname || request.body.name || `${job.name}.project`;
  try {
    const report = importProject(xml, name);
    db.prepare("UPDATE cut_jobs SET project_path = ?, status = ? WHERE id = ?").run(name, "Wynik z GibLab zaimportowany", jobId);
    if (job.order_id) db.prepare("UPDATE orders SET project_path = ?, production_status = ? WHERE id = ?").run(name, "Po rozkroju", job.order_id);
    response.json(report);
  } catch (error) {
    if (sendStockMovementError(response, error)) return;
    throw error;
  }
});

app.post("/api/project/import", upload.single("project"), (request, response) => {
  const xml = request.file?.buffer.toString("utf8") || String(request.body.xml || "");
  if (!xml.trim()) return response.status(400).json({ error: "Missing project XML" });
  try {
    const report = importProject(xml, request.file?.originalname || request.body.name || "");
    response.json(report);
  } catch (error) {
    if (sendStockMovementError(response, error)) return;
    throw error;
  }
});

app.post("/api/project/import-latest", (request, response) => {
  const projectsDir = String(request.body?.dir || "C:\\GibLabLocal\\projects");
  const latest = readdirSync(projectsDir)
    .filter((name) => name.toLowerCase().endsWith(".project"))
    .map((name) => {
      const fullPath = path.join(projectsDir, name);
      const stats = statSync(fullPath);
      return { name, fullPath, mtimeMs: stats.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  if (!latest) return response.status(404).json({ error: "No .project files found" });
  const xml = readFileSync(latest.fullPath, "utf8");
  try {
    const report = importProject(xml, latest.name, latest.fullPath);
    response.json({ ...report, path: latest.fullPath });
  } catch (error) {
    if (sendStockMovementError(response, error)) return;
    throw error;
  }
});

app.get("/api/integration/remainder-logs", (request, response) => {
  response.json(db.prepare("SELECT * FROM integration_logs ORDER BY created_at DESC, id DESC LIMIT 50").all());
});

app.get("/giblab/remainders", (request, response) => {
  handleGibLabRemainders(request, response, String(request.query.type || request.header("type") || "load").toLowerCase(), "");
});

app.post("/giblab/remainders", (request, response) => {
  handleGibLabRemainders(request, response, String(request.header("type") || request.query.type || "").toLowerCase(), String(request.body || ""));
});

function handleGibLabRemainders(request, response, type, body) {
  if (type === "load") {
    const code = String(request.header("code") || "");
    const rows = db.prepare(`
      SELECT * FROM offcuts
      WHERE status = 'available' AND (? = '' OR code = ?)
      ORDER BY created_at DESC
    `).all(code, code);
    const text = rows.map((row) => [row.id, row.length, row.width, row.quantity, row.project_name].filter((value) => value !== "").join(",")).join("\n");
    logIntegration("giblab", "load", request.headers, body, { rows: rows.length });
    return response.type("text/plain; charset=utf-8").send(text);
  }
  if (type === "save" || type === "report") {
    const result = importRemaindersReport(body, request.headers);
    logIntegration("giblab", type, request.headers, body, result);
    return response.type("text/plain; charset=utf-8").send(`OK ${result.saved}`);
  }
  response.status(400).type("text/plain; charset=utf-8").send("Unknown type header");
}

app.listen(port, host, () => {
  const visibleHost = host === "0.0.0.0" ? "localhost" : host;
  console.log(`Magazyn materiałów GibLab działa: http://${visibleHost}:${port}`);
  console.log(`Baza danych: ${dbPath}`);
});

function normalizeMaterial(input) {
  return {
    id: toNullableNumber(input.id),
    paren_id: toNullableNumber(input.paren_id ?? input.parent_id),
    isfolder: truthyNumber(input.isfolder),
    code: String(input.code || ""),
    name: String(input.name || "").trim() || "Bez nazwy",
    unit: String(input.unit || ""),
    price: toNullableNumber(input.price),
    thickness: toNullableNumber(input.thickness),
    length: toNullableNumber(input.length),
    width: toNullableNumber(input.width),
    ...normalizeMaterialCatalogFields(input)
  };
}

function materialValues(material) {
  return materialWriteColumns.map((column) => material[column] ?? null);
}

function materialUpdateValues(material) {
  return materialUpdateColumns.map((column) => material[column] ?? null);
}

function sendStockMovementError(response, error) {
  if (!(error instanceof StockMovementError)) return false;
  response.status(400).json({ error: error.message, details: error.details });
  return true;
}

function normalizeCustomer(input) {
  return {
    name: String(input.name || "").trim() || "Klient bez nazwy",
    phone: String(input.phone || ""),
    email: String(input.email || ""),
    address: String(input.address || ""),
    tax_id: String(input.tax_id || input.nip || ""),
    notes: String(input.notes || "")
  };
}

function normalizeOrder(input) {
  const rawOrderNumber = String(input.order_number || "").trim();
  return {
    order_number: rawOrderNumber === "Numer automatyczny" ? "" : rawOrderNumber,
    customer_id: toNullableNumber(input.customer_id),
    title: String(input.title || "").trim() || "Zamówienie",
    project_path: String(input.project_path || ""),
    order_date: String(input.order_date || new Date().toISOString().slice(0, 10)),
    due_date: String(input.due_date || ""),
    production_status: String(input.production_status || "Nowe"),
    payment_status: normalizePaymentStatus(input.payment_status || "Nie zapłacone"),
    payment_status_manual: truthyNumber(input.payment_status_manual),
    total_amount: Number(String(input.total_amount || 0).replace(",", ".")),
    notes: String(input.notes || "")
  };
}

function normalizePayment(input) {
  const amount = Number(String(input.amount || 0).replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Payment amount must be positive");
  return {
    amount,
    payment_date: String(input.payment_date || new Date().toISOString().slice(0, 10)),
    method: String(input.method || ""),
    payer_name: String(input.payer_name || ""),
    received_by: String(input.received_by || ""),
    note: String(input.note || "")
  };
}

function normalizePriceItem(input) {
  return {
    code: String(input.code || ""),
    name: String(input.name || "").trim() || "Pozycja cennika",
    unit: String(input.unit || "szt."),
    unit_price: Number(String(input.unit_price || 0).replace(",", ".")),
    category: String(input.category || ""),
    active: input.active === undefined ? 1 : truthyNumber(input.active)
  };
}

function normalizeSupply(input) {
  return {
    category: String(input.category || "Inne").trim() || "Inne",
    code: String(input.code || ""),
    name: String(input.name || "").trim() || "Pozycja",
    unit: String(input.unit || ""),
    price: Number(String(input.price || 0).replace(",", ".")),
    quantity: Number(String(input.quantity || 0).replace(",", ".")),
    notes: String(input.notes || ""),
    active: input.active === undefined ? 1 : truthyNumber(input.active)
  };
}

function normalizeQuoteLine(input) {
  const priceItemId = toNullableNumber(input.price_item_id);
  const item = priceItemId ? db.prepare("SELECT * FROM price_items WHERE id = ?").get(priceItemId) : null;
  const quantity = Number(String(input.quantity || 1).replace(",", "."));
  const unitPrice = Number(String(input.unit_price || item?.unit_price || 0).replace(",", "."));
  const description = String(input.description || item?.name || "Pozycja wyceny");
  const unit = String(input.unit || item?.unit || "szt.");
  return {
    price_item_id: priceItemId,
    description,
    unit,
    quantity,
    unit_price: unitPrice,
    line_total: quantity * unitPrice
  };
}

function normalizeCutJob(input) {
  const materialId = toNullableNumber(input.material_id);
  const material = materialId ? selectMaterial.get(materialId) : null;
  return {
    order_id: toNullableNumber(input.order_id),
    name: String(input.name || input.title || "").trim() || "Formatki",
    material_id: materialId,
    material_code: String(input.material_code || material?.code || ""),
    material_name: String(input.material_name || material?.name || ""),
    status: String(input.status || "Robocze"),
    notes: String(input.notes || "")
  };
}

function normalizeCutPart(input) {
  const materialId = toNullableNumber(pickValue(input, ["material_id", "materialId"]));
  const material = materialId ? selectMaterial.get(materialId) : null;
  const materialName = pickValue(input, ["material_name", "material", "Material", "materiał", "Материал", "A"]);
  const length = toMoneyNumber(pickValue(input, ["length", "dlugosc", "długość", "Długość", "dugo", "Длина", "B"]));
  const width = toMoneyNumber(pickValue(input, ["width", "szerokosc", "szerokość", "Szerokość", "szeroko", "Ширина", "C"]));
  const quantity = toMoneyNumber(pickValue(input, ["quantity", "ilosc", "ilość", "Ilość", "ilo", "Количество", "D"])) || 1;
  const workMilling = pickValue(input, ["work_milling", "frez", "frezowanie"]);
  const workDrilling = pickValue(input, ["work_drilling", "wierc", "wiercenie"]);
  const workLacquer = pickValue(input, ["work_lacquer", "lakier", "lakierowanie"]);
  const workOther = pickValue(input, ["work_other", "inne", "inna_praca"]);
  return {
    material_id: materialId,
    material_code: String(pickValue(input, ["material_code", "code", "Kod"]) || material?.code || ""),
    material_name: String(materialName || material?.name || ""),
    thickness: toMoneyNumber(pickValue(input, ["thickness", "grubosc", "grubość", "Grubość"])) || material?.thickness || null,
    length,
    width,
    quantity,
    texture: truthyNumber(pickValue(input, ["texture", "tekstura", "Tekstura", "Текстура", "E"])) ? 1 : 0,
    name: String(pickValue(input, ["name", "nazwa", "Nazwa", "Наименование", "F"]) || ""),
    edge_top: normalizeEdgeValue(pickValue(input, ["edge_top", "ob", "OB", "G"])),
    edge_bottom: normalizeEdgeValue(pickValue(input, ["edge_bottom", "oh", "OH", "H"])),
    edge_left: normalizeEdgeValue(pickValue(input, ["edge_left", "ol", "OL", "I"])),
    edge_right: normalizeEdgeValue(pickValue(input, ["edge_right", "op", "OP", "J"])),
    work_milling: truthyNumber(workMilling),
    work_drilling: truthyNumber(workDrilling),
    work_lacquer: truthyNumber(workLacquer),
    work_other: truthyNumber(workOther),
    description: String(pickValue(input, ["description", "opis", "Opis", "Описание", "K"]) || "")
  };
}

function normalizeEdgeValue(value) {
  if (value === true) return "1";
  if (value === false || value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text || text === "0" || text.toLowerCase() === "false" || text.toLowerCase() === "nie") return "";
  return text;
}

function normalizeOcrText(text) {
  return String(text || "")
    .replace(/[×]/g, "x")
    .replace(/[|]/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function pickValue(input, keys) {
  for (const key of keys) {
    if (input?.[key] !== undefined && input[key] !== null && input[key] !== "") return input[key];
  }
  const wanted = new Set(keys.map(normalizeLooseKey));
  for (const [key, value] of Object.entries(input || {})) {
    if (wanted.has(normalizeLooseKey(key)) && value !== null && value !== undefined && value !== "") return value;
  }
  return "";
}

function normalizeLooseKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\?/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function findExcelSheetName(workbook, names) {
  const lowerNames = names.map((name) => name.toLowerCase());
  return workbook.SheetNames.find((sheetName) => lowerNames.includes(sheetName.toLowerCase()));
}

function getCutJobTotals(jobId) {
  const rows = db.prepare("SELECT * FROM cut_parts WHERE cut_job_id = ?").all(jobId);
  return rows.reduce((totals, part) => {
    const quantity = Number(part.quantity || 0);
    const length = Number(part.length || 0);
    const width = Number(part.width || 0);
    totals.part_count += quantity;
    totals.area_m2 += length * width * quantity / 1000000;
    if (part.edge_top) totals.edge_mb += length * quantity / 1000;
    if (part.edge_bottom) totals.edge_mb += length * quantity / 1000;
    if (part.edge_left) totals.edge_mb += width * quantity / 1000;
    if (part.edge_right) totals.edge_mb += width * quantity / 1000;
    if (part.work_milling) totals.milling_count += quantity;
    if (part.work_drilling) totals.drilling_count += quantity;
    if (part.work_lacquer) totals.lacquer_m2 += length * width * quantity / 1000000;
    if (part.work_other) totals.other_count += quantity;
    return totals;
  }, { part_count: 0, area_m2: 0, edge_mb: 0, milling_count: 0, drilling_count: 0, lacquer_m2: 0, other_count: 0 });
}

function exportCutJobExcel(job, parts, target) {
  const dir = path.dirname(target || path.join("C:\\GibLabLocal\\projects\\warehouse-formatki", "placeholder.xls"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const safeName = safeFileName(`${job.order_number || "bez-zamowienia"}-${job.name || "formatki"}`);
  const targetPath = target || path.join(dir, `${safeName}.xls`);
  const detailsRows = [
    ["Материал", "Длина", "Ширина", "Количество", "Текстура", "Наименование", "OB", "OH", "OL", "OP", "Описание"],
    ...parts.map((part) => [
      part.material_name || job.material_name || "",
      part.length,
      part.width,
      part.quantity,
      part.texture ? 1 : 0,
      part.name || "",
      part.edge_top || "",
      part.edge_bottom || "",
      part.edge_left || "",
      part.edge_right || "",
      part.description || ""
    ])
  ];
  const materials = new Map();
  parts.forEach((part, index) => {
    const name = part.material_name || job.material_name || "";
    if (!name || materials.has(name)) return;
    const materialRow = part.material_id ? db.prepare("SELECT length, width, thickness FROM materials WHERE id = ?").get(part.material_id) : null;
    materials.set(name, {
      code: part.material_code || job.material_code || `MAT-${index + 1}`,
      name,
      length: materialRow?.length || "",
      width: materialRow?.width || "",
      thickness: part.thickness || materialRow?.thickness || "",
      price: ""
    });
  });
  const materialsRows = [
    ["", "Код", "Наименование", "Длина", "Ширина", "Толщина", "Цена"],
    ...[...materials.values()].map((material) => [
      "",
      material.code,
      material.name,
      material.length,
      material.width,
      material.thickness,
      material.price
    ])
  ];
  const simpleOperationsRows = [
    ["", "Изделие", "Код", "Наименование", "Описание", "Стоимость операции", "Код компонента", "Наименование компонента", "Единица измерения", "Цена", "Количество"]
  ];
  const productRows = [
    ["", "Код", "Наименование", "Количество", "Описание", "Телефон 1", "Телефон 2", "Дата"],
    [
      "",
      job.order_number || `JOB-${job.id}`,
      job.order_title || job.name,
      1,
      [job.customer_name, job.customer_phone].filter(Boolean).join(" / "),
      job.customer_phone || "",
      "",
      ""
    ]
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(detailsRows), "детали");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(materialsRows), "материалы");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(simpleOperationsRows), "простые операции");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(productRows), "изделия");
  writeFileSync(targetPath, XLSX.write(workbook, { type: "buffer", bookType: "biff8" }));
  return targetPath;
}

function safeFileName(value) {
  return String(value || "plik").replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 120);
}

function normalizeOffcut(input) {
  const length = Number(input.length || 0);
  const width = Number(input.width || 0);
  if (!length || !width) throw new Error("Offcut needs length and width");
  return {
    id: String(input.id || `${Date.now()}`),
    material_id: toNullableNumber(input.material_id),
    code: String(input.code || ""),
    length,
    width,
    quantity: Number(input.quantity || 1),
    is_business: truthyNumber(input.is_business),
    project_name: String(input.project_name || ""),
    project_path: String(input.project_path || ""),
    status: String(input.status || "available")
  };
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function toMoneyNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function truthyNumber(value) {
  return value === true || value === "true" || value === "1" || value === 1 ? 1 : 0;
}

function runInTransaction(callback) {
  db.exec("BEGIN");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function nextMaterialId(isfolder) {
  const minimum = isfolder ? 1 : 1001;
  const row = db.prepare("SELECT MAX(id) AS max_id FROM materials WHERE id >= ?").get(minimum);
  return Math.max(minimum, Number(row.max_id || minimum - 1) + 1);
}

function readCatalogImportRows(buffer, filename = "") {
  if (String(filename).toLowerCase().endsWith(".csv")) return parseCsvRows(buffer.toString("utf8"));
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
}

function parseCsvRows(text) {
  const cleanText = String(text || "").replace(/^\uFEFF/, "");
  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return [];
  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function detectCsvDelimiter(headerLine) {
  const candidates = [";", "\t", ","];
  return candidates
    .map((delimiter) => [delimiter, parseCsvLine(headerLine, delimiter).length])
    .sort((a, b) => b[1] - a[1])[0][0];
}

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function importGoodsRows(rows) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO materials (${[...materialWriteColumns, "sort_order"].join(", ")})
    VALUES (${[...materialWriteColumns, "sort_order"].map(() => "?").join(", ")})
  `);
  const ensureStock = db.prepare("INSERT OR IGNORE INTO stock (material_id) VALUES (?)");
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM materials").run();
    rows.forEach((row, index) => {
      const material = normalizeMaterial({
        id: row.id ?? row.ID,
        paren_id: row.paren_id ?? row.parent_id ?? row["paren id"],
        isfolder: row.isfolder ?? row.isFolder,
        code: row.code,
        name: row.name,
        unit: row.unit,
        price: row.price,
        thickness: row.thickness ?? row["???????"],
        length: row.length ?? row["?????"],
        width: row.width ?? row["??????"],
        producer: row.producer,
        decor_code: row.decor_code ?? row.decorCode,
        decor_name: row.decor_name ?? row.decorName,
        structure: row.structure,
        material_type: row.material_type ?? row.materialType,
        supplier: row.supplier,
        location: row.location,
        min_stock: row.min_stock ?? row.minStock,
        is_active: row.is_active ?? row.isActive
      });
      if (material.id === null) return;
      insert.run(...materialValues(material), index);
      ensureStock.run(material.id);
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function toGoodsRow(row) {
  return {
    id: row.id,
    paren_id: row.paren_id ?? "",
    isfolder: row.isfolder,
    code: row.code,
    name: row.name,
    unit: row.unit,
    price: row.price ?? "",
    thickness: row.thickness ?? row["???????"],
    length: row.length ?? row["?????"],
    width: row.width ?? row["??????"],
    producer: row.producer ?? "",
    decor_code: row.decor_code ?? "",
    decor_name: row.decor_name ?? "",
    structure: row.structure ?? "",
    material_type: row.material_type ?? "",
    supplier: row.supplier ?? "",
    location: row.location ?? "",
    min_stock: row.min_stock ?? 0,
    is_active: row.is_active ?? 1
  };
}

function writeGoodsFile(target) {
  const rows = selectMaterials.all().map(toGoodsRow);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...materialWriteColumns] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "goods");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "biff8" });
  writeFileSync(target, buffer);
  return rows;
}

function ensureRoot(name) {
  const existing = db.prepare("SELECT id FROM materials WHERE paren_id IS NULL AND name = ? LIMIT 1").get(name)
    || db.prepare("SELECT id FROM materials WHERE id IN (0, 20000) AND name = ? LIMIT 1").get(name);
  if (existing) return existing.id;
  const id = name === "Materiał płytowy" ? 0 : 20000;
  db.prepare(`
    INSERT OR REPLACE INTO materials (id, paren_id, isfolder, code, name, sort_order)
    VALUES (?, NULL, 1, '', ?, ?)
  `).run(id, name, id);
  db.prepare("INSERT OR IGNORE INTO stock (material_id) VALUES (?)").run(id);
  return id;
}

function buildTree(rows) {
  const byId = new Map(rows.map((row) => [row.id, { ...row, children: [] }]));
  const roots = [];
  for (const row of byId.values()) {
    const parent = byId.get(row.paren_id);
    if (parent) parent.children.push(row);
    else roots.push(row);
  }
  return roots;
}

function importProject(xml, projectName, projectPath = projectName) {
  return runInTransaction(() => {
    const materials = [...xml.matchAll(/<material\b([^>]*)\/?>/g)].map((match) => parseAttributes(match[1]));
    const parts = [...xml.matchAll(/<part\b([^>]*)\/?>/g)].map((match) => parseAttributes(match[1]));
    const goods = [...xml.matchAll(/<good\b([^>]*)\/?>/g)].map((match) => parseAttributes(match[1]));
    const sheetGood = goods.find((good) => good.typeId === "sheet" && good.code);
    let usedCount = 0;
    let offcutCount = 0;

    for (const material of materials) {
      const code = material.code || "";
      const used = Number(material.usedCount || material.usedcount || 0);
      if (!code || !used) continue;
      const stockRow = db.prepare("SELECT id FROM materials WHERE code = ? LIMIT 1").get(code);
      if (!stockRow) continue;
      db.prepare("INSERT OR IGNORE INTO stock (material_id) VALUES (?)").run(stockRow.id);
      const current = db.prepare("SELECT * FROM stock WHERE material_id = ?").get(stockRow.id);
      assertCanUseStock(current, used, { materialCode: code, projectName });
      db.prepare("UPDATE stock SET quantity = quantity - ?, used = used + ? WHERE material_id = ?").run(used, used, stockRow.id);
      db.prepare("INSERT INTO stock_events (material_id, event_type, quantity, note) VALUES (?, 'use', ?, ?)").run(stockRow.id, used, `Import projektu ${projectName}`);
      usedCount += 1;
    }

    for (const part of parts) {
      const isWaste = part.waste === "true" || part.dblId || part.dblid || part.dbId || part.dbid;
      if (!isWaste) continue;
      const id = part.dblId || part.dblid || part.dbId || part.dbid || `${projectName}:${part.id}`;
      const length = Number(part.l || part.length || 0);
      const width = Number(part.w || part.width || 0);
      if (!length || !width) continue;
      db.prepare(`
        INSERT OR REPLACE INTO offcuts (id, code, length, width, quantity, is_business, project_name, project_path, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')
      `).run(id, sheetGood?.code || "", length, width, Number(part.count || 1), truthyNumber(part.business), projectName, projectPath);
      offcutCount += 1;
    }

    return { projectName, materialUsageRows: usedCount, offcuts: offcutCount };
  });
}

function importRemaindersReport(text, headers) {
  const code = String(headers.code || "");
  const projectNameHeader = String(headers["project.name"] || headers.projectname || "");
  const insert = db.prepare(`
    INSERT OR REPLACE INTO offcuts (id, material_id, code, length, width, quantity, is_business, project_name, project_path, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
  `);
  let saved = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split(",").map((part) => part.trim());
    if (parts.length >= 9) {
      const [projectOffcutId, externalId, isSheetOrOffcut, isBusiness, length, width, initialQuantity, usedQuantity, ...projectParts] = parts;
      const quantity = Math.max(0, Number(initialQuantity || 0) - Number(usedQuantity || 0));
      if (!quantity) continue;
      insert.run(
        externalId || projectOffcutId,
        null,
        code,
        Number(length || 0),
        Number(width || 0),
        quantity,
        truthyNumber(isBusiness),
        projectParts[0] || projectNameHeader,
        projectParts.slice(1).join(","),
      );
      saved += 1;
    } else if (parts.length >= 4) {
      const [id, length, width, quantity, comment = ""] = parts;
      insert.run(id, null, code, Number(length || 0), Number(width || 0), Number(quantity || 1), 0, comment || projectNameHeader, "");
      saved += 1;
    }
  }
  return { saved };
}

function logIntegration(source, eventType, headers, body, result) {
  db.prepare(`
    INSERT INTO integration_logs (source, event_type, headers_json, body, result_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(source, eventType, JSON.stringify(headers || {}), body || "", JSON.stringify(result || {}));
}

function polishMaterialName(name) {
  let value = String(name || "");
  const exact = new Map([
    ["Листовой материал", "Materiał płytowy"],
    ["Кромочные материалы", "Okleiny"],
    ["Кроно Украина", "Kronospan"],
    ["SWISSPAN Украина", "Swiss Krono"],
    ["ДСП", "Płyta wiórowa"],
    ["ДВП", "Płyta pilśniowa"],
    ["МДФ", "MDF"],
    ["Столешницы", "Blaty"],
    ["Rehau", "Rehau"],
    ["Egger", "Egger"],
    ["PFLEIDERER", "Pfleiderer"]
  ]);
  if (exact.has(value)) return exact.get(value);
  const replacements = [
    [/ЛДСП/gi, "Płyta laminowana"],
    [/ДСП/gi, "Płyta wiórowa"],
    [/ДВП/gi, "Płyta pilśniowa"],
    [/МДФ/gi, "MDF"],
    [/Кромка ABS/gi, "Obrzeże ABS"],
    [/Кромка/gi, "Obrzeże"],
    [/Украина/gi, "Ukraina"],
    [/Ваниль/gi, "Wanilia"],
    [/Яблоня Локарно/gi, "Jabłoń Locarno"],
    [/Яблоня/gi, "Jabłoń"],
    [/Бук Бавария/gi, "Buk Bawaria"],
    [/Бук/gi, "Buk"],
    [/Орех итальянский/gi, "Orzech włoski"],
    [/Орех темный/gi, "Orzech ciemny"],
    [/Орех/gi, "Orzech"],
    [/Вишня Оксфорд/gi, "Wiśnia Oxford"],
    [/Вишня/gi, "Wiśnia"],
    [/Дуб молочн\.?\s*роз\.?/gi, "Dąb mleczny różowy"],
    [/Дуб молочный розовый/gi, "Dąb mleczny różowy"],
    [/Дуб молочный/gi, "Dąb mleczny"],
    [/Дуб светлый/gi, "Dąb jasny"],
    [/Дуб ясный/gi, "Dąb jasny"],
    [/Дуб/gi, "Dąb"],
    [/Ольха горная/gi, "Olcha górska"],
    [/Ольха Горская/gi, "Olcha górska"],
    [/Ольха/gi, "Olcha"],
    [/Красное дерево/gi, "Mahoń"],
    [/Белый гладкий/gi, "Biały gładki"],
    [/Белый/gi, "Biały"],
    [/Черный/gi, "Czarny"],
    [/Черная/gi, "Czarna"],
    [/Серый/gi, "Szary"],
    [/Клен ванкувер светлый/gi, "Klon Vancouver jasny"],
    [/Клен Ванкувер светлый/gi, "Klon Vancouver jasny"],
    [/Клен Ванкувер/gi, "Klon Vancouver"],
    [/Клен/gi, "Klon"],
    [/Алюминий/gi, "Aluminium"],
    [/Венге/gi, "Wenge"],
    [/шоколадная/gi, "czekoladowa"],
    [/светлый/gi, "jasny"],
    [/темный/gi, "ciemny"],
    [/матовая/gi, "matowa"],
    [/глянец/gi, "połysk"],
    [/ДСП -/gi, "Płyta wiórowa -"]
  ];
  for (const [pattern, replacement] of replacements) value = value.replace(pattern, replacement);
  value = value.replace(/ĐĽĐĽ/gi, "mm").replace(/Ń…/gi, "x");
  return value.replace(/\s+/g, " ").trim();
}

function polishFolderCode(name, row, byId) {
  if (row.id === 0 || row.id === 20000) return "";
  if (row.code) return row.code;
  const producerCodes = new Map([
    ["Krono Ukraina", "KR"],
    ["Kronospan", "KS"],
    ["Swiss Krono", "SK"],
    ["SWISSPAN Ukraina", "SW"],
    ["Egger", "EG"],
    ["Pfleiderer", "PF"],
    ["Rehau", "RH"]
  ]);
  if (producerCodes.has(name)) return producerCodes.get(name);
  const parent = byId.get(row.paren_id);
  if (parent && (parent.id === 0 || parent.id === 20000)) return codeSlug(name).slice(0, 4);
  return "";
}

function polishMaterialCode(row, byId) {
  const producer = findProducer(row, byId);
  const producerName = polishMaterialName(producer?.name || "");
  const prefix = producer?.code || polishFolderCode(producerName, producer || {}, byId) || codeSlug(producerName || "MAT").slice(0, 4);
  const type = materialTypeCode(polishMaterialName(row.name));
  const thickness = row.thickness ? `${cleanNumber(row.thickness)}` : "XX";
  const size = row.length && row.width ? `${cleanNumber(row.length)}X${cleanNumber(row.width)}` : "ROL";
  const suffix = String(row.id).padStart(4, "0");
  return `${prefix}-${type}-${thickness}-${size}-${suffix}`;
}

function findProducer(row, byId) {
  let current = byId.get(row.paren_id);
  let previous = null;
  while (current) {
    if (current.paren_id === 0 || current.paren_id === 20000 || current.paren_id === null || current.paren_id === undefined) return current;
    previous = current;
    current = byId.get(current.paren_id);
  }
  return previous;
}

function materialTypeCode(name) {
  const value = String(name || "").toLowerCase();
  if (value.includes("obrze?e")) return "OB";
  if (value.includes("mdf")) return "MDF";
  if (value.includes("pilśni")) return "HDF";
  if (value.includes("blat")) return "BL";
  if (value.includes("laminowana")) return "PL";
  if (value.includes("wi?rowa")) return "PW";
  return "MAT";
}

function codeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

function cleanNumber(value) {
  return String(value).replace(/[,.\s]/g, "");
}

function polishUnit(unit) {
  return String(unit || "")
    .replace(/ĐĽ2/gi, "m2")
    .replace(/ĐĽ/gi, "m");
}

function normalizePaymentStatus(value) {
  const raw = String(value || "").trim();
  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (normalized === "nie zaplacone" || normalized === "niezaplacone" || normalized === "unpaid") return "Nie zapłacone";
  if (normalized === "zaliczka" || normalized === "deposit") return "Zaliczka";
  if (normalized === "oplacone" || normalized === "paid") return "Opłacone";
  if (normalized === "po terminie" || normalized === "overdue") return "Po terminie";
  return raw;
}

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function normalizeExistingTextValues() {
  const fixes = [
    ["orders", "payment_status", "Nie zapłacone", ["Nie zap\u0139\u201aacone", "Nie zap?acone", "Nie zaplacone"]],
    ["orders", "payment_status", "Opłacone", ["Op\u0139\u201aacone", "Op?acone", "Oplacone"]],
    ["orders", "production_status", "Zamknięte", ["Zamkni\u00c4\u2122te", "Zamkniete"]],
    ["payments", "method", "Gotówka", ["Got\u0102\u0142wka", "Got?wka", "Gotowka"]]
  ];

  for (const [tableName, columnName, correctValue, badValues] of fixes) {
    const statement = db.prepare(`UPDATE ${tableName} SET ${columnName} = ? WHERE ${columnName} = ?`);
    for (const badValue of badValues) {
      statement.run(correctValue, badValue);
    }
  }
}

function seedDefaultPriceItems() {
  const existing = db.prepare("SELECT id FROM price_items WHERE code = ? AND active = 1 LIMIT 1");
  const insert = db.prepare(`
    INSERT INTO price_items (category, code, name, unit, unit_price)
    VALUES (?, ?, ?, ?, ?)
  `);
  const defaults = [
    ["Robocizna", "CUT", "Cięcie płyty", "szt.", 0],
    ["Robocizna", "EDGE", "Oklejanie krawędzi", "mb", 0]
  ];
  runInTransaction(() => {
    for (const row of defaults) {
      if (!existing.get(row[1])) insert.run(...row);
    }
  });
}

function nextOrderNumber() {
  const year = new Date().getFullYear();
  const prefix = `ZAM-${year}-`;
  const row = db.prepare("SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY order_number DESC LIMIT 1").get(`${prefix}%`);
  const next = row ? Number(row.order_number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function refreshPaymentStatus(orderId) {
  const existing = db.prepare("SELECT payment_status_manual FROM orders WHERE id = ?").get(orderId);
  if (existing?.payment_status_manual) return;
  const row = db.prepare(`
    SELECT o.total_amount AS total, COALESCE(SUM(p.amount), 0) AS paid
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.id = ?
    GROUP BY o.id
  `).get(orderId);
  if (!row) return;
  let status = "Nie zapłacone";
  if (row.paid > 0 && row.paid < row.total) status = "Zaliczka";
  if (row.total > 0 && row.paid >= row.total) status = "Opłacone";
  if (row.total === 0 && row.paid > 0) status = "Opłacone";
  db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?").run(status, orderId);
}

function updateOrderTotalFromQuote(orderId) {
  const row = db.prepare("SELECT COALESCE(SUM(line_total), 0) AS total FROM quote_lines WHERE order_id = ?").get(orderId);
  db.prepare("UPDATE orders SET total_amount = ? WHERE id = ?").run(Number(row?.total || 0), orderId);
  refreshPaymentStatus(orderId);
}

function buildReadyMessage(order, customer) {
  const greeting = customer?.name ? `Dzień dobry, ${customer.name}.` : "Dzień dobry.";
  const balance = Number(order.balance || 0);
  const paymentLine = balance > 0
    ? `Do zapłaty pozostało: ${balance.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł.`
    : "Płatność jest rozliczona.";
  return `${greeting} Zamówienie ${order.order_number} (${order.title}) jest gotowe do odbioru. ${paymentLine}`;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits.replace("+", "");
  if (digits.length === 9) return `48${digits}`;
  return digits;
}

function parseAttributes(source) {
  const attrs = {};
  for (const match of source.matchAll(/([\w:-]+)=["']([^"']*)["']/g)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

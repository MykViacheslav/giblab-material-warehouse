import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { normalizeDelivery, normalizeDeliveryLine, postDeliveryToDatabase } from "../src/deliveryLogic.js";

test("delivery normalizer creates draft with date", () => {
  const delivery = normalizeDelivery({ supplier: " EGGER ", document_number: " WZ-1 " });
  assert.equal(delivery.supplier, "EGGER");
  assert.equal(delivery.document_number, "WZ-1");
  assert.equal(delivery.status, "draft");
  assert.match(delivery.delivery_date, /^\d{4}-\d{2}-\d{2}$/);
});

test("delivery line normalizer parses positive quantity and price", () => {
  const line = normalizeDeliveryLine({ material_id: "1001", quantity: "2,5", unit_price: "1 234,56" });
  assert.equal(line.material_id, 1001);
  assert.equal(line.quantity, 2.5);
  assert.equal(line.unit_price, 1234.56);
});

test("draft delivery does not change stock before posting", () => {
  const db = createDeliveryDb();
  seedDelivery(db);
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  const events = db.prepare("SELECT COUNT(*) AS count FROM stock_events").get();
  assert.equal(stock.quantity, 3);
  assert.equal(events.count, 0);
});

test("posting delivery increases stock and creates stock history", () => {
  const db = createDeliveryDb();
  seedDelivery(db);
  const posted = postDeliveryToDatabase(db, 1);
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  const event = db.prepare("SELECT * FROM stock_events WHERE material_id = 1001").get();
  assert.equal(posted.status, "posted");
  assert.equal(stock.quantity, 8);
  assert.equal(event.event_type, "receive");
  assert.equal(event.quantity, 5);
  assert.match(event.note, /WZ-1/);
});

test("posting delivery without lines is rejected", () => {
  const db = createDeliveryDb();
  db.prepare("INSERT INTO deliveries (id, supplier, document_number, status) VALUES (1, 'EGGER', 'WZ-1', 'draft')").run();
  assert.throws(() => postDeliveryToDatabase(db, 1), /no lines/);
});

test("posting delivery twice is rejected", () => {
  const db = createDeliveryDb();
  seedDelivery(db);
  postDeliveryToDatabase(db, 1);
  assert.throws(() => postDeliveryToDatabase(db, 1), /already posted/);
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  assert.equal(stock.quantity, 8);
});

function createDeliveryDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE materials (
      id INTEGER PRIMARY KEY,
      code TEXT DEFAULT '',
      name TEXT NOT NULL
    );
    CREATE TABLE stock (
      material_id INTEGER PRIMARY KEY,
      quantity REAL NOT NULL DEFAULT 0,
      reserved REAL NOT NULL DEFAULT 0,
      used REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE stock_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER,
      event_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT DEFAULT '',
      document_number TEXT DEFAULT '',
      delivery_date TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT DEFAULT '',
      posted_at TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE delivery_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      material_code TEXT DEFAULT '',
      material_name TEXT DEFAULT '',
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

function seedDelivery(db) {
  db.prepare("INSERT INTO materials (id, code, name) VALUES (1001, 'EG-U216', 'Kaszmir')").run();
  db.prepare("INSERT INTO stock (material_id, quantity, reserved, used) VALUES (1001, 3, 0, 0)").run();
  db.prepare("INSERT INTO deliveries (id, supplier, document_number, status) VALUES (1, 'EGGER', 'WZ-1', 'draft')").run();
  db.prepare(`
    INSERT INTO delivery_lines (delivery_id, material_id, material_code, material_name, quantity, unit_price)
    VALUES (1, 1001, 'EG-U216', 'Kaszmir', 5, 120)
  `).run();
}

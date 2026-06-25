import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  normalizeDelivery,
  normalizeDeliveryCorrection,
  normalizeDeliveryCorrectionLine,
  normalizeDeliveryLine,
  postDeliveryCorrectionToDatabase,
  postDeliveryToDatabase
} from "../src/deliveryLogic.js";

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

test("delivery correction normalizers parse correction fields", () => {
  const correction = normalizeDeliveryCorrection({ correction_number: " KOR-1 ", reason: " wrong qty " });
  const line = normalizeDeliveryCorrectionLine({ material_id: "1001", quantity_delta: "-2,5", unit_price_net: "10,20" });
  assert.equal(correction.correction_number, "KOR-1");
  assert.equal(correction.reason, "wrong qty");
  assert.equal(line.quantity_delta, -2.5);
  assert.equal(line.line_total_net_delta, -25.5);
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

test("draft correction does not affect stock", () => {
  const db = createDeliveryDb();
  seedPostedDelivery(db);
  seedCorrection(db, { quantityDelta: -2 });
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  const events = db.prepare("SELECT COUNT(*) AS count FROM stock_events").get();
  assert.equal(stock.quantity, 8);
  assert.equal(events.count, 0);
});

test("posting positive correction receives stock and creates history", () => {
  const db = createDeliveryDb();
  seedPostedDelivery(db);
  seedCorrection(db, { quantityDelta: 2 });
  postDeliveryCorrectionToDatabase(db, 1);
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  const event = db.prepare("SELECT * FROM stock_events WHERE material_id = 1001").get();
  assert.equal(stock.quantity, 10);
  assert.equal(event.event_type, "receive");
  assert.equal(event.quantity, 2);
});

test("posting negative correction uses available stock and creates history", () => {
  const db = createDeliveryDb();
  seedPostedDelivery(db);
  seedCorrection(db, { quantityDelta: -3 });
  postDeliveryCorrectionToDatabase(db, 1);
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  const event = db.prepare("SELECT * FROM stock_events WHERE material_id = 1001").get();
  assert.equal(stock.quantity, 5);
  assert.equal(event.event_type, "use");
  assert.equal(event.quantity, 3);
});

test("negative correction cannot consume reserved stock", () => {
  const db = createDeliveryDb();
  seedPostedDelivery(db);
  db.prepare("UPDATE stock SET reserved = 7 WHERE material_id = 1001").run();
  seedCorrection(db, { quantityDelta: -2 });
  assert.throws(() => postDeliveryCorrectionToDatabase(db, 1), /available stock/i);
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  const correction = db.prepare("SELECT * FROM delivery_corrections WHERE id = 1").get();
  const events = db.prepare("SELECT COUNT(*) AS count FROM stock_events").get();
  assert.equal(stock.quantity, 8);
  assert.equal(stock.reserved, 7);
  assert.equal(correction.status, "draft");
  assert.equal(events.count, 0);
});

test("correction rollback is full when one line fails", () => {
  const db = createDeliveryDb();
  seedPostedDelivery(db);
  seedCorrection(db, { quantityDelta: 1 });
  db.prepare(`
    INSERT INTO delivery_correction_lines (correction_id, material_id, quantity_delta, unit_price_net, line_total_net_delta)
    VALUES (1, 1001, -99, 10, -990)
  `).run();
  assert.throws(() => postDeliveryCorrectionToDatabase(db, 1));
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  const events = db.prepare("SELECT COUNT(*) AS count FROM stock_events").get();
  assert.equal(stock.quantity, 8);
  assert.equal(events.count, 0);
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
    CREATE TABLE delivery_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_delivery_id INTEGER NOT NULL,
      correction_number TEXT DEFAULT '',
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      note TEXT DEFAULT '',
      total_net_delta REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      posted_at TEXT DEFAULT '',
      cancelled_at TEXT DEFAULT ''
    );
    CREATE TABLE delivery_correction_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      correction_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity_delta REAL NOT NULL,
      unit_price_net REAL DEFAULT 0,
      line_total_net_delta REAL DEFAULT 0,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

function seedPostedDelivery(db) {
  db.prepare("INSERT INTO materials (id, code, name) VALUES (1001, 'EG-U216', 'Kaszmir')").run();
  db.prepare("INSERT INTO stock (material_id, quantity, reserved, used) VALUES (1001, 8, 0, 0)").run();
  db.prepare("INSERT INTO deliveries (id, supplier, document_number, status) VALUES (1, 'EGGER', 'WZ-1', 'posted')").run();
}

function seedCorrection(db, { quantityDelta }) {
  db.prepare(`
    INSERT INTO delivery_corrections (id, original_delivery_id, correction_number, reason, status)
    VALUES (1, 1, 'KOR-1', 'test correction', 'draft')
  `).run();
  db.prepare(`
    INSERT INTO delivery_correction_lines (correction_id, material_id, quantity_delta, unit_price_net, line_total_net_delta)
    VALUES (1, 1001, ?, 10, ?)
  `).run(quantityDelta, quantityDelta * 10);
}

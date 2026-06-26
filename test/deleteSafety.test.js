import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { getCustomerDeleteBlockers, getMaterialDeleteBlockers, getOrderDeleteBlockers } from "../src/deleteSafety.js";

test("customer with orders cannot be safely deleted", () => {
  const db = createDeleteSafetyDb();
  db.prepare("INSERT INTO customers (id, name) VALUES (1, 'Marcin')").run();
  db.prepare("INSERT INTO orders (id, order_number, customer_id, title) VALUES (1, 'ZAM-1', 1, 'test')").run();
  const blockers = getCustomerDeleteBlockers(db, 1);
  assert.equal(blockers.length, 1);
  assert.equal(blockers[0].code, "orders");
});

test("order with payments quote lines or cut jobs cannot be safely deleted", () => {
  const db = createDeleteSafetyDb();
  db.prepare("INSERT INTO orders (id, order_number, title) VALUES (1, 'ZAM-1', 'test')").run();
  db.prepare("INSERT INTO payments (order_id, amount) VALUES (1, 10)").run();
  db.prepare("INSERT INTO quote_lines (order_id, description) VALUES (1, 'Cięcie')").run();
  db.prepare("INSERT INTO cut_jobs (order_id, name) VALUES (1, 'Pozycja 1')").run();
  const codes = getOrderDeleteBlockers(db, 1).map((blocker) => blocker.code);
  assert.deepEqual(codes, ["payments", "quote_lines", "cut_jobs"]);
});

test("material with stock history and linked production cannot be safely deleted", () => {
  const db = createDeleteSafetyDb();
  db.prepare("INSERT INTO materials (id, name) VALUES (1001, 'Kaszmir')").run();
  db.prepare("INSERT INTO stock (material_id, quantity, reserved, used) VALUES (1001, 2, 1, 0)").run();
  db.prepare("INSERT INTO stock_events (material_id, event_type, quantity) VALUES (1001, 'receive', 2)").run();
  db.prepare("INSERT INTO offcuts (id, material_id, length, width) VALUES ('R1', 1001, 100, 50)").run();
  db.prepare("INSERT INTO deliveries (id, status) VALUES (1, 'posted')").run();
  db.prepare("INSERT INTO delivery_lines (delivery_id, material_id, quantity) VALUES (1, 1001, 1)").run();
  db.prepare("INSERT INTO cut_jobs (id, material_id, name) VALUES (1, 1001, 'Pozycja 1')").run();
  db.prepare("INSERT INTO cut_parts (cut_job_id, material_id, length, width) VALUES (1, 1001, 100, 50)").run();
  const codes = getMaterialDeleteBlockers(db, 1001).map((blocker) => blocker.code);
  assert.ok(codes.includes("stock"));
  assert.ok(codes.includes("stock_events"));
  assert.ok(codes.includes("offcuts"));
  assert.ok(codes.includes("delivery_lines"));
  assert.ok(codes.includes("cut_jobs"));
  assert.ok(codes.includes("cut_parts"));
});

test("unused material has no delete blockers", () => {
  const db = createDeleteSafetyDb();
  db.prepare("INSERT INTO materials (id, name) VALUES (1001, 'Unused')").run();
  db.prepare("INSERT INTO stock (material_id, quantity, reserved, used) VALUES (1001, 0, 0, 0)").run();
  assert.deepEqual(getMaterialDeleteBlockers(db, 1001), []);
});

function createDeleteSafetyDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE materials (id INTEGER PRIMARY KEY, paren_id INTEGER, name TEXT NOT NULL);
    CREATE TABLE stock (material_id INTEGER PRIMARY KEY, quantity REAL DEFAULT 0, reserved REAL DEFAULT 0, used REAL DEFAULT 0);
    CREATE TABLE stock_events (id INTEGER PRIMARY KEY AUTOINCREMENT, material_id INTEGER, event_type TEXT, quantity REAL);
    CREATE TABLE offcuts (id TEXT PRIMARY KEY, material_id INTEGER, length REAL NOT NULL, width REAL NOT NULL);
    CREATE TABLE customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
    CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT, customer_id INTEGER, title TEXT NOT NULL);
    CREATE TABLE payments (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, amount REAL NOT NULL);
    CREATE TABLE quote_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, description TEXT NOT NULL);
    CREATE TABLE cut_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, material_id INTEGER, name TEXT NOT NULL);
    CREATE TABLE cut_parts (id INTEGER PRIMARY KEY AUTOINCREMENT, cut_job_id INTEGER, material_id INTEGER, length REAL NOT NULL, width REAL NOT NULL);
    CREATE TABLE deliveries (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT DEFAULT 'draft');
    CREATE TABLE delivery_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, delivery_id INTEGER, material_id INTEGER, quantity REAL NOT NULL);
    CREATE TABLE delivery_corrections (id INTEGER PRIMARY KEY AUTOINCREMENT);
    CREATE TABLE delivery_correction_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, correction_id INTEGER, material_id INTEGER, quantity_delta REAL NOT NULL);
  `);
  return db;
}

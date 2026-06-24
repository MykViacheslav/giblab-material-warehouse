import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  applyStockEvent,
  assertCanUseStock,
  getAvailableQuantity,
  parseNonNegativeQuantity,
  parsePositiveQuantity,
  StockMovementError
} from "../src/stockLogic.js";
import { applyStockEventToDatabase, listStockEvents, withAvailableStock } from "../src/stockRepository.js";

test("receive increases physical stock", () => {
  const result = applyStockEvent({ quantity: 2, reserved: 0, used: 0 }, "receive", 3);
  assert.deepEqual(result, { quantity: 5, reserved: 0, used: 0 });
});

test("reserve cannot exceed available stock", () => {
  assert.throws(
    () => applyStockEvent({ quantity: 5, reserved: 3, used: 0 }, "reserve", 3),
    StockMovementError
  );
});

test("available quantity is calculated as quantity minus reserved", () => {
  assert.equal(getAvailableQuantity({ quantity: 10, reserved: 3 }), 7);
  assert.equal(withAvailableStock({ quantity: 10, reserved: 3 }).available, 7);
});

test("release cannot exceed reserved stock", () => {
  assert.throws(
    () => applyStockEvent({ quantity: 5, reserved: 1, used: 0 }, "release", 2),
    StockMovementError
  );
});

test("use reduces stock and records used quantity", () => {
  const result = applyStockEvent({ quantity: 5, reserved: 1, used: 2 }, "use", 3);
  assert.deepEqual(result, { quantity: 2, reserved: 1, used: 5 });
});

test("use cannot silently clamp stock below zero", () => {
  assert.throws(
    () => applyStockEvent({ quantity: 2, reserved: 0, used: 0 }, "use", 3),
    StockMovementError
  );
});

test("normal use rejects usage above available stock when quantity is reserved", () => {
  assert.throws(
    () => applyStockEvent({ quantity: 10, reserved: 8, used: 0 }, "use", 3),
    /available stock/
  );
});

test("project import guard rejects usage above available stock", () => {
  assert.throws(
    () => assertCanUseStock({ quantity: 10, reserved: 8, used: 0 }, 3, { materialCode: "MAT-1" }),
    /available stock/
  );
});

test("use_reserved decreases both physical and reserved stock", () => {
  const result = applyStockEvent({ quantity: 10, reserved: 4, used: 1 }, "use_reserved", 3);
  assert.deepEqual(result, { quantity: 7, reserved: 1, used: 4 });
});

test("use_reserved rejects usage above reserved quantity", () => {
  assert.throws(
    () => applyStockEvent({ quantity: 10, reserved: 4, used: 0 }, "use_reserved", 5),
    /reserved stock/
  );
});

test("adjust can set stock to zero but not below reserved quantity", () => {
  assert.deepEqual(
    applyStockEvent({ quantity: 5, reserved: 0, used: 0 }, "adjust", 0),
    { quantity: 0, reserved: 0, used: 0 }
  );
  assert.throws(
    () => applyStockEvent({ quantity: 5, reserved: 2, used: 0 }, "adjust", 1),
    /below reserved/
  );
});

test("quantity parsers reject invalid movements", () => {
  assert.equal(parsePositiveQuantity("2,5"), 2.5);
  assert.equal(parseNonNegativeQuantity("0"), 0);
  assert.throws(() => parsePositiveQuantity("0"), StockMovementError);
  assert.throws(() => parseNonNegativeQuantity("-1"), StockMovementError);
});

test("successful stock operation creates event and failed operation does not", () => {
  const db = createStockTestDb();
  applyStockEventToDatabase(db, { materialId: 1, eventType: "receive", quantity: 10, note: "delivery" });
  assert.equal(listStockEvents(db, 1).length, 1);
  assert.throws(
    () => applyStockEventToDatabase(db, { materialId: 1, eventType: "use", quantity: 11, note: "too much" }),
    StockMovementError
  );
  const events = listStockEvents(db, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "receive");
  assert.equal(withAvailableStock(db.prepare("SELECT * FROM stock WHERE material_id = 1").get()).available, 10);
}
);

function createStockTestDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
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
  `);
  return db;
}

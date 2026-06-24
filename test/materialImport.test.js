import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  commitMaterialImport,
  normalizeImportRow,
  parseImportNumber,
  previewMaterialImport
} from "../src/materialImport.js";

test("parse Polish numeric format", () => {
  assert.equal(parseImportNumber("123,45").value, 123.45);
});

test("parse price with space", () => {
  assert.equal(parseImportNumber("1 234,56").value, 1234.56);
});

test("map Polish headers to internal fields", () => {
  const row = normalizeImportRow({
    Kod: "KS-1",
    Nazwa: "Plyta",
    Producent: "Kronospan",
    "Kod dekoru": "5981",
    "Grubosc": "18"
  });
  assert.equal(row.material.code, "KS-1");
  assert.equal(row.material.name, "Plyta");
  assert.equal(row.material.producer, "Kronospan");
  assert.equal(row.material.decor_code, "5981");
  assert.equal(row.material.thickness, 18);
});

test("map English headers to internal fields", () => {
  const row = normalizeImportRow({
    code: "EG-U216",
    name: "Kaszmir",
    producer: "EGGER",
    decor_code: "U216",
    structure: "ST9",
    thickness: 18
  });
  assert.equal(row.material.code, "EG-U216");
  assert.equal(row.material.decor_code, "U216");
  assert.equal(row.material.structure, "ST9");
});

test("default is_active = 1", () => {
  const row = normalizeImportRow({ code: "A", name: "A" });
  assert.equal(row.material.is_active, 1);
});

test("default min_stock = 0", () => {
  const row = normalizeImportRow({ code: "A", name: "A" });
  assert.equal(row.material.min_stock, 0);
});

test("invalid row when both code and decor_code are missing", () => {
  const preview = previewMaterialImport([{ name: "Material" }]);
  assert.equal(preview.rows[0].valid, false);
  assert.match(preview.rows[0].errors.join(" "), /code or decor_code/);
});

test("invalid row when both name and decor_name are missing", () => {
  const preview = previewMaterialImport([{ code: "A" }]);
  assert.equal(preview.rows[0].valid, false);
  assert.match(preview.rows[0].errors.join(" "), /name or decor_name/);
});

test("reject negative price", () => {
  const preview = previewMaterialImport([{ code: "A", name: "A", price: "-1" }]);
  assert.equal(preview.rows[0].valid, false);
  assert.match(preview.rows[0].errors.join(" "), /price cannot be negative/);
});

test("reject negative thickness", () => {
  const preview = previewMaterialImport([{ code: "A", name: "A", thickness: "-18" }]);
  assert.equal(preview.rows[0].valid, false);
  assert.match(preview.rows[0].errors.join(" "), /thickness cannot be negative/);
});

test("detect duplicate by producer + decor_code + structure + thickness", () => {
  const preview = previewMaterialImport(
    [{ name: "Kaszmir", producer: "EGGER", decor_code: "U216", structure: "ST9", thickness: 18 }],
    [{ id: 7, producer: "egger", decor_code: "u216", structure: "st9", thickness: 18 }]
  );
  assert.equal(preview.rows[0].status, "existing");
  assert.equal(preview.rows[0].existing_id, 7);
});

test("detect duplicate by code fallback", () => {
  const preview = previewMaterialImport(
    [{ code: "ABC", name: "Material" }],
    [{ id: 8, code: "abc", name: "Old" }]
  );
  assert.equal(preview.rows[0].status, "existing");
  assert.equal(preview.rows[0].existing_id, 8);
});

test("upsert inserts new row", () => {
  const db = createImportDb();
  const result = commitMaterialImport(db, [{ code: "NEW", name: "New material" }], "upsert");
  const row = db.prepare("SELECT * FROM materials WHERE code = 'NEW'").get();
  assert.equal(result.added, 1);
  assert.equal(row.name, "New material");
});

test("upsert updates existing row", () => {
  const db = createImportDb();
  db.prepare("INSERT INTO materials (id, code, name, price) VALUES (1001, 'OLD', 'Old material', 10)").run();
  const result = commitMaterialImport(db, [{ code: "OLD", name: "Updated material", price: "12,50" }], "upsert");
  const row = db.prepare("SELECT * FROM materials WHERE id = 1001").get();
  assert.equal(result.updated, 1);
  assert.equal(row.name, "Updated material");
  assert.equal(row.price, 12.5);
});

test("import does not modify stock quantities", () => {
  const db = createImportDb();
  db.prepare("INSERT INTO materials (id, code, name) VALUES (1001, 'OLD', 'Old')").run();
  db.prepare("INSERT INTO stock (material_id, quantity, reserved, used) VALUES (1001, 5, 2, 1)").run();
  commitMaterialImport(db, [{ code: "OLD", name: "Updated" }], "upsert");
  const stock = db.prepare("SELECT * FROM stock WHERE material_id = 1001").get();
  assert.equal(stock.quantity, 5);
  assert.equal(stock.reserved, 2);
  assert.equal(stock.used, 1);
});

test("import does not create stock_events", () => {
  const db = createImportDb();
  commitMaterialImport(db, [{ code: "NEW", name: "New material" }], "upsert");
  const events = db.prepare("SELECT COUNT(*) AS count FROM stock_events").get();
  assert.equal(events.count, 0);
});

function createImportDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE materials (
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
      sort_order INTEGER DEFAULT 0,
      producer TEXT DEFAULT '',
      decor_code TEXT DEFAULT '',
      decor_name TEXT DEFAULT '',
      structure TEXT DEFAULT '',
      material_type TEXT DEFAULT '',
      supplier TEXT DEFAULT '',
      location TEXT DEFAULT '',
      min_stock REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
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
      note TEXT DEFAULT ''
    );
  `);
  return db;
}

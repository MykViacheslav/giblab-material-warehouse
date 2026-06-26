import test from "node:test";
import assert from "node:assert/strict";
import { buildFilteredPurchaseNeedsReport, buildPurchaseNeedsReport, purchaseNeedsToCsv } from "../src/purchaseNeeds.js";

test("purchase needs report shows material below minimum stock", () => {
  const report = buildPurchaseNeedsReport([
    { id: 1, code: "A", name: "Board A", quantity: 2, reserved: 0, min_stock: 5, is_active: 1 }
  ]);
  assert.equal(report.rows.length, 1);
  assert.equal(report.rows[0].available, 2);
  assert.equal(report.rows[0].order_quantity, 3);
});

test("purchase needs report uses available stock, not physical stock", () => {
  const report = buildPurchaseNeedsReport([
    { id: 1, code: "A", name: "Board A", quantity: 10, reserved: 8, min_stock: 5, is_active: 1 }
  ]);
  assert.equal(report.rows[0].available, 2);
  assert.equal(report.rows[0].order_quantity, 3);
});

test("purchase needs report ignores materials at or above minimum", () => {
  const report = buildPurchaseNeedsReport([
    { id: 1, code: "A", name: "Board A", quantity: 5, reserved: 0, min_stock: 5, is_active: 1 },
    { id: 2, code: "B", name: "Board B", quantity: 8, reserved: 0, min_stock: 5, is_active: 1 }
  ]);
  assert.equal(report.rows.length, 0);
});

test("purchase needs report ignores inactive materials and folders", () => {
  const report = buildPurchaseNeedsReport([
    { id: 1, code: "A", name: "Inactive", quantity: 0, reserved: 0, min_stock: 5, is_active: 0 },
    { id: 2, code: "F", name: "Folder", quantity: 0, reserved: 0, min_stock: 5, isfolder: 1, is_active: 1 }
  ]);
  assert.equal(report.rows.length, 0);
});

test("purchase needs report summarizes by supplier", () => {
  const report = buildPurchaseNeedsReport([
    { id: 1, code: "A", name: "A", supplier: "EGGER", quantity: 1, reserved: 0, min_stock: 5, is_active: 1 },
    { id: 2, code: "B", name: "B", supplier: "EGGER", quantity: 2, reserved: 1, min_stock: 4, is_active: 1 },
    { id: 3, code: "C", name: "C", supplier: "Kronospan", quantity: 0, reserved: 0, min_stock: 2, is_active: 1 }
  ]);
  assert.equal(report.summary.total_rows, 3);
  assert.equal(report.summary.total_order_quantity, 9);
  assert.deepEqual(report.summary.suppliers.map((row) => [row.supplier, row.rows, row.order_quantity]), [
    ["EGGER", 2, 7],
    ["Kronospan", 1, 2]
  ]);
});

test("purchase needs report filters by supplier producer material type and search", () => {
  const rows = [
    { id: 1, code: "EG-U216", name: "Kaszmir", supplier: "EGGER", producer: "EGGER", material_type: "chipboard", quantity: 1, reserved: 0, min_stock: 5, is_active: 1 },
    { id: 2, code: "KS-5981", name: "Dab", supplier: "Kronospan", producer: "Kronospan", material_type: "MDF", quantity: 0, reserved: 0, min_stock: 4, is_active: 1 }
  ];
  assert.equal(buildFilteredPurchaseNeedsReport(rows, { supplier: "EGGER" }).rows[0].code, "EG-U216");
  assert.equal(buildFilteredPurchaseNeedsReport(rows, { producer: "Kronospan" }).rows[0].code, "KS-5981");
  assert.equal(buildFilteredPurchaseNeedsReport(rows, { material_type: "MDF" }).rows[0].code, "KS-5981");
  assert.equal(buildFilteredPurchaseNeedsReport(rows, { search: "kasz" }).rows[0].code, "EG-U216");
});

test("purchase needs csv export includes headers and escaped values", () => {
  const csv = purchaseNeedsToCsv([
    {
      supplier: "ACME;Test",
      producer: "EGGER",
      code: "EG-U216",
      name: "Kaszmir \"premium\"",
      decor_code: "U216",
      decor_name: "Kaszmir",
      structure: "ST9",
      material_type: "chipboard",
      thickness: 18,
      length: 2800,
      width: 2070,
      unit: "szt.",
      quantity: 1,
      reserved: 0,
      available: 1,
      min_stock: 5,
      order_quantity: 4,
      location: "A1"
    }
  ]);
  assert.match(csv, /^Dostawca;Producent;Kod;/);
  assert.match(csv, /"ACME;Test";EGGER;EG-U216;"Kaszmir ""premium"""/);
});

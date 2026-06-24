import test from "node:test";
import assert from "node:assert/strict";
import { MATERIAL_CATALOG_FIELD_NAMES, normalizeMaterialCatalogFields } from "../src/materialCatalog.js";

test("material catalog exposes carpentry fields", () => {
  assert.deepEqual(MATERIAL_CATALOG_FIELD_NAMES, [
    "producer",
    "decor_code",
    "decor_name",
    "structure",
    "material_type",
    "supplier",
    "location",
    "min_stock",
    "is_active"
  ]);
});

test("material catalog fields normalize defaults and aliases", () => {
  const result = normalizeMaterialCatalogFields({
    producer: " EGGER ",
    decorCode: "U216",
    decorName: "Kaszmir",
    structure: "ST9",
    materialType: "chipboard",
    supplier: "Local supplier",
    location: "A-01",
    minStock: "2,5"
  });
  assert.deepEqual(result, {
    producer: "EGGER",
    decor_code: "U216",
    decor_name: "Kaszmir",
    structure: "ST9",
    material_type: "chipboard",
    supplier: "Local supplier",
    location: "A-01",
    min_stock: 2.5,
    is_active: 1
  });
});

test("material catalog can mark material inactive", () => {
  const result = normalizeMaterialCatalogFields({ is_active: "0" });
  assert.equal(result.is_active, 0);
});

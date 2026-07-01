import assert from "node:assert/strict";
import test from "node:test";
import { chooseOffcutStorageLocation } from "../src/offcutStorage.js";

test("assigns large offcuts to the large sheet rack", () => {
  assert.equal(chooseOffcutStorageLocation({ length: 2800, width: 936 }), "R1-DUZE");
});

test("assigns medium offcuts to the medium rack", () => {
  assert.equal(chooseOffcutStorageLocation({ length: 1200, width: 500 }), "R2-SREDNIE");
});

test("assigns small offcuts to the small rack", () => {
  assert.equal(chooseOffcutStorageLocation({ length: 600, width: 500 }), "R3-MALE");
});

test("assigns narrow strips before generic large racks", () => {
  assert.equal(chooseOffcutStorageLocation({ length: 2400, width: 120 }), "R4-WASKIE");
});

test("ignores inactive storage locations", () => {
  const locations = [
    {
      code: "OFF",
      min_long_side: 0,
      max_long_side: 10000,
      min_short_side: 0,
      max_short_side: 10000,
      sort_order: 1,
      active: 0
    },
    {
      code: "ON",
      min_long_side: 0,
      max_long_side: 10000,
      min_short_side: 0,
      max_short_side: 10000,
      sort_order: 2,
      active: 1
    }
  ];

  assert.equal(chooseOffcutStorageLocation({ length: 500, width: 500 }, locations), "ON");
});

test("uses user-defined rack dimensions and priority", () => {
  const locations = [
    {
      code: "A1",
      min_long_side: 0,
      max_long_side: 900,
      min_short_side: 0,
      max_short_side: 600,
      sort_order: 20,
      active: 1
    },
    {
      code: "PASKI",
      min_long_side: 800,
      max_long_side: 3000,
      min_short_side: 0,
      max_short_side: 150,
      sort_order: 10,
      active: 1
    }
  ];

  assert.equal(chooseOffcutStorageLocation({ length: 850, width: 120 }, locations), "PASKI");
  assert.equal(chooseOffcutStorageLocation({ length: 850, width: 500 }, locations), "A1");
});

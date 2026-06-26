import test from "node:test";
import assert from "node:assert/strict";
import { buildCutQuoteLines, normalizeCutQuotePrices } from "../src/cutQuote.js";

test("cut quote pricing creates lines for all selected processes", () => {
  const prices = normalizeCutQuotePrices({
    material_price: "50,5",
    cut_price: "2",
    edge_price: "3",
    milling_price: "4",
    drilling_price: "1",
    lacquer_price: "80",
    other_price: "7"
  });
  const lines = buildCutQuoteLines({ name: "Pozycja 1" }, {
    area_m2: 2,
    part_count: 5,
    edge_mb: 3,
    milling_count: 2,
    drilling_count: 4,
    lacquer_m2: 1.5,
    other_count: 1
  }, prices);
  assert.deepEqual(lines.map((line) => line.unit), ["m2", "szt.", "mb", "szt.", "szt.", "m2", "szt."]);
  assert.deepEqual(lines.map((line) => line.line_total), [101, 10, 9, 8, 4, 120, 7]);
});

test("cut quote pricing skips zero prices and zero quantities", () => {
  const lines = buildCutQuoteLines({ name: "Pozycja 1" }, {
    area_m2: 2,
    part_count: 0,
    edge_mb: 3,
    milling_count: 0
  }, normalizeCutQuotePrices({
    material_price: "0",
    cut_price: "2",
    edge_price: "3",
    milling_price: "4"
  }));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].description, "Formatki Pozycja 1 - oklejanie");
});

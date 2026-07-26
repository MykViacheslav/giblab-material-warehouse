import test from "node:test";
import assert from "node:assert/strict";
import { buildCutTechnologyQuoteLines } from "../src/cutTechnologyQuote.js";

test("groups technology prices by matching technology", () => {
  const prices = [{
    id: 1, name: "Front gładki", element_type: "Front gładki",
    technology: "Front gładki lakierowany", lacquer_sides: "1 strona",
    unit: "m2", unit_price: 350, active: 1
  }];
  const parts = [
    { element_type: "Front gładki", technology: "Front gładki lakierowany", lacquer_sides: "1 strona", length: 1000, width: 500, quantity: 2 },
    { element_type: "Front gładki", technology: "Front gładki lakierowany", lacquer_sides: "1 strona", length: 500, width: 500, quantity: 1 }
  ];
  const [line] = buildCutTechnologyQuoteLines(parts, prices);
  assert.equal(line.quantity, 1.25);
  assert.equal(line.unit_price, 350);
  assert.equal(line.line_total, 437.5);
});

test("supports running meters and pieces", () => {
  const prices = [
    { id: 1, name: "Listwa", element_type: "Listwa", technology: "Listwa", unit: "mb", unit_price: 20, active: 1 },
    { id: 2, name: "Element", element_type: "Element", technology: "Element", unit: "szt", unit_price: 15, active: 1 }
  ];
  const parts = [
    { element_type: "Listwa", technology: "Listwa", length: 2000, width: 50, quantity: 3 },
    { element_type: "Element", technology: "Element", length: 100, width: 100, quantity: 4 }
  ];
  const lines = buildCutTechnologyQuoteLines(parts, prices);
  assert.equal(lines[0].quantity, 6);
  assert.equal(lines[0].line_total, 120);
  assert.equal(lines[1].quantity, 4);
  assert.equal(lines[1].line_total, 60);
});

test("uses technology price for imported parts with a generic element type", () => {
  const prices = [{
    id: 1,
    name: "Tylko rozkrój",
    element_type: "rozkrój MDF",
    technology: "Bez technologii / tylko rozkrój",
    lacquer_sides: "brak",
    unit: "m2",
    unit_price: 130,
    active: 1
  }];
  const parts = [{
    element_type: "Inne",
    technology: "Bez technologii / tylko rozkrój",
    lacquer_sides: "brak",
    length: 756,
    width: 794,
    quantity: 1
  }];

  const [line] = buildCutTechnologyQuoteLines(parts, prices);
  assert.equal(line.quantity, 0.600264);
  assert.equal(line.unit_price, 130);
  assert.ok(Math.abs(line.line_total - 78.03432) < 0.000001);
});

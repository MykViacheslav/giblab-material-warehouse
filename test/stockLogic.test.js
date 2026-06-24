import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStockEvent,
  assertCanUseStock,
  parseNonNegativeQuantity,
  parsePositiveQuantity,
  StockMovementError
} from "../src/stockLogic.js";

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

test("release cannot exceed reserved stock", () => {
  assert.throws(
    () => applyStockEvent({ quantity: 5, reserved: 1, used: 0 }, "release", 2),
    StockMovementError
  );
});

test("use reduces stock and records used quantity", () => {
  const result = applyStockEvent({ quantity: 5, reserved: 0, used: 2 }, "use", 3);
  assert.deepEqual(result, { quantity: 2, reserved: 0, used: 5 });
});

test("use cannot silently clamp stock below zero", () => {
  assert.throws(
    () => applyStockEvent({ quantity: 2, reserved: 0, used: 0 }, "use", 3),
    StockMovementError
  );
});

test("project import guard rejects usage above stock", () => {
  assert.throws(
    () => assertCanUseStock({ quantity: 2, reserved: 0, used: 0 }, 3, { materialCode: "MAT-1" }),
    /Cannot use more material/
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

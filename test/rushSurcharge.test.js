import test from "node:test";
import assert from "node:assert/strict";
import { calculateRushSurcharge } from "../src/rushSurcharge.js";

test("calculates rush surcharge from quote base", () => {
  assert.deepEqual(calculateRushSurcharge(1000, 15), {
    base: 1000,
    percentage: 15,
    amount: 150
  });
});

test("accepts Polish decimal percentage and rounds money", () => {
  assert.equal(calculateRushSurcharge(333.33, "7,5").amount, 25);
});

test("does not allow negative or above 100 percent", () => {
  assert.equal(calculateRushSurcharge(1000, -10).amount, 0);
  assert.equal(calculateRushSurcharge(1000, 120).amount, 1000);
});

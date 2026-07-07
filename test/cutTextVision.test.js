import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVisionRows, rowsToCutText } from "../src/cutTextVision.js";

test("normalizes Gemini rows and skips unlikely sketch dimensions", () => {
  const result = normalizeVisionRows({
    items: [
      { length: 2580, width: 300, quantity: 1, work_milling: true },
      { length: 60, width: 4, quantity: 1, note: "profil frezu" },
      { length: 786, width: 596, quantity: 2, note: "bez frezu" },
      { length: 515, width: 506, quantity: 120 }
    ]
  });

  assert.equal(result.rows.length, 2);
  assert.equal(result.warnings.length, 2);
  assert.deepEqual(result.rows.map((row) => [row.length, row.width, row.quantity]), [
    [2580, 300, 1],
    [786, 596, 2]
  ]);
});

test("converts Gemini rows to importable cut text", () => {
  const text = rowsToCutText([
    { length: 240, width: 450, quantity: 1, work_milling: true, work_lacquer: true, note: "RAL 9016" }
  ]);

  assert.equal(text, "240 x 450 x 1 frez lakier RAL 9016");
});

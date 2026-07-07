import test from "node:test";
import assert from "node:assert/strict";
import { parseCutTextRows } from "../public/js/cutTextParser.js";

test("parses common workshop cut text formats", () => {
  const rows = parseCutTextRows(`
    Fronty lakierowane kolor: RAL 9016
    2580 x 300
    786 x 596 - 2 szt.
    240 x 450 sztuk 1 frez
    2520 x 200 x 1
    715 x 636 -1
    60 x 4
  `);

  assert.deepEqual(rows.map((row) => [row.length, row.width, row.quantity]), [
    [2580, 300, 1],
    [786, 596, 2],
    [240, 450, 1],
    [2520, 200, 1],
    [715, 636, 1]
  ]);
  assert.equal(rows[2].work_milling, true);
  assert.equal(rows.every((row) => row.work_lacquer), true);
});

test("keeps bez frezu as note and disables milling for that row", () => {
  const rows = parseCutTextRows("140 x 796 x 1 bez frezu w srodku");

  assert.equal(rows.length, 1);
  assert.equal(rows[0].work_milling, false);
  assert.match(rows[0].description, /bez frezu/i);
});

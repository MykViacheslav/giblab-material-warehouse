import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVisionRows, rowsToCutText } from "../src/cutTextVision.js";

test("vision result normalizes rectangular cut parts", () => {
  const result = normalizeVisionRows({
    items: [
      {
        length: 554,
        width: 596,
        quantity: 2,
        name: "Front lakierowany 1502-Y50R",
        work_milling: true,
        work_lacquer: true
      }
    ],
    warnings: []
  });

  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0], {
    length: 554,
    width: 596,
    quantity: 2,
    edge_top: false,
    edge_bottom: false,
    edge_left: false,
    edge_right: false,
    name: "Front lakierowany 1502-Y50R",
    work_milling: true,
    work_lacquer: true,
    note: "",
    uncertain: false
  });
  assert.equal(rowsToCutText(result.rows), "554 x 596 x 2 frez lakier Front lakierowany 1502-Y50R");
});

test("vision result keeps trapeziums as rectangular bounding boxes", () => {
  const result = normalizeVisionRows(JSON.stringify({
    items: [
      {
        length: 1316,
        width: 670,
        quantity: 1,
        note: "trapez/skos"
      }
    ]
  }));

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].length, 1316);
  assert.equal(result.rows[0].width, 670);
  assert.equal(rowsToCutText(result.rows), "1316 x 670 x 1 trapez/skos");
});

test("vision result filters implausible sketch dimensions", () => {
  const result = normalizeVisionRows({
    items: [
      { length: 60, width: 4, quantity: 1 },
      { length: 2500, width: 105, quantity: 1 }
    ]
  });

  assert.equal(result.rows.length, 1);
  assert.equal(rowsToCutText(result.rows), "2500 x 105 x 1");
});

test("vision result keeps narrow strips used in furniture production", () => {
  const result = normalizeVisionRows({
    items: [
      { length: 1780, width: 40, quantity: 1 },
      { length: 1600, width: 40, quantity: 1 }
    ]
  });

  assert.equal(result.rows.length, 2);
  assert.equal(rowsToCutText(result.rows), "1780 x 40 x 1\n1600 x 40 x 1");
});

test("vision result accepts json fenced model output", () => {
  const result = normalizeVisionRows("```json\n{\"items\":[{\"length\":764,\"width\":596,\"quantity\":3}]}\n```");

  assert.equal(result.rows.length, 1);
  assert.equal(rowsToCutText(result.rows), "764 x 596 x 3");
});

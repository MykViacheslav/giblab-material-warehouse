import test from "node:test";
import assert from "node:assert/strict";
import { formatRemaindersLoadResponse, parseReportedRemainderIds } from "../src/giblabRemainders.js";

test("formats GibLab load response as exactly five columns", () => {
  const text = formatRemaindersLoadResponse([{
    id: "OF-12",
    length: 1200,
    width: 450,
    quantity: 1,
    storage_location: "R2-SREDNIE",
    project_name: "ZAM-12",
    status: "reserved",
    reserved_by: "CNC-1",
    reserved_project: "Rozkroj 4"
  }]);

  assert.equal(text, "OF-12,1200,450,1,R2-SREDNIE | ZAM-12 | REZERWACJA CNC-1 | Rozkroj 4");
  assert.equal(text.split(",").length, 5);
});

test("sanitizes commas and new lines in GibLab remainder comment", () => {
  const text = formatRemaindersLoadResponse([{
    id: "OF,12",
    length: 500,
    width: 400,
    quantity: 2,
    storage_location: "A1,\nlewa"
  }]);

  assert.equal(text, "OF;12,500,400,2,A1; lewa");
  assert.equal(text.split(",").length, 5);
});

test("extracts unique used remainder ids from report", () => {
  assert.deepEqual(
    parseReportedRemainderIds("OF-1,500,400,1\nOF-2,1200,300,1\nOF-1,500,400,1\n"),
    ["OF-1", "OF-2"]
  );
});

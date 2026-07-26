import test from "node:test";
import assert from "node:assert/strict";
import { hasFinishedGibLabResult, isWarehouseExportProject, projectFingerprint } from "../src/giblabProjectAutoSync.js";

test("accepts only exported warehouse project names", () => {
  assert.equal(isWarehouseExportProject("C:/GibLabLocal/projects/ZAM-2026-0007 - Klient - Pozycja 1.project"), true);
  assert.equal(isWarehouseExportProject("C:/GibLabLocal/projects/Kuchnia-7.project"), false);
});

test("recognizes a finished GibLab result without accepting a fresh export", () => {
  assert.equal(hasFinishedGibLabResult('<part usedCount="0" l="500" w="400"/>'), false);
  assert.equal(hasFinishedGibLabResult('<part usedCount="1" l="500" w="400"/>'), true);
  assert.equal(hasFinishedGibLabResult('<part waste="true" l="500" w="400"/>'), true);
});

test("uses file size and modification time as a project fingerprint", () => {
  assert.equal(projectFingerprint({ size: 2048, mtimeMs: 123.5 }), "2048:123.5");
});

import test from "node:test";
import assert from "node:assert/strict";
import { buildProductionAnalytics } from "../src/productionAnalytics.js";

test("buildProductionAnalytics sums work and counts GibLab job actuals once", () => {
  const rows = [
    {
      cut_job_id: 1,
      order_number: "ZAM-1",
      customer_name: "Jan",
      job_name: "Fronty",
      job_status: "Po rozkroju",
      production_status: "Po rozkroju",
      job_material_name: "MDF",
      length: 1000,
      width: 500,
      quantity: 2,
      edge_top: 1,
      edge_bottom: 1,
      work_lacquer: 1,
      lacquer_sides: "2 strony",
      element_type: "Front gladki",
      technology: "Lakier",
      board_sheets_actual: 2,
      board_m2_actual: 5.8,
      edge_meters_actual: 3.5
    },
    {
      cut_job_id: 1,
      order_number: "ZAM-1",
      customer_name: "Jan",
      job_name: "Fronty",
      job_material_name: "MDF",
      length: 500,
      width: 400,
      quantity: 1,
      work_milling: 1,
      work_drilling: 1,
      work_other: 1,
      element_type: "Front frezowany",
      technology: "Frez",
      board_sheets_actual: 2,
      board_m2_actual: 5.8,
      edge_meters_actual: 3.5
    },
    {
      cut_job_id: 2,
      order_number: "ZAM-2",
      customer_name: "Anna",
      job_name: "Boki",
      job_material_name: "MDF",
      length: 200,
      width: 100,
      quantity: 3,
      edge_left: 1,
      work_lacquer: 1,
      lacquer_sides: "1 strona",
      element_type: "Bok dokladany",
      technology: "Lakier",
      board_sheets_actual: 1,
      board_m2_actual: 2.9,
      edge_meters_actual: 0.6
    }
  ];

  const result = buildProductionAnalytics(rows);

  assert.equal(result.totals.quantity, 6);
  assert.equal(result.totals.area_m2, 1.26);
  assert.equal(result.totals.edge_mb, 4.3);
  assert.equal(result.totals.board_sheets_actual, 3);
  assert.equal(result.totals.board_m2_actual, 8.7);
  assert.equal(result.totals.lacquer_part_count, 5);
  assert.equal(result.totals.milling_count, 1);
  assert.equal(result.totals.drilling_count, 1);
  assert.equal(result.totals.other_count, 1);
  assert.equal(result.byJob.length, 2);

  const firstJob = result.byJob.find((row) => row.cut_job_id === 1);
  assert.equal(firstJob.quantity, 3);
  assert.equal(firstJob.board_sheets_actual, 2);
});

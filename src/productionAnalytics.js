function toNumber(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function truthyFlag(value) {
  if (value === true || value === 1) return true;
  const text = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "tak", "yes", "on"].includes(text);
}

function cleanLabel(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function round3(value) {
  return Math.round(toNumber(value) * 1000) / 1000;
}

function partAreaM2(row) {
  return toNumber(row.length) * toNumber(row.width) * toNumber(row.quantity) / 1000000;
}

function partEdgeMb(row) {
  const length = toNumber(row.length);
  const width = toNumber(row.width);
  const quantity = toNumber(row.quantity);
  const longEdges = (truthyFlag(row.edge_top) ? 1 : 0) + (truthyFlag(row.edge_bottom) ? 1 : 0);
  const shortEdges = (truthyFlag(row.edge_left) ? 1 : 0) + (truthyFlag(row.edge_right) ? 1 : 0);
  return ((longEdges * length) + (shortEdges * width)) * quantity / 1000;
}

function lacquerMultiplier(row) {
  const text = `${row.lacquer_sides || ""} ${row.tech_notes || ""}`.toLowerCase();
  return text.includes("2") || text.includes("dwustron") || text.includes("obustron") ? 2 : 1;
}

function partLacquerM2(row) {
  return truthyFlag(row.work_lacquer) ? partAreaM2(row) * lacquerMultiplier(row) : 0;
}

function createMetrics() {
  return {
    quantity: 0,
    area_m2: 0,
    edge_mb: 0,
    milling_count: 0,
    drilling_count: 0,
    lacquer_m2: 0,
    lacquer_part_count: 0,
    other_count: 0
  };
}

function addMetrics(target, metrics) {
  for (const [key, value] of Object.entries(metrics)) {
    target[key] = toNumber(target[key]) + toNumber(value);
  }
}

function metricsFromPart(row) {
  const quantity = toNumber(row.quantity);
  return {
    quantity,
    area_m2: partAreaM2(row),
    edge_mb: partEdgeMb(row),
    milling_count: truthyFlag(row.work_milling) ? quantity : 0,
    drilling_count: truthyFlag(row.work_drilling) ? quantity : 0,
    lacquer_m2: partLacquerM2(row),
    lacquer_part_count: truthyFlag(row.work_lacquer) ? quantity : 0,
    other_count: truthyFlag(row.work_other) ? quantity : 0
  };
}

function finalizeNumbers(row) {
  for (const key of [
    "quantity",
    "area_m2",
    "edge_mb",
    "milling_count",
    "drilling_count",
    "lacquer_m2",
    "lacquer_part_count",
    "other_count",
    "board_sheets_actual",
    "board_m2_actual",
    "edge_meters_actual"
  ]) {
    if (key in row) row[key] = round3(row[key]);
  }
  return row;
}

export function buildProductionAnalytics(rows = []) {
  const totals = {
    ...createMetrics(),
    board_sheets_actual: 0,
    board_m2_actual: 0,
    edge_meters_actual: 0
  };
  const byTechnology = new Map();
  const byJob = new Map();
  const seenJobs = new Set();

  for (const row of rows) {
    const metrics = metricsFromPart(row);
    addMetrics(totals, metrics);

    const elementType = cleanLabel(row.element_type, "Inne");
    const technology = cleanLabel(row.technology, "Bez technologii / tylko rozkroj");
    const lacquerSides = cleanLabel(row.lacquer_sides, "brak");
    const technologyKey = `${elementType}|${technology}|${lacquerSides}`;
    if (!byTechnology.has(technologyKey)) {
      byTechnology.set(technologyKey, {
        element_type: elementType,
        technology,
        lacquer_sides: lacquerSides,
        ...createMetrics()
      });
    }
    addMetrics(byTechnology.get(technologyKey), metrics);

    const jobId = toNumber(row.cut_job_id || row.job_id || 0);
    const jobKey = jobId || `${row.order_number || ""}|${row.job_name || ""}|${row.material_name || ""}`;
    if (!byJob.has(jobKey)) {
      byJob.set(jobKey, {
        cut_job_id: jobId,
        order_number: cleanLabel(row.order_number, "-"),
        customer_name: cleanLabel(row.customer_name, "-"),
        job_name: cleanLabel(row.job_name, "-"),
        material_name: cleanLabel(row.job_material_name || row.material_name, "-"),
        production_status: cleanLabel(row.production_status, ""),
        job_status: cleanLabel(row.job_status, ""),
        board_sheets_actual: toNumber(row.board_sheets_actual),
        board_m2_actual: toNumber(row.board_m2_actual),
        edge_meters_actual: toNumber(row.edge_meters_actual),
        ...createMetrics()
      });
    }
    addMetrics(byJob.get(jobKey), metrics);

    if (jobId && !seenJobs.has(jobId)) {
      seenJobs.add(jobId);
      totals.board_sheets_actual += toNumber(row.board_sheets_actual);
      totals.board_m2_actual += toNumber(row.board_m2_actual);
      totals.edge_meters_actual += toNumber(row.edge_meters_actual);
    }
  }

  return {
    totals: finalizeNumbers(totals),
    byTechnology: [...byTechnology.values()]
      .map(finalizeNumbers)
      .sort((a, b) => `${a.element_type} ${a.technology}`.localeCompare(`${b.element_type} ${b.technology}`, "pl")),
    byJob: [...byJob.values()]
      .map(finalizeNumbers)
      .sort((a, b) => `${a.order_number} ${a.job_name}`.localeCompare(`${b.order_number} ${b.job_name}`, "pl"))
  };
}

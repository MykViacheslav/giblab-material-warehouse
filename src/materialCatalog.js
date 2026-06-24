export const MATERIAL_CATALOG_COLUMNS = [
  ["producer", "TEXT DEFAULT ''"],
  ["decor_code", "TEXT DEFAULT ''"],
  ["decor_name", "TEXT DEFAULT ''"],
  ["structure", "TEXT DEFAULT ''"],
  ["material_type", "TEXT DEFAULT ''"],
  ["supplier", "TEXT DEFAULT ''"],
  ["location", "TEXT DEFAULT ''"],
  ["min_stock", "REAL DEFAULT 0"],
  ["is_active", "INTEGER DEFAULT 1"]
];

export const MATERIAL_CATALOG_FIELD_NAMES = MATERIAL_CATALOG_COLUMNS.map(([name]) => name);

export const MATERIAL_TYPE_OPTIONS = [
  "",
  "chipboard",
  "MDF",
  "HDF",
  "plywood",
  "edge_band",
  "HPL",
  "veneer",
  "worktop",
  "hardware",
  "other"
];

export function normalizeMaterialCatalogFields(input = {}) {
  return {
    producer: textValue(input.producer),
    decor_code: textValue(input.decor_code ?? input.decorCode),
    decor_name: textValue(input.decor_name ?? input.decorName),
    structure: textValue(input.structure),
    material_type: textValue(input.material_type ?? input.materialType),
    supplier: textValue(input.supplier),
    location: textValue(input.location),
    min_stock: numberValue(input.min_stock ?? input.minStock),
    is_active: input.is_active === undefined && input.isActive === undefined ? 1 : truthyNumber(input.is_active ?? input.isActive)
  };
}

function textValue(value) {
  return String(value || "").trim();
}

function numberValue(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function truthyNumber(value) {
  return value === true || value === "true" || value === "1" || value === 1 ? 1 : 0;
}

import { normalizeMaterialCatalogFields } from "./materialCatalog.js";

export const MATERIAL_IMPORT_FIELDS = [
  "code",
  "name",
  "producer",
  "decor_code",
  "decor_name",
  "structure",
  "material_type",
  "unit",
  "price",
  "thickness",
  "length",
  "width",
  "supplier",
  "location",
  "min_stock",
  "is_active"
];

export const MATERIAL_IMPORT_MODES = new Set(["add_new", "update_existing", "upsert", "skip_duplicates"]);

const HEADER_ALIASES = new Map([
  ["code", "code"],
  ["kod", "code"],
  ["symbol", "code"],
  ["indeks", "code"],
  ["sku", "code"],
  ["name", "name"],
  ["nazwa", "name"],
  ["opis", "name"],
  ["producer", "producer"],
  ["producent", "producer"],
  ["marka", "producer"],
  ["decor_code", "decor_code"],
  ["decor code", "decor_code"],
  ["kod_dekoru", "decor_code"],
  ["kod dekoru", "decor_code"],
  ["dekor", "decor_code"],
  ["decor", "decor_code"],
  ["decor_name", "decor_name"],
  ["decor name", "decor_name"],
  ["nazwa_dekoru", "decor_name"],
  ["nazwa dekoru", "decor_name"],
  ["structure", "structure"],
  ["struktura", "structure"],
  ["powierzchnia", "structure"],
  ["material_type", "material_type"],
  ["material type", "material_type"],
  ["typ", "material_type"],
  ["typ_materialu", "material_type"],
  ["typ materialu", "material_type"],
  ["typ materiału", "material_type"],
  ["unit", "unit"],
  ["jednostka", "unit"],
  ["jm", "unit"],
  ["j.m.", "unit"],
  ["price", "price"],
  ["cena", "price"],
  ["cena_netto", "price"],
  ["cena netto", "price"],
  ["thickness", "thickness"],
  ["grubosc", "thickness"],
  ["grubość", "thickness"],
  ["thickness_mm", "thickness"],
  ["thickness mm", "thickness"],
  ["length", "length"],
  ["dlugosc", "length"],
  ["długość", "length"],
  ["length_mm", "length"],
  ["length mm", "length"],
  ["width", "width"],
  ["szerokosc", "width"],
  ["szerokość", "width"],
  ["width_mm", "width"],
  ["width mm", "width"],
  ["supplier", "supplier"],
  ["dostawca", "supplier"],
  ["hurtownia", "supplier"],
  ["location", "location"],
  ["lokalizacja", "location"],
  ["miejsce", "location"],
  ["min_stock", "min_stock"],
  ["min stock", "min_stock"],
  ["stan_min", "min_stock"],
  ["stan minimalny", "min_stock"],
  ["minimum", "min_stock"],
  ["is_active", "is_active"],
  ["is active", "is_active"],
  ["aktywny", "is_active"],
  ["active", "is_active"]
]);

const NUMERIC_FIELDS = new Set(["price", "thickness", "length", "width", "min_stock"]);
const NON_NEGATIVE_FIELDS = new Set(["price", "thickness", "length", "width", "min_stock"]);
const ACTIVE_TRUE = new Set(["1", "true", "tak", "yes", "active", "aktywny"]);
const ACTIVE_FALSE = new Set(["0", "false", "nie", "no", "inactive", "nieaktywny"]);

export function previewMaterialImport(rawRows, existingMaterials = []) {
  const existingKeys = buildExistingKeyIndex(existingMaterials);
  const uploadedKeys = new Map();
  const rows = rawRows
    .map((raw, index) => normalizeImportRow(raw, index + 1))
    .filter((row) => row.hasContent);

  for (const row of rows) {
    const key = materialDuplicateKey(row.material);
    if (!key) {
      row.warnings.push("Cannot detect duplicate reliably because code/decor key is missing.");
    } else {
      row.duplicate_key = key.value;
      row.duplicate_key_type = key.type;
      const uploadedCount = uploadedKeys.get(key.value) || 0;
      if (uploadedCount > 0) {
        row.file_duplicate = true;
        row.warnings.push("Duplicate in uploaded file.");
      }
      uploadedKeys.set(key.value, uploadedCount + 1);

      const existing = existingKeys.get(key.value);
      if (existing) {
        row.existing_id = existing.id;
      }
    }

    row.valid = row.errors.length === 0;
    row.status = statusForPreviewRow(row);
  }

  return {
    rows,
    summary: summarizePreviewRows(rows)
  };
}

export function commitMaterialImport(db, rows, mode = "upsert", options = {}) {
  if (!MATERIAL_IMPORT_MODES.has(mode)) throw new Error(`Unsupported import mode: ${mode}`);
  const existingRows = options.existingMaterials || db.prepare("SELECT * FROM materials").all();
  const preview = previewMaterialImport(rows.map((row) => row.material || row), existingRows);
  const insert = db.prepare(`
    INSERT INTO materials (
      id, paren_id, isfolder, code, name, unit, price, thickness, length, width,
      producer, decor_code, decor_name, structure, material_type, supplier, location, min_stock, is_active, sort_order
    )
    VALUES (?, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const update = db.prepare(`
    UPDATE materials
    SET code = ?, name = ?, unit = ?, price = ?, thickness = ?, length = ?, width = ?,
        producer = ?, decor_code = ?, decor_name = ?, structure = ?, material_type = ?,
        supplier = ?, location = ?, min_stock = ?, is_active = ?
    WHERE id = ?
  `);

  let added = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  db.exec("BEGIN");
  try {
    for (const row of preview.rows) {
      if (!row.valid) {
        skipped += 1;
        errors.push({ row: row.row_number, errors: row.errors });
        continue;
      }
      if (row.file_duplicate) {
        skipped += 1;
        continue;
      }
      const existingId = row.existing_id || findExistingMaterialId(db, row.material);
      const isExisting = Boolean(existingId);
      if ((mode === "add_new" || mode === "skip_duplicates") && isExisting) {
        skipped += 1;
        continue;
      }
      if (mode === "update_existing" && !isExisting) {
        skipped += 1;
        continue;
      }
      if (isExisting) {
        update.run(...materialUpdateValues(row.material), existingId);
        updated += 1;
      } else {
        const id = nextMaterialId(db);
        insert.run(id, ...materialInsertValues(row.material), id);
        added += 1;
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    mode,
    added,
    updated,
    skipped,
    errors,
    total: preview.rows.length
  };
}

export function normalizeImportRow(rawRow = {}, rowNumber = 1) {
  const mapped = {};
  const original = {};
  for (const [header, value] of Object.entries(rawRow)) {
    const field = fieldForHeader(header);
    if (!field) continue;
    original[field] = value;
    if (mapped[field] === undefined || mapped[field] === "") mapped[field] = value;
  }

  const errors = [];
  const material = {};
  for (const field of MATERIAL_IMPORT_FIELDS) {
    if (NUMERIC_FIELDS.has(field)) {
      const parsed = parseImportNumber(mapped[field]);
      if (!parsed.ok) {
        errors.push(`${field} must be a number.`);
        material[field] = null;
      } else {
        material[field] = parsed.value;
      }
    } else if (field === "is_active") {
      material[field] = parseActiveValue(mapped[field]);
    } else {
      material[field] = textValue(mapped[field]);
    }
  }

  const catalogFields = normalizeMaterialCatalogFields(material);
  Object.assign(material, catalogFields);
  if (!material.material_type) material.material_type = "other";
  if (!material.unit) material.unit = "";
  if (!material.name && material.decor_name) material.name = material.decor_name;

  if (!material.code && !material.decor_code) errors.push("code or decor_code is required.");
  if (!material.name && !material.decor_name) errors.push("name or decor_name is required.");
  for (const field of NON_NEGATIVE_FIELDS) {
    if (material[field] !== null && material[field] < 0) errors.push(`${field} cannot be negative.`);
  }

  return {
    row_number: rowNumber,
    material,
    errors,
    warnings: [],
    valid: false,
    status: "invalid",
    existing_id: null,
    duplicate_key: "",
    duplicate_key_type: "",
    file_duplicate: false,
    hasContent: Object.values(original).some((value) => textValue(value) !== "")
  };
}

export function parseImportNumber(value) {
  if (value === "" || value === null || value === undefined) return { ok: true, value: null };
  if (typeof value === "number") return Number.isFinite(value) ? { ok: true, value } : { ok: false, value: null };
  const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return { ok: true, value: null };
  const number = Number(normalized);
  return Number.isFinite(number) ? { ok: true, value: number } : { ok: false, value: null };
}

export function fieldForHeader(header) {
  return HEADER_ALIASES.get(normalizeHeader(header)) || "";
}

export function materialDuplicateKey(material) {
  const producer = normalizeKeyPart(material.producer);
  const decorCode = normalizeKeyPart(material.decor_code);
  const structure = normalizeKeyPart(material.structure);
  const thickness = material.thickness === null || material.thickness === undefined ? "" : normalizeKeyPart(material.thickness);
  if (producer && decorCode && structure && thickness) {
    return { type: "decor", value: `decor:${producer}|${decorCode}|${structure}|${thickness}` };
  }
  const code = normalizeKeyPart(material.code);
  if (code) return { type: "code", value: `code:${code}` };
  return null;
}

export function buildExistingKeyIndex(existingMaterials = []) {
  const keys = new Map();
  for (const material of existingMaterials) {
    const key = materialDuplicateKey(material);
    if (key && !keys.has(key.value)) keys.set(key.value, material);
  }
  return keys;
}

function findExistingMaterialId(db, material) {
  const key = materialDuplicateKey(material);
  if (!key) return null;
  if (key.type === "decor") {
    const row = db.prepare(`
      SELECT id FROM materials
      WHERE lower(trim(producer)) = lower(trim(?))
        AND lower(trim(decor_code)) = lower(trim(?))
        AND lower(trim(structure)) = lower(trim(?))
        AND COALESCE(thickness, '') = COALESCE(?, '')
      LIMIT 1
    `).get(material.producer, material.decor_code, material.structure, material.thickness);
    return row?.id || null;
  }
  const row = db.prepare("SELECT id FROM materials WHERE lower(trim(code)) = lower(trim(?)) LIMIT 1").get(material.code);
  return row?.id || null;
}

function nextMaterialId(db) {
  const row = db.prepare("SELECT MAX(id) AS max_id FROM materials WHERE id >= 1001").get();
  return Math.max(1001, Number(row.max_id || 1000) + 1);
}

function materialInsertValues(material) {
  return [
    material.code,
    material.name || material.decor_name || material.code || material.decor_code,
    material.unit,
    material.price,
    material.thickness,
    material.length,
    material.width,
    material.producer,
    material.decor_code,
    material.decor_name,
    material.structure,
    material.material_type || "other",
    material.supplier,
    material.location,
    material.min_stock ?? 0,
    material.is_active === 0 ? 0 : 1
  ];
}

function materialUpdateValues(material) {
  return materialInsertValues(material);
}

function statusForPreviewRow(row) {
  if (!row.valid) return "invalid";
  if (row.file_duplicate) return "duplicate";
  if (row.existing_id) return "existing";
  if (row.warnings.length) return "warning";
  return "new";
}

function summarizePreviewRows(rows) {
  const summary = { total: rows.length, valid: 0, invalid: 0, new: 0, existing: 0, duplicates: 0, warnings: 0 };
  for (const row of rows) {
    if (row.valid) summary.valid += 1;
    else summary.invalid += 1;
    if (row.status === "new") summary.new += 1;
    if (row.status === "existing") summary.existing += 1;
    if (row.status === "duplicate") summary.duplicates += 1;
    if (row.status === "warning") summary.warnings += 1;
  }
  return summary;
}

function parseActiveValue(value) {
  if (value === "" || value === null || value === undefined) return 1;
  const normalized = normalizeKeyPart(value);
  if (ACTIVE_TRUE.has(normalized)) return 1;
  if (ACTIVE_FALSE.has(normalized)) return 0;
  return 1;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeKeyPart(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function textValue(value) {
  return String(value ?? "").trim();
}

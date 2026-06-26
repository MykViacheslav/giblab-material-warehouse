import { getAvailableQuantity } from "./stockLogic.js";

export function buildPurchaseNeedsReport(rows = []) {
  const needs = rows
    .filter((row) => !isTrue(row.isfolder))
    .filter((row) => isActive(row.is_active))
    .map((row) => {
      const quantity = numberValue(row.quantity);
      const reserved = numberValue(row.reserved);
      const available = getAvailableQuantity({ quantity, reserved });
      const minStock = numberValue(row.min_stock);
      const orderQuantity = Math.max(0, minStock - available);
      return {
        id: row.id,
        code: textValue(row.code),
        name: textValue(row.name),
        producer: textValue(row.producer),
        decor_code: textValue(row.decor_code),
        decor_name: textValue(row.decor_name),
        structure: textValue(row.structure),
        material_type: textValue(row.material_type),
        supplier: textValue(row.supplier),
        location: textValue(row.location),
        thickness: nullableNumber(row.thickness),
        length: nullableNumber(row.length),
        width: nullableNumber(row.width),
        unit: textValue(row.unit),
        quantity,
        reserved,
        available,
        min_stock: minStock,
        order_quantity: orderQuantity
      };
    })
    .filter((row) => row.min_stock > 0 && row.order_quantity > 0)
    .sort(comparePurchaseNeeds);

  return {
    rows: needs,
    summary: summarizePurchaseNeeds(needs)
  };
}

export function summarizePurchaseNeeds(rows = []) {
  const bySupplier = new Map();
  for (const row of rows) {
    const supplier = row.supplier || "Bez dostawcy";
    const current = bySupplier.get(supplier) || { supplier, rows: 0, order_quantity: 0 };
    current.rows += 1;
    current.order_quantity += Number(row.order_quantity || 0);
    bySupplier.set(supplier, current);
  }
  return {
    total_rows: rows.length,
    total_order_quantity: rows.reduce((sum, row) => sum + Number(row.order_quantity || 0), 0),
    suppliers: [...bySupplier.values()].sort((first, second) => first.supplier.localeCompare(second.supplier, "pl"))
  };
}

function comparePurchaseNeeds(first, second) {
  return String(first.supplier || "").localeCompare(String(second.supplier || ""), "pl")
    || String(first.producer || "").localeCompare(String(second.producer || ""), "pl")
    || String(first.decor_code || first.code || first.name).localeCompare(String(second.decor_code || second.code || second.name), "pl");
}

function numberValue(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function textValue(value) {
  return String(value ?? "").trim();
}

function isTrue(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function isActive(value) {
  if (value === undefined || value === null || value === "") return true;
  return isTrue(value);
}

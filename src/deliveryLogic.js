import { parsePositiveQuantity, StockMovementError } from "./stockLogic.js";
import { applyStockEventToDatabase } from "./stockRepository.js";

export const DELIVERY_STATUSES = new Set(["draft", "posted"]);
export const DELIVERY_CORRECTION_STATUSES = new Set(["draft", "posted", "cancelled"]);

export function normalizeDelivery(input = {}) {
  return {
    supplier: textValue(input.supplier),
    document_number: textValue(input.document_number ?? input.documentNumber),
    delivery_date: textValue(input.delivery_date ?? input.deliveryDate) || new Date().toISOString().slice(0, 10),
    status: DELIVERY_STATUSES.has(input.status) ? input.status : "draft",
    notes: textValue(input.notes)
  };
}

export function normalizeDeliveryLine(input = {}) {
  const materialId = Number(input.material_id ?? input.materialId);
  const quantity = parsePositiveQuantity(input.quantity);
  return {
    material_id: Number.isFinite(materialId) && materialId > 0 ? materialId : null,
    material_code: textValue(input.material_code ?? input.materialCode),
    material_name: textValue(input.material_name ?? input.materialName),
    quantity,
    unit_price: moneyValue(input.unit_price ?? input.unitPrice),
    notes: textValue(input.notes)
  };
}

export function normalizeDeliveryCorrection(input = {}) {
  return {
    correction_number: textValue(input.correction_number ?? input.correctionNumber),
    reason: textValue(input.reason),
    status: DELIVERY_CORRECTION_STATUSES.has(input.status) ? input.status : "draft",
    note: textValue(input.note ?? input.notes)
  };
}

export function normalizeDeliveryCorrectionLine(input = {}) {
  const materialId = Number(input.material_id ?? input.materialId);
  const quantityDelta = signedQuantity(input.quantity_delta ?? input.quantityDelta);
  const unitPriceNet = moneyValue(input.unit_price_net ?? input.unitPriceNet ?? input.unit_price ?? input.unitPrice);
  return {
    material_id: Number.isFinite(materialId) && materialId > 0 ? materialId : null,
    quantity_delta: quantityDelta,
    unit_price_net: unitPriceNet,
    line_total_net_delta: quantityDelta * unitPriceNet,
    note: textValue(input.note ?? input.notes)
  };
}

export function postDeliveryToDatabase(db, deliveryId) {
  const delivery = db.prepare("SELECT * FROM deliveries WHERE id = ?").get(deliveryId);
  if (!delivery) throw new DeliveryError("Delivery not found");
  if (delivery.status === "posted") throw new DeliveryError("Delivery is already posted");
  const lines = db.prepare("SELECT * FROM delivery_lines WHERE delivery_id = ? ORDER BY id").all(deliveryId);
  if (!lines.length) throw new DeliveryError("Delivery has no lines");

  db.exec("BEGIN");
  try {
    for (const line of lines) {
      const material = db.prepare("SELECT id, code, name FROM materials WHERE id = ?").get(line.material_id);
      if (!material) throw new DeliveryError(`Material not found for delivery line ${line.id}`);
      const quantity = parsePositiveQuantity(line.quantity);
      const note = delivery.document_number
        ? `Dostawa ${delivery.document_number}: ${delivery.supplier || ""}`.trim()
        : `Dostawa ${delivery.id}: ${delivery.supplier || ""}`.trim();
      applyStockEventToDatabase(db, {
        materialId: material.id,
        eventType: "receive",
        quantity,
        note
      });
    }
    db.prepare("UPDATE deliveries SET status = 'posted', posted_at = CURRENT_TIMESTAMP WHERE id = ?").run(deliveryId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return db.prepare("SELECT * FROM deliveries WHERE id = ?").get(deliveryId);
}

export function postDeliveryCorrectionToDatabase(db, correctionId) {
  const correction = db.prepare("SELECT * FROM delivery_corrections WHERE id = ?").get(correctionId);
  if (!correction) throw new DeliveryError("Delivery correction not found");
  if (correction.status === "posted") throw new DeliveryError("Delivery correction is already posted");
  if (correction.status === "cancelled") throw new DeliveryError("Delivery correction is cancelled");
  const original = db.prepare("SELECT * FROM deliveries WHERE id = ?").get(correction.original_delivery_id);
  if (!original) throw new DeliveryError("Original delivery not found");
  if (original.status !== "posted") throw new DeliveryError("Only posted deliveries can be corrected");
  const lines = db.prepare("SELECT * FROM delivery_correction_lines WHERE correction_id = ? ORDER BY id").all(correctionId);
  if (!lines.length) throw new DeliveryError("Delivery correction has no lines");

  db.exec("BEGIN");
  try {
    let totalNetDelta = 0;
    for (const line of lines) {
      const material = db.prepare("SELECT id, code, name FROM materials WHERE id = ?").get(line.material_id);
      if (!material) throw new DeliveryError(`Material not found for correction line ${line.id}`);
      const delta = signedQuantity(line.quantity_delta);
      const note = correction.correction_number
        ? `Korekta dostawy ${correction.correction_number}: ${correction.reason}`
        : `Korekta dostawy ${correction.id}: ${correction.reason}`;
      applyStockEventToDatabase(db, {
        materialId: material.id,
        eventType: delta > 0 ? "receive" : "use",
        quantity: parsePositiveQuantity(Math.abs(delta)),
        note
      });
      totalNetDelta += Number(line.line_total_net_delta || 0);
    }
    db.prepare(`
      UPDATE delivery_corrections
      SET status = 'posted', posted_at = CURRENT_TIMESTAMP, total_net_delta = ?
      WHERE id = ?
    `).run(totalNetDelta, correctionId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    if (error instanceof StockMovementError) throw error;
    throw error;
  }

  return db.prepare("SELECT * FROM delivery_corrections WHERE id = ?").get(correctionId);
}

export class DeliveryError extends Error {}

function textValue(value) {
  return String(value ?? "").trim();
}

function moneyValue(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function signedQuantity(value) {
  if (value === "" || value === null || value === undefined) throw new DeliveryError("Quantity delta is required");
  const number = Number(String(value).replace(/\s+/g, "").replace(",", "."));
  if (!Number.isFinite(number) || number === 0) throw new DeliveryError("Quantity delta must be non-zero");
  return number;
}

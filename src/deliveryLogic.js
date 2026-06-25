import { parsePositiveQuantity } from "./stockLogic.js";
import { applyStockEventToDatabase } from "./stockRepository.js";

export const DELIVERY_STATUSES = new Set(["draft", "posted"]);

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

export class DeliveryError extends Error {}

function textValue(value) {
  return String(value ?? "").trim();
}

function moneyValue(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

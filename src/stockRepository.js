import { applyStockEvent, getAvailableQuantity } from "./stockLogic.js";

export function withAvailableStock(row) {
  if (!row) return row;
  return { ...row, available: getAvailableQuantity(row) };
}

export function applyStockEventToDatabase(db, { materialId, eventType, quantity, note = "" }) {
  db.prepare("INSERT OR IGNORE INTO stock (material_id) VALUES (?)").run(materialId);
  const current = db.prepare("SELECT * FROM stock WHERE material_id = ?").get(materialId);
  const next = applyStockEvent(current, eventType, quantity);
  db.prepare("UPDATE stock SET quantity = ?, reserved = ?, used = ? WHERE material_id = ?").run(next.quantity, next.reserved, next.used, materialId);
  db.prepare("INSERT INTO stock_events (material_id, event_type, quantity, note) VALUES (?, ?, ?, ?)").run(materialId, eventType, quantity, note);
  return withAvailableStock({ ...next, material_id: materialId });
}

export function listStockEvents(db, materialId) {
  return db.prepare(`
    SELECT id, material_id, event_type AS type, quantity, note, created_at
    FROM stock_events
    WHERE material_id = ?
    ORDER BY id DESC
  `).all(materialId);
}

import { Router } from "express";

export function createDeliveriesRouter(deps) {
  const router = Router();
  const {
    db,
    selectDeliveries,
    selectDelivery,
    selectDeliveryLines,
    selectDeliveryCorrections,
    selectDeliveryCorrection,
    selectDeliveryCorrectionLines,
    normalizeDelivery,
    normalizeDeliveryLine,
    normalizeDeliveryCorrection,
    normalizeDeliveryCorrectionLine,
    postDeliveryToDatabase,
    postDeliveryCorrectionToDatabase,
    DeliveryError,
    runInTransaction,
    StockMovementError
  } = deps;

router.get("/api/price-items", (request, response) => {
  response.json(db.prepare("SELECT * FROM price_items WHERE active = 1 ORDER BY category, name").all());
});

router.post("/api/price-items", (request, response) => {
  const payload = normalizePriceItem(request.body);
  const result = db.prepare(`
    INSERT INTO price_items (code, name, unit, unit_price, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(payload.code, payload.name, payload.unit, payload.unit_price, payload.category);
  response.status(201).json(db.prepare("SELECT * FROM price_items WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/api/price-items/:id", (request, response) => {
  const id = Number(request.params.id);
  const payload = normalizePriceItem(request.body);
  db.prepare(`
    UPDATE price_items
    SET code = ?, name = ?, unit = ?, unit_price = ?, category = ?, active = ?
    WHERE id = ?
  `).run(payload.code, payload.name, payload.unit, payload.unit_price, payload.category, payload.active, id);
  response.json(db.prepare("SELECT * FROM price_items WHERE id = ?").get(id));
});

router.delete("/api/price-items/:id", (request, response) => {
  const id = Number(request.params.id);
  const item = db.prepare("SELECT * FROM price_items WHERE id = ?").get(id);
  if (!item) return response.status(404).json({ error: "Price item not found" });
  db.prepare("UPDATE price_items SET active = 0 WHERE id = ?").run(id);
  response.status(204).end();
});

router.get("/api/supplies", (request, response) => {
  response.json(db.prepare("SELECT * FROM supplies WHERE active = 1 ORDER BY category, name, id").all());
});

router.post("/api/supplies", (request, response) => {
  const payload = normalizeSupply(request.body);
  const result = db.prepare(`
    INSERT INTO supplies (category, code, name, unit, price, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(payload.category, payload.code, payload.name, payload.unit, payload.price, payload.quantity, payload.notes);
  response.status(201).json(db.prepare("SELECT * FROM supplies WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/api/supplies/:id", (request, response) => {
  const id = Number(request.params.id);
  const payload = normalizeSupply(request.body);
  db.prepare(`
    UPDATE supplies
    SET category = ?, code = ?, name = ?, unit = ?, price = ?, quantity = ?, notes = ?, active = ?
    WHERE id = ?
  `).run(payload.category, payload.code, payload.name, payload.unit, payload.price, payload.quantity, payload.notes, payload.active, id);
  response.json(db.prepare("SELECT * FROM supplies WHERE id = ?").get(id));
});

router.delete("/api/supplies/:id", (request, response) => {
  db.prepare("UPDATE supplies SET active = 0 WHERE id = ?").run(Number(request.params.id));
  response.status(204).end();
});

router.get("/api/deliveries", (request, response) => {
  response.json(selectDeliveries.all());
});

router.post("/api/deliveries", (request, response) => {
  const payload = normalizeDelivery(request.body);
  const result = db.prepare(`
    INSERT INTO deliveries (supplier, document_number, delivery_date, status, notes)
    VALUES (?, ?, ?, 'draft', ?)
  `).run(payload.supplier, payload.document_number, payload.delivery_date, payload.notes);
  response.status(201).json(selectDelivery.get(result.lastInsertRowid));
});

router.put("/api/deliveries/:id", (request, response) => {
  const id = Number(request.params.id);
  const delivery = selectDelivery.get(id);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be edited" });
  const payload = normalizeDelivery(request.body);
  db.prepare(`
    UPDATE deliveries
    SET supplier = ?, document_number = ?, delivery_date = ?, notes = ?
    WHERE id = ?
  `).run(payload.supplier, payload.document_number, payload.delivery_date, payload.notes, id);
  response.json(selectDelivery.get(id));
});

router.delete("/api/deliveries/:id", (request, response) => {
  const id = Number(request.params.id);
  const delivery = selectDelivery.get(id);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be deleted" });
  db.prepare("DELETE FROM deliveries WHERE id = ?").run(id);
  response.status(204).end();
});

router.post("/api/deliveries/:id/cancel", (request, response) => {
  const delivery = selectDelivery.get(Number(request.params.id));
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  return response.status(400).json({ error: "Posted deliveries cannot be cancelled directly. Create a delivery correction instead." });
});

router.get("/api/deliveries/:id/lines", (request, response) => {
  const id = Number(request.params.id);
  if (!selectDelivery.get(id)) return response.status(404).json({ error: "Delivery not found" });
  response.json(selectDeliveryLines.all(id));
});

router.post("/api/deliveries/:id/lines", (request, response) => {
  const deliveryId = Number(request.params.id);
  const delivery = selectDelivery.get(deliveryId);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be edited" });
  try {
    const payload = normalizeDeliveryLine(request.body);
    const material = selectMaterial.get(payload.material_id);
    if (!material || material.isfolder) return response.status(400).json({ error: "Valid material is required" });
    const result = db.prepare(`
      INSERT INTO delivery_lines (delivery_id, material_id, material_code, material_name, quantity, unit_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      deliveryId,
      material.id,
      material.code || payload.material_code,
      material.name || payload.material_name,
      payload.quantity,
      payload.unit_price,
      payload.notes
    );
    response.status(201).json(db.prepare("SELECT * FROM delivery_lines WHERE id = ?").get(result.lastInsertRowid));
  } catch (error) {
    if (error instanceof StockMovementError) return response.status(400).json({ error: error.message, details: error.details });
    throw error;
  }
});

router.delete("/api/delivery-lines/:id", (request, response) => {
  const id = Number(request.params.id);
  const line = db.prepare("SELECT * FROM delivery_lines WHERE id = ?").get(id);
  if (!line) return response.status(404).json({ error: "Delivery line not found" });
  const delivery = selectDelivery.get(line.delivery_id);
  if (delivery?.status === "posted") return response.status(400).json({ error: "Posted delivery cannot be edited" });
  db.prepare("DELETE FROM delivery_lines WHERE id = ?").run(id);
  response.status(204).end();
});

router.post("/api/deliveries/:id/post", (request, response) => {
  const id = Number(request.params.id);
  try {
    const delivery = postDeliveryToDatabase(db, id);
    response.json({
      ...delivery,
      lines: selectDeliveryLines.all(id),
      stock: selectStock.all().map(withAvailableStock)
    });
  } catch (error) {
    if (error instanceof DeliveryError || error instanceof StockMovementError) {
      return response.status(400).json({ error: error.message, details: error.details });
    }
    throw error;
  }
});

router.get("/api/delivery-corrections", (request, response) => {
  response.json(selectDeliveryCorrections.all());
});

router.post("/api/deliveries/:id/corrections", (request, response) => {
  const deliveryId = Number(request.params.id);
  const delivery = selectDelivery.get(deliveryId);
  if (!delivery) return response.status(404).json({ error: "Delivery not found" });
  if (delivery.status !== "posted") return response.status(400).json({ error: "Only posted deliveries can be corrected" });
  const payload = normalizeDeliveryCorrection(request.body);
  if (!payload.reason) return response.status(400).json({ error: "Correction reason is required" });
  const result = db.prepare(`
    INSERT INTO delivery_corrections (original_delivery_id, correction_number, reason, status, note)
    VALUES (?, ?, ?, 'draft', ?)
  `).run(deliveryId, payload.correction_number, payload.reason, payload.note);
  response.status(201).json(selectDeliveryCorrection.get(result.lastInsertRowid));
});

router.put("/api/delivery-corrections/:id", (request, response) => {
  const id = Number(request.params.id);
  const correction = selectDeliveryCorrection.get(id);
  if (!correction) return response.status(404).json({ error: "Delivery correction not found" });
  if (correction.status !== "draft") return response.status(400).json({ error: "Posted correction cannot be edited" });
  const payload = normalizeDeliveryCorrection(request.body);
  if (!payload.reason) return response.status(400).json({ error: "Correction reason is required" });
  db.prepare(`
    UPDATE delivery_corrections
    SET correction_number = ?, reason = ?, note = ?
    WHERE id = ?
  `).run(payload.correction_number, payload.reason, payload.note, id);
  response.json(selectDeliveryCorrection.get(id));
});

router.get("/api/delivery-corrections/:id/lines", (request, response) => {
  const id = Number(request.params.id);
  if (!selectDeliveryCorrection.get(id)) return response.status(404).json({ error: "Delivery correction not found" });
  response.json(selectDeliveryCorrectionLines.all(id));
});

router.post("/api/delivery-corrections/:id/lines", (request, response) => {
  const correctionId = Number(request.params.id);
  const correction = selectDeliveryCorrection.get(correctionId);
  if (!correction) return response.status(404).json({ error: "Delivery correction not found" });
  if (correction.status !== "draft") return response.status(400).json({ error: "Posted correction cannot be edited" });
  try {
    const payload = normalizeDeliveryCorrectionLine(request.body);
    const material = selectMaterial.get(payload.material_id);
    if (!material || material.isfolder) return response.status(400).json({ error: "Valid material is required" });
    const result = db.prepare(`
      INSERT INTO delivery_correction_lines (correction_id, material_id, quantity_delta, unit_price_net, line_total_net_delta, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(correctionId, material.id, payload.quantity_delta, payload.unit_price_net, payload.line_total_net_delta, payload.note);
    response.status(201).json(selectDeliveryCorrectionLines.all(correctionId).find((line) => line.id === result.lastInsertRowid));
  } catch (error) {
    if (error instanceof DeliveryError) return response.status(400).json({ error: error.message });
    throw error;
  }
});

router.delete("/api/delivery-correction-lines/:id", (request, response) => {
  const id = Number(request.params.id);
  const line = db.prepare("SELECT * FROM delivery_correction_lines WHERE id = ?").get(id);
  if (!line) return response.status(404).json({ error: "Delivery correction line not found" });
  const correction = selectDeliveryCorrection.get(line.correction_id);
  if (correction?.status !== "draft") return response.status(400).json({ error: "Posted correction cannot be edited" });
  db.prepare("DELETE FROM delivery_correction_lines WHERE id = ?").run(id);
  response.status(204).end();
});

router.post("/api/delivery-corrections/:id/post", (request, response) => {
  const id = Number(request.params.id);
  try {
    const correction = postDeliveryCorrectionToDatabase(db, id);
    response.json({
      ...correction,
      lines: selectDeliveryCorrectionLines.all(id),
      stock: selectStock.all().map(withAvailableStock)
    });
  } catch (error) {
    if (error instanceof DeliveryError || error instanceof StockMovementError) {
      return response.status(400).json({ error: error.message, details: error.details });
    }
    throw error;
  }
});

  return router;
}

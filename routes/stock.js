import { Router } from "express";
import { StockMovementError, parseNonNegativeQuantity, parsePositiveQuantity } from "../src/stockLogic.js";
import { applyStockEventToDatabase, listStockEvents, withAvailableStock } from "../src/stockRepository.js";

export function createStockRouter({
  db,
  selectMaterial,
  selectStockById,
  runInTransaction
}) {
  const router = Router();

  router.post("/event", (request, response) => {
    const materialId = Number(request.body.material_id);
    const eventType = String(request.body.event_type || "");
    const note = String(request.body.note || "");
    if (!materialId || !["receive", "reserve", "release", "use", "use_reserved", "adjust"].includes(eventType)) {
      return response.status(400).json({ error: "Invalid stock event" });
    }
    if (!selectMaterial.get(materialId)) return response.status(404).json({ error: "Material not found" });
    try {
      const quantity = eventType === "adjust"
        ? parseNonNegativeQuantity(request.body.quantity)
        : parsePositiveQuantity(request.body.quantity);
      const updated = runInTransaction(() => {
        applyStockEventToDatabase(db, { materialId, eventType, quantity, note });
        return withAvailableStock(selectStockById.get(materialId));
      });
      response.json(updated);
    } catch (error) {
      if (error instanceof StockMovementError) return response.status(400).json({ error: error.message, details: error.details });
      throw error;
    }
  });

  router.get("/:materialId/events", (request, response) => {
    const materialId = Number(request.params.materialId);
    if (!materialId) return response.status(400).json({ error: "Invalid material id" });
    if (!selectMaterial.get(materialId)) return response.status(404).json({ error: "Material not found" });
    try {
      response.json(listStockEvents(db, materialId));
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Could not load stock history" });
    }
  });

  return router;
}

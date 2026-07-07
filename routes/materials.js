import { Router } from "express";

export function createMaterialsRouter(deps) {
  const router = Router();
  const {
    db,
    upload,
    selectMaterials,
    selectMaterial,
    selectStock,
    selectStockById,
    insertMaterialSql,
    updateMaterialSql,
    materialValues,
    materialUpdateValues,
    nextMaterialId,
    buildTree,
    withAvailableStock,
    buildFilteredPurchaseNeedsReport,
    purchaseNeedsToCsv,
    readCatalogImportRows,
    previewMaterialImport,
    commitMaterialImport,
    normalizeMaterial,
    getMaterialDeleteBlockers
  } = deps;

router.get("/api/materials", (request, response) => {
  response.json(buildTree(selectStock.all().map(withAvailableStock)));
});

router.get("/api/materials/flat", (request, response) => {
  response.json(selectStock.all().map(withAvailableStock));
});

router.get("/api/purchase-needs", (request, response) => {
  response.json(buildFilteredPurchaseNeedsReport(selectStock.all().map(withAvailableStock), request.query));
});

router.get("/api/purchase-needs.csv", (request, response) => {
  const report = buildFilteredPurchaseNeedsReport(selectStock.all().map(withAvailableStock), request.query);
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", "attachment; filename=\"purchase-needs.csv\"");
  response.send(`\uFEFF${purchaseNeedsToCsv(report.rows)}`);
});

router.post("/api/materials/import-preview", upload.single("catalog"), (request, response) => {
  if (!request.file?.buffer) return response.status(400).json({ error: "Import file is required" });
  try {
    const rows = readCatalogImportRows(request.file.buffer, request.file.originalname);
    const preview = previewMaterialImport(rows, selectMaterials.all());
    response.json({
      filename: request.file.originalname,
      ...preview
    });
  } catch (error) {
    console.error(error);
    response.status(400).json({ error: "Could not parse material catalog file" });
  }
});

router.post("/api/materials/import-commit", (request, response) => {
  const rows = Array.isArray(request.body.rows) ? request.body.rows : [];
  const mode = String(request.body.mode || "upsert");
  if (!rows.length) return response.status(400).json({ error: "No import rows supplied" });
  try {
    const result = commitMaterialImport(db, rows, mode, { existingMaterials: selectMaterials.all() });
    response.json(result);
  } catch (error) {
    console.error(error);
    response.status(400).json({ error: error.message || "Could not commit material catalog import" });
  }
});

router.post("/api/materials", (request, response) => {
  const payload = normalizeMaterial(request.body);
  const id = payload.id !== null ? payload.id : nextMaterialId(payload.isfolder);
  db.prepare(insertMaterialSql).run(...materialValues({ ...payload, id }), id);
  db.prepare("INSERT OR IGNORE INTO stock (material_id) VALUES (?)").run(id);
  response.status(201).json(withAvailableStock(selectStockById.get(id)));
});

router.put("/api/materials/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectMaterial.get(id)) return response.status(404).json({ error: "Material not found" });
  const payload = normalizeMaterial({ ...request.body, id });
  db.prepare(updateMaterialSql).run(...materialUpdateValues(payload), id);
  response.json(withAvailableStock(selectStockById.get(id)));
});

router.delete("/api/materials/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectMaterial.get(id)) return response.status(404).json({ error: "Material not found" });
  const blockers = getMaterialDeleteBlockers(db, id);
  if (blockers.length) return response.status(409).json({ error: "Material cannot be deleted safely", blockers });
  db.prepare("DELETE FROM stock WHERE material_id = ?").run(id);
  db.prepare("DELETE FROM materials WHERE id = ?").run(id);
  response.status(204).end();
});

  return router;
}

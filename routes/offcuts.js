import { Router } from "express";

export function createOffcutsRouter(deps) {
  const router = Router();
  const {
    db,
    runInTransaction,
    normalizeOffcutStorageLocation,
    storageLocationErrorMessage,
    normalizeOffcut,
    assignOffcutStorageLocation,
    normalizeStationName,
    requestStation
  } = deps;

router.get("/api/offcuts", (request, response) => {
  response.json(db.prepare(`
    SELECT * FROM offcuts
    ORDER BY
      CASE WHEN status = 'available' THEN 0 WHEN status = 'reserved' THEN 1 ELSE 2 END,
      created_at DESC
  `).all());
});

router.get("/api/offcut-storage-locations", (request, response) => {
  response.json(db.prepare("SELECT * FROM offcut_storage_locations ORDER BY sort_order, id").all());
});

router.post("/api/offcut-storage-locations", (request, response) => {
  try {
    const payload = normalizeOffcutStorageLocation(request.body);
    const result = db.prepare(`
      INSERT INTO offcut_storage_locations (
        code, name, min_long_side, max_long_side, min_short_side, max_short_side, sort_order, active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.code,
      payload.name,
      payload.min_long_side,
      payload.max_long_side,
      payload.min_short_side,
      payload.max_short_side,
      payload.sort_order,
      payload.active
    );
    response.status(201).json(db.prepare("SELECT * FROM offcut_storage_locations WHERE id = ?").get(result.lastInsertRowid));
  } catch (error) {
    response.status(400).json({ error: storageLocationErrorMessage(error) });
  }
});

router.put("/api/offcut-storage-locations/:id", (request, response) => {
  const id = Number(request.params.id || 0);
  const existing = db.prepare("SELECT * FROM offcut_storage_locations WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Storage location not found" });
  try {
    const payload = normalizeOffcutStorageLocation({ ...existing, ...request.body });
    db.prepare(`
      UPDATE offcut_storage_locations
      SET code = ?, name = ?, min_long_side = ?, max_long_side = ?, min_short_side = ?, max_short_side = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(
      payload.code,
      payload.name,
      payload.min_long_side,
      payload.max_long_side,
      payload.min_short_side,
      payload.max_short_side,
      payload.sort_order,
      payload.active,
      id
    );
    response.json(db.prepare("SELECT * FROM offcut_storage_locations WHERE id = ?").get(id));
  } catch (error) {
    response.status(400).json({ error: storageLocationErrorMessage(error) });
  }
});

router.delete("/api/offcut-storage-locations/:id", (request, response) => {
  const id = Number(request.params.id || 0);
  const existing = db.prepare("SELECT id FROM offcut_storage_locations WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Storage location not found" });
  db.prepare("DELETE FROM offcut_storage_locations WHERE id = ?").run(id);
  response.status(204).end();
});

router.post("/api/offcuts", (request, response) => {
  const payload = normalizeOffcut(request.body);
  db.prepare(`
    INSERT OR REPLACE INTO offcuts (
      id, material_id, code, length, width, quantity, is_business, project_name, project_path,
      storage_location, storage_note, reserved_by, reserved_at, reserved_project, source_station, used_by, used_at, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    payload.id,
    payload.material_id,
    payload.code,
    payload.length,
    payload.width,
    payload.quantity,
    payload.is_business,
    payload.project_name,
    payload.project_path,
    payload.storage_location,
    payload.storage_note,
    payload.reserved_by,
    payload.reserved_at,
    payload.reserved_project,
    payload.source_station,
    payload.used_by,
    payload.used_at,
    payload.status
  );
  response.status(201).json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(payload.id));
});

router.put("/api/offcuts/:id", (request, response) => {
  const id = String(request.params.id || "").trim();
  const existing = db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  const payload = normalizeOffcut({ ...existing, ...request.body, id });
  db.prepare(`
    UPDATE offcuts
    SET material_id = ?, code = ?, length = ?, width = ?, quantity = ?, is_business = ?, project_name = ?, project_path = ?,
      storage_location = ?, storage_note = ?, reserved_by = ?, reserved_at = ?, reserved_project = ?, source_station = ?,
      used_by = ?, used_at = ?, status = ?
    WHERE id = ?
  `).run(
    payload.material_id,
    payload.code,
    payload.length,
    payload.width,
    payload.quantity,
    payload.is_business,
    payload.project_name,
    payload.project_path,
    payload.storage_location,
    payload.storage_note,
    payload.reserved_by,
    payload.reserved_at,
    payload.reserved_project,
    payload.source_station,
    payload.used_by,
    payload.used_at,
    payload.status,
    id
  );
  response.json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id));
});

router.post("/api/offcuts/reassign-storage", (request, response) => {
  const rows = db.prepare("SELECT id, length, width FROM offcuts WHERE status = 'available'").all();
  const update = db.prepare("UPDATE offcuts SET storage_location = ? WHERE id = ?");
  let updated = 0;
  runInTransaction(() => {
    for (const row of rows) {
      update.run(assignOffcutStorageLocation(row.length, row.width), row.id);
      updated += 1;
    }
  });
  response.json({ updated });
});

router.post("/api/offcuts/:id/assign-storage", (request, response) => {
  const id = String(request.params.id || "").trim();
  const existing = db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  const storageLocation = assignOffcutStorageLocation(existing.length, existing.width);
  db.prepare("UPDATE offcuts SET storage_location = ? WHERE id = ?").run(storageLocation, id);
  response.json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id));
});

router.post("/api/offcuts/:id/reserve", (request, response) => {
  const id = String(request.params.id || "").trim();
  const station = normalizeStationName(request.body?.station || requestStation(request));
  const project = String(request.body?.project || "").trim();
  const existing = db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  if (existing.status === "used") return response.status(409).json({ error: "Ta resztka jest już zużyta" });
  if (existing.status === "reserved" && existing.reserved_by && existing.reserved_by !== station) {
    return response.status(409).json({
      error: `Ta resztka jest już zarezerwowana przez ${existing.reserved_by}`,
      offcut: existing
    });
  }
  db.prepare(`
    UPDATE offcuts
    SET status = 'reserved', reserved_by = ?, reserved_at = CURRENT_TIMESTAMP, reserved_project = ?
    WHERE id = ? AND (status = 'available' OR (status = 'reserved' AND reserved_by = ?))
  `).run(station, project, id, station);
  response.json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id));
});

router.post("/api/offcuts/:id/release", (request, response) => {
  const id = String(request.params.id || "").trim();
  const existing = db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  if (existing.status === "used") return response.status(409).json({ error: "Zużytej resztki nie można zwolnić" });
  db.prepare(`
    UPDATE offcuts
    SET status = 'available', reserved_by = '', reserved_at = '', reserved_project = ''
    WHERE id = ?
  `).run(id);
  response.json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id));
});

router.post("/api/offcuts/:id/use", (request, response) => {
  const id = String(request.params.id || "").trim();
  const station = normalizeStationName(request.body?.station || requestStation(request));
  const existing = db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  if (existing.status === "used") return response.status(409).json({ error: "Ta resztka jest już oznaczona jako zużyta" });
  if (existing.status === "reserved" && existing.reserved_by && existing.reserved_by !== station) {
    return response.status(409).json({
      error: `Ta resztka jest zarezerwowana przez ${existing.reserved_by}`,
      offcut: existing
    });
  }
  db.prepare(`
    UPDATE offcuts
    SET status = 'used', used_by = ?, used_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(station, id);
  response.json(db.prepare("SELECT * FROM offcuts WHERE id = ?").get(id));
});

router.delete("/api/offcuts/:id", (request, response) => {
  const id = String(request.params.id || "");
  const existing = db.prepare("SELECT id FROM offcuts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Offcut not found" });
  db.prepare("DELETE FROM offcuts WHERE id = ?").run(id);
  response.status(204).end();
});

  return router;
}

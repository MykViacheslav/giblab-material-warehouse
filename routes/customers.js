import { Router } from "express";
import { getCustomerDeleteBlockers } from "../src/deleteSafety.js";

export function createCustomersRouter({
  db,
  selectCustomers,
  selectCustomer,
  normalizeCustomer,
  getCustomerRelatedDocuments
}) {
  const router = Router();

  router.get("/", (request, response) => {
    response.json(selectCustomers.all());
  });

  router.get("/:id/related-documents", (request, response) => {
    const id = Number(request.params.id);
    if (!selectCustomer.get(id)) return response.status(404).json({ error: "Customer not found" });
    response.json(getCustomerRelatedDocuments(id));
  });

  router.post("/", (request, response) => {
    const payload = normalizeCustomer(request.body);
    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, address, tax_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(payload.name, payload.phone, payload.email, payload.address, payload.tax_id, payload.notes);
    response.status(201).json(selectCustomer.get(result.lastInsertRowid));
  });

  router.put("/:id", (request, response) => {
    const id = Number(request.params.id);
    if (!selectCustomer.get(id)) return response.status(404).json({ error: "Customer not found" });
    const payload = normalizeCustomer(request.body);
    db.prepare(`
      UPDATE customers
      SET name = ?, phone = ?, email = ?, address = ?, tax_id = ?, notes = ?
      WHERE id = ?
    `).run(payload.name, payload.phone, payload.email, payload.address, payload.tax_id, payload.notes, id);
    response.json(selectCustomer.get(id));
  });

  router.delete("/:id", (request, response) => {
    const id = Number(request.params.id);
    if (!selectCustomer.get(id)) return response.status(404).json({ error: "Customer not found" });
    const blockers = getCustomerDeleteBlockers(db, id);
    if (blockers.length) {
      db.prepare("UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      return response.status(204).end();
    }
    db.prepare("DELETE FROM customers WHERE id = ?").run(id);
    response.status(204).end();
  });

  return router;
}

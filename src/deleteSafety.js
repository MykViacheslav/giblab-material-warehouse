function count(db, sql, ...params) {
  return Number(db.prepare(sql).get(...params)?.count || 0);
}

function blocker(code, message, countValue) {
  return { code, message, count: countValue };
}

export function getCustomerDeleteBlockers(db, customerId) {
  const orders = count(db, "SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?", customerId);
  return orders ? [blocker("orders", "Klient ma przypisane zamówienia. Najpierw przepnij zamówienia albo zostaw klienta w bazie.", orders)] : [];
}

export function getOrderDeleteBlockers(db, orderId) {
  const blockers = [];
  const payments = count(db, "SELECT COUNT(*) AS count FROM payments WHERE order_id = ?", orderId);
  const quoteLines = count(db, "SELECT COUNT(*) AS count FROM quote_lines WHERE order_id = ?", orderId);
  const cutJobs = count(db, "SELECT COUNT(*) AS count FROM cut_jobs WHERE order_id = ?", orderId);
  if (payments) blockers.push(blocker("payments", "Zamówienie ma wpłaty. Nie usuwamy go, żeby nie stracić rozliczenia.", payments));
  if (quoteLines) blockers.push(blocker("quote_lines", "Zamówienie ma pozycje wyceny. Usuń je świadomie albo zostaw zamówienie w historii.", quoteLines));
  if (cutJobs) blockers.push(blocker("cut_jobs", "Zamówienie ma pozycje formatek. Nie usuwamy go razem z produkcją.", cutJobs));
  return blockers;
}

export function getMaterialDeleteBlockers(db, materialId) {
  const blockers = [];
  const children = count(db, "SELECT COUNT(*) AS count FROM materials WHERE paren_id = ?", materialId);
  const stock = db.prepare("SELECT quantity, reserved, used FROM stock WHERE material_id = ?").get(materialId);
  const stockEvents = count(db, "SELECT COUNT(*) AS count FROM stock_events WHERE material_id = ?", materialId);
  const offcuts = count(db, "SELECT COUNT(*) AS count FROM offcuts WHERE material_id = ?", materialId);
  const deliveryLines = count(db, "SELECT COUNT(*) AS count FROM delivery_lines WHERE material_id = ?", materialId);
  const correctionLines = count(db, "SELECT COUNT(*) AS count FROM delivery_correction_lines WHERE material_id = ?", materialId);
  const cutJobs = count(db, "SELECT COUNT(*) AS count FROM cut_jobs WHERE material_id = ?", materialId);
  const cutParts = count(db, "SELECT COUNT(*) AS count FROM cut_parts WHERE material_id = ?", materialId);

  if (children) blockers.push(blocker("children", "Folder ma podpozycje. Najpierw przenieś albo usuń dzieci.", children));
  if (stock && (Number(stock.quantity || 0) || Number(stock.reserved || 0) || Number(stock.used || 0))) {
    blockers.push(blocker("stock", "Materiał ma stan, rezerwację albo zużycie. Nie usuwamy go z magazynu.", 1));
  }
  if (stockEvents) blockers.push(blocker("stock_events", "Materiał ma historię magazynową. Historii nie kasujemy.", stockEvents));
  if (offcuts) blockers.push(blocker("offcuts", "Materiał jest przypisany do resztek.", offcuts));
  if (deliveryLines) blockers.push(blocker("delivery_lines", "Materiał występuje w dostawach.", deliveryLines));
  if (correctionLines) blockers.push(blocker("delivery_correction_lines", "Materiał występuje w korektach dostaw.", correctionLines));
  if (cutJobs) blockers.push(blocker("cut_jobs", "Materiał jest użyty w zleceniach formatek.", cutJobs));
  if (cutParts) blockers.push(blocker("cut_parts", "Materiał jest użyty w formatkach.", cutParts));
  return blockers;
}

export function assertNoDeleteBlockers(blockers) {
  if (!blockers.length) return;
  const error = new Error(blockers.map((item) => item.message).join(" "));
  error.name = "DeleteBlockedError";
  error.blockers = blockers;
  throw error;
}

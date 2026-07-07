import { Router } from "express";

export function createOrdersRouter(deps) {
  const router = Router();
  const {
    allocateProjectActualsToJobs,
    assignOffcutStorageLocation,
    attrValue,
    buildReadyMessage,
    buildTree,
    cleanNumber,
    cleanProjectNumber,
    codeSlug,
    deleteOrderBundle,
    detectCsvDelimiter,
    distributeAmount,
    distributeTotal,
    distributeUsage,
    ensureColumn,
    ensureRoot,
    escapeXml,
    exportCutJobProject,
    findExcelSheetName,
    findProducer,
    getCustomerRelatedDocuments,
    getCutJobTotals,
    handleGibLabRemainders,
    importGoodsRows,
    importProject,
    importRemaindersReport,
    logIntegration,
    materialTypeCode,
    materialUpdateValues,
    materialValues,
    nextMaterialId,
    nextOrderNumber,
    normalizeCustomer,
    normalizeCutJob,
    normalizeCutPart,
    normalizeEdgeValue,
    normalizeExistingTextValues,
    normalizeLooseKey,
    normalizeMaterial,
    normalizeOcrText,
    normalizeOffcut,
    normalizeOffcutStatus,
    normalizeOffcutStorageLocation,
    normalizeOrder,
    normalizePayment,
    normalizePaymentStatus,
    normalizePhone,
    normalizePriceItem,
    normalizeQuoteLine,
    normalizeRemainderRequestType,
    normalizeStationName,
    normalizeSupply,
    offcutStorageLocations,
    parseAttributes,
    parseCsvLine,
    parseCsvRows,
    parseProjectActuals,
    pickValue,
    polishFolderCode,
    polishMaterialCode,
    polishMaterialName,
    polishUnit,
    readCatalogImportRows,
    readProjectNumber,
    refreshPaymentStatus,
    requestStation,
    resolveExportEdgeMaterial,
    resolveExportMaterial,
    runInTransaction,
    safeFileName,
    seedDefaultOffcutStorageLocations,
    seedDefaultPriceItems,
    sendStockMovementError,
    storageLocationErrorMessage,
    toGoodsRow,
    toMoneyNumber,
    toNonNegativeNumber,
    toNullableNumber,
    toPositiveNumber,
    truthyNumber,
    updateOrderTotalFromQuote,
    writeGoodsFile,
    selectCustomer,
    selectCustomers,
    selectDeliveries,
    selectDelivery,
    selectDeliveryCorrection,
    selectDeliveryCorrectionLines,
    selectDeliveryCorrections,
    selectDeliveryLines,
    selectMaterial,
    selectMaterials,
    selectOrder,
    selectOrders,
    selectStock,
    selectStockById,
    db,
    upload,
    getOrderDeleteBlockers,
    buildCutQuoteLines,
    normalizeCutQuotePrices,
    createWorker,
    XLSX,
    path,
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync,
    spawn
  } = deps;

router.get("/api/orders", (request, response) => {
  response.json(selectOrders.all());
});

router.get("/api/orders/next-number", (request, response) => {
  response.json({ order_number: nextOrderNumber() });
});

router.post("/api/orders", (request, response) => {
  const payload = normalizeOrder(request.body);
  const orderNumber = payload.order_number || nextOrderNumber();
  const result = db.prepare(`
    INSERT INTO orders (order_number, customer_id, title, project_path, order_date, due_date, production_status, payment_status, total_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNumber, payload.customer_id, payload.title, payload.project_path, payload.order_date, payload.due_date, payload.production_status, payload.payment_status, payload.total_amount, payload.notes);
  refreshPaymentStatus(result.lastInsertRowid);
  response.status(201).json(selectOrder.get(result.lastInsertRowid));
});

router.put("/api/orders/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectOrder.get(id)) return response.status(404).json({ error: "Order not found" });
  const payload = normalizeOrder(request.body);
  const orderNumber = payload.order_number || selectOrder.get(id).order_number;
  db.prepare(`
    UPDATE orders
    SET order_number = ?, customer_id = ?, title = ?, project_path = ?, order_date = ?, due_date = ?,
        production_status = ?, payment_status = ?, payment_status_manual = ?, total_amount = ?, notes = ?
    WHERE id = ?
  `).run(orderNumber, payload.customer_id, payload.title, payload.project_path, payload.order_date, payload.due_date, payload.production_status, payload.payment_status, payload.payment_status_manual, payload.total_amount, payload.notes, id);
  if (!payload.payment_status_manual) refreshPaymentStatus(id);
  response.json(selectOrder.get(id));
});

router.post("/api/orders/:id/payment-status", (request, response) => {
  const id = Number(request.params.id);
  if (!selectOrder.get(id)) return response.status(404).json({ error: "Order not found" });
  const status = normalizePaymentStatus(request.body.payment_status || "Nie zapłacone");
  if (!["Nie zapłacone", "Zaliczka", "Opłacone", "Po terminie"].includes(status)) {
    return response.status(400).json({ error: "Invalid payment status" });
  }
  db.prepare("UPDATE orders SET payment_status = ?, payment_status_manual = 1 WHERE id = ?").run(status, id);
  response.json(selectOrder.get(id));
});

router.delete("/api/orders/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!selectOrder.get(id)) return response.status(404).json({ error: "Order not found" });
  const blockers = getOrderDeleteBlockers(db, id);
  if (blockers.length) return response.status(409).json({ error: "Order cannot be deleted safely", blockers });
  db.prepare("DELETE FROM orders WHERE id = ?").run(id);
  response.status(204).end();
});

router.delete("/api/orders/:id/full", (request, response) => {
  const id = Number(request.params.id);
  if (!selectOrder.get(id)) return response.status(404).json({ error: "Order not found" });
  const result = deleteOrderBundle(id);
  response.json(result);
});

router.get("/api/orders/:id/payments", (request, response) => {
  response.json(db.prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC, id DESC").all(Number(request.params.id)));
});

router.post("/api/orders/:id/payments", (request, response) => {
  const orderId = Number(request.params.id);
  if (!selectOrder.get(orderId)) return response.status(404).json({ error: "Order not found" });
  const payload = normalizePayment(request.body);
  const result = db.prepare(`
    INSERT INTO payments (order_id, amount, payment_date, method, payer_name, received_by, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, payload.amount, payload.payment_date, payload.method, payload.payer_name, payload.received_by, payload.note);
  refreshPaymentStatus(orderId);
  response.status(201).json(db.prepare("SELECT * FROM payments WHERE id = ?").get(result.lastInsertRowid));
});

router.get("/api/orders/:id/notify", (request, response) => {
  const order = selectOrder.get(Number(request.params.id));
  if (!order) return response.status(404).json({ error: "Order not found" });
  const customer = order.customer_id ? selectCustomer.get(order.customer_id) : null;
  const message = buildReadyMessage(order, customer);
  const phone = normalizePhone(customer?.phone || "");
  const email = customer?.email || "";
  response.json({
    message,
    sms: phone ? `sms:${phone}?body=${encodeURIComponent(message)}` : "",
    whatsapp: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "",
    telegram: `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`,
    email: email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Zamówienie ${order.order_number} gotowe do odbioru`)}&body=${encodeURIComponent(message)}` : ""
  });
});

router.delete("/api/payments/:id", (request, response) => {
  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(Number(request.params.id));
  if (!payment) return response.status(404).json({ error: "Payment not found" });
  db.prepare("DELETE FROM payments WHERE id = ?").run(payment.id);
  refreshPaymentStatus(payment.order_id);
  response.status(204).end();
});


router.get("/api/orders/:id/quote-lines", (request, response) => {
  response.json(db.prepare("SELECT * FROM quote_lines WHERE order_id = ? ORDER BY id").all(Number(request.params.id)));
});

router.post("/api/orders/:id/quote-lines", (request, response) => {
  const orderId = Number(request.params.id);
  if (!selectOrder.get(orderId)) return response.status(404).json({ error: "Order not found" });
  const payload = normalizeQuoteLine(request.body);
  const result = db.prepare(`
    INSERT INTO quote_lines (order_id, price_item_id, description, unit, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, payload.price_item_id, payload.description, payload.unit, payload.quantity, payload.unit_price, payload.line_total);
  updateOrderTotalFromQuote(orderId);
  response.status(201).json(db.prepare("SELECT * FROM quote_lines WHERE id = ?").get(result.lastInsertRowid));
});

router.delete("/api/quote-lines/:id", (request, response) => {
  const line = db.prepare("SELECT * FROM quote_lines WHERE id = ?").get(Number(request.params.id));
  if (!line) return response.status(404).json({ error: "Quote line not found" });
  db.prepare("DELETE FROM quote_lines WHERE id = ?").run(line.id);
  updateOrderTotalFromQuote(line.order_id);
  response.status(204).end();
});

router.post("/api/orders/:id/recalculate-quote", (request, response) => {
  const orderId = Number(request.params.id);
  updateOrderTotalFromQuote(orderId);
  response.json(selectOrder.get(orderId));
});

router.get("/api/cut-jobs", (request, response) => {
  response.json(db.prepare(`
    SELECT j.*, o.order_number, o.title AS order_title, c.name AS customer_name,
      COUNT(p.id) AS part_rows,
      COALESCE(SUM(p.quantity), 0) AS part_count,
      COALESCE(SUM(p.length * p.width * p.quantity / 1000000.0), 0) AS area_m2
    FROM cut_jobs j
    LEFT JOIN orders o ON o.id = j.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN cut_parts p ON p.cut_job_id = j.id
    GROUP BY j.id
    ORDER BY j.created_at DESC, j.id DESC
  `).all());
});

router.post("/api/cut-jobs", (request, response) => {
  const payload = normalizeCutJob(request.body);
  const result = db.prepare(`
    INSERT INTO cut_jobs (order_id, name, material_id, material_code, material_name, edge_material_id, edge_material_code, edge_material_name, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(payload.order_id, payload.name, payload.material_id, payload.material_code, payload.material_name, payload.edge_material_id, payload.edge_material_code, payload.edge_material_name, payload.status, payload.notes);
  response.status(201).json(db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/api/cut-jobs/:id", (request, response) => {
  const id = Number(request.params.id);
  const payload = normalizeCutJob(request.body);
  db.prepare(`
    UPDATE cut_jobs
    SET order_id = ?, name = ?, material_id = ?, material_code = ?, material_name = ?, edge_material_id = ?, edge_material_code = ?, edge_material_name = ?, status = ?, notes = ?
    WHERE id = ?
  `).run(payload.order_id, payload.name, payload.material_id, payload.material_code, payload.material_name, payload.edge_material_id, payload.edge_material_code, payload.edge_material_name, payload.status, payload.notes, id);
  response.json(db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(id));
});

router.delete("/api/cut-jobs/:id", (request, response) => {
  const id = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(id);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  runInTransaction(() => {
    db.prepare("DELETE FROM quote_lines WHERE cut_job_id = ?").run(id);
    db.prepare("DELETE FROM cut_jobs WHERE id = ?").run(id);
    if (job.order_id) updateOrderTotalFromQuote(job.order_id);
  });
  response.status(204).end();
});

router.get("/api/cut-jobs/:id/parts", (request, response) => {
  response.json(db.prepare("SELECT * FROM cut_parts WHERE cut_job_id = ? ORDER BY sort_order, id").all(Number(request.params.id)));
});

router.post("/api/cut-jobs/:id/parts", (request, response) => {
  const jobId = Number(request.params.id);
  if (!db.prepare("SELECT id FROM cut_jobs WHERE id = ?").get(jobId)) return response.status(404).json({ error: "Cut job not found" });
  const payload = normalizeCutPart(request.body);
  const nextSort = db.prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort FROM cut_parts WHERE cut_job_id = ?").get(jobId).next_sort;
  const result = db.prepare(`
    INSERT INTO cut_parts (cut_job_id, material_id, material_code, material_name, thickness, length, width, quantity, texture, name, edge_top, edge_bottom, edge_left, edge_right, work_milling, work_drilling, work_lacquer, work_other, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(jobId, payload.material_id, payload.material_code, payload.material_name, payload.thickness, payload.length, payload.width, payload.quantity, payload.texture, payload.name, payload.edge_top, payload.edge_bottom, payload.edge_left, payload.edge_right, payload.work_milling, payload.work_drilling, payload.work_lacquer, payload.work_other, payload.description, nextSort);
  response.status(201).json(db.prepare("SELECT * FROM cut_parts WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/api/cut-parts/:id", (request, response) => {
  const id = Number(request.params.id);
  const existing = db.prepare("SELECT * FROM cut_parts WHERE id = ?").get(id);
  if (!existing) return response.status(404).json({ error: "Cut part not found" });
  const payload = normalizeCutPart({ ...existing, ...request.body });
  db.prepare(`
    UPDATE cut_parts
    SET material_id = ?, material_code = ?, material_name = ?, thickness = ?, length = ?, width = ?, quantity = ?, texture = ?, name = ?,
      edge_top = ?, edge_bottom = ?, edge_left = ?, edge_right = ?, work_milling = ?, work_drilling = ?, work_lacquer = ?, work_other = ?, description = ?
    WHERE id = ?
  `).run(
    payload.material_id,
    payload.material_code,
    payload.material_name,
    payload.thickness,
    payload.length,
    payload.width,
    payload.quantity,
    payload.texture,
    payload.name,
    payload.edge_top,
    payload.edge_bottom,
    payload.edge_left,
    payload.edge_right,
    payload.work_milling,
    payload.work_drilling,
    payload.work_lacquer,
    payload.work_other,
    payload.description,
    id
  );
  response.json(db.prepare("SELECT * FROM cut_parts WHERE id = ?").get(id));
});

router.delete("/api/cut-parts/:id", (request, response) => {
  db.prepare("DELETE FROM cut_parts WHERE id = ?").run(Number(request.params.id));
  response.status(204).end();
});

router.post("/api/cut-jobs/:id/import-excel", upload.single("formatki"), (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  if (!request.file?.buffer) return response.status(400).json({ error: "Missing Excel file" });
  const workbook = XLSX.read(request.file.buffer, { type: "buffer", cellDates: false });
  const sheetName = findExcelSheetName(workbook, ["detale", "detali", "детали"]) || workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: true });
  const parts = rows.map((row) => normalizeCutPart(row)).filter((part) => part.length && part.width && part.quantity);
  runInTransaction(() => {
    db.prepare("DELETE FROM cut_parts WHERE cut_job_id = ?").run(jobId);
    const insert = db.prepare(`
      INSERT INTO cut_parts (cut_job_id, material_id, material_code, material_name, thickness, length, width, quantity, texture, name, edge_top, edge_bottom, edge_left, edge_right, work_milling, work_drilling, work_lacquer, work_other, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    parts.forEach((part, index) => insert.run(jobId, part.material_id, part.material_code, part.material_name, part.thickness, part.length, part.width, part.quantity, part.texture, part.name, part.edge_top, part.edge_bottom, part.edge_left, part.edge_right, part.work_milling, part.work_drilling, part.work_lacquer, part.work_other, part.description, index + 1));
    db.prepare("UPDATE cut_jobs SET source_file = ?, status = ? WHERE id = ?").run(request.file.originalname || "", "Zaimportowane formatki", jobId);
  });
  response.json({ imported: parts.length, sheet: sheetName });
});

router.post("/api/ocr/cut-text", upload.single("photo"), async (request, response) => {
  try {
    if (!request.file?.buffer) return response.status(400).json({ error: "Missing photo" });
    const fsPromises = await import("node:fs/promises");
    const os = await import("node:os");
    const tempFilePath = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`);
    await fsPromises.writeFile(tempFilePath, request.file.buffer);

    let resultText = "";
    try {
      const worker = await createWorker("pol+eng");
      const result = await worker.recognize(tempFilePath);
      await worker.terminate();
      resultText = result.data.text || "";
    } finally {
      await fsPromises.unlink(tempFilePath).catch(() => {});
    }

    response.json({ text: normalizeOcrText(resultText) });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Nie udało się odczytać tekstu ze zdjęcia" });
  }
});

router.post("/api/cut-jobs/:id/export-excel", (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare(`
    SELECT j.*, o.order_number, o.title AS order_title, c.name AS customer_name, c.phone AS customer_phone
    FROM cut_jobs j
    LEFT JOIN orders o ON o.id = j.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE j.id = ?
  `).get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  const parts = db.prepare("SELECT * FROM cut_parts WHERE cut_job_id = ? ORDER BY sort_order, id").all(jobId);
  const target = exportCutJobProject(job, parts, request.body?.target);
  db.prepare("UPDATE cut_jobs SET export_path = ?, status = ? WHERE id = ?").run(target, "Wyeksportowane do GibLab", jobId);
  response.json({ exported: parts.length, target });
});

router.post("/api/orders/:id/export-project", (request, response) => {
  const orderId = Number(request.params.id);
  const order = db.prepare(`
    SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(orderId);
  if (!order) return response.status(404).json({ error: "Order not found" });
  const jobs = db.prepare("SELECT * FROM cut_jobs WHERE order_id = ? ORDER BY id").all(orderId);
  if (!jobs.length) return response.status(400).json({ error: "Order has no cut jobs" });
  const parts = db.prepare(`
    SELECT p.*,
      j.name AS cut_job_name,
      j.material_id AS job_material_id,
      j.material_code AS job_material_code,
      j.material_name AS job_material_name,
      j.edge_material_id AS job_edge_material_id,
      j.edge_material_code AS job_edge_material_code,
      j.edge_material_name AS job_edge_material_name
    FROM cut_parts p
    JOIN cut_jobs j ON j.id = p.cut_job_id
    WHERE j.order_id = ?
    ORDER BY j.id, p.sort_order, p.id
  `).all(orderId).map((part) => ({
    ...part,
    material_id: part.job_material_id || part.material_id || null,
    material_code: part.job_material_code || part.material_code || "",
    material_name: part.job_material_name || part.material_name || "",
    edge_material_id: part.job_edge_material_id || part.edge_material_id || null,
    edge_material_code: part.job_edge_material_code || part.edge_material_code || "",
    edge_material_name: part.job_edge_material_name || part.edge_material_name || "",
    name: part.name || part.cut_job_name || "Formatka"
  }));
  if (!parts.length) return response.status(400).json({ error: "Order has no cut parts" });
  const target = exportCutJobProject({
    id: order.id,
    order_id: order.id,
    order_number: order.order_number,
    name: order.title || "Zamowienie",
    material_code: "",
    material_name: "",
    edge_material_code: "",
    edge_material_name: "",
    customer_name: order.customer_name,
    customer_phone: order.customer_phone
  }, parts, request.body?.target);
  db.prepare("UPDATE cut_jobs SET export_path = ?, status = ? WHERE order_id = ?").run(target, "Wyeksportowane do GibLab", orderId);
  db.prepare("UPDATE orders SET project_path = ? WHERE id = ?").run(path.basename(target), orderId);
  response.json({ exported: parts.length, jobs: jobs.length, target });
});

router.post("/api/cut-jobs/:id/open-export-folder", (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT export_path FROM cut_jobs WHERE id = ?").get(jobId);
  const target = job?.export_path || path.join("C:\\GibLabLocal\\projects\\warehouse-formatki", "formatki.xls");
  const folder = path.dirname(target);
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  if (process.platform === "win32") {
    const args = existsSync(target) ? [`/select,${target}`] : [folder];
    spawn("explorer.exe", args, { detached: true, stdio: "ignore" }).unref();
  }
  response.json({ folder, target: existsSync(target) ? target : "" });
});

router.post("/api/orders/:id/open-export-folder", (request, response) => {
  const orderId = Number(request.params.id);
  const row = db.prepare("SELECT export_path FROM cut_jobs WHERE order_id = ? AND export_path <> '' ORDER BY id LIMIT 1").get(orderId);
  const order = db.prepare("SELECT order_number, title FROM orders WHERE id = ?").get(orderId);
  const safeName = safeFileName(`${order?.order_number || "bez-zamowienia"}-${order?.title || "formatki"}`);
  const target = row?.export_path || path.join("C:\\GibLabLocal\\projects", `${safeName}.project`);
  const folder = path.dirname(target);
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  if (process.platform === "win32") {
    const args = existsSync(target) ? [`/select,${target}`] : [folder];
    spawn("explorer.exe", args, { detached: true, stdio: "ignore" }).unref();
  }
  response.json({ folder, target: existsSync(target) ? target : "" });
});

router.get("/api/cut-jobs/:id/quote-lines", (request, response) => {
  response.json(db.prepare("SELECT * FROM quote_lines WHERE cut_job_id = ? ORDER BY id").all(Number(request.params.id)));
});

router.post("/api/cut-jobs/:id/quote", (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  if (!job.order_id) return response.status(400).json({ error: "Cut job is not linked to an order" });
  const totals = getCutJobTotals(jobId);
  const quoteRows = buildCutQuoteLines(job, totals, normalizeCutQuotePrices(request.body));
  const insert = db.prepare(`
    INSERT INTO quote_lines (order_id, cut_job_id, description, unit, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  runInTransaction(() => {
    db.prepare("DELETE FROM quote_lines WHERE cut_job_id = ?").run(jobId);
    quoteRows.forEach((row) => {
      insert.run(job.order_id, jobId, row.description, row.unit, row.quantity, row.unit_price, row.line_total);
    });
    updateOrderTotalFromQuote(job.order_id);
  });
  const lines = db.prepare("SELECT * FROM quote_lines WHERE cut_job_id = ? ORDER BY id").all(jobId);
  response.json({ ...totals, lines, order: selectOrder.get(job.order_id) });
});

router.post("/api/cut-jobs/:id/import-project", upload.single("project"), (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  const xml = request.file?.buffer.toString("utf8") || String(request.body.xml || "");
  if (!xml.trim()) return response.status(400).json({ error: "Missing project XML" });
  const name = request.file?.originalname || request.body.name || `${job.name}.project`;
  try {
    const report = importProject(xml, name);
    db.prepare("UPDATE cut_jobs SET project_path = ?, status = ? WHERE id = ?").run(name, "Wynik z GibLab zaimportowany", jobId);
    if (job.order_id) db.prepare("UPDATE orders SET project_path = ?, production_status = ? WHERE id = ?").run(name, "Po rozkroju", job.order_id);
    response.json(report);
  } catch (error) {
    if (sendStockMovementError(response, error)) return;
    throw error;
  }
});

router.post("/api/cut-jobs/:id/import-exported-project", (request, response) => {
  const jobId = Number(request.params.id);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return response.status(404).json({ error: "Cut job not found" });
  const target = String(request.body?.path || job.export_path || "");
  if (!target || !existsSync(target)) return response.status(404).json({ error: "Exported .project file not found" });
  const xml = readFileSync(target, "utf8");
  const actuals = parseProjectActuals(xml);
  db.prepare(`
    UPDATE cut_jobs
    SET board_sheets_actual = ?, board_m2_actual = ?, edge_meters_actual = ?, project_path = ?, status = 'Wynik z GibLab zaimportowany'
    WHERE id = ?
  `).run(actuals.totalBoardSheets, actuals.totalBoardM2, actuals.totalEdgeMeters, path.basename(target), jobId);
  if (job.order_id) db.prepare("UPDATE orders SET project_path = ?, production_status = ? WHERE id = ?").run(path.basename(target), "Po rozkroju", job.order_id);
  response.json({ ...actuals, projectName: path.basename(target), path: target, jobs: [{ id: jobId, board_sheets_actual: actuals.totalBoardSheets, board_m2_actual: actuals.totalBoardM2, edge_meters_actual: actuals.totalEdgeMeters }] });
});

router.post("/api/orders/:id/import-exported-project", (request, response) => {
  const orderId = Number(request.params.id);
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order) return response.status(404).json({ error: "Order not found" });
  const exported = db.prepare("SELECT export_path FROM cut_jobs WHERE order_id = ? AND export_path <> '' ORDER BY id DESC LIMIT 1").get(orderId);
  const fallbackPath = order.project_path ? path.join("C:\\GibLabLocal\\projects", order.project_path) : "";
  const target = String(request.body?.path || exported?.export_path || fallbackPath || "");
  if (!target || !existsSync(target)) return response.status(404).json({ error: "Exported .project file not found" });
  const xml = readFileSync(target, "utf8");
  const actuals = parseProjectActuals(xml);
  const jobs = db.prepare("SELECT * FROM cut_jobs WHERE order_id = ? ORDER BY id").all(orderId);
  const parts = db.prepare("SELECT * FROM cut_parts WHERE cut_job_id IN (SELECT id FROM cut_jobs WHERE order_id = ?)").all(orderId);
  const allocations = allocateProjectActualsToJobs(actuals, jobs, parts);
  const updateJob = db.prepare(`
    UPDATE cut_jobs
    SET board_sheets_actual = ?, board_m2_actual = ?, edge_meters_actual = ?, project_path = ?, status = 'Wynik z GibLab zaimportowany'
    WHERE id = ?
  `);
  runInTransaction(() => {
    for (const row of allocations) {
      updateJob.run(row.board_sheets_actual, row.board_m2_actual, row.edge_meters_actual, path.basename(target), row.id);
    }
    db.prepare("UPDATE orders SET project_path = ?, production_status = ? WHERE id = ?").run(path.basename(target), "Po rozkroju", orderId);
  });
  response.json({ ...actuals, projectName: path.basename(target), path: target, jobs: allocations });
});

router.post("/api/project/import", upload.single("project"), (request, response) => {
  const xml = request.file?.buffer.toString("utf8") || String(request.body.xml || "");
  if (!xml.trim()) return response.status(400).json({ error: "Missing project XML" });
  try {
    const report = importProject(xml, request.file?.originalname || request.body.name || "");
    response.json(report);
  } catch (error) {
    if (sendStockMovementError(response, error)) return;
    throw error;
  }
});

router.post("/api/project/import-latest", (request, response) => {
  const projectsDir = String(request.body?.dir || "C:\\GibLabLocal\\projects");
  const latest = readdirSync(projectsDir)
    .filter((name) => name.toLowerCase().endsWith(".project"))
    .map((name) => {
      const fullPath = path.join(projectsDir, name);
      const stats = statSync(fullPath);
      return { name, fullPath, mtimeMs: stats.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  if (!latest) return response.status(404).json({ error: "No .project files found" });
  const xml = readFileSync(latest.fullPath, "utf8");
  try {
    const report = importProject(xml, latest.name, latest.fullPath);
    response.json({ ...report, path: latest.fullPath });
  } catch (error) {
    if (sendStockMovementError(response, error)) return;
    throw error;
  }
});

router.get("/api/integration/remainder-logs", (request, response) => {
  response.json(db.prepare("SELECT * FROM integration_logs ORDER BY created_at DESC, id DESC LIMIT 50").all());
});

  return router;
}

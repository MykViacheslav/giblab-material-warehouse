// --- CNC API ENDPOINTS ---

app.get("/api/workers", (req, res) => {
  res.json(db.prepare("SELECT * FROM workers ORDER BY name").all());
});

app.post("/api/workers", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const info = db.prepare("INSERT INTO workers (name) VALUES (?)").run(name.trim());
    res.json({ id: info.lastInsertRowid, name: name.trim(), active: 1 });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/cnc/queue", (req, res) => {
  const jobs = db.prepare(`
    SELECT * FROM cut_jobs 
    WHERE cnc_status IN ('W kolejce', 'W trakcie')
    ORDER BY priority DESC, created_at ASC
  `).all();
  res.json(jobs);
});

app.post("/api/cnc/job/:id/start", (req, res) => {
  const { workerName } = req.body;
  db.prepare("UPDATE cut_jobs SET cnc_status = 'W trakcie', assigned_worker = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?").run(workerName || '', req.params.id);
  res.json({ success: true });
});

app.post("/api/cnc/job/:id/complete", (req, res) => {
  const { usedOffcutIds, workerName } = req.body;
  db.prepare("UPDATE cut_jobs SET cnc_status = 'Zakończone', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  
  if (Array.isArray(usedOffcutIds) && usedOffcutIds.length > 0) {
    const placeholders = usedOffcutIds.map(() => "?").join(",");
    db.prepare(`UPDATE offcuts SET status = 'used', used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`)
      .run(workerName || '', ...usedOffcutIds);
  }

  res.json({ success: true });
});

app.post("/api/cnc/report", (req, res) => {
  const { cutJobId, workerName, errorType, description } = req.body;
  db.prepare("INSERT INTO cnc_reports (cut_job_id, worker_name, error_type, description) VALUES (?, ?, ?, ?)").run(
    cutJobId || null, workerName || '', errorType || '', description || ''
  );
  res.json({ success: true });
});

app.get("/api/cnc/reports", (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, c.name as job_name 
    FROM cnc_reports r 
    LEFT JOIN cut_jobs c ON r.cut_job_id = c.id 
    ORDER BY r.created_at DESC
  `).all();
  res.json(reports);
});

app.get("/api/cnc/offcuts/:id", (req, res) => {
  const offcut = db.prepare("SELECT * FROM offcuts WHERE id = ?").get(req.params.id);
  if (!offcut) return res.status(404).json({ error: "Nie znaleziono resztki o podanym ID" });
  res.json(offcut);
});

app.get("/api/cnc/materials/:jobId", (req, res) => {
  const jobId = Number(req.params.jobId);
  const job = db.prepare("SELECT * FROM cut_jobs WHERE id = ?").get(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  
  let offcuts = [];
  if (job.project_path) {
    const xmlPath = path.join("C:\\GibLabLocal\\projects", job.project_path);
    if (existsSync(xmlPath)) {
      const xml = readFileSync(xmlPath, "utf8");
      const dbIds = new Set();
      const jobNameClean = job.name.trim();
      const partIds = new Set();
      for (const m of xml.matchAll(/<good[^>]*typeId="product"[^>]*name="[^"]*"([^>]*|.*?)<\/good>/gi)) {
        if (m[0].includes('"' + jobNameClean + '"') || m[0].includes(' ' + jobNameClean + '"')) {
          for (const pm of m[0].matchAll(/<part[^>]*id="([0-9]+)"/gi)) {
            partIds.add(pm[1]);
          }
        }
      }
      let unescapedData = "";
      for (const m of xml.matchAll(/<operation[^>]*data="([^"]+)"/gi)) {
        unescapedData += m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      }
      const sheetIds = new Set();
      for (const m of unescapedData.matchAll(/<pattern[^>]*sheet="([0-9]+)"[^>]*>(.*?)<\/pattern>/gi)) {
        for (const pid of partIds) {
          if (m[2].includes('part.id="' + pid + '"')) {
            sheetIds.add(m[1]);
            break;
          }
        }
      }
      for (const m of xml.matchAll(/<good[^>]*typeId="sheet"[^>]*>(.*?)<\/good>/gi)) {
        for (const pm of m[1].matchAll(/<part[^>]*dbId="([^"]+)"[^>]*id="([0-9]+)"/gi)) {
          if (sheetIds.has(pm[2])) {
            dbIds.add(pm[1]);
          }
        }
      }
      const dbIdArr = [...dbIds];
      if (dbIdArr.length > 0) {
        const placeholders = dbIdArr.map(() => "?").join(",");
        offcuts = db.prepare(`SELECT * FROM offcuts WHERE id IN (${placeholders})`).all(...dbIdArr);
      }
    }
  }
  
  if (offcuts.length === 0) {
    offcuts = db.prepare("SELECT * FROM offcuts WHERE status = 'reserved' AND reserved_project = ?").all(job.name);
  }
  
  res.json({ offcuts });
});

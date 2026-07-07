const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// 1. Add TCP Proxy at the end
if (!code.includes('const proxyPort = port + 1')) {
  code = code.replace(/app\.listen\(port, \(\) => {[\s\S]*?}\);/m, (match) => {
    return match + `\n\nimport net from "net";\nconst proxyPort = port + 1; // 3081\nnet.createServer((clientSocket) => {\n  const serverSocket = net.connect(port, "127.0.0.1", () => {\n    let headerPatched = false;\n    clientSocket.on("data", (chunk) => {\n      if (!headerPatched) {\n        let str = chunk.toString("binary");\n        if (str.includes("\\r\\n\\r\\n")) {\n          str = str.replace(/\\r\\ndate\\r\\n/g, "\\r\\ndate:\\r\\n");\n          chunk = Buffer.from(str, "binary");\n          headerPatched = true;\n        }\n      }\n      serverSocket.write(chunk);\n    });\n  });\n  serverSocket.on("data", (chunk) => clientSocket.write(chunk));\n  clientSocket.on("error", () => serverSocket.destroy());\n  serverSocket.on("error", () => clientSocket.destroy());\n  clientSocket.on("close", () => serverSocket.end());\n  serverSocket.on("close", () => clientSocket.end());\n}).listen(proxyPort, "0.0.0.0", () => {\n  console.log(\`GibLab Proxy (dla uszkodzonych nagłówków) działa: http://localhost:\${proxyPort}\`);\n});`;
  });
}

// 2. Fix CSV Load Format
code = code.replace(/const text = rows\.map\(\(row\) => \[\s*row\.id,\s*"",\s*"true",\s*"false",\s*row\.length,\s*row\.width,\s*row\.quantity,\s*"0",\s*row\.project_name \|\| "",\s*row\.project_path \|\| ""\s*\]\.join\(","\)\)\.join\("\\n"\);/m, 
`const text = rows.map((row) => {\n      let comment = row.project_name || "";\n      if (row.storage_location) {\n        comment += \` (Lok: \${row.storage_location})\`;\n      }\n      return [\n        row.id,\n        row.length,\n        row.width,\n        row.quantity,\n        comment.trim()\n      ].join(",");\n    }).join("\\n");`);

// 3. Fix ID generation and usage in importRemaindersReport
code = code.replace(/const \[projectOffcutId, externalId, isSheetOrOffcut, isBusiness, length, width, initialQuantity, usedQuantity, \.\.\.projectParts\] = parts;\s*const quantity = Math\.max\(0, Number\(initialQuantity \|\| 0\) - Number\(usedQuantity \|\| 0\)\);\s*if \(\!quantity\) continue;\s*const parsedLength = Number\(length \|\| 0\);\s*const parsedWidth = Number\(width \|\| 0\);\s*insert\.run\(\s*externalId \|\| projectOffcutId,/m, 
`const [projectOffcutId, externalId, isSheetOrOffcut, isBusiness, length, width, initialQuantity, usedQuantity, ...projectParts] = parts;\n        const quantity = Math.max(0, Number(initialQuantity || 0) - Number(usedQuantity || 0));\n        const parsedLength = Number(length || 0);\n        const parsedWidth = Number(width || 0);\n        const uniqueId = externalId || \`\${code}-\${projectParts[0] || projectNameHeader}-\${projectOffcutId}\`;\n\n        if (quantity === 0) {\n          if (externalId) {\n            db.prepare(\`UPDATE offcuts SET status = 'used', used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?\`).run(normalizeStationName(station), externalId);\n          }\n          continue;\n        }\n\n        insert.run(\n          uniqueId,`);

// 4. Add new tables and schema upgrades
if (!code.includes('CREATE TABLE IF NOT EXISTS workers')) {
  code = code.replace(/work_other INTEGER NOT NULL DEFAULT 0,\s*description TEXT DEFAULT '',\s*sort_order INTEGER DEFAULT 0,\s*created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\s*\);\s*`\);/m,
  `work_other INTEGER NOT NULL DEFAULT 0,\n      description TEXT DEFAULT '',\n      sort_order INTEGER DEFAULT 0,\n      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS workers (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      name TEXT NOT NULL UNIQUE,\n      active INTEGER NOT NULL DEFAULT 1,\n      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS cnc_reports (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      cut_job_id INTEGER REFERENCES cut_jobs(id) ON DELETE CASCADE,\n      worker_name TEXT NOT NULL,\n      error_type TEXT NOT NULL,\n      description TEXT DEFAULT '',\n      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n    );\n  \`);`);
}

if (!code.includes('ensureColumn("cut_jobs", "assigned_worker"')) {
  code = code.replace(/ensureColumn\("offcuts", "used_at", "TEXT DEFAULT ''"\);\s*normalizeExistingTextValues\(\);/m,
  `ensureColumn("offcuts", "used_at", "TEXT DEFAULT ''");\n  ensureColumn("cut_jobs", "assigned_worker", "TEXT DEFAULT ''");\n  ensureColumn("cut_jobs", "priority", "INTEGER DEFAULT 0");\n  ensureColumn("cut_jobs", "cnc_status", "TEXT DEFAULT 'W kolejce'");\n  ensureColumn("cut_jobs", "started_at", "TEXT DEFAULT ''");\n  ensureColumn("cut_jobs", "completed_at", "TEXT DEFAULT ''");\n  normalizeExistingTextValues();`);
}

// 5. Inject CNC API code
const apiCode = fs.readFileSync('cnc_api.js', 'utf8');
if (!code.includes('/api/workers')) {
  code = code.replace(/app\.listen\(port, host, \(\) => \{/m, apiCode + '\n\napp.listen(port, host, () => {');
}

fs.writeFileSync('server.js', code, 'utf8');
console.log("Patched server.js successfully!");

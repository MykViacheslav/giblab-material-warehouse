const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const replacement = `function normalizePaymentStatus(value) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  if (normalized === "nie zaplacone" || normalized === "niezaplacone" || normalized === "unpaid") return "Nie zapłacone";
  if (normalized === "zaliczka" || normalized === "deposit") return "Zaliczka";
  if (normalized === "oplacone" || normalized === "paid") return "Opłacone";
  if (normalized === "po terminie" || normalized === "overdue") return "Po terminie";
  return raw;
}

function ensureColumn(tableName`;

server = server.replace('function ensureColumn(tableName', replacement);
fs.writeFileSync('server.js', server);

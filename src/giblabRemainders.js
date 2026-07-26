export function formatRemaindersLoadResponse(rows = []) {
  return rows.map((row) => [
    cleanField(row.id),
    numberField(row.length),
    numberField(row.width),
    numberField(row.quantity, 1),
    remainderComment(row)
  ].join(",")).join("\n");
}

export function parseReportedRemainderIds(text) {
  const ids = [];
  const seen = new Set();
  for (const line of String(text || "").split(/\r?\n/)) {
    const id = cleanField(line.split(",")[0]);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function remainderComment(row) {
  return [
    row.storage_location,
    row.project_name,
    row.status === "reserved" && row.reserved_by ? `REZERWACJA ${row.reserved_by}` : "",
    row.reserved_project
  ].filter(Boolean).map(cleanField).join(" | ");
}

function cleanField(value) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/,/g, ";")
    .trim();
}

function numberField(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : String(fallback);
}

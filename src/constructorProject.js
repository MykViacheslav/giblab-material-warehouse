function parseAttributes(source) {
  const attrs = {};
  for (const match of String(source || "").matchAll(/([\w:.-]+)=["']([^"']*)["']/g)) {
    attrs[match[1]] = decodeXmlValue(match[2]);
  }
  return attrs;
}

function decodeXmlValue(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function toNumber(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function truthy(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return value === true || normalized === "true" || normalized === "1" || normalized === "yes";
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function pickDimension(attrs, keys) {
  for (const key of keys) {
    const value = toNumber(attrs[key]);
    if (value > 0) return Math.round(value);
  }
  return 0;
}

function buildPartName(attrs) {
  const code = cleanText(attrs["part.code"]);
  const partName = cleanText(attrs["part.name"]);
  const name = cleanText(attrs.name);
  const pieces = [];
  if (code) pieces.push(code);
  if (partName && partName !== code) pieces.push(partName);
  if (!pieces.length && name) pieces.push(name);
  return pieces.join(" - ") || "Formatka z 3D Constructora";
}

export function parseConstructorProjectParts(xml) {
  const parts = [];
  const source = String(xml || "");
  for (const match of source.matchAll(/<part\b([^>]*)\/?>/gi)) {
    const attrs = parseAttributes(match[1]);
    const length = pickDimension(attrs, ["l", "dl", "cl", "part.dtl", "length"]);
    const width = pickDimension(attrs, ["w", "dw", "cw", "part.dtw", "width"]);
    if (!length || !width) continue;
    if (length < 20 || width < 20 || length > 6000 || width > 3000) continue;

    const quantity = Math.max(1, Math.round(toNumber(attrs.count) || 1));
    const description = cleanText(attrs.description);
    const name = buildPartName(attrs);
    const operationText = `${description} ${name}`.toLowerCase();
    const workDrilling = truthy(attrs["part.drill"]) || truthy(attrs.drill);
    const workMilling =
      truthy(attrs["part.mill"]) ||
      truthy(attrs["part.groove"]) ||
      truthy(attrs.mill) ||
      /\b(fr|frez|paz|groove)\b/i.test(operationText);

    parts.push({
      length,
      width,
      quantity,
      texture: 1,
      name,
      description,
      work_milling: workMilling ? 1 : 0,
      work_drilling: workDrilling ? 1 : 0,
      work_lacquer: 0,
      work_other: 0
    });
  }
  for (const match of source.matchAll(/<Obj\b([^>]*)>/gi)) {
    const attrs = parseAttributes(match[1]);
    const objectClass = cleanText(attrs.class);
    const sheetClasses = new Set(["18", "34", "50", "114"]);
    if (!sheetClasses.has(objectClass)) continue;
    if (String(attrs.cutting ?? "").trim().toLowerCase() === "false") continue;

    const length = pickDimension(attrs, ["dl", "dtl", "l", "length"]);
    const width = pickDimension(attrs, ["dw", "dtw", "w", "width"]);
    if (!length || !width) continue;
    if (length < 20 || width < 20 || length > 6000 || width > 3000) continue;

    const quantity = Math.max(1, Math.round(toNumber(attrs.quantity) || toNumber(attrs.count) || 1));
    const code = cleanText(attrs.code);
    const name = cleanText(attrs.name);
    const description = cleanText(attrs.opFlag || attrs.description || attrs.position);
    const operationText = `${description} ${code} ${name}`.toLowerCase();
    const workDrilling = truthy(attrs.drill) || /\b(drill|wier|otw|otwor|otwór)\b/i.test(operationText);
    const workMilling =
      truthy(attrs.mill) ||
      truthy(attrs.groove) ||
      /\b(fr|frez|paz|groove|mill)\b/i.test(operationText);

    parts.push({
      length,
      width,
      quantity,
      texture: truthy(attrs.txt) ? 1 : 0,
      name: [code, name].filter(Boolean).join(" - ") || "Formatka z 3D Constructora",
      description,
      work_milling: workMilling ? 1 : 0,
      work_drilling: workDrilling ? 1 : 0,
      work_lacquer: 0,
      work_other: 0
    });
  }
  return parts;
}

export function getConstructorProjectName(xml, fallback = "") {
  const match = String(xml || "").match(/<(?:project|Project3dc)\b([^>]*)>/i);
  if (!match) return fallback;
  const attrs = parseAttributes(match[1]);
  return cleanText(attrs.name) || fallback;
}

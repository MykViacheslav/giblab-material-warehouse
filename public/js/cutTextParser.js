const MIN_PART_SIDE_MM = 80;

export function parseCutTextRows(text) {
  const normalizedText = normalizeCutText(text);
  const color = readColor(normalizedText);
  const isLacqueredFront = /fronty\s+lakierowane|lakiery|lakier/i.test(normalizedText);
  const baseName = [isLacqueredFront ? "Front lakierowany" : "", color].filter(Boolean).join(" ");
  const defaultMilling = /\bfrez|frezowane|frezowanie/i.test(normalizedText);

  return normalizedText
    .split(/\r?\n/)
    .map((line) => parseCutTextLine(line, { baseName, isLacqueredFront, defaultMilling }))
    .filter(Boolean);
}

function normalizeCutText(text) {
  return String(text || "")
    .replace(/[×*]/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/\b[zż]t\b/gi, "szt")
    .replace(/([^\n\r])(\b\d{2,5}(?:[,.]\d+)?\s*x\s*\d{2,5}(?:[,.]\d+)?\b)/gi, (match, before, dimensions) => {
      if (/[\n\r]/.test(before)) return match;
      return `${before}\n${dimensions}`;
    });
}

function readColor(text) {
  const color = (String(text).match(/kolor\s*:?\s*([^\n\r]+)/i)?.[1] || "").trim();
  return color
    .replace(/\s*Pr\s*=.*$/i, "")
    .replace(/\s{2,}.*$/, "")
    .replace(/,.*$/, "")
    .trim();
}

function parseCutTextLine(line, options) {
  const normalizedLine = cleanLinePrefix(line);
  const match = normalizedLine.match(/^(\d+(?:[,.]\d+)?)\s*x\s*(\d+(?:[,.]\d+)?)(.*)$/i);
  if (!match) return null;

  const length = parseImportedNumber(match[1]);
  const width = parseImportedNumber(match[2]);
  if (!isLikelyPartDimension(length, width)) return null;

  const quantityResult = extractQuantity(match[3]);
  const quantity = quantityResult.quantity;
  const tail = cleanupDescription(quantityResult.tail);
  if (!quantity || !isLikelyQuantity(quantity)) return null;

  const hasNoMilling = /\bbez\s+frez/i.test(tail);
  const hasMilling = /\bfrez/i.test(tail);
  const description = [tail, options.baseName].filter(Boolean).join(" | ");
  const fallbackName = cleanupName(tail);

  return {
    length,
    width,
    quantity,
    name: options.baseName || fallbackName,
    description,
    work_milling: hasNoMilling ? false : options.defaultMilling || hasMilling,
    work_drilling: /wierc|otwor/i.test(tail),
    work_lacquer: options.isLacqueredFront || /lakier/i.test(tail)
  };
}

function cleanLinePrefix(line) {
  return String(line || "")
    .replace(/[×*]/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/\b[zż]t\b/gi, "szt")
    .replace(/^[\s•*.\-–—:_#]+/, "")
    .replace(/^[^\d]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractQuantity(rawTail) {
  let tail = String(rawTail || "").trim();
  let quantity = 1;

  const patterns = [
    /^\s*x\s*(\d+(?:[,.]\d+)?)\b(.*)$/i,
    /^\s*(?:sztuk|szt\.?|pcs)\s*(\d+(?:[,.]\d+)?)\b(.*)$/i,
    /^\s*-\s*(\d+(?:[,.]\d+)?)(?:\s*(?:sztuk|szt\.?|pcs))?\b(.*)$/i,
    /^\s*\/\s*(\d+(?:[,.]\d+)?)\b(.*)$/i,
    /^(.*?)(?:\(|\s|^)(\d+(?:[,.]\d+)?)(?:\)|\s*)$/i
  ];

  for (const pattern of patterns) {
    const match = tail.match(pattern);
    if (!match) continue;
    if (pattern === patterns[4]) {
      quantity = parseImportedNumber(match[2]);
      tail = match[1].trim();
    } else {
      quantity = parseImportedNumber(match[1]);
      tail = match[2].trim();
    }
    break;
  }

  tail = tail.replace(/\b(?:sztuk|szt\.?|pcs)\b/gi, "").trim();
  return { quantity, tail };
}

function cleanupDescription(value) {
  return String(value || "")
    .replace(/^[\s\-:/]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupName(value) {
  const name = cleanupDescription(value)
    .replace(/\b(?:sztuk|szt\.?|pcs)\b/gi, "")
    .replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, "")
    .trim();
  return /^(?:x|szt|szt\.|pcs|frez|\d+)$/i.test(name) ? "" : name;
}

function isLikelyPartDimension(length, width) {
  return length >= MIN_PART_SIDE_MM && width >= MIN_PART_SIDE_MM;
}

function isLikelyQuantity(quantity) {
  return quantity > 0 && quantity <= 99;
}

function parseImportedNumber(value) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

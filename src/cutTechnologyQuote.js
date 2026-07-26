export function buildCutTechnologyQuoteLines(parts = [], prices = []) {
  const groups = new Map();
  for (const part of parts) {
    const price = findTechnologyPrice(part, prices);
    if (!price || price.active === 0 || price.unit === "none" || Number(price.unit_price || 0) <= 0) continue;
    const quantity = technologyQuantity(part, price.unit);
    if (quantity <= 0) continue;
    const key = String(price.id || [price.name, price.element_type, price.technology, price.lacquer_sides, price.unit, price.unit_price].join("|"));
    const row = groups.get(key) || {
      description: `Technologia: ${price.name || part.technology || part.element_type || "Formatki"}`,
      unit: unitLabel(price.unit),
      quantity: 0,
      unit_price: Number(price.unit_price || 0),
      line_total: 0
    };
    row.quantity += quantity;
    row.line_total += quantity * row.unit_price;
    groups.set(key, row);
  }
  return [...groups.values()];
}

function findTechnologyPrice(part, prices) {
  const technology = normalize(part.technology);
  const elementType = normalize(part.element_type);
  const lacquerSides = normalize(part.lacquer_sides);
  return prices.find((price) =>
    normalize(price.technology) === technology
    && (!price.element_type || normalize(price.element_type) === elementType)
    && (!price.lacquer_sides || normalize(price.lacquer_sides) === lacquerSides)
  ) || prices.find((price) =>
    // Older imported parts can have a generic element type despite a valid technology.
    normalize(price.technology) === technology
    && (!price.lacquer_sides || normalize(price.lacquer_sides) === lacquerSides)
  ) || prices.find((price) =>
    normalize(price.element_type) === elementType
    && (!price.lacquer_sides || normalize(price.lacquer_sides) === lacquerSides)
  ) || null;
}

function technologyQuantity(part, unit) {
  const count = Number(part.quantity || 0);
  const length = Number(part.length || 0);
  const width = Number(part.width || 0);
  if (unit === "m2") return length * width * count / 1000000;
  if (unit === "mb") return length * count / 1000;
  if (unit === "szt") return count;
  return 0;
}

function unitLabel(unit) {
  if (unit === "m2") return "m²";
  if (unit === "mb") return "mb";
  return "szt.";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

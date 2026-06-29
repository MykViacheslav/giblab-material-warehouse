export function normalizeCutQuotePrices(input = {}) {
  return {
    material_price: money(input.material_price),
    cut_price: money(input.cut_price),
    edge_price: money(input.edge_price),
    milling_price: money(input.milling_price),
    drilling_price: money(input.drilling_price),
    lacquer_price: money(input.lacquer_price),
    other_price: money(input.other_price)
  };
}

export function buildCutQuoteLines(job, totals, prices) {
  const jobName = job?.name || "formatki";
  const rows = [
    line(prices.material_price, totals.board_sheets ? totals.board_sheets : totals.area_m2, totals.board_sheets ? "ark." : "m2", `Formatki ${jobName} - materiał`),
    line(prices.cut_price, totals.part_count, "szt.", `Formatki ${jobName} - cięcie`),
    line(prices.edge_price, totals.edge_mb, "mb", `Formatki ${jobName} - oklejanie`),
    line(prices.milling_price, totals.milling_count, "szt.", `Formatki ${jobName} - frezowanie`),
    line(prices.drilling_price, totals.drilling_count, "szt.", `Formatki ${jobName} - otwory`),
    line(prices.lacquer_price, totals.lacquer_m2, "m2", `Formatki ${jobName} - lakierowanie`),
    line(prices.other_price, totals.other_count, "szt.", `Formatki ${jobName} - inne prace`)
  ];
  return rows.filter(Boolean);
}

function line(unitPrice, quantity, unit, description) {
  const safePrice = Number(unitPrice || 0);
  const safeQuantity = Number(quantity || 0);
  if (safePrice <= 0 || safeQuantity <= 0) return null;
  return {
    description,
    unit,
    quantity: safeQuantity,
    unit_price: safePrice,
    line_total: safeQuantity * safePrice
  };
}

function money(value) {
  return Number(String(value || 0).replace(/\s/g, "").replace(",", ".")) || 0;
}

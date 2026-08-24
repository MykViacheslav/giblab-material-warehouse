export function calculateRushSurcharge(baseAmount, percentage) {
  const base = nonNegativeNumber(baseAmount);
  const rate = Math.min(100, nonNegativeNumber(percentage));
  return {
    base,
    percentage: rate,
    amount: roundMoney(base * rate / 100)
  };
}

function nonNegativeNumber(value) {
  const number = Number(String(value ?? 0).replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export class StockMovementError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "StockMovementError";
    this.details = details;
  }
}

export function parsePositiveQuantity(value, fieldName = "quantity") {
  const quantity = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new StockMovementError(`${fieldName} must be positive`, { fieldName, value });
  }
  return quantity;
}

export function parseNonNegativeQuantity(value, fieldName = "quantity") {
  const quantity = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new StockMovementError(`${fieldName} must not be negative`, { fieldName, value });
  }
  return quantity;
}

export function applyStockEvent(currentStock, eventType, quantity) {
  const stock = normalizeStock(currentStock);
  switch (eventType) {
    case "receive": {
      const amount = parsePositiveQuantity(quantity);
      return { ...stock, quantity: stock.quantity + amount };
    }
    case "reserve": {
      const amount = parsePositiveQuantity(quantity);
      const available = stock.quantity - stock.reserved;
      if (amount > available) {
        throw new StockMovementError("Cannot reserve more material than is available", { eventType, quantity: amount, available });
      }
      return { ...stock, reserved: stock.reserved + amount };
    }
    case "release": {
      const amount = parsePositiveQuantity(quantity);
      if (amount > stock.reserved) {
        throw new StockMovementError("Cannot release more material than is reserved", { eventType, quantity: amount, reserved: stock.reserved });
      }
      return { ...stock, reserved: stock.reserved - amount };
    }
    case "use": {
      const amount = parsePositiveQuantity(quantity);
      if (amount > stock.quantity) {
        throw new StockMovementError("Cannot use more material than is in stock", { eventType, quantity: amount, available: stock.quantity });
      }
      return { ...stock, quantity: stock.quantity - amount, used: stock.used + amount };
    }
    case "adjust":
      return adjustStockQuantity(stock, quantity);
    default:
      throw new StockMovementError("Invalid stock event", { eventType });
  }
}

export function adjustStockQuantity(currentStock, quantity) {
  const stock = normalizeStock(currentStock);
  const amount = parseNonNegativeQuantity(quantity);
  if (amount < stock.reserved) {
    throw new StockMovementError("Cannot adjust stock below reserved quantity", { quantity: amount, reserved: stock.reserved });
  }
  return { ...stock, quantity: amount };
}

export function assertCanUseStock(currentStock, quantity, context = {}) {
  const stock = normalizeStock(currentStock);
  const amount = parsePositiveQuantity(quantity);
  if (amount > stock.quantity) {
    throw new StockMovementError("Cannot use more material than is in stock", { ...context, quantity: amount, available: stock.quantity });
  }
  return amount;
}

function normalizeStock(stock = {}) {
  return {
    quantity: toFiniteNumber(stock.quantity),
    reserved: toFiniteNumber(stock.reserved),
    used: toFiniteNumber(stock.used)
  };
}

function toFiniteNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

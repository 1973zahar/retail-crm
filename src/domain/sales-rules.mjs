const MONEY_FACTOR = 100;
const QUANTITY_FACTOR = 1000;

export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function roundMoney(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * MONEY_FACTOR) / MONEY_FACTOR;
}

export function roundQuantity(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * QUANTITY_FACTOR) / QUANTITY_FACTOR;
}

export function normalizeDiscountPercent(value) {
  const percent = toFiniteNumber(value, 0);
  return Math.min(100, Math.max(0, percent));
}

export function calculateSaleLineTotals(line = {}) {
  const quantity = Math.max(0, toFiniteNumber(line.quantity, 0));
  const unitPrice = Math.max(0, toFiniteNumber(line.price ?? line.unitPrice, 0));
  const gross = roundMoney(quantity * unitPrice);
  const discountPercent = normalizeDiscountPercent(line.discountPercent ?? line.discount);
  const discountAmount = roundMoney(gross * (discountPercent / 100));

  return {
    quantity: roundQuantity(quantity),
    unitPrice: roundMoney(unitPrice),
    gross,
    discountPercent,
    discountAmount,
    total: roundMoney(gross - discountAmount)
  };
}

export function calculateSaleTotals(lines = []) {
  return lines.reduce((accumulator, line) => {
    const totals = calculateSaleLineTotals(line);
    accumulator.gross = roundMoney(accumulator.gross + totals.gross);
    accumulator.discountAmount = roundMoney(accumulator.discountAmount + totals.discountAmount);
    accumulator.total = roundMoney(accumulator.total + totals.total);
    accumulator.quantity = roundQuantity(accumulator.quantity + totals.quantity);
    accumulator.lineCount += 1;
    return accumulator;
  }, {
    gross: 0,
    discountAmount: 0,
    total: 0,
    lineCount: 0,
    quantity: 0
  });
}

export function canMergeSaleLines(left = {}, right = {}) {
  const leftSerial = normalizeToken(left.serialNumber ?? left.serial);
  const rightSerial = normalizeToken(right.serialNumber ?? right.serial);

  if (leftSerial || rightSerial) {
    return false;
  }

  return normalizeToken(left.productCode ?? left.productId) === normalizeToken(right.productCode ?? right.productId)
    && normalizeToken(left.warehouseCode) === normalizeToken(right.warehouseCode)
    && normalizeToken(left.priceType) === normalizeToken(right.priceType)
    && normalizeToken(left.currency ?? left.sourceCurrency) === normalizeToken(right.currency ?? right.sourceCurrency)
    && roundMoney(left.price ?? left.unitPrice) === roundMoney(right.price ?? right.unitPrice)
    && normalizeDiscountPercent(left.discountPercent ?? left.discount) === normalizeDiscountPercent(right.discountPercent ?? right.discount);
}

function normalizeToken(value) {
  return String(value ?? "").trim();
}

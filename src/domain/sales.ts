import type { RetailSaleLine } from "../types/retail-b2c";

export interface SaleLineTotals {
  quantity: number;
  unitPrice: number;
  gross: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
}

export interface SaleTotals {
  gross: number;
  discountAmount: number;
  total: number;
  lineCount: number;
  quantity: number;
}

export function normalizeDiscountPercent(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value)));
}

export function calculateSaleLineTotals(line: RetailSaleLine): SaleLineTotals {
  const quantity = Math.max(0, Number(line.quantity || 0));
  const unitPrice = Math.max(0, Number(line.price || 0));
  const gross = roundMoney(quantity * unitPrice);
  const discountPercent = normalizeDiscountPercent(line.discountPercent);
  const discountAmount = roundMoney(gross * (discountPercent / 100));
  return {
    quantity,
    unitPrice,
    gross,
    discountPercent,
    discountAmount,
    total: roundMoney(gross - discountAmount)
  };
}

export function calculateSaleTotals(lines: readonly RetailSaleLine[]): SaleTotals {
  return lines.reduce<SaleTotals>((accumulator, line) => {
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

export function canMergeSaleLines(left: RetailSaleLine, right: RetailSaleLine): boolean {
  return left.productCode === right.productCode
    && left.warehouseCode === right.warehouseCode
    && String(left.serialNumber || "") === String(right.serialNumber || "")
    && Number(left.price || 0) === Number(right.price || 0)
    && normalizeDiscountPercent(left.discountPercent) === normalizeDiscountPercent(right.discountPercent);
}

export function requiresSerialNumber(categoryPath: string | null | undefined): boolean {
  const value = String(categoryPath || "").toLocaleLowerCase("uk-UA");
  return value.includes("зброя") || value.includes("weapon");
}

function roundMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}

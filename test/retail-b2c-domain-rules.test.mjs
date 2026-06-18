import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateSaleLineTotals,
  calculateSaleTotals,
  canMergeSaleLines,
  normalizeDiscountPercent
} from "../src/domain/sales-rules.mjs";
import {
  SERIAL_VALIDATION_CODES,
  canPostSerializedSaleLine,
  isWeaponCategory,
  requiresSerialNumber
} from "../src/domain/serial-rules.mjs";
import {
  canExecuteAction,
  canViewBlock,
  missingPermissionText,
  requireAction
} from "../src/domain/role-rules.mjs";

test("sale totals clamp discounts and round money consistently", () => {
  assert.equal(normalizeDiscountPercent(-7), 0);
  assert.equal(normalizeDiscountPercent(130), 100);

  const lineTotals = calculateSaleLineTotals({
    productCode: "02422",
    quantity: 2,
    price: 125.55,
    discountPercent: 10
  });

  assert.deepEqual(lineTotals, {
    quantity: 2,
    unitPrice: 125.55,
    gross: 251.1,
    discountPercent: 10,
    discountAmount: 25.11,
    total: 225.99
  });

  assert.deepEqual(calculateSaleTotals([
    { productCode: "02422", quantity: 2, price: 125.55, discountPercent: 10 },
    { productCode: "09111", quantity: "1.5", price: "80", discount: "5" }
  ]), {
    gross: 371.1,
    discountAmount: 31.11,
    total: 339.99,
    lineCount: 2,
    quantity: 3.5
  });
});

test("sale lines merge only when non-serialized sale terms match", () => {
  const baseLine = {
    productCode: "02422",
    warehouseCode: "2",
    price: 100,
    discountPercent: 5,
    currency: "UAH"
  };

  assert.equal(canMergeSaleLines(baseLine, { ...baseLine, quantity: 3 }), true);
  assert.equal(canMergeSaleLines(baseLine, { ...baseLine, price: 101 }), false);
  assert.equal(canMergeSaleLines({ ...baseLine, serialNumber: "SN-1" }, { ...baseLine, serialNumber: "SN-1" }), false);
});

test("weapon products require one available serial before posting", () => {
  const weaponProduct = {
    productCode: "W-001",
    categoryPath: "\u0417\u0431\u0440\u043e\u044f / \u041f\u0456\u0441\u0442\u043e\u043b\u0435\u0442"
  };
  const nonWeaponProduct = { productCode: "T-001", categoryPath: "Accessories" };

  assert.equal(isWeaponCategory(weaponProduct), true);
  assert.equal(requiresSerialNumber(nonWeaponProduct), false);
  assert.deepEqual(canPostSerializedSaleLine({ quantity: 2 }, nonWeaponProduct), {
    ok: true,
    code: SERIAL_VALIDATION_CODES.NOT_REQUIRED
  });
  assert.deepEqual(canPostSerializedSaleLine({ quantity: 1 }, weaponProduct), {
    ok: false,
    code: SERIAL_VALIDATION_CODES.REQUIRED
  });
  assert.deepEqual(canPostSerializedSaleLine({ quantity: 2, serialNumber: "SN-1" }, weaponProduct), {
    ok: false,
    code: SERIAL_VALIDATION_CODES.QUANTITY
  });
  assert.deepEqual(canPostSerializedSaleLine(
    { quantity: 1, serialNumber: "SN-2" },
    weaponProduct,
    [{ serialNumber: "SN-1", availableQty: 1 }]
  ), {
    ok: false,
    code: SERIAL_VALIDATION_CODES.NOT_AVAILABLE
  });
  assert.deepEqual(canPostSerializedSaleLine(
    { quantity: 1, serialNumber: "SN-1" },
    weaponProduct,
    [{ serialNumber: "SN-1", availableQty: 1 }]
  ), {
    ok: true,
    code: SERIAL_VALIDATION_CODES.READY
  });
});

test("role rules expose executable permission checks", () => {
  const seller = {
    visibleBlocks: ["pos", "customers"],
    actions: ["sale_create", "customer_create"]
  };
  const admin = { isAdmin: true, status: "active" };

  assert.equal(canViewBlock(seller, "pos"), true);
  assert.equal(canViewBlock(seller, "settings"), false);
  assert.equal(canExecuteAction(seller, "sale_create"), true);
  assert.equal(canExecuteAction(seller, "employee_manage"), false);
  assert.equal(canExecuteAction(admin, "employee_manage"), true);
  assert.deepEqual(requireAction(seller, "employee_manage"), {
    ok: false,
    action: "employee_manage",
    message: missingPermissionText("employee_manage")
  });
});

import { toFiniteNumber } from "./sales-rules.mjs";

export const SERIAL_VALIDATION_CODES = Object.freeze({
  NOT_REQUIRED: "SERIAL_NOT_REQUIRED",
  READY: "SERIAL_READY",
  REQUIRED: "SERIAL_REQUIRED",
  QUANTITY: "SERIAL_QUANTITY_MUST_BE_ONE",
  NOT_AVAILABLE: "SERIAL_NOT_AVAILABLE"
});

const WEAPON_CATEGORY_KEYWORDS = [
  "\u0437\u0431\u0440\u043e",
  "\u0437\u0431\u0440\u043e\u044f",
  "weapon",
  "firearm",
  "gun",
  "rifle",
  "pistol"
];

export function normalizeCategoryPath(value) {
  if (value && typeof value === "object") {
    return [
      value.categoryPath,
      value.productGroupPath,
      value.productFullPath,
      value.categoryPrimary,
      value.categorySecondary,
      value.folderLevel1,
      value.folderLevel2,
      value.folderLevel3,
      value.folderLevel4,
      value.folderLevel5,
      value.folderLevel6
    ].filter(Boolean).join(" / ");
  }

  return String(value ?? "");
}

export function isWeaponCategory(value) {
  const path = normalizeCategoryPath(value).toLocaleLowerCase("uk-UA");
  return WEAPON_CATEGORY_KEYWORDS.some((keyword) => path.includes(keyword));
}

export function requiresSerialNumber(value) {
  return isWeaponCategory(value);
}

export function canPostSerializedSaleLine(line = {}, productOrCategory = line, serialRows = []) {
  if (!requiresSerialNumber(productOrCategory)) {
    return { ok: true, code: SERIAL_VALIDATION_CODES.NOT_REQUIRED };
  }

  const serialNumber = normalizeSerial(line.serialNumber ?? line.serial);
  if (!serialNumber) {
    return { ok: false, code: SERIAL_VALIDATION_CODES.REQUIRED };
  }

  const quantity = toFiniteNumber(line.quantity, 0);
  if (quantity !== 1) {
    return { ok: false, code: SERIAL_VALIDATION_CODES.QUANTITY };
  }

  if (Array.isArray(serialRows) && serialRows.length > 0) {
    const hasAvailableSerial = serialRows.some((row) => {
      const candidate = normalizeSerial(row.serialNumber ?? row.serial ?? row.seriesNumber);
      const availableQty = toFiniteNumber(row.availableQty ?? row.qty ?? row.quantity ?? 0, 0);
      return candidate === serialNumber && availableQty > 0;
    });

    if (!hasAvailableSerial) {
      return { ok: false, code: SERIAL_VALIDATION_CODES.NOT_AVAILABLE };
    }
  }

  return { ok: true, code: SERIAL_VALIDATION_CODES.READY };
}

function normalizeSerial(value) {
  return String(value ?? "").trim();
}

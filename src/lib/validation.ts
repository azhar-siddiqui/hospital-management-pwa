export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function readText(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function readNote(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function boundedText(value: string, label: string, min: number, max: number) {
  if (value.length < min) {
    return `${label} must be at least ${min} characters.`;
  }
  if (value.length > max) {
    return `${label} must be ${max} characters or fewer.`;
  }
  return null;
}

export function optionalText(value: string, label: string, max: number) {
  if (!value) {
    return null;
  }
  return boundedText(value, label, 1, max);
}

export function readPhone(value: string) {
  const phone = value.trim().replace(/\s+/g, " ");
  if (!/^\+?[0-9][0-9\s-]{5,18}$/.test(phone)) {
    return null;
  }
  return phone;
}

export function readAge(value: string) {
  if (!value) {
    return { ok: true as const, age: null };
  }
  if (!/^\d{1,3}$/.test(value)) {
    return { ok: false as const, error: "Age must be a whole number." };
  }
  const age = Number(value);
  if (age > 130) {
    return { ok: false as const, error: "Age must be 130 or less." };
  }
  return { ok: true as const, age };
}

export function readMoney(value: string, label: string, allowZero: boolean) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return {
      ok: false as const,
      error: `${label} must be a positive amount with up to 2 decimal places.`,
    };
  }
  const amount = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(amount) || amount > 1_000_000 || (allowZero ? amount < 0 : amount <= 0)) {
    return {
      ok: false as const,
      error: allowZero
        ? `${label} must be from 0 to 10,00,000.`
        : `${label} must be greater than 0 and at most 10,00,000.`,
    };
  }
  return { ok: true as const, amount };
}

export function readQuantity(value: string, max = 1_000) {
  if (!/^\d+$/.test(value)) {
    return { ok: false as const, error: "Quantity must be a whole number." };
  }
  const quantity = Number(value);
  if (quantity < 1 || quantity > max) {
    return { ok: false as const, error: `Quantity must be from 1 to ${max}.` };
  }
  return { ok: true as const, quantity };
}

export function readStock(value: string) {
  if (!/^\d+$/.test(value)) {
    return { ok: false as const, error: "Quantity must be a whole number." };
  }
  const quantity = Number(value);
  if (quantity > 1_000_000) {
    return { ok: false as const, error: "Quantity must be 10,00,000 or less." };
  }
  return { ok: true as const, quantity };
}

export const GENDERS = ["Female", "Male", "Other"] as const;
export const ITEM_CATEGORIES = ["Medicine", "Equipment", "Supplies", "Other"] as const;
export const WARD_TYPES = ["DAY_CARE", "GENERAL", "SEMI_ICU", "ICU"] as const;
export const VISIT_TYPES = ["OPD", "IPD"] as const;

export type Gender = (typeof GENDERS)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type WardTypeName = (typeof WARD_TYPES)[number];
export type VisitTypeName = (typeof VISIT_TYPES)[number];

export function isGender(value: string): value is Gender {
  return (GENDERS as readonly string[]).includes(value);
}

export function isItemCategory(value: string): value is ItemCategory {
  return (ITEM_CATEGORIES as readonly string[]).includes(value);
}

export function isWardType(value: string): value is WardTypeName {
  return (WARD_TYPES as readonly string[]).includes(value);
}

export function isVisitType(value: string): value is VisitTypeName {
  return (VISIT_TYPES as readonly string[]).includes(value);
}

export const WARD_LABELS: Record<WardTypeName, string> = {
  DAY_CARE: "Day Care",
  GENERAL: "General",
  SEMI_ICU: "Semi-ICU",
  ICU: "ICU",
};

export const BED_STATUS_LABELS = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
} as const;

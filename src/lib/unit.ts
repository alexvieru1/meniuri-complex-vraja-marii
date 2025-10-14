export const UNIT_VALUES = ["GRAM", "MILLILITER", "BUCATA"] as const;

export type UnitValue = (typeof UNIT_VALUES)[number];
export type MaybeUnitValue = UnitValue | null | undefined;

export const DEFAULT_UNIT: UnitValue = "GRAM";

export const UNIT_SHORT_LABEL: Record<UnitValue, string> = {
  GRAM: "g",
  MILLILITER: "ml",
  BUCATA: "buc",
};

export const UNIT_SELECT_OPTIONS = UNIT_VALUES.map((value) => ({
  value,
  label: UNIT_SHORT_LABEL[value],
}));

export function formatUnitShort(unit: MaybeUnitValue): string {
  return UNIT_SHORT_LABEL[unit ?? DEFAULT_UNIT];
}

export function isUnitValue(value: unknown): value is UnitValue {
  return typeof value === "string" && (UNIT_VALUES as readonly string[]).includes(value);
}

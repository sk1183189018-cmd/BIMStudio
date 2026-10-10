/**
 * BIMStudio — Measurement Units
 *
 * Internal geometry calculations use millimetres.
 * This module provides validated unit conversions.
 */

export type LengthUnit = "mm" | "cm" | "m" | "in" | "ft";

const MILLIMETRES_PER_UNIT: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8
};

/**
 * Convert a length from one supported unit to another.
 */
export function convertLength(
  value: number,
  from: LengthUnit,
  to: LengthUnit
): number {
  if (!Number.isFinite(value)) {
    throw new Error("Length must be a finite number.");
  }

  const millimetres = value * MILLIMETRES_PER_UNIT[from];
  const converted = millimetres / MILLIMETRES_PER_UNIT[to];

  if (!Number.isFinite(converted)) {
    throw new Error("Length conversion produced an invalid result.");
  }

  return converted;
}

/**
 * Convert any supported length to the internal unit: millimetres.
 */
export function toMillimetres(
  value: number,
  unit: LengthUnit
): number {
  return convertLength(value, unit, "mm");
}

/**
 * Convert internal millimetres to a display unit.
 */
export function fromMillimetres(
  value: number,
  unit: LengthUnit
): number {
  return convertLength(value, "mm", unit);
}

/**
 * Format a length for display.
 */
export function formatLength(
  value: number,
  unit: LengthUnit = "mm",
  precision = 2
): string {
  if (!Number.isFinite(value)) {
    throw new Error("Length must be a finite number.");
  }

  if (!Number.isInteger(precision) || precision < 0 || precision > 8) {
    throw new Error("Precision must be an integer from 0 to 8.");
  }

  const converted = fromMillimetres(value, unit);

  return `${converted.toFixed(precision)} ${unit}`;
}

/**
 * Check whether a value is a supported length unit.
 */
export function isLengthUnit(value: unknown): value is LengthUnit {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(MILLIMETRES_PER_UNIT, value)
  );
}

/**
 * Convert a length to a rounded millimetre value.
 */
export function roundToMillimetre(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Length must be a finite number.");
  }

  return Math.round(value);
}

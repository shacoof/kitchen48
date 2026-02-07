/**
 * Measurement Utilities (Frontend)
 * Shared functions for unit conversion and fraction display.
 * Mirrors backend/src/lib/measurement.ts for client-side use.
 */

// ============================================================================
// Fraction Display
// ============================================================================

const FRACTION_MAP: Array<{ decimal: number; display: string }> = [
  { decimal: 0.125, display: '\u215B' },  // ⅛
  { decimal: 0.25, display: '\u00BC' },   // ¼
  { decimal: 0.333, display: '\u2153' },  // ⅓
  { decimal: 0.375, display: '\u215C' },  // ⅜
  { decimal: 0.5, display: '\u00BD' },    // ½
  { decimal: 0.625, display: '\u215D' },  // ⅝
  { decimal: 0.667, display: '\u2154' },  // ⅔
  { decimal: 0.75, display: '\u00BE' },   // ¾
  { decimal: 0.875, display: '\u215E' },  // ⅞
];

const FRACTION_TOLERANCE = 0.01;

/**
 * Convert a decimal quantity to a human-friendly fraction string.
 *
 * Examples:
 *   0.5   → "½"
 *   1.333 → "1⅓"
 *   2.0   → "2"
 *   0.25  → "¼"
 *   3.7   → "3.7"
 */
export function toFractionDisplay(value: number): string {
  if (value <= 0) return '0';

  const whole = Math.floor(value);
  const fractional = value - whole;

  if (fractional < FRACTION_TOLERANCE) {
    return whole.toString();
  }

  const match = FRACTION_MAP.find(
    (f) => Math.abs(f.decimal - fractional) < FRACTION_TOLERANCE
  );

  if (match) {
    return whole > 0 ? `${whole}${match.display}` : match.display;
  }

  return Number(value.toFixed(1)).toString();
}

// ============================================================================
// Unit System
// ============================================================================

export type UnitSystem = 'universal' | 'metric' | 'imperial';

const UNIT_SYSTEMS: Record<string, UnitSystem> = {
  cups: 'universal', tbsp: 'universal', tsp: 'universal',
  pieces: 'universal', pinch: 'universal', cloves: 'universal',
  slices: 'universal', whole: 'universal', bunch: 'universal',
  g: 'metric', kg: 'metric', ml: 'metric', l: 'metric',
  oz: 'imperial', lb: 'imperial', fl_oz: 'imperial',
};

export function getUnitSystem(unit: string): UnitSystem {
  return UNIT_SYSTEMS[unit] || 'universal';
}

// ============================================================================
// Conversion
// ============================================================================

interface ConversionPair {
  metricUnit: string;
  imperialUnit: string;
  toImperial: number;
}

const CONVERSIONS: ConversionPair[] = [
  { metricUnit: 'g', imperialUnit: 'oz', toImperial: 0.035274 },
  { metricUnit: 'kg', imperialUnit: 'lb', toImperial: 2.20462 },
  { metricUnit: 'ml', imperialUnit: 'fl_oz', toImperial: 0.033814 },
  { metricUnit: 'l', imperialUnit: 'fl_oz', toImperial: 33.814 },
];

/**
 * Convert a quantity between measurement systems.
 * Returns null if no conversion needed or available.
 */
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toSystem: 'metric' | 'imperial'
): { quantity: number; unit: string } | null {
  const fromSystem = getUnitSystem(fromUnit);

  if (fromSystem === 'universal') return null;
  if (fromSystem === toSystem) return null;

  if (toSystem === 'imperial') {
    const pair = CONVERSIONS.find((c) => c.metricUnit === fromUnit);
    if (!pair) return null;
    return { quantity: quantity * pair.toImperial, unit: pair.imperialUnit };
  } else {
    const pair = CONVERSIONS.find((c) => c.imperialUnit === fromUnit);
    if (!pair) return null;
    return { quantity: quantity / pair.toImperial, unit: pair.metricUnit };
  }
}

/**
 * Format an ingredient quantity for display, applying serving adjustment
 * and optional unit conversion.
 */
export function formatQuantity(
  quantity: number | null,
  unit: string | null,
  servingMultiplier = 1,
  targetSystem?: 'metric' | 'imperial'
): string {
  if (quantity === null) return '';

  let displayQuantity = quantity * servingMultiplier;
  let displayUnit = unit || '';

  // Convert if needed
  if (targetSystem && unit) {
    const converted = convertQuantity(displayQuantity, unit, targetSystem);
    if (converted) {
      displayQuantity = converted.quantity;
      displayUnit = converted.unit;
    }
  }

  const fractionStr = toFractionDisplay(displayQuantity);
  return displayUnit ? `${fractionStr} ${displayUnit}` : fractionStr;
}

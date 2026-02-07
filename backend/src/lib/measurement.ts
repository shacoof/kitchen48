/**
 * Measurement Utilities
 * Shared functions for unit conversion and fraction display.
 *
 * Unit classification (from LOV "Measurement Units"):
 *   Universal: cups, tbsp, tsp, pieces, pinch, cloves, slices, whole, bunch
 *   Metric:    g, kg, ml, l
 *   Imperial:  oz, lb, fl_oz
 *
 * Universal units are NEVER converted between systems.
 */

// ============================================================================
// Fraction Display
// ============================================================================

/** Fraction lookup entries sorted by decimal value */
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
 *   3.7   → "3.7"  (no matching fraction, falls back to decimal)
 */
export function toFractionDisplay(value: number): string {
  if (value <= 0) return '0';

  const whole = Math.floor(value);
  const fractional = value - whole;

  // No fractional part
  if (fractional < FRACTION_TOLERANCE) {
    return whole.toString();
  }

  // Look up the fractional part
  const match = FRACTION_MAP.find(
    (f) => Math.abs(f.decimal - fractional) < FRACTION_TOLERANCE
  );

  if (match) {
    return whole > 0 ? `${whole}${match.display}` : match.display;
  }

  // No matching fraction — round to 1 decimal place
  return Number(value.toFixed(1)).toString();
}

// ============================================================================
// Unit System Classification
// ============================================================================

export type UnitSystem = 'universal' | 'metric' | 'imperial';

const UNIT_SYSTEMS: Record<string, UnitSystem> = {
  // Universal (never converted)
  cups: 'universal',
  tbsp: 'universal',
  tsp: 'universal',
  pieces: 'universal',
  pinch: 'universal',
  cloves: 'universal',
  slices: 'universal',
  whole: 'universal',
  bunch: 'universal',
  // Metric
  g: 'metric',
  kg: 'metric',
  ml: 'metric',
  l: 'metric',
  // Imperial
  oz: 'imperial',
  lb: 'imperial',
  fl_oz: 'imperial',
};

/**
 * Get the measurement system of a unit.
 * Returns 'universal' for unknown units (safe default — no conversion).
 */
export function getUnitSystem(unit: string): UnitSystem {
  return UNIT_SYSTEMS[unit] || 'universal';
}

// ============================================================================
// Unit Conversion
// ============================================================================

interface ConversionPair {
  metricUnit: string;
  imperialUnit: string;
  /** Multiply metric value by this factor to get imperial value */
  toImperial: number;
}

const CONVERSIONS: ConversionPair[] = [
  { metricUnit: 'g', imperialUnit: 'oz', toImperial: 0.035274 },
  { metricUnit: 'kg', imperialUnit: 'lb', toImperial: 2.20462 },
  { metricUnit: 'ml', imperialUnit: 'fl_oz', toImperial: 0.033814 },
  { metricUnit: 'l', imperialUnit: 'fl_oz', toImperial: 33.814 },
];

/**
 * Convert a quantity from one unit to the target measurement system.
 *
 * Returns the converted { quantity, unit } or null if:
 * - The unit is universal (no conversion needed)
 * - The unit is already in the target system
 * - No conversion pair exists for the unit
 */
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toSystem: 'metric' | 'imperial'
): { quantity: number; unit: string } | null {
  const fromSystem = getUnitSystem(fromUnit);

  // Universal units never convert
  if (fromSystem === 'universal') return null;

  // Already in target system
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

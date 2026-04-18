export type MeasurementSystem = 'metric' | 'imperial';
export type TimeUnit = 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';

const UNIVERSAL_UNITS = new Set([
  'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons', 'pinch', 'dash',
  'piece', 'pieces', 'whole', 'clove', 'cloves',
  'bunch', 'bunches', 'sprig', 'sprigs', 'slice', 'slices',
  'can', 'cans', 'bottle', 'bottles', 'package', 'packages',
  'handful', 'handfuls', 'drop', 'drops', 'stick', 'sticks',
]);

const METRIC_UNITS = new Set(['g', 'kg', 'ml', 'l', 'cm']);
const IMPERIAL_UNITS = new Set(['oz', 'lb', 'fl oz', 'qt', 'gal', 'in']);

export function getUnitSystem(unit: string): MeasurementSystem | 'universal' {
  const lower = unit.toLowerCase().trim();
  if (UNIVERSAL_UNITS.has(lower)) return 'universal';
  if (METRIC_UNITS.has(lower)) return 'metric';
  if (IMPERIAL_UNITS.has(lower)) return 'imperial';
  return 'universal';
}

export function convertTimeToSeconds(value: number, unit: TimeUnit): number {
  switch (unit) {
    case 'SECONDS': return value;
    case 'MINUTES': return value * 60;
    case 'HOURS': return value * 3600;
    case 'DAYS': return value * 86400;
  }
}

export function formatTimer(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export function toFractionDisplay(value: number): string {
  const whole = Math.floor(value);
  const frac = value - whole;

  const fractions: [number, string][] = [
    [0.125, '\u215B'], [0.25, '\u00BC'], [0.333, '\u2153'],
    [0.5, '\u00BD'], [0.667, '\u2154'], [0.75, '\u00BE'],
  ];

  let closest = '';
  let minDiff = Infinity;
  for (const [threshold, symbol] of fractions) {
    const diff = Math.abs(frac - threshold);
    if (diff < minDiff && diff < 0.06) {
      minDiff = diff;
      closest = symbol;
    }
  }

  if (!closest) return frac === 0 ? `${whole}` : value.toFixed(1);
  return whole > 0 ? `${whole}${closest}` : closest;
}

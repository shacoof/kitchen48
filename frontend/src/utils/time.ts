/**
 * Time conversion and formatting utilities for recipe times.
 * Used by RecipePage, CreateRecipePage, and RecipeStepPage.
 */

/** Normalize a time value + unit to minutes */
export function toMinutes(value: number | null, unit: string | null): number {
  if (!value || !unit) return 0;
  switch (unit) {
    case 'SECONDS': return value / 60;
    case 'MINUTES': return value;
    case 'HOURS': return value * 60;
    case 'DAYS': return value * 1440;
    default: return value;
  }
}

/**
 * Format a total-minutes value to a human-friendly string.
 * < 1 min  → "<1 min"
 * 1–59 min → "45m"
 * 1h–24h   → "2h 30m"
 * 24h+     → "2d 3h"
 */
export function formatTotalTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '—';
  if (totalMinutes < 1) return '<1 min';
  if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;

  const totalHours = totalMinutes / 60;
  if (totalHours < 24) {
    const hours = Math.floor(totalHours);
    const mins = Math.round(totalMinutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = Math.round(totalHours % 24);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

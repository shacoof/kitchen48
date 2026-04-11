/**
 * Generate a unique ID without requiring crypto.getRandomValues.
 * Uses timestamp + random suffix — sufficient for local-only SQLite IDs.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${random}-${random2}`;
}

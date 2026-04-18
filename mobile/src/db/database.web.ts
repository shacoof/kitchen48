import { createLogger } from '../lib/logger';

const logger = createLogger('Database');

// Web stub — expo-sqlite is not available on web.
// All DB operations return empty results.

export async function getDatabase(): Promise<null> {
  return null;
}

export async function initDatabase(): Promise<void> {
  logger.debug('Web platform — SQLite not available');
}

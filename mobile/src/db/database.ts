import * as SQLite from 'expo-sqlite';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Database');

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('kitchen48.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const start = Date.now();
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      servings INTEGER,
      measurement_system TEXT DEFAULT 'metric',
      difficulty TEXT,
      cuisine TEXT,
      meal_type TEXT,
      hero_image_path TEXT,
      intro_video_path TEXT,
      is_published INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      title TEXT,
      slug TEXT,
      instruction TEXT,
      sort_order INTEGER NOT NULL,
      prep_time REAL,
      prep_time_unit TEXT DEFAULT 'MINUTES',
      wait_time REAL,
      wait_time_unit TEXT DEFAULT 'MINUTES',
      image_path TEXT,
      video_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS step_ingredients (
      id TEXT PRIMARY KEY,
      step_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dietary_tags (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  logger.timing('Database initialized', start);
}

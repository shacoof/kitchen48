/**
 * Database abstraction layer interface
 *
 * This module provides a swappable database interface.
 * Currently a placeholder for future PostgreSQL integration.
 */

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export interface Database {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query<T>(sql: string, params?: unknown[]): Promise<T[]>
  execute(sql: string, params?: unknown[]): Promise<void>
}

/**
 * Placeholder database implementation
 * Replace with actual PostgreSQL client in production
 */
export class PlaceholderDatabase implements Database {
  async connect(): Promise<void> {
    console.log('Database connection placeholder - no actual DB connected')
  }

  async disconnect(): Promise<void> {
    console.log('Database disconnection placeholder')
  }

  async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
    console.warn('Database query placeholder - no actual DB connected')
    return []
  }

  async execute(_sql: string, _params?: unknown[]): Promise<void> {
    console.warn('Database execute placeholder - no actual DB connected')
  }
}

// Export a singleton instance
export const db = new PlaceholderDatabase()

/**
 * Central Logging System for Kitchen48 Backend
 *
 * Environment-aware logging with file rotation and console output.
 * Configuration is stored in database parameters.
 *
 * Usage:
 *   const logger = createLogger('ComponentName');
 *   logger.debug('message');
 *   logger.warning('message');
 *   logger.error('message');
 *   logger.object('description', data);
 *   logger.timing('operation', startTime);
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Types
export type LogSeverity = 'debug' | 'warning' | 'error';

export interface LoggerConfig {
  enableFileLogging?: boolean;
  logDir?: string;
  retentionDays?: number;
  maxFileSize?: number;
  separateErrorLog?: boolean;
}

interface LogEntry {
  timestamp: Date;
  severity: LogSeverity;
  caller: string;
  message: string;
}

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
let config: Required<LoggerConfig> = {
  enableFileLogging: true,
  logDir: path.join(__dirname, '..', '..', '..', 'logs'),
  retentionDays: 30,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  separateErrorLog: true,
};

// Cache for database parameters
let cachedConsoleLogLevel: LogSeverity | null = null;
let cachedTimezone: string | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute

// Lazy-loaded prisma client
let prisma: any = null;

/**
 * Configure the logger
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get parameter value from database with caching
 */
async function getParameterFromDB(key: string, defaultValue: string): Promise<string> {
  const now = Date.now();

  // Return cached value if still valid
  if (lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    if (key === 'system.logging.console.minLevel' && cachedConsoleLogLevel) {
      return cachedConsoleLogLevel;
    }
    if (key === 'system.logging.timezone' && cachedTimezone) {
      return cachedTimezone;
    }
  }

  try {
    if (!prisma) {
      const { prisma: prismaSingleton } = await import('../core/database/prisma.js');
      prisma = prismaSingleton;
    }

    const parameter = await prisma.parameter.findFirst({
      where: {
        key,
        ownerType: 'SYSTEM',
      },
    });

    if (parameter && parameter.value) {
      // Update cache
      if (key === 'system.logging.console.minLevel') {
        cachedConsoleLogLevel = parameter.value as LogSeverity;
      }
      if (key === 'system.logging.timezone') {
        cachedTimezone = parameter.value;
      }
      lastFetchTime = now;
      return parameter.value;
    }
  } catch {
    // Silently fail and use default - don't log to avoid recursion
  }

  return defaultValue;
}

/**
 * Get console log level from database
 */
async function getConsoleLogLevel(): Promise<LogSeverity> {
  const level = await getParameterFromDB('system.logging.console.minLevel', 'error');
  return level as LogSeverity;
}

/**
 * Get timezone from database
 */
async function getTimezone(): Promise<string> {
  return await getParameterFromDB('system.logging.timezone', 'Asia/Jerusalem');
}

/**
 * Get the current date string in YYYY-MM-DD format for the configured timezone
 */
async function getCurrentDateString(): Promise<string> {
  const timezone = await getTimezone();
  const now = new Date();

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  } catch {
    // Fallback to UTC
    return now.toISOString().split('T')[0];
  }
}

/**
 * Format severity level with icon
 */
function formatSeverity(severity: LogSeverity): string {
  const icons = {
    debug: '🔍 DEBUG',
    warning: '⚠️  WARN',
    error: '❌ ERROR',
  };
  return icons[severity];
}

/**
 * Format timestamp for the configured timezone
 */
async function formatTimestamp(date: Date): Promise<string> {
  const timezone = await getTimezone();

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const formatted = new Intl.DateTimeFormat('en-CA', options).format(date);
    // Convert from "2026-01-24, 15:30:45" to "2026-01-24 15:30:45"
    return formatted.replace(',', '');
  } catch {
    // Fallback to ISO format
    return date.toISOString().replace('T', ' ').split('.')[0];
  }
}

/**
 * Format log entry for output
 */
async function formatLog(entry: LogEntry): Promise<string> {
  const timestamp = await formatTimestamp(entry.timestamp);
  const severity = formatSeverity(entry.severity);
  return `${severity} [${timestamp}] ${entry.caller}: ${entry.message}`;
}

/**
 * Ensure log directory exists
 */
async function ensureLogDirectory(): Promise<void> {
  try {
    await fs.promises.mkdir(config.logDir, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

/**
 * Write log entry to file
 */
async function writeToFile(entry: LogEntry, formattedLog: string): Promise<void> {
  if (!config.enableFileLogging) return;

  try {
    await ensureLogDirectory();

    const dateString = await getCurrentDateString();
    const logFile = path.join(config.logDir, `${dateString}.log`);
    const logLine = formattedLog + '\n';

    // Write to daily log file
    await fs.promises.appendFile(logFile, logLine, 'utf8');

    // Write to separate error log if enabled
    if (config.separateErrorLog && entry.severity === 'error') {
      const errorLogFile = path.join(config.logDir, 'error.log');
      await fs.promises.appendFile(errorLogFile, logLine, 'utf8');
    }

    // Check file size and rotate if needed
    await checkAndRotateLog(logFile);

    // Clean up old logs (don't await, run in background)
    cleanupOldLogs().catch(() => {});
  } catch {
    // Silently fail file logging
  }
}

/**
 * Check log file size and rotate if needed
 */
async function checkAndRotateLog(logFile: string): Promise<void> {
  try {
    const stats = await fs.promises.stat(logFile);
    if (stats.size > config.maxFileSize) {
      const timestamp = Date.now();
      const rotatedFile = logFile.replace('.log', `.${timestamp}.log`);
      await fs.promises.rename(logFile, rotatedFile);
    }
  } catch {
    // File might not exist yet
  }
}

/**
 * Clean up old log files based on retention policy
 */
async function cleanupOldLogs(): Promise<void> {
  try {
    const files = await fs.promises.readdir(config.logDir);
    const now = Date.now();
    const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      if (file === 'error.log') continue; // Keep error log

      const filePath = path.join(config.logDir, file);
      const stats = await fs.promises.stat(filePath);
      const age = now - stats.mtime.getTime();

      if (age > retentionMs) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Check if severity level should be logged to console
 */
function shouldLogToConsole(severity: LogSeverity, minLevel: LogSeverity): boolean {
  const levels: LogSeverity[] = ['debug', 'warning', 'error'];
  const severityIndex = levels.indexOf(severity);
  const minLevelIndex = levels.indexOf(minLevel);
  return severityIndex >= minLevelIndex;
}

/**
 * Core logging function
 */
export function appLog(
  caller: string,
  message: string,
  severity: LogSeverity = 'debug'
): void {
  const entry: LogEntry = {
    timestamp: new Date(),
    severity,
    caller,
    message,
  };

  // Format and output (async operations)
  (async () => {
    const formattedLog = await formatLog(entry);

    // Console output - check against minimum level
    const minLevel = await getConsoleLogLevel();
    if (shouldLogToConsole(severity, minLevel)) {
      console.log(formattedLog);
    }

    // File output - always write regardless of console level
    await writeToFile(entry, formattedLog);
  })().catch(() => {
    // Fallback to basic console output on error
    console.log(`[${severity.toUpperCase()}] ${caller}: ${message}`);
  });
}

/**
 * Convenience functions for different severity levels
 */
export function logDebug(caller: string, message: string): void {
  appLog(caller, message, 'debug');
}

export function logWarning(caller: string, message: string): void {
  appLog(caller, message, 'warning');
}

export function logError(caller: string, message: string): void {
  appLog(caller, message, 'error');
}

/**
 * Log complex objects with JSON serialization
 */
export function logObject(
  caller: string,
  message: string,
  data: unknown,
  severity: LogSeverity = 'debug'
): void {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    appLog(caller, `${message}\n${jsonData}`, severity);
  } catch {
    appLog(caller, `${message} [Failed to serialize object]`, 'error');
  }
}

/**
 * Log operation timing for performance monitoring
 */
export function logTiming(
  caller: string,
  operation: string,
  startTime: number,
  severity: LogSeverity = 'debug'
): void {
  const duration = Date.now() - startTime;
  appLog(caller, `${operation} completed in ${duration}ms`, severity);
}

/**
 * Scoped logger class for better organization
 */
export class ScopedLogger {
  constructor(private callerName: string) {}

  debug(message: string): void {
    logDebug(this.callerName, message);
  }

  warning(message: string): void {
    logWarning(this.callerName, message);
  }

  error(message: string): void {
    logError(this.callerName, message);
  }

  object(message: string, data: unknown, severity: LogSeverity = 'debug'): void {
    logObject(this.callerName, message, data, severity);
  }

  timing(operation: string, startTime: number, severity: LogSeverity = 'debug'): void {
    logTiming(this.callerName, operation, startTime, severity);
  }
}

/**
 * Create a scoped logger instance (recommended pattern)
 */
export function createLogger(callerName: string): ScopedLogger {
  return new ScopedLogger(callerName);
}

// Initialize log directory on module load
ensureLogDirectory().catch(() => {});

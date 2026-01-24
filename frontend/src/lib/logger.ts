/**
 * Central Logging System for Kitchen48 Frontend
 *
 * Browser-compatible logger with console output only.
 * Same API as backend logger for consistency.
 *
 * Usage:
 *   const logger = createLogger('ComponentName');
 *   logger.debug('message');
 *   logger.warning('message');
 *   logger.error('message');
 *   logger.object('description', data);
 *   logger.timing('operation', startTime);
 */

// Types
export type LogSeverity = 'debug' | 'warning' | 'error';

interface LogEntry {
  timestamp: Date;
  severity: LogSeverity;
  caller: string;
  message: string;
}

// Default timezone (Israel) - hardcoded for frontend
const DEFAULT_TIMEZONE = 'Asia/Jerusalem';

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
 * Format timestamp for Israel timezone
 */
function formatTimestamp(date: Date): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: DEFAULT_TIMEZONE,
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
 * Format log entry for console output
 */
function formatLog(entry: LogEntry): string {
  const timestamp = formatTimestamp(entry.timestamp);
  const severity = formatSeverity(entry.severity);
  return `${severity} [${timestamp}] ${entry.caller}: ${entry.message}`;
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

  const formattedLog = formatLog(entry);
  console.log(formattedLog);
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

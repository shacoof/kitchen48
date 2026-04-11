type LogLevel = 'debug' | 'warning' | 'error';

const ICONS: Record<LogLevel, string> = {
  debug: '\uD83D\uDD0D',
  warning: '\u26A0\uFE0F',
  error: '\u274C',
};

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export function createLogger(caller: string) {
  const log = (level: LogLevel, message: string) => {
    const icon = ICONS[level];
    const line = `${icon} ${level.toUpperCase()} [${timestamp()}] ${caller}: ${message}`;
    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (level === 'warning') {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  };

  return {
    debug: (msg: string) => log('debug', msg),
    warning: (msg: string) => log('warning', msg),
    error: (msg: string) => log('error', msg),
    object: (desc: string, data: unknown) => {
      log('debug', `${desc}: ${JSON.stringify(data, null, 2)}`);
    },
    timing: (operation: string, startTime: number) => {
      log('debug', `${operation} took ${Date.now() - startTime}ms`);
    },
  };
}

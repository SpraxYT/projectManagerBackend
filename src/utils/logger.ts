// Logger simple pour l'application

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

function formatMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const color = COLORS[level];
  const reset = COLORS.reset;
  
  let formatted = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;
  
  if (meta) {
    formatted += `\n${JSON.stringify(meta, null, 2)}`;
  }
  
  return formatted;
}

export const logger = {
  debug(message: string, meta?: any) {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: any) {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: any) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: any) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },
};

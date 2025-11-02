/* eslint-disable no-console */
import util from 'util';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_KEYS = new Set([
  'token',
  'accessToken',
  'refreshToken',
  'otp',
  'password',
  'passwordHash',
  'sessionId',
  'sessionID',
  'userId',
  'user_id',
  'reportedUserId',
  'reporterUserId',
  'email',
  'phone',
  'phoneNumber',
  'activeDeviceToken',
  'deviceHash',
  'ipHash'
]);

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TOKEN_REGEX = /(Bearer\s+[A-Za-z0-9\-._~+/]+=*)|([A-Za-z0-9\-._~+/]{20,})/g;

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const resolveLogLevel = (): LogLevel => {
  const envLevel = (process.env.LOG_LEVEL || process.env.BACKEND_LOG_LEVEL || '').toLowerCase();
  if (envLevel in levelPriority) {
    return envLevel as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
};

const currentLevel: LogLevel = resolveLogLevel();
const currentPriority = levelPriority[currentLevel];

const originalConsole: Record<ConsoleMethod, (...args: any[]) => void> = {
  log: console.log.bind(console),
  info: console.info ? console.info.bind(console) : console.log.bind(console),
  warn: console.warn ? console.warn.bind(console) : console.log.bind(console),
  error: console.error ? console.error.bind(console) : console.log.bind(console),
  debug: console.debug ? console.debug.bind(console) : console.log.bind(console)
};

const methodMapping: Record<LogLevel, ConsoleMethod> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error'
};

const sanitizeValue = (value: any, key?: string, seen?: WeakSet<object>): any => {
  if (value === null || value === undefined) {
    return value;
  }

  if (key && SENSITIVE_KEYS.has(key)) {
    return '[redacted]';
  }

  if (typeof value === 'string') {
    let sanitized = value.replace(EMAIL_REGEX, '[redacted-email]');
    sanitized = sanitized.replace(TOKEN_REGEX, '[redacted-token]');
    return sanitized;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const tracker = seen || new WeakSet<object>();
    if (tracker.has(value)) {
      return '[Circular]';
    }
    tracker.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, key, tracker));
    }

    const sanitizedObject: Record<string, any> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      sanitizedObject[childKey] = sanitizeValue(childValue, childKey, tracker);
    }
    return sanitizedObject;
  }

  return value;
};

const shouldLog = (level: LogLevel): boolean => levelPriority[level] >= currentPriority;

const formatArgs = (args: any[]): any[] => args.map((arg) => sanitizeValue(arg));

const writeLog = (level: LogLevel, scope: string | undefined, args: any[]) => {
  if (!shouldLog(level)) {
    return;
  }

  const writer = originalConsole[methodMapping[level]] || originalConsole.log;
  const timestamp = new Date().toISOString();
  const prefixParts = [`[${timestamp}]`, `[${level.toUpperCase()}]`];
  if (scope) {
    prefixParts.push(`[${scope}]`);
  }

  const sanitizedArgs = formatArgs(args);
  if (sanitizedArgs.length === 1 && typeof sanitizedArgs[0] === 'string') {
    writer(`${prefixParts.join(' ')} ${sanitizedArgs[0]}`);
  } else {
    writer(`${prefixParts.join(' ')}`, ...sanitizedArgs.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      return util.inspect(item, { depth: 4, colors: false, compact: true });
    }));
  }
};

export const createLogger = (scope: string) => ({
  debug: (...args: any[]) => writeLog('debug', scope, args),
  info: (...args: any[]) => writeLog('info', scope, args),
  warn: (...args: any[]) => writeLog('warn', scope, args),
  error: (...args: any[]) => writeLog('error', scope, args)
});

const patchConsole = () => {
  (console as any).log = (...args: any[]) => writeLog('debug', undefined, args);
  (console as any).debug = (...args: any[]) => writeLog('debug', undefined, args);
  (console as any).info = (...args: any[]) => writeLog('info', undefined, args);
  (console as any).warn = (...args: any[]) => writeLog('warn', undefined, args);
  (console as any).error = (...args: any[]) => writeLog('error', undefined, args);
};

patchConsole();

export const logger = createLogger('app');

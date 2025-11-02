const DEBUG_ENABLED = process.env.REACT_APP_DEBUG_LOGS === 'true';

const redact = (value: unknown) => {
  if (typeof value !== 'string') return value;
  if (value.length <= 8) return '[redacted]';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
};

const sanitize = (args: unknown[]) =>
  args.map((arg) => {
    if (typeof arg === 'string') {
      return arg
        .replace(/Bearer\s+[A-Za-z0-9-_./+=]+/gi, 'Bearer [redacted]')
        .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]');
    }

    if (typeof arg === 'object' && arg !== null) {
      const clone: Record<string, unknown> = Array.isArray(arg) ? {} : {};
      const entries = Object.entries(arg as Record<string, unknown>);
      for (const [key, value] of entries) {
        if (/token|email|userId|session/i.test(key)) {
          clone[key] = redact(typeof value === 'string' ? value : JSON.stringify(value));
        } else {
          clone[key] = value;
        }
      }
      return Array.isArray(arg) ? entries.map(([k, v]) => ({ [k]: clone[k] ?? v })) : clone;
    }

    return arg;
  });

export const debugLog = (...args: unknown[]) => {
  if (!DEBUG_ENABLED) return;
  // eslint-disable-next-line no-console
  console.log('[debug]', ...sanitize(args));
};

export const debugWarn = (...args: unknown[]) => {
  if (!DEBUG_ENABLED) return;
  // eslint-disable-next-line no-console
  console.warn('[debug]', ...sanitize(args));
};

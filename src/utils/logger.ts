/**
 * Logger condicional que solo muestra logs en desarrollo
 * En producción, los logs se silencian para mejorar rendimiento y seguridad
 */

const isDevelopment = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const createLogger = (): Logger => {
  const logMethod = (level: LogLevel) => (...args: unknown[]) => {
    if (isDevelopment) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      console[level](prefix, ...args);
    }
  };

  return {
    log: logMethod('log'),
    warn: logMethod('warn'),
    error: logMethod('error'),
    info: logMethod('info'),
    debug: logMethod('debug'),
  };
};

export const logger = createLogger();

export default logger;

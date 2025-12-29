export class Log {
  static info(...args: unknown[]) {
    console.log('[Game]', ...args);
  }
  static warn(...args: unknown[]) {
    console.warn('[Game]', ...args);
  }
  static error(...args: unknown[]) {
    console.error('[Game]', ...args);
  }
}

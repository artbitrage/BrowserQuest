export class Log {
  static info(...args: any[]) {
    console.log('[Game]', ...args);
  }
  static warn(...args: any[]) {
    console.warn('[Game]', ...args);
  }
  static error(...args: any[]) {
    console.error('[Game]', ...args);
  }
}

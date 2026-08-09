/* eslint-disable no-console */
type LogMeta = Record<string, unknown>;

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    console.log(JSON.stringify({ level: 'info', time: timestamp(), message, ...meta }));
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(JSON.stringify({ level: 'warn', time: timestamp(), message, ...meta }));
  },
  error(message: string, meta?: LogMeta): void {
    console.error(JSON.stringify({ level: 'error', time: timestamp(), message, ...meta }));
  },
};

// src/shared/logger.ts

import type { Logger, LogLevel } from "./types.js";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class ConsoleLogger implements Logger {
  level: LogLevel;

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export function createLogger(level?: LogLevel): Logger {
  return new ConsoleLogger(level ?? "info");
}

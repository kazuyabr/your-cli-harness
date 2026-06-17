// src/core/memory/manager.ts

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

import type { AutoMemoryConfig } from "../../shared/types.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class MemoryManager {
  private config: AutoMemoryConfig;
  private memoryDir: string;

  constructor(config: AutoMemoryConfig, memoryDir: string) {
    this.config = config;
    this.memoryDir = memoryDir;
  }

  load(): string {
    if (!this.config.enabled) return "";

    const memoryPath = resolve(this.memoryDir, "MEMORY.md");

    if (!existsSync(memoryPath)) {
      logger.info("No MEMORY.md found, starting fresh");
      return "";
    }

    const content = readFileSync(memoryPath, "utf-8");
    const lines = content.split("\n");

    const truncated =
      lines.length > this.config.maxLines
        ? lines.slice(0, this.config.maxLines).join("\n")
        : content;

    if (Buffer.byteLength(truncated, "utf-8") > this.config.maxKB * 1024) {
      return truncated.slice(0, this.config.maxKB * 1024) + "\n... [truncated]";
    }

    logger.info(`Loaded auto-memory (${lines.length} lines)`);
    return truncated;
  }

  save(content: string): void {
    if (!this.config.enabled) return;

    const memoryPath = resolve(this.memoryDir, "MEMORY.md");
    const dir = dirname(memoryPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(memoryPath, content, "utf-8");
    logger.info("Auto-memory saved");
  }

  append(note: string): void {
    const existing = this.load();
    const updated = existing
      ? `${existing}\n\n${note}`
      : `# Auto Memory\n\n${note}`;

    this.save(updated);
  }
}

// src/core/memory/manager.ts
// Memory Manager: auto-memory, MEMORY.md management, compaction, session memory

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

import type { AutoMemoryConfig } from "../../shared/types.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: Date;
  source: "user" | "assistant" | "system";
  tags?: string[];
}

export interface MemoryStats {
  totalLines: number;
  totalBytes: number;
  entries: number;
  lastModified: Date | null;
}

export interface CompactOptions {
  maxLines?: number;
  maxKB?: number;
  preservePatterns?: string[];
}

export class MemoryManager {
  private config: AutoMemoryConfig;
  private memoryDir: string;
  private memoryPath: string;

  constructor(config: AutoMemoryConfig, memoryDir: string) {
    this.config = config;
    this.memoryDir = memoryDir;
    this.memoryPath = resolve(memoryDir, "MEMORY.md");
  }

  // ─── Core Operations ──────────────────────────────────────────────

  load(): string {
    if (!this.config.enabled) return "";

    if (!existsSync(this.memoryPath)) {
      logger.info("No MEMORY.md found, starting fresh");
      return "";
    }

    const content = readFileSync(this.memoryPath, "utf-8");
    return this.truncateContent(content);
  }

  save(content: string): void {
    if (!this.config.enabled) return;

    const dir = dirname(this.memoryPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(this.memoryPath, content, "utf-8");
    logger.info("Auto-memory saved");
  }

  append(note: string): void {
    const existing = this.load();
    const updated = existing
      ? `${existing}\n\n${note}`
      : `# Auto Memory\n\n${note}`;

    this.save(updated);
  }

  clear(): void {
    this.save("# Auto Memory\n");
  }

  exists(): boolean {
    return existsSync(this.memoryPath);
  }

  // ─── Stats ────────────────────────────────────────────────────────

  getStats(): MemoryStats {
    if (!existsSync(this.memoryPath)) {
      return { totalLines: 0, totalBytes: 0, entries: 0, lastModified: null };
    }

    const content = readFileSync(this.memoryPath, "utf-8");
    const lines = content.split("\n");
    const stat = require("node:fs").statSync(this.memoryPath);

    return {
      totalLines: lines.length,
      totalBytes: Buffer.byteLength(content, "utf-8"),
      entries: this.countEntries(content),
      lastModified: stat.mtime,
    };
  }

  // ─── Structured Memory ────────────────────────────────────────────

  addEntry(entry: Omit<MemoryEntry, "id" | "timestamp">): void {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date();

    const line = `- [${id}] ${entry.content}`;
    this.append(line);
  }

  getEntries(): MemoryEntry[] {
    if (!this.exists()) return [];

    const content = readFileSync(this.memoryPath, "utf-8");
    const lines = content.split("\n");
    const entries: MemoryEntry[] = [];

    for (const line of lines) {
      const match = line.match(/^- \[(mem_\d+_[a-z0-9]+)\] (.+)$/);
      if (match) {
        entries.push({
          id: match[1],
          content: match[2],
          timestamp: new Date(parseInt(match[1].split("_")[1])),
          source: "assistant",
        });
      }
    }

    return entries;
  }

  removeEntry(id: string): boolean {
    if (!this.exists()) return false;

    const content = readFileSync(this.memoryPath, "utf-8");
    const lines = content.split("\n");
    const filtered = lines.filter((line) => !line.includes(`[${id}]`));

    if (filtered.length === lines.length) return false;

    this.save(filtered.join("\n"));
    return true;
  }

  // ─── Compaction ────────────────────────────────────────────────────

  compact(options?: CompactOptions): { before: number; after: number } {
    const content = this.load();
    if (!content) return { before: 0, after: 0 };

    const before = content.split("\n").length;
    const maxLines = options?.maxLines ?? this.config.maxLines;
    const maxKB = options?.maxKB ?? this.config.maxKB;

    let compacted = content;

    // Remove duplicate lines
    const uniqueLines = [...new Set(compacted.split("\n"))];
    compacted = uniqueLines.join("\n");

    // Truncate by lines
    const lines = compacted.split("\n");
    if (lines.length > maxLines) {
      compacted = lines.slice(0, maxLines).join("\n");
    }

    // Truncate by size
    if (Buffer.byteLength(compacted, "utf-8") > maxKB * 1024) {
      compacted = compacted.slice(0, maxKB * 1024) + "\n... [compacted]";
    }

    const after = compacted.split("\n").length;

    if (before !== after) {
      this.save(compacted);
      logger.info(`Memory compacted: ${before} → ${after} lines`);
    }

    return { before, after };
  }

  // ─── Session Memory ───────────────────────────────────────────────

  learnFromSession(sessionId: string, learnings: string[]): void {
    if (learnings.length === 0) return;

    const section = `\n## Session ${sessionId}\n${learnings.map((l) => `- ${l}`).join("\n")}`;
    this.append(section);
  }

  getRecentLearnings(count: number = 10): string[] {
    const entries = this.getEntries();
    return entries
      .slice(-count)
      .map((e) => e.content);
  }

  // ─── Section Management ───────────────────────────────────────────

  getSection(heading: string): string | null {
    if (!this.exists()) return null;

    const content = readFileSync(this.memoryPath, "utf-8");
    const lines = content.split("\n");
    const startIdx = lines.findIndex((l) => l.trim() === heading);

    if (startIdx === -1) return null;

    let endIdx = lines.length;
    for (let i = startIdx + 1; i < lines.length; i++) {
      if (/^#{1,6}\s/.test(lines[i])) {
        endIdx = i;
        break;
      }
    }

    return lines.slice(startIdx, endIdx).join("\n");
  }

  updateSection(heading: string, content: string): void {
    if (!this.exists()) {
      this.save(`# ${heading}\n${content}`);
      return;
    }

    const existing = readFileSync(this.memoryPath, "utf-8");
    const lines = existing.split("\n");
    const startIdx = lines.findIndex((l) => l.trim() === heading);

    if (startIdx === -1) {
      this.save(`${existing}\n\n# ${heading}\n${content}`);
      return;
    }

    let endIdx = lines.length;
    for (let i = startIdx + 1; i < lines.length; i++) {
      if (/^#{1,6}\s/.test(lines[i])) {
        endIdx = i;
        break;
      }
    }

    const newLines = [
      ...lines.slice(0, startIdx),
      heading,
      content,
      ...lines.slice(endIdx),
    ];

    this.save(newLines.join("\n"));
  }

  // ─── Utilities ────────────────────────────────────────────────────

  private truncateContent(content: string): string {
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

  private countEntries(content: string): number {
    return content.split("\n").filter((l) => l.match(/^- \[mem_/)).length;
  }
}

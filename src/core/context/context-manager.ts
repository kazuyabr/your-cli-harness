// src/core/context/context-manager.ts

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface ContextSource {
  type: "session" | "agents" | "claude" | "vibecoding";
  path: string;
  content: string;
  priority: number;
}

export interface ContextConfig {
  projectRoot: string;
  clientId: string;
  maxContextSize?: number;
}

export class ContextManager {
  private config: ContextConfig;
  private sources: ContextSource[] = [];

  constructor(config: ContextConfig) {
    this.config = config;
  }

  async loadContext(): Promise<string> {
    logger.info("Loading context...");

    // Load sources in priority order
    await this.loadSessionContext();
    await this.loadAgentsContext();
    await this.loadClaudeContext();
    await this.loadVibecodingContext();

    // Sort by priority (higher = more important)
    this.sources.sort((a, b) => b.priority - a.priority);

    // Combine context
    const combined = this.sources
      .map(s => `## ${s.type.toUpperCase()}\n${s.content}`)
      .join("\n\n---\n\n");

    // Truncate if needed
    const maxSize = this.config.maxContextSize || 100000;
    if (combined.length > maxSize) {
      logger.warn(`Context truncated: ${combined.length} > ${maxSize}`);
      return combined.slice(0, maxSize);
    }

    logger.info(`Context loaded: ${this.sources.length} sources, ${combined.length} chars`);
    return combined;
  }

  private async loadSessionContext(): Promise<void> {
    const sessionPath = join(this.config.projectRoot, ".vibecoding", "memory", "session.md");
    if (existsSync(sessionPath)) {
      try {
        const content = await readFile(sessionPath, "utf-8");
        this.sources.push({
          type: "session",
          path: sessionPath,
          content,
          priority: 100, // Highest priority
        });
      } catch (error) {
        logger.warn(`Failed to load session context: ${error}`);
      }
    }
  }

  private async loadAgentsContext(): Promise<void> {
    const agentsPath = join(this.config.projectRoot, "AGENTS.md");
    if (existsSync(agentsPath)) {
      try {
        const content = await readFile(agentsPath, "utf-8");
        this.sources.push({
          type: "agents",
          path: agentsPath,
          content,
          priority: 90,
        });
      } catch (error) {
        logger.warn(`Failed to load agents context: ${error}`);
      }
    }
  }

  private async loadClaudeContext(): Promise<void> {
    const claudePath = join(this.config.projectRoot, "CLAUDE.md");
    if (existsSync(claudePath)) {
      try {
        const content = await readFile(claudePath, "utf-8");
        this.sources.push({
          type: "claude",
          path: claudePath,
          content,
          priority: 80,
        });
      } catch (error) {
        logger.warn(`Failed to load claude context: ${error}`);
      }
    }
  }

  private async loadVibecodingContext(): Promise<void> {
    const vibecodingPath = join(this.config.projectRoot, ".vibecoding");
    if (existsSync(vibecodingPath)) {
      try {
        const files = await this.getVibecodingFiles(vibecodingPath);
        const contents: string[] = [];

        for (const file of files) {
          try {
            const content = await readFile(file, "utf-8");
            const relativePath = file.replace(vibecodingPath, "").replace(/^\//, "");
            contents.push(`### ${relativePath}\n${content}`);
          } catch {
            // Skip unreadable files
          }
        }

        if (contents.length > 0) {
          this.sources.push({
            type: "vibecoding",
            path: vibecodingPath,
            content: contents.join("\n\n"),
            priority: 70,
          });
        }
      } catch (error) {
        logger.warn(`Failed to load vibecoding context: ${error}`);
      }
    }
  }

  private async getVibecodingFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const subFiles = await this.getVibecodingFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip unreadable directories
    }

    return files;
  }

  async saveSessionContext(content: string): Promise<void> {
    const sessionPath = join(this.config.projectRoot, ".vibecoding", "memory", "session.md");
    const dir = join(this.config.projectRoot, ".vibecoding", "memory");
    
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(sessionPath, content, "utf-8");
    logger.info("Session context saved");
  }

  getSources(): ContextSource[] {
    return [...this.sources];
  }

  clearSources(): void {
    this.sources = [];
  }
}

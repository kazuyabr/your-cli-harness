// src/core/context/headroom.ts

import type { Session } from "../../shared/types.js";
import { ContextWindowManager } from "./window.js";
import { CompactionEngine } from "./compaction.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export type HeadroomLevel = "safe" | "attention" | "critical" | "emergency";

export interface HeadroomStatus {
  level: HeadroomLevel;
  usedTokens: number;
  maxTokens: number;
  headroomTokens: number;
  usagePercent: number;
  shouldCompact: boolean;
  message: string;
}

export class HeadroomMonitor {
  private windowManager: ContextWindowManager;
  private compactionEngine: CompactionEngine;
  private autoCompactThreshold: number;

  constructor(
    maxTokens: number = 200_000,
    autoCompactThreshold: number = 95,
    _suggestThreshold: number = 80
  ) {
    this.windowManager = new ContextWindowManager(maxTokens);
    this.compactionEngine = new CompactionEngine();
    this.autoCompactThreshold = autoCompactThreshold;
  }

  check(session: Session): HeadroomStatus {
    const usagePercent = (session.contextWindow.usedTokens / session.contextWindow.maxTokens) * 100;
    const level = this.windowManager.getLevel();
    const headroomTokens = session.contextWindow.maxTokens - session.contextWindow.usedTokens;

    const shouldCompact = usagePercent >= this.autoCompactThreshold;

    let message: string;
    switch (level) {
      case "safe":
        message = `Context: ${usagePercent.toFixed(1)}% used (${headroomTokens} tokens free)`;
        break;
      case "attention":
        message = `⚠️ Context at ${usagePercent.toFixed(1)}%. Consider /compact soon.`;
        break;
      case "critical":
        message = `🔴 Context at ${usagePercent.toFixed(1)}%. Compaction recommended.`;
        break;
      case "emergency":
        message = `🚨 Context at ${usagePercent.toFixed(1)}! Auto-compacting...`;
        break;
    }

    return {
      level,
      usedTokens: session.contextWindow.usedTokens,
      maxTokens: session.contextWindow.maxTokens,
      headroomTokens,
      usagePercent,
      shouldCompact,
      message,
    };
  }

  async autoCompact(session: Session): Promise<boolean> {
    const status = this.check(session);
    if (!status.shouldCompact) return false;

    logger.info("Auto-compacting context...");
    const result = this.compactionEngine.compact(session);

    session.messages = [
      ...result.preservedMessages,
    ];
    session.contextWindow.messageTokens = result.tokensAfter;
    session.contextWindow.usedTokens =
      session.contextWindow.systemTokens + session.contextWindow.messageTokens;

    logger.info(`Auto-compaction complete: ${result.tokensBefore} → ${result.tokensAfter} tokens`);
    return true;
  }
}

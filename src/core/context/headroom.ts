// src/core/context/headroom.ts

import type { Session } from "../../shared/types.js";
import { ContextWindowManager } from "./window.js";
import { CompactionEngine } from "./compaction.js";
import { TokenCounter } from "./token-counter.js";
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
  shouldSuggest: boolean;
  message: string;
  breakdown: {
    system: number;
    messages: number;
    tools: number;
  };
}

export interface HeadroomConfig {
  autoCompactThreshold: number;
  suggestThreshold: number;
  emergencyThreshold: number;
  model: string;
}

const DEFAULT_CONFIG: HeadroomConfig = {
  autoCompactThreshold: 95,
  suggestThreshold: 80,
  emergencyThreshold: 95,
  model: "claude-sonnet-4-20250514",
};

export class HeadroomMonitor {
  private windowManager: ContextWindowManager;
  private compactionEngine: CompactionEngine;
  private config: HeadroomConfig;

  constructor(config: Partial<HeadroomConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const limits = TokenCounter.getModelLimits(this.config.model);
    this.windowManager = new ContextWindowManager(limits.contextWindow);
    this.compactionEngine = new CompactionEngine();
  }

  check(session: Session): HeadroomStatus {
    const cw = session.contextWindow;
    const usagePercent = (cw.usedTokens / cw.maxTokens) * 100;
    const headroomTokens = cw.maxTokens - cw.usedTokens;

    const shouldSuggest = usagePercent >= this.config.suggestThreshold;
    const shouldCompact = usagePercent >= this.config.autoCompactThreshold;
    const level = this.determineLevel(usagePercent);

    let message: string;
    switch (level) {
      case "safe":
        message = `✅ Context: ${usagePercent.toFixed(1)}% (${headroomTokens.toLocaleString()} free)`;
        break;
      case "attention":
        message = `⚠️ Context at ${usagePercent.toFixed(1)}%. Consider /compact soon.`;
        break;
      case "critical":
        message = `🔴 Context at ${usagePercent.toFixed(1)}%. Compaction recommended.`;
        break;
      case "emergency":
        message = `🚨 Context at ${usagePercent.toFixed(1)}%! Auto-compacting...`;
        break;
    }

    return {
      level,
      usedTokens: cw.usedTokens,
      maxTokens: cw.maxTokens,
      headroomTokens,
      usagePercent,
      shouldCompact,
      shouldSuggest,
      message,
      breakdown: {
        system: cw.systemTokens,
        messages: cw.messageTokens,
        tools: cw.toolTokens,
      },
    };
  }

  async autoCompact(session: Session): Promise<boolean> {
    const status = this.check(session);
    if (!status.shouldCompact) return false;

    logger.info("Auto-compacting context...");
    const result = this.compactionEngine.apply(session);

    logger.info(
      `Auto-compaction complete: ${result.tokensBefore} → ${result.tokensAfter} tokens ` +
      `(${(result.compressionRatio * 100).toFixed(1)}%)`
    );
    return true;
  }

  suggestAction(session: Session): string | null {
    const status = this.check(session);
    if (status.level === "emergency") {
      return "Context is critically full. Compaction will be applied automatically.";
    }
    if (status.level === "critical") {
      return "Context is running low. Run /compact to free space.";
    }
    if (status.level === "attention") {
      return "Context is getting full. Consider compacting soon.";
    }
    return null;
  }

  renderStatus(session: Session): string {
    const status = this.check(session);
    const bar = this.windowManager.renderBar(30);

    const lines = [
      "",
      "📊 Context Window",
      `  ${bar}`,
      `  System:  ${status.breakdown.system.toLocaleString().padStart(8)} tokens`,
      `  Messages:${status.breakdown.messages.toLocaleString().padStart(8)} tokens`,
      `  Tools:   ${status.breakdown.tools.toLocaleString().padStart(8)} tokens`,
      `  Total:   ${status.usedTokens.toLocaleString().padStart(8)} / ${status.maxTokens.toLocaleString()} tokens`,
      `  Free:    ${status.headroomTokens.toLocaleString().padStart(8)} tokens`,
      "",
    ];

    return lines.join("\n");
  }

  private determineLevel(usagePercent: number): HeadroomLevel {
    if (usagePercent >= this.config.emergencyThreshold) return "emergency";
    if (usagePercent >= this.config.autoCompactThreshold) return "critical";
    if (usagePercent >= this.config.suggestThreshold) return "attention";
    return "safe";
  }
}

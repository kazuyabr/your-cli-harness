// src/core/context/window.ts

import type { ContextWindow } from "../../shared/types.js";
import { TokenCounter } from "./token-counter.js";

export type WindowLevel = "safe" | "attention" | "critical" | "emergency";

export interface WindowAnalysis {
  level: WindowLevel;
  usedTokens: number;
  maxTokens: number;
  headroomTokens: number;
  usagePercent: number;
  breakdown: {
    system: { tokens: number; percent: number };
    messages: { tokens: number; percent: number };
    tools: { tokens: number; percent: number };
  };
  recommendation: string;
}

export class ContextWindowManager {
  private window: ContextWindow;
  private counter: TokenCounter;

  constructor(maxTokens: number = 200_000) {
    this.counter = new TokenCounter();
    this.window = {
      maxTokens,
      usedTokens: 0,
      systemTokens: 0,
      messageTokens: 0,
      toolTokens: 0,
      headroomTokens: maxTokens,
    };
  }

  getWindow(): ContextWindow {
    return { ...this.window };
  }

  getHeadroom(): number {
    return this.window.headroomTokens;
  }

  getUsagePercent(): number {
    return (this.window.usedTokens / this.window.maxTokens) * 100;
  }

  getLevel(): WindowLevel {
    const pct = this.getUsagePercent();
    if (pct >= 95) return "emergency";
    if (pct >= 80) return "critical";
    if (pct >= 60) return "attention";
    return "safe";
  }

  analyze(): WindowAnalysis {
    const level = this.getLevel();
    const maxTokens = this.window.maxTokens;

    let recommendation: string;
    switch (level) {
      case "safe":
        recommendation = "Context usage is healthy. Continue working.";
        break;
      case "attention":
        recommendation = `Context at ${this.getUsagePercent().toFixed(1)}%. Consider compacting soon.`;
        break;
      case "critical":
        recommendation = `Context at ${this.getUsagePercent().toFixed(1)}%. Compaction recommended.`;
        break;
      case "emergency":
        recommendation = `Context at ${this.getUsagePercent().toFixed(1)}%! Compaction required immediately.`;
        break;
    }

    return {
      level,
      usedTokens: this.window.usedTokens,
      maxTokens,
      headroomTokens: this.window.headroomTokens,
      usagePercent: this.getUsagePercent(),
      breakdown: {
        system: {
          tokens: this.window.systemTokens,
          percent: maxTokens > 0 ? (this.window.systemTokens / maxTokens) * 100 : 0,
        },
        messages: {
          tokens: this.window.messageTokens,
          percent: maxTokens > 0 ? (this.window.messageTokens / maxTokens) * 100 : 0,
        },
        tools: {
          tokens: this.window.toolTokens,
          percent: maxTokens > 0 ? (this.window.toolTokens / maxTokens) * 100 : 0,
        },
      },
      recommendation,
    };
  }

  addSystemTokens(tokens: number): void {
    this.window.systemTokens += tokens;
    this.recalculate();
  }

  setSystemTokens(tokens: number): void {
    this.window.systemTokens = tokens;
    this.recalculate();
  }

  addMessageTokens(tokens: number): void {
    this.window.messageTokens += tokens;
    this.recalculate();
  }

  addToolTokens(tokens: number): void {
    this.window.toolTokens += tokens;
    this.recalculate();
  }

  estimateTextTokens(text: string): number {
    return this.counter.count(text).tokens;
  }

  canFit(tokens: number): boolean {
    return this.window.headroomTokens >= tokens;
  }

  setMaxTokens(maxTokens: number): void {
    this.window.maxTokens = maxTokens;
    this.recalculate();
  }

  renderBar(width: number = 40): string {
    const pct = this.getUsagePercent();
    const filled = Math.round((pct / 100) * width);
    const empty = width - filled;

    let fillChar = "█";
    let color = "\x1b[32m";
    if (pct >= 95) { fillChar = "█"; color = "\x1b[31m"; }
    else if (pct >= 80) { fillChar = "▓"; color = "\x1b[33m"; }
    else if (pct >= 60) { fillChar = "▒"; color = "\x1b[33m"; }
    else { fillChar = "█"; color = "\x1b[32m"; }

    const reset = "\x1b[0m";
    const bar = `${color}${fillChar.repeat(filled)}${"░".repeat(empty)}${reset}`;

    return `[${bar}] ${pct.toFixed(1)}%`;
  }

  private recalculate(): void {
    this.window.usedTokens =
      this.window.systemTokens + this.window.messageTokens + this.window.toolTokens;
    this.window.headroomTokens = this.window.maxTokens - this.window.usedTokens;
  }
}

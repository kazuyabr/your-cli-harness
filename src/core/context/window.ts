// src/core/context/window.ts

import type { ContextWindow } from "../../shared/types.js";
import { estimateTokens } from "../../shared/utils.js";

export class ContextWindowManager {
  private window: ContextWindow;

  constructor(maxTokens: number = 200_000) {
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

  getLevel(): "safe" | "attention" | "critical" | "emergency" {
    const pct = this.getUsagePercent();
    if (pct >= 95) return "emergency";
    if (pct >= 80) return "critical";
    if (pct >= 60) return "attention";
    return "safe";
  }

  addSystemTokens(tokens: number): void {
    this.window.systemTokens += tokens;
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
    return estimateTokens(text);
  }

  canFit(tokens: number): boolean {
    return this.window.headroomTokens >= tokens;
  }

  private recalculate(): void {
    this.window.usedTokens = this.window.systemTokens + this.window.messageTokens + this.window.toolTokens;
    this.window.headroomTokens = this.window.maxTokens - this.window.usedTokens;
  }
}

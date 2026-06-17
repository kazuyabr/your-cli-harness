// src/core/context/compaction.ts

import type { Session, Message } from "../../shared/types.js";
import { estimateTokens } from "../../shared/utils.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface CompactionResult {
  summary: string;
  preservedMessages: Message[];
  droppedCount: number;
  tokensBefore: number;
  tokensAfter: number;
}

export class CompactionEngine {
  compact(session: Session, keepLastNTurns: number = 3): CompactionResult {
    const messages = session.messages;
    const splitPoint = Math.max(0, messages.length - keepLastNTurns * 2);

    const oldMessages = messages.slice(0, splitPoint);
    const preservedMessages = messages.slice(splitPoint);

    const tokensBefore = this.countTokens(messages);
    const summary = this.summarize(oldMessages);
    const summaryTokens = estimateTokens(summary);
    const tokensAfter = summaryTokens + this.countTokens(preservedMessages);

    logger.info(
      `Compaction: ${oldMessages.length} messages → summary (${summaryTokens} tokens). ` +
      `Total: ${tokensBefore} → ${tokensAfter} tokens`
    );

    return {
      summary,
      preservedMessages,
      droppedCount: oldMessages.length,
      tokensBefore,
      tokensAfter,
    };
  }

  private summarize(messages: Message[]): string {
    if (messages.length === 0) return "";

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    const parts: string[] = ["## Previous Conversation Summary\n"];

    if (userMessages.length > 0) {
      parts.push("### User Requests:");
      for (const msg of userMessages) {
        const preview = msg.content.slice(0, 200);
        parts.push(`- ${preview}${msg.content.length > 200 ? "..." : ""}`);
      }
    }

    if (assistantMessages.length > 0) {
      parts.push("\n### Key Actions Taken:");
      for (const msg of assistantMessages) {
        const preview = msg.content.slice(0, 150);
        parts.push(`- ${preview}${msg.content.length > 150 ? "..." : ""}`);
      }
    }

    return parts.join("\n");
  }

  private countTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  }
}

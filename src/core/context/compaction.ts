// src/core/context/compaction.ts

import type { Session, Message } from "../../shared/types.js";
import { TokenCounter } from "./token-counter.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface CompactionResult {
  summary: string;
  preservedMessages: Message[];
  compactedMessages: Message[];
  droppedCount: number;
  tokensBefore: number;
  tokensAfter: number;
  compressionRatio: number;
}

export interface CompactionOptions {
  keepLastNTurns: number;
  preserveSystemMessages: boolean;
  maxSummaryTokens: number;
  includeToolResults: boolean;
}

const DEFAULT_OPTIONS: CompactionOptions = {
  keepLastNTurns: 3,
  preserveSystemMessages: true,
  maxSummaryTokens: 2000,
  includeToolResults: false,
};

export class CompactionEngine {
  private counter: TokenCounter;
  private options: CompactionOptions;

  constructor(options: Partial<CompactionOptions> = {}) {
    this.counter = new TokenCounter();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  compact(session: Session): CompactionResult {
    const messages = session.messages;
    const keepCount = this.options.keepLastNTurns * 2;
    const splitPoint = Math.max(0, messages.length - keepCount);

    const oldMessages = messages.slice(0, splitPoint);
    const preservedMessages = messages.slice(splitPoint);

    const tokensBefore = this.countTokens(messages);
    const summary = this.summarize(oldMessages);
    const summaryTokens = this.counter.count(summary).tokens;
    const tokensAfter = summaryTokens + this.countTokens(preservedMessages);
    const compressionRatio = tokensBefore > 0 ? tokensAfter / tokensBefore : 1;

    logger.info(
      `Compaction: ${oldMessages.length} msgs → summary (${summaryTokens} tokens). ` +
      `Total: ${tokensBefore} → ${tokensAfter} (${(compressionRatio * 100).toFixed(1)}%)`
    );

    return {
      summary,
      preservedMessages,
      compactedMessages: oldMessages,
      droppedCount: oldMessages.length,
      tokensBefore,
      tokensAfter,
      compressionRatio,
    };
  }

  apply(session: Session): CompactionResult {
    const result = this.compact(session);

    const summaryMessage: Message = {
      role: "user",
      content: `[COMPACTED CONTEXT]\n\n${result.summary}\n\n[END COMPACTED CONTEXT]`,
      timestamp: new Date(),
    };

    session.messages = [summaryMessage, ...result.preservedMessages];
    session.contextWindow.messageTokens = result.tokensAfter;
    session.contextWindow.usedTokens =
      session.contextWindow.systemTokens + session.contextWindow.messageTokens;

    return result;
  }

  private summarize(messages: Message[]): string {
    if (messages.length === 0) return "";

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const toolMessages = messages.filter((m) => m.role === "tool");

    const parts: string[] = ["## Compacted Conversation Summary\n"];

    if (userMessages.length > 0) {
      parts.push("### User Requests:");
      for (const msg of userMessages) {
        const preview = this.truncateContent(msg.content, 300);
        parts.push(`- ${preview}`);
      }
    }

    if (assistantMessages.length > 0) {
      parts.push("\n### Key Actions & Responses:");
      for (const msg of assistantMessages) {
        const preview = this.truncateContent(msg.content, 200);
        parts.push(`- ${preview}`);
      }
    }

    if (this.options.includeToolResults && toolMessages.length > 0) {
      parts.push("\n### Tool Results:");
      for (const msg of toolMessages) {
        const preview = this.truncateContent(msg.content, 100);
        parts.push(`- ${preview}`);
      }
    }

    parts.push(`\n_(${messages.length} messages compacted)_`);

    return parts.join("\n");
  }

  private truncateContent(content: string, maxChars: number): string {
    const cleaned = content.replace(/\n+/g, " ").trim();
    if (cleaned.length <= maxChars) return cleaned;
    return cleaned.slice(0, maxChars) + "...";
  }

  private countTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + this.counter.count(m.content).tokens, 0);
  }
}

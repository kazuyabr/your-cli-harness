// src/core/context/session.ts

import type { Session, Message } from "../../shared/types.js";
import { generateId, estimateTokens } from "../../shared/utils.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const DEFAULT_MAX_TOKENS = 200_000;

export class SessionManager {
  private sessions = new Map<string, Session>();

  create(clientId: string, mode: string = "default", maxTokens: number = DEFAULT_MAX_TOKENS): Session {
    const session: Session = {
      id: generateId(),
      clientId,
      mode,
      messages: [],
      contextWindow: {
        maxTokens,
        usedTokens: 0,
        systemTokens: 0,
        messageTokens: 0,
        toolTokens: 0,
        headroomTokens: maxTokens,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    logger.info(`Session created: ${session.id} (client: ${clientId}, mode: ${mode})`);
    return session;
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId: string, message: Omit<Message, "timestamp">): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const fullMessage: Message = { ...message, timestamp: new Date() };
    session.messages.push(fullMessage);
    session.updatedAt = new Date();

    const tokens = estimateTokens(message.content);
    session.contextWindow.messageTokens += tokens;
    session.contextWindow.usedTokens += tokens;
    session.contextWindow.headroomTokens = session.contextWindow.maxTokens - session.contextWindow.usedTokens;
  }

  setSystemTokens(sessionId: string, tokens: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.contextWindow.systemTokens = tokens;
    session.contextWindow.usedTokens = tokens + session.contextWindow.messageTokens + session.contextWindow.toolTokens;
    session.contextWindow.headroomTokens = session.contextWindow.maxTokens - session.contextWindow.usedTokens;
  }

  getHeadroom(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    return session.contextWindow.headroomTokens;
  }

  getUsagePercent(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    return (session.contextWindow.usedTokens / session.contextWindow.maxTokens) * 100;
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

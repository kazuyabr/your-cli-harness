// src/core/context/session.ts

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

import type { Session, Message } from "../../shared/types.js";
import { generateId } from "../../shared/utils.js";
import { TokenCounter } from "./token-counter.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export interface SessionPersistence {
  save(session: Session, path: string): void;
  load(path: string): Session | null;
}

export class FileSessionPersistence implements SessionPersistence {
  save(session: Session, filePath: string): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(session, null, 2), "utf-8");
    logger.info(`Session saved: ${session.id} → ${filePath}`);
  }

  load(filePath: string): Session | null {
    if (!existsSync(filePath)) return null;
    try {
      const raw = readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as Session;
    } catch {
      logger.warn(`Failed to load session from: ${filePath}`);
      return null;
    }
  }
}

export class SessionManager {
  private sessions = new Map<string, Session>();
  private counter: TokenCounter;
  private persistence?: SessionPersistence;
  private sessionsDir?: string;

  constructor(_model: string = "claude-sonnet-4-20250514", persistence?: SessionPersistence, sessionsDir?: string) {
    this.counter = new TokenCounter();
    this.persistence = persistence;
    this.sessionsDir = sessionsDir;
  }

  create(clientId: string, mode: string = "default", model: string = "claude-sonnet-4-20250514"): Session {
    const limits = TokenCounter.getModelLimits(model);
    const session: Session = {
      id: generateId(),
      clientId,
      mode,
      messages: [],
      contextWindow: {
        maxTokens: limits.contextWindow,
        usedTokens: 0,
        systemTokens: 0,
        messageTokens: 0,
        toolTokens: 0,
        headroomTokens: limits.contextWindow,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    logger.info(`Session created: ${session.id} (client: ${clientId}, mode: ${mode}, maxTokens: ${limits.contextWindow})`);
    return session;
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId: string, message: Omit<Message, "timestamp">): number {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const fullMessage: Message = { ...message, timestamp: new Date() };
    session.messages.push(fullMessage);
    session.updatedAt = new Date();

    const tokens = this.countMessageTokens(message);
    if (message.role === "tool") {
      session.contextWindow.toolTokens += tokens;
    } else {
      session.contextWindow.messageTokens += tokens;
    }
    this.recalculateWindow(session);

    return tokens;
  }

  setSystemContent(sessionId: string, content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const tokens = this.counter.count(content).tokens;
    session.contextWindow.systemTokens = tokens;
    this.recalculateWindow(session);
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

  getContextWindow(sessionId: string): Session["contextWindow"] | undefined {
    const session = this.sessions.get(sessionId);
    return session ? { ...session.contextWindow } : undefined;
  }

  saveSession(sessionId: string): void {
    if (!this.persistence || !this.sessionsDir) return;
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const filePath = resolve(this.sessionsDir, `${sessionId}.json`);
    this.persistence.save(session, filePath);
  }

  loadSession(sessionId: string): Session | null {
    if (!this.persistence || !this.sessionsDir) return null;
    const filePath = resolve(this.sessionsDir, `${sessionId}.json`);
    const session = this.persistence.load(filePath);
    if (session) {
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  delete(sessionId: string): boolean {
    this.sessions.delete(sessionId);
    return true;
  }

  private countMessageTokens(message: Omit<Message, "timestamp">): number {
    return this.counter.count(message.content).tokens + this.counter.count(message.role).tokens;
  }

  private recalculateWindow(session: Session): void {
    session.contextWindow.usedTokens =
      session.contextWindow.systemTokens +
      session.contextWindow.messageTokens +
      session.contextWindow.toolTokens;
    session.contextWindow.headroomTokens =
      session.contextWindow.maxTokens - session.contextWindow.usedTokens;
  }
}

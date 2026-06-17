// tests/unit/core/context/compaction.test.ts

import { describe, it, expect } from "vitest";
import { CompactionEngine } from "../../../../src/core/context/compaction.js";
import type { Session, Message } from "../../../../src/shared/types.js";

function createSession(messages: Message[]): Session {
  return {
    id: "test-session",
    clientId: "test-client",
    mode: "default",
    messages,
    contextWindow: {
      maxTokens: 200_000,
      usedTokens: 0,
      systemTokens: 0,
      messageTokens: 0,
      toolTokens: 0,
      headroomTokens: 200_000,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createMessage(role: Message["role"], content: string): Message {
  return { role, content, timestamp: new Date() };
}

describe("CompactionEngine", () => {
  describe("compact", () => {
    it("should return empty summary for empty messages", () => {
      const engine = new CompactionEngine();
      const session = createSession([]);
      const result = engine.compact(session);

      expect(result.summary).toBe("");
      expect(result.droppedCount).toBe(0);
      expect(result.tokensBefore).toBe(0);
    });

    it("should compact old messages and keep recent ones", () => {
      const engine = new CompactionEngine({ keepLastNTurns: 2 });
      const longContent = (text: string) => text + " " + "x".repeat(500);
      const messages: Message[] = [
        createMessage("user", longContent("first question")),
        createMessage("assistant", longContent("first answer")),
        createMessage("user", longContent("second question")),
        createMessage("assistant", longContent("second answer")),
        createMessage("user", longContent("third question")),
        createMessage("assistant", longContent("third answer")),
        createMessage("user", longContent("fourth question")),
        createMessage("assistant", longContent("fourth answer")),
      ];
      const session = createSession(messages);

      const result = engine.compact(session);

      expect(result.droppedCount).toBe(4);
      expect(result.preservedMessages.length).toBe(4);
      expect(result.summary).toContain("Compacted Conversation Summary");
      expect(result.summary).toContain("first question");
      expect(result.tokensAfter).toBeLessThan(result.tokensBefore);
      expect(result.compressionRatio).toBeLessThan(1);
    });

    it("should include user requests in summary", () => {
      const engine = new CompactionEngine({ keepLastNTurns: 1 });
      const messages: Message[] = [
        createMessage("user", "implement auth"),
        createMessage("assistant", "I'll implement auth..."),
        createMessage("user", "add tests"),
        createMessage("assistant", "Adding tests..."),
      ];
      const session = createSession(messages);

      const result = engine.compact(session);

      expect(result.summary).toContain("User Requests");
      expect(result.summary).toContain("implement auth");
    });

    it("should include assistant actions in summary", () => {
      const engine = new CompactionEngine({ keepLastNTurns: 1 });
      const messages: Message[] = [
        createMessage("user", "implement authentication system with JWT tokens and session management"),
        createMessage("assistant", "Created auth.ts with JWT support and session management. The implementation includes token generation, validation, and refresh logic."),
        createMessage("user", "add tests"),
        createMessage("assistant", "Adding tests..."),
      ];
      const session = createSession(messages);

      const result = engine.compact(session);

      expect(result.summary).toContain("Key Actions & Responses");
      expect(result.summary).toContain("auth.ts");
    });
  });

  describe("apply", () => {
    it("should modify session in place", () => {
      const engine = new CompactionEngine({ keepLastNTurns: 1 });
      const messages: Message[] = [
        createMessage("user", "old question 1"),
        createMessage("assistant", "old answer 1"),
        createMessage("user", "old question 2"),
        createMessage("assistant", "old answer 2"),
        createMessage("user", "recent question"),
        createMessage("assistant", "recent answer"),
      ];
      const session = createSession(messages);

      engine.apply(session);

      expect(session.messages.length).toBeLessThan(messages.length);
      expect(session.messages[0].content).toContain("COMPACTED CONTEXT");
    });

    it("should update token counts after compaction", () => {
      const engine = new CompactionEngine({ keepLastNTurns: 1 });
      const messages: Message[] = [
        createMessage("user", "question"),
        createMessage("assistant", "answer"),
        createMessage("user", "recent"),
        createMessage("assistant", "recent answer"),
      ];
      const session = createSession(messages);
      session.contextWindow.messageTokens = 100;

      engine.apply(session);

      expect(session.contextWindow.messageTokens).toBeGreaterThan(0);
      expect(session.contextWindow.usedTokens).toBeGreaterThan(0);
    });
  });

  describe("options", () => {
    it("should respect includeToolResults option", () => {
      const engine = new CompactionEngine({ keepLastNTurns: 1, includeToolResults: true });
      const messages: Message[] = [
        createMessage("user", "run the full test suite and check for any failures"),
        createMessage("tool", "test output: all 42 tests passed successfully"),
        createMessage("assistant", "Tests passed!"),
        createMessage("user", "deploy now"),
        createMessage("assistant", "Deploying..."),
      ];
      const session = createSession(messages);

      const result = engine.compact(session);

      expect(result.summary).toContain("Tool Results");
    });
  });
});

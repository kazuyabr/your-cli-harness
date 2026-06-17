// tests/unit/core/context/session.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager } from "../../../../src/core/context/session.js";

describe("SessionManager", () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe("create", () => {
    it("should create a new session", () => {
      const session = manager.create("test-client");
      expect(session.id).toBeDefined();
      expect(session.clientId).toBe("test-client");
      expect(session.mode).toBe("default");
      expect(session.messages).toEqual([]);
    });

    it("should create session with custom mode", () => {
      const session = manager.create("test-client", "plan");
      expect(session.mode).toBe("plan");
    });
  });

  describe("get", () => {
    it("should retrieve an existing session", () => {
      const session = manager.create("test-client");
      const retrieved = manager.get(session.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(session.id);
    });

    it("should return undefined for non-existent session", () => {
      const retrieved = manager.get("non-existent");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("addMessage", () => {
    it("should add a message to the session", () => {
      const session = manager.create("test-client");
      manager.addMessage(session.id, { role: "user", content: "hello" });

      const updated = manager.get(session.id);
      expect(updated!.messages.length).toBe(1);
      expect(updated!.messages[0].content).toBe("hello");
      expect(updated!.messages[0].role).toBe("user");
    });

    it("should update token counts", () => {
      const session = manager.create("test-client");
      manager.addMessage(session.id, { role: "user", content: "hello world" });

      const updated = manager.get(session.id);
      expect(updated!.contextWindow.messageTokens).toBeGreaterThan(0);
      expect(updated!.contextWindow.usedTokens).toBeGreaterThan(0);
    });
  });

  describe("getHeadroom", () => {
    it("should return full headroom for new session", () => {
      const session = manager.create("test-client");
      const headroom = manager.getHeadroom(session.id);
      expect(headroom).toBe(200_000);
    });

    it("should decrease as messages are added", () => {
      const session = manager.create("test-client");
      const initialHeadroom = manager.getHeadroom(session.id);

      manager.addMessage(session.id, { role: "user", content: "a".repeat(1000) });

      const newHeadroom = manager.getHeadroom(session.id);
      expect(newHeadroom).toBeLessThan(initialHeadroom);
    });
  });

  describe("getUsagePercent", () => {
    it("should return 0 for new session", () => {
      const session = manager.create("test-client");
      expect(manager.getUsagePercent(session.id)).toBe(0);
    });
  });

  describe("delete", () => {
    it("should delete a session", () => {
      const session = manager.create("test-client");
      const deleted = manager.delete(session.id);
      expect(deleted).toBe(true);
      expect(manager.get(session.id)).toBeUndefined();
    });
  });
});

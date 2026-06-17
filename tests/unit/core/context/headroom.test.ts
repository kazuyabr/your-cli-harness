// tests/unit/core/context/headroom.test.ts

import { describe, it, expect } from "vitest";
import { HeadroomMonitor } from "../../../../src/core/context/headroom.js";
import type { Session } from "../../../../src/shared/types.js";

function createSession(usedTokens: number, maxTokens: number = 200_000): Session {
  return {
    id: "test-session",
    clientId: "test-client",
    mode: "default",
    messages: [],
    contextWindow: {
      maxTokens,
      usedTokens,
      systemTokens: Math.floor(usedTokens * 0.2),
      messageTokens: Math.floor(usedTokens * 0.7),
      toolTokens: Math.floor(usedTokens * 0.1),
      headroomTokens: maxTokens - usedTokens,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("HeadroomMonitor", () => {
  describe("check", () => {
    it("should return safe status for low usage", () => {
      const monitor = new HeadroomMonitor();
      const session = createSession(50_000);
      const status = monitor.check(session);

      expect(status.level).toBe("safe");
      expect(status.shouldCompact).toBe(false);
      expect(status.shouldSuggest).toBe(false);
      expect(status.usagePercent).toBe(25);
    });

    it("should return attention status at 80%+", () => {
      const monitor = new HeadroomMonitor();
      const session = createSession(170_000);
      const status = monitor.check(session);

      expect(status.level).toBe("attention");
      expect(status.shouldSuggest).toBe(true);
      expect(status.shouldCompact).toBe(false);
    });

    it("should return critical status at 95%+", () => {
      const monitor = new HeadroomMonitor({ autoCompactThreshold: 95, emergencyThreshold: 98 });
      const session = createSession(195_000);
      const status = monitor.check(session);

      expect(status.level).toBe("critical");
      expect(status.shouldCompact).toBe(true);
    });

    it("should return emergency status at 95%+ with emergency threshold", () => {
      const monitor = new HeadroomMonitor({ emergencyThreshold: 95 });
      const session = createSession(195_000);
      const status = monitor.check(session);

      expect(status.level).toBe("emergency");
      expect(status.shouldCompact).toBe(true);
    });

    it("should include breakdown in status", () => {
      const monitor = new HeadroomMonitor();
      const session = createSession(100_000);
      const status = monitor.check(session);

      expect(status.breakdown.system).toBe(20_000);
      expect(status.breakdown.messages).toBe(70_000);
      expect(status.breakdown.tools).toBe(10_000);
    });
  });

  describe("autoCompact", () => {
    it("should not compact when under threshold", async () => {
      const monitor = new HeadroomMonitor();
      const session = createSession(50_000);

      const result = await monitor.autoCompact(session);
      expect(result).toBe(false);
    });

    it("should compact when over threshold", async () => {
      const monitor = new HeadroomMonitor({ autoCompactThreshold: 90 });
      const session = createSession(190_000);

      const result = await monitor.autoCompact(session);
      expect(result).toBe(true);
    });
  });

  describe("suggestAction", () => {
    it("should return null for safe level", () => {
      const monitor = new HeadroomMonitor();
      const session = createSession(50_000);

      expect(monitor.suggestAction(session)).toBeNull();
    });

    it("should suggest compaction for critical level", () => {
      const monitor = new HeadroomMonitor();
      const session = createSession(180_000);

      const suggestion = monitor.suggestAction(session);
      expect(suggestion).toContain("compact");
    });

    it("should warn for emergency level", () => {
      const monitor = new HeadroomMonitor({ emergencyThreshold: 95 });
      const session = createSession(195_000);

      const suggestion = monitor.suggestAction(session);
      expect(suggestion).toContain("critically");
    });
  });

  describe("renderStatus", () => {
    it("should render a status string", () => {
      const monitor = new HeadroomMonitor();
      const session = createSession(100_000);

      const rendered = monitor.renderStatus(session);
      expect(rendered).toContain("Context Window");
      expect(rendered).toContain("System:");
      expect(rendered).toContain("Messages:");
      expect(rendered).toContain("Tools:");
      expect(rendered).toContain("Total:");
      expect(rendered).toContain("Free:");
    });
  });

  describe("custom config", () => {
    it("should use custom thresholds", () => {
      const monitor = new HeadroomMonitor({
        suggestThreshold: 50,
        autoCompactThreshold: 70,
        emergencyThreshold: 90,
      });
      const session = createSession(140_000);
      const status = monitor.check(session);

      expect(status.level).toBe("critical");
      expect(status.shouldCompact).toBe(true);
    });

    it("should use model-specific context window", () => {
      const monitor = new HeadroomMonitor({ model: "gpt-4o" });
      const session = createSession(100_000, 128_000);
      const status = monitor.check(session);

      expect(status.maxTokens).toBe(128_000);
      expect(status.usagePercent).toBeCloseTo(78.1, 0);
    });
  });
});

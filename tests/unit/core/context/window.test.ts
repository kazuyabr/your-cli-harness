// tests/unit/core/context/window.test.ts

import { describe, it, expect } from "vitest";
import { ContextWindowManager } from "../../../../src/core/context/window.js";

describe("ContextWindowManager", () => {
  describe("constructor", () => {
    it("should initialize with default max tokens", () => {
      const wm = new ContextWindowManager();
      const window = wm.getWindow();
      expect(window.maxTokens).toBe(200_000);
      expect(window.headroomTokens).toBe(200_000);
      expect(window.usedTokens).toBe(0);
    });

    it("should accept custom max tokens", () => {
      const wm = new ContextWindowManager(128_000);
      expect(wm.getWindow().maxTokens).toBe(128_000);
    });
  });

  describe("addSystemTokens", () => {
    it("should add system tokens and recalculate", () => {
      const wm = new ContextWindowManager(1000);
      wm.addSystemTokens(200);
      expect(wm.getWindow().systemTokens).toBe(200);
      expect(wm.getWindow().usedTokens).toBe(200);
      expect(wm.getWindow().headroomTokens).toBe(800);
    });
  });

  describe("addMessageTokens", () => {
    it("should add message tokens and recalculate", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(300);
      expect(wm.getWindow().messageTokens).toBe(300);
      expect(wm.getWindow().usedTokens).toBe(300);
      expect(wm.getWindow().headroomTokens).toBe(700);
    });
  });

  describe("addToolTokens", () => {
    it("should add tool tokens and recalculate", () => {
      const wm = new ContextWindowManager(1000);
      wm.addToolTokens(100);
      expect(wm.getWindow().toolTokens).toBe(100);
      expect(wm.getWindow().usedTokens).toBe(100);
      expect(wm.getWindow().headroomTokens).toBe(900);
    });
  });

  describe("getLevel", () => {
    it("should return safe when under 60%", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(500);
      expect(wm.getLevel()).toBe("safe");
    });

    it("should return attention at 60-79%", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(650);
      expect(wm.getLevel()).toBe("attention");
    });

    it("should return critical at 80-94%", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(850);
      expect(wm.getLevel()).toBe("critical");
    });

    it("should return emergency at 95%+", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(960);
      expect(wm.getLevel()).toBe("emergency");
    });
  });

  describe("analyze", () => {
    it("should return full analysis", () => {
      const wm = new ContextWindowManager(1000);
      wm.addSystemTokens(200);
      wm.addMessageTokens(300);

      const analysis = wm.analyze();
      expect(analysis.level).toBe("safe");
      expect(analysis.usedTokens).toBe(500);
      expect(analysis.maxTokens).toBe(1000);
      expect(analysis.headroomTokens).toBe(500);
      expect(analysis.usagePercent).toBe(50);
      expect(analysis.breakdown.system.tokens).toBe(200);
      expect(analysis.breakdown.messages.tokens).toBe(300);
      expect(analysis.breakdown.tools.tokens).toBe(0);
      expect(analysis.recommendation).toBeDefined();
    });
  });

  describe("canFit", () => {
    it("should return true when enough headroom", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(500);
      expect(wm.canFit(400)).toBe(true);
    });

    it("should return false when not enough headroom", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(800);
      expect(wm.canFit(300)).toBe(false);
    });
  });

  describe("renderBar", () => {
    it("should render a progress bar", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(500);
      const bar = wm.renderBar(20);
      expect(bar).toContain("50.0%");
      expect(bar).toContain("[");
      expect(bar).toContain("]");
    });
  });

  describe("setMaxTokens", () => {
    it("should update max tokens and recalculate", () => {
      const wm = new ContextWindowManager(1000);
      wm.addMessageTokens(500);
      wm.setMaxTokens(2000);

      expect(wm.getWindow().maxTokens).toBe(2000);
      expect(wm.getWindow().headroomTokens).toBe(1500);
    });
  });
});

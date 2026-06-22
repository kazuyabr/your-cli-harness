// tests/unit/core/economy/token-reporter.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { TokenReporter } from "../../../../src/core/economy/token-reporter.js";

describe("TokenReporter", () => {
  let reporter: TokenReporter;

  beforeEach(() => {
    reporter = new TokenReporter();
  });

  describe("formatInteractionReport", () => {
    it("formats report correctly", () => {
      const report = {
        inputTokensOriginal: 10000,
        inputTokensCompressed: 3000,
        inputTechniques: ["headroom"],
        outputTokensOriginal: 5000,
        outputTokensCompressed: 1500,
        outputTechniques: ["caveman"],
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };

      const formatted = reporter.formatInteractionReport(report);
      expect(formatted).toContain("$");
      expect(formatted).toContain("%");
      expect(formatted).toContain("claude-sonnet-4-20250514");
    });
  });

  describe("recordInteraction", () => {
    it("records interaction", () => {
      const report = {
        inputTokensOriginal: 10000,
        inputTokensCompressed: 3000,
        inputTechniques: ["headroom"],
        outputTokensOriginal: 5000,
        outputTokensCompressed: 1500,
        outputTechniques: ["caveman"],
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };

      reporter.recordInteraction(report);
      const stats = reporter.getSessionStats();
      expect(stats.totalInteractions).toBe(1);
      expect(stats.totalSaved).toBeGreaterThan(0);
    });

    it("accumulates stats", () => {
      const report = {
        inputTokensOriginal: 10000,
        inputTokensCompressed: 3000,
        inputTechniques: ["headroom"],
        outputTokensOriginal: 5000,
        outputTokensCompressed: 1500,
        outputTechniques: ["caveman"],
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };

      reporter.recordInteraction(report);
      reporter.recordInteraction(report);
      const stats = reporter.getSessionStats();
      expect(stats.totalInteractions).toBe(2);
    });
  });

  describe("formatSessionReport", () => {
    it("returns message when no interactions", () => {
      const report = reporter.formatSessionReport();
      expect(report).toContain("Nenhuma interação");
    });

    it("formats session report", () => {
      const report = {
        inputTokensOriginal: 10000,
        inputTokensCompressed: 3000,
        inputTechniques: ["headroom"],
        outputTokensOriginal: 5000,
        outputTokensCompressed: 1500,
        outputTechniques: ["caveman"],
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };

      reporter.recordInteraction(report);
      const formatted = reporter.formatSessionReport();
      expect(formatted).toContain("Relatório de Economia");
      expect(formatted).toContain("Interações: 1");
    });
  });

  describe("resetSession", () => {
    it("resets session stats", () => {
      const report = {
        inputTokensOriginal: 10000,
        inputTokensCompressed: 3000,
        inputTechniques: ["headroom"],
        outputTokensOriginal: 5000,
        outputTokensCompressed: 1500,
        outputTechniques: ["caveman"],
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };

      reporter.recordInteraction(report);
      reporter.resetSession();
      const stats = reporter.getSessionStats();
      expect(stats.totalInteractions).toBe(0);
    });
  });
});

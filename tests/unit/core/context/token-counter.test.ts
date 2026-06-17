// tests/unit/core/context/token-counter.test.ts

import { describe, it, expect } from "vitest";
import { TokenCounter } from "../../../../src/core/context/token-counter.js";

describe("TokenCounter", () => {
  describe("count", () => {
    it("should return 0 for empty string", () => {
      const counter = new TokenCounter();
      const result = counter.count("");
      expect(result.tokens).toBe(0);
      expect(result.characters).toBe(0);
      expect(result.words).toBe(0);
    });

    it("should estimate tokens based on character count", () => {
      const counter = new TokenCounter(4);
      const result = counter.count("hello world");
      expect(result.tokens).toBe(3);
      expect(result.characters).toBe(11);
      expect(result.words).toBe(2);
    });

    it("should handle unicode characters", () => {
      const counter = new TokenCounter();
      const result = counter.count("こんにちは");
      expect(result.tokens).toBe(2);
      expect(result.characters).toBe(5);
    });
  });

  describe("countMessages", () => {
    it("should count tokens for multiple messages", () => {
      const counter = new TokenCounter(4);
      const messages = [
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi there" },
      ];
      const tokens = counter.countMessages(messages);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe("getModelLimits", () => {
    it("should return limits for known models", () => {
      const claudeLimits = TokenCounter.getModelLimits("claude-sonnet-4-20250514");
      expect(claudeLimits.contextWindow).toBe(200_000);
      expect(claudeLimits.maxOutput).toBe(8192);

      const gptLimits = TokenCounter.getModelLimits("gpt-4o");
      expect(gptLimits.contextWindow).toBe(128_000);
      expect(gptLimits.maxOutput).toBe(16_384);
    });

    it("should return defaults for unknown models", () => {
      const limits = TokenCounter.getModelLimits("unknown-model");
      expect(limits.contextWindow).toBe(128_000);
      expect(limits.maxOutput).toBe(4096);
    });
  });

  describe("getHeadroomThresholds", () => {
    it("should calculate thresholds based on model context window", () => {
      const thresholds = TokenCounter.getHeadroomThresholds("claude-sonnet-4-20250514");
      expect(thresholds.attention).toBe(120_000);
      expect(thresholds.critical).toBe(160_000);
      expect(thresholds.emergency).toBe(190_000);
    });
  });
});

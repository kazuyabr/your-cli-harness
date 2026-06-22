// tests/unit/core/economy/cost-calculator.test.ts

import { describe, it, expect } from "vitest";
import { CostCalculator } from "../../../../src/core/economy/cost-calculator.js";

describe("CostCalculator", () => {
  const calculator = new CostCalculator();

  describe("calculateCost", () => {
    it("calculates cost for Anthropic", () => {
      const cost = calculator.calculateCost("anthropic", "claude-sonnet-4-20250514", 1000, 500);
      expect(cost.input).toBeCloseTo(0.003);
      expect(cost.output).toBeCloseTo(0.0075);
      expect(cost.total).toBeCloseTo(0.0105);
    });

    it("calculates cost for OpenAI", () => {
      const cost = calculator.calculateCost("openai", "gpt-4o", 1000, 500);
      expect(cost.input).toBeCloseTo(0.0025);
      expect(cost.output).toBeCloseTo(0.005);
      expect(cost.total).toBeCloseTo(0.0075);
    });

    it("calculates cost for OpenRouter free model", () => {
      const cost = calculator.calculateCost("openrouter", "meta-llama/llama-3.1-8b-instruct:free", 1000, 500);
      expect(cost.input).toBe(0);
      expect(cost.output).toBe(0);
      expect(cost.total).toBe(0);
    });

    it("uses fallback for unknown model", () => {
      const cost = calculator.calculateCost("unknown", "unknown-model", 1000, 500);
      expect(cost.total).toBeGreaterThan(0);
    });
  });

  describe("calculateSavings", () => {
    it("calculates savings", () => {
      const savings = calculator.calculateSavings(
        { input: 10000, output: 5000 },
        { input: 3000, output: 1500 },
        "anthropic",
        "claude-sonnet-4-20250514"
      );

      expect(savings.costBefore.total).toBeGreaterThan(savings.costAfter.total);
      expect(savings.saved).toBeGreaterThan(0);
      expect(savings.percentSaved).toBeGreaterThan(0);
    });
  });

  describe("getPricing", () => {
    it("returns pricing for known model", () => {
      const pricing = calculator.getPricing("anthropic", "claude-sonnet-4-20250514");
      expect(pricing).toBeDefined();
      expect(pricing?.inputPer1k).toBe(0.003);
    });

    it("returns undefined for unknown model", () => {
      const pricing = calculator.getPricing("unknown", "unknown-model");
      expect(pricing).toBeUndefined();
    });
  });

  describe("addPricing", () => {
    it("adds new pricing", () => {
      calculator.addPricing({
        provider: "custom",
        model: "custom-model",
        inputPer1k: 0.001,
        outputPer1k: 0.002,
      });

      const pricing = calculator.getPricing("custom", "custom-model");
      expect(pricing).toBeDefined();
      expect(pricing?.inputPer1k).toBe(0.001);
    });

    it("updates existing pricing", () => {
      calculator.addPricing({
        provider: "custom",
        model: "custom-model",
        inputPer1k: 0.005,
        outputPer1k: 0.01,
      });

      const pricing = calculator.getPricing("custom", "custom-model");
      expect(pricing?.inputPer1k).toBe(0.005);
    });
  });
});

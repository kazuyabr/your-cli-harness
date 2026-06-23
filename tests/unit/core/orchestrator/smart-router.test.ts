// tests/unit/core/orchestrator/smart-router.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { SmartRouter } from "../../../../src/core/orchestrator/smart-router.js";

describe("SmartRouter", () => {
  let router: SmartRouter;

  beforeEach(() => {
    router = new SmartRouter("automatic");
  });

  describe("constructor", () => {
    it("creates router with default mode", () => {
      const defaultRouter = new SmartRouter();
      expect(defaultRouter.getMode()).toBe("automatic");
    });

    it("creates router with specified mode", () => {
      expect(router.getMode()).toBe("automatic");
    });
  });

  describe("route", () => {
    it("routes code task", async () => {
      const decision = await router.route({
        taskType: "code",
        complexity: "medium",
      });

      expect(decision.provider).toBeTruthy();
      expect(decision.model).toBeTruthy();
      expect(decision.reason).toBeTruthy();
      expect(decision.confidence).toBeGreaterThan(0);
    });

    it("routes chat task", async () => {
      const decision = await router.route({
        taskType: "chat",
        complexity: "low",
      });

      expect(decision.provider).toBeTruthy();
      expect(decision.model).toBeTruthy();
    });

    it("routes analysis task", async () => {
      const decision = await router.route({
        taskType: "analysis",
        complexity: "high",
      });

      expect(decision.provider).toBeTruthy();
      expect(decision.model).toBeTruthy();
    });

    it("routes with cost constraint", async () => {
      const decision = await router.route({
        taskType: "simple",
        complexity: "low",
        maxCost: 0.001,
      });

      expect(decision.provider).toBeTruthy();
      expect(decision.model).toBeTruthy();
    });

    it("routes with latency constraint", async () => {
      const decision = await router.route({
        taskType: "chat",
        complexity: "low",
        maxLatency: 500,
      });

      expect(decision.provider).toBeTruthy();
      expect(decision.model).toBeTruthy();
    });

    it("routes with preferred provider", async () => {
      const decision = await router.route({
        taskType: "code",
        complexity: "medium",
        preferredProvider: "openrouter",
      });

      expect(decision.provider).toBe("openrouter");
    });
  });

  describe("setMode", () => {
    it("changes mode", () => {
      router.setMode("manual");
      expect(router.getMode()).toBe("manual");
    });

    it("changes to hybrid mode", () => {
      router.setMode("hybrid");
      expect(router.getMode()).toBe("hybrid");
    });
  });

  describe("manual rules", () => {
    it("sets manual rule", () => {
      router.setManualRule("code", "anthropic/claude-sonnet-4-20250514");
      const rules = router.getManualRules();
      expect(rules.get("code")).toBe("anthropic/claude-sonnet-4-20250514");
    });

    it("routes with manual mode", async () => {
      router.setMode("manual");
      router.setManualRule("code", "anthropic/claude-sonnet-4-20250514");

      const decision = await router.route({
        taskType: "code",
        complexity: "medium",
      });

      expect(decision.provider).toBe("anthropic");
      expect(decision.model).toBe("claude-sonnet-4-20250514");
    });
  });

  describe("model profiles", () => {
    it("gets model profiles", () => {
      const profiles = router.getModelProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });

    it("adds model profile", () => {
      const initialCount = router.getModelProfiles().length;
      
      router.addModelProfile({
        provider: "custom",
        model: "custom-model",
        strengths: ["code"],
        costPer1k: 0.001,
        avgLatency: 500,
        maxTokens: 4096,
      });

      expect(router.getModelProfiles().length).toBe(initialCount + 1);
    });
  });

  describe("hybrid mode", () => {
    it("routes with hybrid mode", async () => {
      router.setMode("hybrid");

      const decision = await router.route({
        taskType: "code",
        complexity: "medium",
      });

      expect(decision.provider).toBeTruthy();
      expect(decision.model).toBeTruthy();
      expect(decision.reason).toBeTruthy();
    });
  });

  describe("decision log", () => {
    it("returns decision log", () => {
      const log = router.getDecisionLog();
      expect(Array.isArray(log)).toBe(true);
    });
  });
});

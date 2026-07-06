// tests/unit/core/tui/useStatusBar.test.ts
// Tests for useStatusBar hook (direct logic testing)

import { describe, it, expect } from "vitest";

import type { StatusBarInfo } from "../../../../src/core/cli/tui/types.js";

function createStatusBarState(initialModel = "openrouter/owl-alpha", initialProvider = "openrouter", initialLanguage = "en") {
  const status: StatusBarInfo = {
    model: initialModel,
    provider: initialProvider,
    tokensIn: 0,
    tokensOut: 0,
    cost: 0,
    mode: "default",
    language: initialLanguage,
  };

  function updateTokens(tokensIn: number, tokensOut: number) {
    status.tokensIn += tokensIn;
    status.tokensOut += tokensOut;
  }

  function updateCost(cost: number) {
    status.cost += cost;
  }

  function setModel(model: string, provider: string) {
    status.model = model;
    status.provider = provider;
  }

  function setMode(mode: string) {
    status.mode = mode;
  }

  function setLanguage(language: string) {
    status.language = language;
  }

  function reset() {
    status.tokensIn = 0;
    status.tokensOut = 0;
    status.cost = 0;
  }

  return {
    status,
    updateTokens,
    updateCost,
    setModel,
    setMode,
    setLanguage,
    reset,
  };
}

describe("useStatusBar logic", () => {
  it("initializes with default values", () => {
    const sb = createStatusBarState();
    expect(sb.status.model).toBe("openrouter/owl-alpha");
    expect(sb.status.provider).toBe("openrouter");
    expect(sb.status.tokensIn).toBe(0);
    expect(sb.status.tokensOut).toBe(0);
    expect(sb.status.cost).toBe(0);
    expect(sb.status.mode).toBe("default");
    expect(sb.status.language).toBe("en");
  });

  it("initializes with custom values", () => {
    const sb = createStatusBarState("gpt-4o", "openai", "pt-BR");
    expect(sb.status.model).toBe("gpt-4o");
    expect(sb.status.provider).toBe("openai");
    expect(sb.status.language).toBe("pt-BR");
  });

  it("updates tokens cumulatively", () => {
    const sb = createStatusBarState();
    sb.updateTokens(100, 50);
    expect(sb.status.tokensIn).toBe(100);
    expect(sb.status.tokensOut).toBe(50);
    sb.updateTokens(200, 100);
    expect(sb.status.tokensIn).toBe(300);
    expect(sb.status.tokensOut).toBe(150);
  });

  it("updates cost cumulatively", () => {
    const sb = createStatusBarState();
    sb.updateCost(0.001);
    expect(sb.status.cost).toBeCloseTo(0.001);
    sb.updateCost(0.002);
    expect(sb.status.cost).toBeCloseTo(0.003);
  });

  it("sets model", () => {
    const sb = createStatusBarState();
    sb.setModel("claude-sonnet-4-20250514", "anthropic");
    expect(sb.status.model).toBe("claude-sonnet-4-20250514");
    expect(sb.status.provider).toBe("anthropic");
  });

  it("sets mode", () => {
    const sb = createStatusBarState();
    sb.setMode("plan");
    expect(sb.status.mode).toBe("plan");
  });

  it("sets language", () => {
    const sb = createStatusBarState();
    sb.setLanguage("pt-BR");
    expect(sb.status.language).toBe("pt-BR");
  });

  it("resets counters", () => {
    const sb = createStatusBarState();
    sb.updateTokens(100, 50);
    sb.updateCost(0.005);
    sb.reset();
    expect(sb.status.tokensIn).toBe(0);
    expect(sb.status.tokensOut).toBe(0);
    expect(sb.status.cost).toBe(0);
  });
});

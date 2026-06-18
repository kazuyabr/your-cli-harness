// tests/unit/core/cli/onboarding.test.ts

import { describe, it, expect } from "vitest";
import { generateConfigFromAnswers, type OnboardingAnswers } from "../../../../src/core/cli/commands/onboarding.js";

function baseAnswers(overrides: Partial<OnboardingAnswers> = {}): OnboardingAnswers {
  return {
    clientName: "test-cli",
    commandName: "test-cli",
    llmProvider: "anthropic",
    model: "claude-sonnet-4-20250514",
    planEnabled: true,
    planCanPropose: true,
    planCanExecute: false,
    buildEnabled: true,
    buildWithTests: true,
    buildWithDeploy: false,
    yoloEnabled: false,
    yoloConfirmDestructive: true,
    autoMemory: true,
    vectorEnabled: false,
    vectorProvider: "none",
    qdrantUrl: "",
    mcpGitHub: true,
    mcpJira: false,
    mcpDatabase: false,
    brandingVoice: "professional",
    customLogo: false,
    customColors: false,
    ...overrides,
  };
}

describe("generateConfigFromAnswers", () => {
  it("generates valid YAML with basic answers", () => {
    const config = generateConfigFromAnswers(baseAnswers());
    expect(config).toContain("name: test-cli");
    expect(config).toContain("command: test-cli");
    expect(config).toContain('version: "1.0.0"');
  });

  it("includes LLM config", () => {
    const config = generateConfigFromAnswers(baseAnswers());
    expect(config).toContain("llm:");
    expect(config).toContain("provider: anthropic");
    expect(config).toContain("model: claude-sonnet-4-20250514");
  });

  it("includes all enabled modes", () => {
    const config = generateConfigFromAnswers(baseAnswers());
    expect(config).toContain("modes:");
    expect(config).toContain("plan:");
    expect(config).toContain("build:");
  });

  it("excludes disabled yolo", () => {
    const config = generateConfigFromAnswers(baseAnswers({ yoloEnabled: false }));
    expect(config).not.toContain("yolo:");
  });

  it("includes yolo when enabled", () => {
    const config = generateConfigFromAnswers(baseAnswers({ yoloEnabled: true, yoloConfirmDestructive: false }));
    expect(config).toContain("yolo:");
    expect(config).toContain("confirmDestructive: false");
  });

  it("includes plan capabilities", () => {
    const config = generateConfigFromAnswers(baseAnswers({ planCanPropose: true, planCanExecute: true }));
    expect(config).toContain("canPropose: true");
    expect(config).toContain("canExecute: true");
  });

  it("includes build options", () => {
    const config = generateConfigFromAnswers(baseAnswers({ buildWithTests: false, buildWithDeploy: true }));
    expect(config).toContain("withTests: false");
    expect(config).toContain("withDeploy: true");
  });

  it("includes memory section", () => {
    const config = generateConfigFromAnswers(baseAnswers());
    expect(config).toContain("memory:");
    expect(config).toContain("auto:");
    expect(config).toContain("maxLines: 200");
  });

  it("includes vector memory when enabled", () => {
    const config = generateConfigFromAnswers(baseAnswers({
      vectorEnabled: true,
      vectorProvider: "qdrant",
      qdrantUrl: "http://qdrant:6333",
    }));
    expect(config).toContain("vector:");
    expect(config).toContain("provider: qdrant");
    expect(config).toContain("url: \"http://qdrant:6333\"");
  });

  it("excludes vector config when disabled", () => {
    const config = generateConfigFromAnswers(baseAnswers({ vectorEnabled: false }));
    expect(config).not.toContain("vector:");
  });

  it("includes MCP servers", () => {
    const config = generateConfigFromAnswers(baseAnswers({ mcpGitHub: true, mcpJira: true }));
    expect(config).toContain("mcp:");
    expect(config).toContain("github:");
    expect(config).toContain("jira:");
  });

  it("includes database MCP when enabled", () => {
    const config = generateConfigFromAnswers(baseAnswers({ mcpDatabase: true }));
    expect(config).toContain("database:");
  });

  it("excludes MCP servers when disabled", () => {
    const config = generateConfigFromAnswers(baseAnswers({ mcpGitHub: false, mcpJira: false, mcpDatabase: false }));
    expect(config).toContain("servers:");
  });

  it("includes branding with voice theme", () => {
    const config = generateConfigFromAnswers(baseAnswers({ brandingVoice: "casual" }));
    expect(config).toContain("branding:");
    expect(config).toContain("theme: casual");
  });

  it("includes default colors", () => {
    const config = generateConfigFromAnswers(baseAnswers());
    expect(config).toContain('primary: "#D97757"');
    expect(config).toContain('accent: "#2563EB"');
  });

  it("uses openai model", () => {
    const config = generateConfigFromAnswers(baseAnswers({ llmProvider: "openai", model: "gpt-4o" }));
    expect(config).toContain("provider: openai");
    expect(config).toContain("model: gpt-4o");
  });

  it("uses azure model", () => {
    const config = generateConfigFromAnswers(baseAnswers({ llmProvider: "azure", model: "gpt-4-turbo" }));
    expect(config).toContain("provider: azure");
    expect(config).toContain("model: gpt-4-turbo");
  });

  it("includes default mode always", () => {
    const config = generateConfigFromAnswers(baseAnswers({ planEnabled: false, buildEnabled: false }));
    expect(config).toContain("default:");
    expect(config).toContain("enabled: true");
  });

  it("generates valid YAML structure", () => {
    const config = generateConfigFromAnswers(baseAnswers());
    const lines = config.split("\n");
    const nonEmpty = lines.filter((l) => l.trim());
    for (const line of nonEmpty) {
      expect(line.trim()).toMatch(/^[a-zA-Z#]/);
    }
  });

  it("includes collection name for qdrant", () => {
    const config = generateConfigFromAnswers(baseAnswers({
      vectorEnabled: true,
      vectorProvider: "qdrant",
      qdrantUrl: "http://localhost:6333",
    }));
    expect(config).toContain('collection: "test-cli-docs"');
  });

  it("uses client name in collection", () => {
    const config = generateConfigFromAnswers(baseAnswers({
      clientName: "my-app",
      vectorEnabled: true,
      vectorProvider: "qdrant",
      qdrantUrl: "http://localhost:6333",
    }));
    expect(config).toContain('collection: "my-app-docs"');
  });
});

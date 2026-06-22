// tests/unit/core/llm/factory.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMFactory } from "../../../../src/core/llm/factory.js";
import { AISDKProvider } from "../../../../src/core/llm/ai-sdk.js";
import type { LLMConfig } from "../../../../src/core/llm/provider.js";

// Mock AISDKProvider
vi.mock("../../../../src/core/llm/ai-sdk.js", () => ({
  AISDKProvider: vi.fn().mockImplementation((config) => ({
    name: config.provider,
    model: config.model,
    maxTokens: config.maxTokens,
  })),
}));

describe("LLMFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates provider for openrouter", () => {
      const config: LLMConfig = {
        provider: "openrouter",
        model: "openrouter/owl-alpha",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("openrouter");
    });

    it("creates provider for anthropic", () => {
      const config: LLMConfig = {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("anthropic");
    });

    it("creates provider for openai", () => {
      const config: LLMConfig = {
        provider: "openai",
        model: "gpt-4o",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("openai");
    });

    it("creates provider for groq", () => {
      const config: LLMConfig = {
        provider: "groq",
        model: "llama-3.1-8b-instant",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("groq");
    });

    it("creates provider for together", () => {
      const config: LLMConfig = {
        provider: "together",
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("together");
    });

    it("creates provider for lmstudio", () => {
      const config: LLMConfig = {
        provider: "lmstudio",
        model: "local-model",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("lmstudio");
    });

    it("creates provider for ollama", () => {
      const config: LLMConfig = {
        provider: "ollama",
        model: "llama3.2",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("ollama");
    });

    it("creates provider for google", () => {
      const config: LLMConfig = {
        provider: "google",
        model: "gemini-2.0-flash",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("google");
    });

    it("creates provider for xai", () => {
      const config: LLMConfig = {
        provider: "xai",
        model: "grok-2",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const provider = LLMFactory.create(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe("xai");
    });
  });

  describe("validateConfig", () => {
    it("returns errors for missing model", () => {
      const config: LLMConfig = {
        provider: "openrouter",
        model: "",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const errors = LLMFactory.validateConfig(config);
      expect(errors).toContain("Model is required");
    });

    it("returns errors for missing API key", () => {
      const config: LLMConfig = {
        provider: "openrouter",
        model: "openrouter/owl-alpha",
        maxTokens: 4096,
        temperature: 0.7,
      };

      // Clear env var
      const originalKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const errors = LLMFactory.validateConfig(config);
      expect(errors).toContain("API key for openrouter not found (set OPENROUTER_API_KEY env var)");

      // Restore env var
      if (originalKey) {
        process.env.OPENROUTER_API_KEY = originalKey;
      }
    });

    it("returns errors for invalid maxTokens", () => {
      const config: LLMConfig = {
        provider: "openrouter",
        model: "openrouter/owl-alpha",
        maxTokens: 0,
        temperature: 0.7,
      };

      const errors = LLMFactory.validateConfig(config);
      expect(errors).toContain("maxTokens must be between 1 and 200000");
    });

    it("returns errors for invalid temperature", () => {
      const config: LLMConfig = {
        provider: "openrouter",
        model: "openrouter/owl-alpha",
        maxTokens: 4096,
        temperature: 3,
      };

      const errors = LLMFactory.validateConfig(config);
      expect(errors).toContain("temperature must be between 0 and 2");
    });

    it("returns empty array for valid config", () => {
      const config: LLMConfig = {
        provider: "lmstudio",
        model: "local-model",
        maxTokens: 4096,
        temperature: 0.7,
      };

      const errors = LLMFactory.validateConfig(config);
      expect(errors).toEqual([]);
    });
  });
});

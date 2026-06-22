// tests/unit/core/llm/ai-sdk.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AISDKProvider } from "../../../../src/core/llm/ai-sdk.js";
import type { LLMConfig } from "../../../../src/core/llm/provider.js";

// Mock the AI SDK modules
vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    text: "Test response",
    toolCalls: [],
    usage: { inputTokens: 100, outputTokens: 50 },
    finishReason: "stop",
  }),
  streamText: vi.fn().mockReturnValue({
    textStream: (async function* () {
      yield "Hello";
      yield " World";
    })(),
    usage: Promise.resolve({ inputTokens: 100, outputTokens: 50 }),
  }),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("@ai-sdk/xai", () => ({
  createXai: vi.fn().mockReturnValue(vi.fn()),
}));

describe("AISDKProvider", () => {
  const baseConfig: LLMConfig = {
    provider: "openrouter",
    model: "openrouter/owl-alpha",
    maxTokens: 4096,
    temperature: 0.7,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("creates provider with correct name and model", () => {
      const provider = new AISDKProvider(baseConfig);
      expect(provider.name).toBe("openrouter");
      expect(provider.model).toBe("openrouter/owl-alpha");
      expect(provider.maxTokens).toBe(4096);
    });

    it("supports anthropic provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("anthropic");
    });

    it("supports openai provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "openai",
        model: "gpt-4o",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("openai");
    });

    it("supports groq provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "groq",
        model: "llama-3.1-8b-instant",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("groq");
    });

    it("supports together provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "together",
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("together");
    });

    it("supports lmstudio provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "lmstudio",
        model: "local-model",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("lmstudio");
    });

    it("supports ollama provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "ollama",
        model: "llama3.2",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("ollama");
    });

    it("supports google provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "google",
        model: "gemini-2.0-flash",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("google");
    });

    it("supports xai provider", () => {
      const config: LLMConfig = {
        ...baseConfig,
        provider: "xai",
        model: "grok-2",
      };
      const provider = new AISDKProvider(config);
      expect(provider.name).toBe("xai");
    });
  });

  describe("chat", () => {
    it("returns response with content", async () => {
      const provider = new AISDKProvider(baseConfig);
      const messages = [
        { role: "user" as const, content: "Hello", timestamp: new Date() },
      ];

      const response = await provider.chat(messages, "You are a helpful assistant.");
      expect(response.content).toBe("Test response");
    });

    it("handles tool calls", async () => {
      const { generateText } = await import("ai");
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "",
        toolCalls: [
          {
            toolCallId: "call-1",
            toolName: "test-tool",
            input: { arg1: "value1" },
            type: "tool-call",
          },
        ],
        usage: { inputTokens: 100, outputTokens: 50 },
        finishReason: "tool-calls",
      });

      const provider = new AISDKProvider(baseConfig);
      const messages = [
        { role: "user" as const, content: "Use tool", timestamp: new Date() },
      ];
      const tools = [
        {
          name: "test-tool",
          description: "A test tool",
          parameters: { type: "object", properties: { arg1: { type: "string" } } },
        },
      ];

      const response = await provider.chat(messages, "You are a helpful assistant.", tools);
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls![0].name).toBe("test-tool");
      expect(response.stopReason).toBe("tool_use");
    });
  });

  describe("stream", () => {
    it("yields stream chunks", async () => {
      const provider = new AISDKProvider(baseConfig);
      const messages = [
        { role: "user" as const, content: "Hello", timestamp: new Date() },
      ];

      const chunks: string[] = [];
      for await (const chunk of provider.stream(messages, "You are a helpful assistant.")) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks).toEqual(["Hello", " World"]);
    });

    it("calls onChunk callback", async () => {
      const provider = new AISDKProvider(baseConfig);
      const messages = [
        { role: "user" as const, content: "Hello", timestamp: new Date() },
      ];

      const onChunk = vi.fn();
      for await (const chunk of provider.stream(messages, "You are a helpful assistant.", undefined, onChunk)) {
        // consume stream
      }

      expect(onChunk).toHaveBeenCalled();
    });
  });

  describe("countTokens", () => {
    it("approximates token count", () => {
      const provider = new AISDKProvider(baseConfig);
      const count = provider.countTokens("Hello World");
      expect(count).toBe(3); // 11 chars / 4 ≈ 3
    });
  });
});

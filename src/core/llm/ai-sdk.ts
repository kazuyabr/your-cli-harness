// src/core/llm/ai-sdk.ts

import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import type { LLMProvider, LLMConfig, LLMResponse, StreamChunk, ToolDefinition } from "./provider.js";
import type { Message } from "../../shared/types.js";
import { LLMError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

export class AISDKProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;
  readonly maxTokens: number;
  private config: LLMConfig;
  private provider: ReturnType<typeof this.createProvider>;

  constructor(config: LLMConfig) {
    this.config = config;
    this.name = config.provider;
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.provider = this.createProvider();
  }

  private createProvider() {
    const { provider, apiKey, baseURL } = this.config;

    switch (provider) {
      case "anthropic":
        return createAnthropic({
          apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
          baseURL,
        });

      case "openai":
        return createOpenAI({
          apiKey: apiKey || process.env.OPENAI_API_KEY,
          baseURL,
        });

      case "openrouter":
        return createOpenAI({
          apiKey: apiKey || process.env.OPENROUTER_API_KEY,
          baseURL: baseURL || "https://openrouter.ai/api/v1",
        });

      case "groq":
        return createOpenAI({
          apiKey: apiKey || process.env.GROQ_API_KEY,
          baseURL: baseURL || "https://api.groq.com/openai/v1",
        });

      case "together":
        return createOpenAI({
          apiKey: apiKey || process.env.TOGETHER_API_KEY,
          baseURL: baseURL || "https://api.together.xyz/v1",
        });

      case "lmstudio":
        return createOpenAI({
          apiKey: "lm-studio",
          baseURL: baseURL || process.env.LM_STUDIO_URL || "http://localhost:1234/v1",
        });

      case "ollama":
        return createOpenAI({
          apiKey: "ollama",
          baseURL: baseURL || process.env.OLLAMA_URL || "http://localhost:11434/v1",
        });

      case "google":
        return createGoogleGenerativeAI({
          apiKey: apiKey || process.env.GOOGLE_API_KEY,
          baseURL,
        });

      case "xai":
        return createXai({
          apiKey: apiKey || process.env.XAI_API_KEY,
          baseURL,
        });

      default:
        throw new LLMError(`Unsupported AI SDK provider: ${provider}`);
    }
  }

  private convertMessages(messages: Message[]) {
    return messages
      .filter((msg) => msg.role !== "system" && msg.role !== "tool")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
  }

  async chat(
    messages: Message[],
    systemPrompt: string,
    _tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    try {
      logger.info(`AI SDK chat: ${this.config.provider}/${this.model}`);

      const result = await generateText({
        model: this.provider(this.model),
        system: systemPrompt,
        messages: this.convertMessages(messages),
        temperature: this.config.temperature,
        maxRetries: this.config.maxRetries || 3,
      });

      return {
        content: result.text,
        toolCalls: result.toolCalls?.map((tc, index) => ({
          id: `call-${index}`,
          name: String(tc.toolName),
          arguments: "input" in tc ? (tc.input as Record<string, unknown>) : {},
        })),
        usage: {
          inputTokens: result.usage?.inputTokens || 0,
          outputTokens: result.usage?.outputTokens || 0,
        },
        stopReason: result.finishReason === "tool-calls" ? "tool_use" : "stop",
        raw: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`AI SDK chat error: ${message}`);
      throw new LLMError(`AI SDK chat failed: ${message}`);
    }
  }

  async *stream(
    messages: Message[],
    systemPrompt: string,
    _tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    try {
      logger.info(`AI SDK stream: ${this.config.provider}/${this.model}`);

      const result = streamText({
        model: this.provider(this.model),
        system: systemPrompt,
        messages: this.convertMessages(messages),
        temperature: this.config.temperature,
        maxRetries: this.config.maxRetries || 3,
      });

      for await (const chunk of result.textStream) {
        const streamChunk: StreamChunk = {
          content: chunk,
          done: false,
        };
        onChunk?.(streamChunk);
        yield streamChunk;
      }

      const finalUsage = await result.usage;
      const finalChunk: StreamChunk = {
        content: "",
        done: true,
        usage: {
          inputTokens: finalUsage?.inputTokens || 0,
          outputTokens: finalUsage?.outputTokens || 0,
        },
      };
      onChunk?.(finalChunk);
      yield finalChunk;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`AI SDK stream error: ${message}`);
      throw new LLMError(`AI SDK stream failed: ${message}`);
    }
  }

  countTokens(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

// src/core/llm/anthropic.ts

import Anthropic from "@anthropic-ai/sdk";

import type { Message } from "../../shared/types.js";
import type {
  LLMProvider,
  LLMResponse,
  LLMConfig,
  ToolDefinition,
  ToolCall,
  StreamChunk,
} from "./provider.js";
import { LLMError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly model: string;
  readonly maxTokens: number;
  private client: Anthropic;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
    });
  }

  async chat(
    messages: Message[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    return this.withRetry(async () => {
      const anthropicMessages = this.toAnthropicMessages(messages);
      const anthropicTools = tools ? this.toAnthropicTools(tools) : undefined;

      logger.debug(`Anthropic chat: ${anthropicMessages.length} messages, ${tools?.length ?? 0} tools`);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: anthropicTools,
        temperature: this.config.temperature,
      });

      return this.fromAnthropicResponse(response);
    });
  }

  async *stream(
    messages: Message[],
    systemPrompt: string,
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    const anthropicMessages = this.toAnthropicMessages(messages);
    const anthropicTools = tools ? this.toAnthropicTools(tools) : undefined;

    logger.debug(`Anthropic stream: ${anthropicMessages.length} messages`);

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: anthropicTools,
      temperature: this.config.temperature,
    });

    let currentToolCall: Partial<ToolCall> | undefined;

    for await (const event of stream) {
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          const chunk: StreamChunk = { content: event.delta.text, done: false };
          onChunk?.(chunk);
          yield chunk;
        } else if (event.delta.type === "input_json_delta") {
          if (currentToolCall) {
            const existing = (currentToolCall.arguments as Record<string, unknown>) ?? {};
            const partial = event.delta.partial_json;
            currentToolCall.arguments = { ...existing, _partial: partial } as Record<string, unknown>;
          }
        }
      } else if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          currentToolCall = {
            id: event.content_block.id,
            name: event.content_block.name,
            arguments: {},
          };
        }
      } else if (event.type === "message_delta") {
        if (event.delta.stop_reason === "tool_use" && currentToolCall) {
          const chunk: StreamChunk = { content: "", done: false, toolCall: currentToolCall };
          onChunk?.(chunk);
          yield chunk;
        }
      } else if (event.type === "message_stop") {
        const finalResponse = await stream.finalMessage();
        const chunk: StreamChunk = {
          content: "",
          done: true,
          usage: {
            inputTokens: finalResponse.usage.input_tokens,
            outputTokens: finalResponse.usage.output_tokens,
          },
        };
        onChunk?.(chunk);
        yield chunk;
      }
    }
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const maxRetries = this.config.maxRetries ?? DEFAULT_MAX_RETRIES;
    const retryDelay = this.config.retryDelay ?? DEFAULT_RETRY_DELAY;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isRetryable = this.isRetryableError(err);
        if (attempt === maxRetries || !isRetryable) {
          throw new LLMError(`Anthropic API error (attempt ${attempt}/${maxRetries}): ${err}`, err as Error);
        }
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Anthropic retry ${attempt}/${maxRetries} after ${delay}ms: ${err}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new LLMError("Anthropic API: max retries exceeded");
  }

  private isRetryableError(err: unknown): boolean {
    if (err instanceof Anthropic.APIError) {
      return err.status === 429 || err.status === 500 || err.status === 503;
    }
    return false;
  }

  private toAnthropicMessages(messages: Message[]): Anthropic.MessageParam[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m): Anthropic.MessageParam => {
        if (m.role === "tool") {
          return {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: m.toolCallId ?? "",
                content: m.content,
              },
            ],
          };
        }
        if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
          const content: Anthropic.ContentBlockParam[] = [];
          if (m.content) {
            content.push({ type: "text", text: m.content });
          }
          for (const tc of m.toolCalls) {
            content.push({
              type: "tool_use",
              id: tc.id,
              name: tc.name,
              input: tc.arguments,
            });
          }
          return { role: "assistant", content };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content,
        };
      });
  }

  private toAnthropicTools(tools: ToolDefinition[]): Anthropic.Tool[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Tool.InputSchema,
    }));
  }

  private fromAnthropicResponse(response: Anthropic.Message): LLMResponse {
    const textBlocks = response.content.filter((c) => c.type === "text") as Anthropic.TextBlock[];
    const content = textBlocks.map((b) => b.text).join("\n");

    const toolUseBlocks = response.content.filter((c) => c.type === "tool_use") as Anthropic.ToolUseBlock[];
    const toolCalls: ToolCall[] = toolUseBlocks.map((b) => ({
      id: b.id,
      name: b.name,
      arguments: b.input as Record<string, unknown>,
    }));

    let stopReason: LLMResponse["stopReason"] = "stop";
    if (response.stop_reason === "tool_use") stopReason = "tool_use";
    else if (response.stop_reason === "max_tokens") stopReason = "max_tokens";

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      stopReason,
      raw: response,
    };
  }
}

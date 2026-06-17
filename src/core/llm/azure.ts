// src/core/llm/azure.ts

import OpenAI from "openai";

import type { Message } from "../../shared/types.js";
import type {
  LLMProvider,
  LLMResponse,
  ToolDefinition,
  ToolCall,
  StreamChunk,
  AzureConfig,
} from "./provider.js";
import { LLMError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger();

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

function createAzureClient(config: AzureConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey ?? process.env.AZURE_OPENAI_API_KEY,
    baseURL: `https://${config.resourceName}.openai.azure.com/openai/deployments/${config.deploymentName}`,
    defaultQuery: { "api-version": config.apiVersion },
    defaultHeaders: { "api-key": config.apiKey ?? process.env.AZURE_OPENAI_API_KEY ?? "" },
    maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
  });
}

export class AzureOpenAIProvider implements LLMProvider {
  readonly name = "azure";
  readonly model: string;
  readonly maxTokens: number;
  private client: OpenAI;
  private config: AzureConfig;

  constructor(config: AzureConfig) {
    this.model = config.deploymentName;
    this.maxTokens = config.maxTokens;
    this.config = config;
    this.client = createAzureClient(config);
  }

  async chat(
    messages: Message[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    return this.withRetry(async () => {
      const openaiMessages = this.toOpenAIMessages(messages, systemPrompt);
      const openaiTools = tools ? this.toOpenAITools(tools) : undefined;

      const params: OpenAI.ChatCompletionCreateParams = {
        model: this.config.deploymentName,
        messages: openaiMessages,
        max_tokens: this.maxTokens,
        temperature: this.config.temperature,
      };

      if (openaiTools) {
        params.tools = openaiTools;
        params.tool_choice = "auto";
      }

      const response = await this.client.chat.completions.create(params);
      return this.fromOpenAIResponse(response);
    });
  }

  async *stream(
    messages: Message[],
    systemPrompt: string,
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    const openaiMessages = this.toOpenAIMessages(messages, systemPrompt);
    const openaiTools = tools ? this.toOpenAITools(tools) : undefined;

    const params: OpenAI.ChatCompletionCreateParams = {
      model: this.config.deploymentName,
      messages: openaiMessages,
      max_tokens: this.maxTokens,
      temperature: this.config.temperature,
      stream: true,
    };

    if (openaiTools) {
      params.tools = openaiTools;
      params.tool_choice = "auto";
    }

    const stream = await this.client.chat.completions.create(params);

    const toolCallArgsBuffer: Record<string, string> = {};
    let currentToolCall: Partial<ToolCall> | undefined;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;

      if (delta.content) {
        const sc: StreamChunk = { content: delta.content, done: false };
        onChunk?.(sc);
        yield sc;
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.id) {
            currentToolCall = { id: tc.id, name: tc.function?.name ?? "", arguments: {} };
            toolCallArgsBuffer[tc.id] = "";
          }
          if (tc.function?.arguments && tc.id) {
            toolCallArgsBuffer[tc.id] = (toolCallArgsBuffer[tc.id] ?? "") + tc.function.arguments;
          }
        }
      }

      if (choice.finish_reason === "tool_calls" && currentToolCall?.id) {
        try {
          const argsStr = toolCallArgsBuffer[currentToolCall.id] ?? "{}";
          currentToolCall.arguments = JSON.parse(argsStr) as Record<string, unknown>;
        } catch {
          currentToolCall.arguments = { raw: toolCallArgsBuffer[currentToolCall.id] ?? "" };
        }
        const sc: StreamChunk = { content: "", done: false, toolCall: currentToolCall };
        onChunk?.(sc);
        yield sc;
      }

      if (choice.finish_reason) {
        const sc: StreamChunk = {
          content: "",
          done: true,
          usage: chunk.usage
            ? { inputTokens: chunk.usage.prompt_tokens, outputTokens: chunk.usage.completion_tokens }
            : undefined,
        };
        onChunk?.(sc);
        yield sc;
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
          throw new LLMError(`Azure OpenAI error (attempt ${attempt}/${maxRetries}): ${err}`, err as Error);
        }
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Azure retry ${attempt}/${maxRetries} after ${delay}ms: ${err}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new LLMError("Azure OpenAI: max retries exceeded");
  }

  private isRetryableError(err: unknown): boolean {
    if (err instanceof OpenAI.APIError) {
      return err.status === 429 || err.status === 500 || err.status === 502 || err.status === 503;
    }
    return false;
  }

  private toOpenAIMessages(
    messages: Message[],
    systemPrompt: string
  ): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const m of messages) {
      if (m.role === "system") continue;

      if (m.role === "tool") {
        result.push({ role: "tool", content: m.content, tool_call_id: m.toolCallId ?? "" });
      } else if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
        result.push({
          role: "assistant",
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        });
      } else {
        result.push({ role: m.role as "user" | "assistant", content: m.content });
      }
    }

    return result;
  }

  private toOpenAITools(tools: ToolDefinition[]): OpenAI.ChatCompletionTool[] {
    return tools.map((t) => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }

  private fromOpenAIResponse(response: OpenAI.ChatCompletion): LLMResponse {
    const choice = response.choices[0];
    if (!choice) {
      return { content: "", usage: { inputTokens: 0, outputTokens: 0 }, stopReason: "stop" };
    }

    const message = choice.message;
    const toolCalls: ToolCall[] = [];

    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        try {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          });
        } catch {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: { raw: tc.function.arguments },
          });
        }
      }
    }

    let stopReason: LLMResponse["stopReason"] = "stop";
    if (choice.finish_reason === "tool_calls") stopReason = "tool_use";
    else if (choice.finish_reason === "length") stopReason = "max_tokens";

    return {
      content: message.content ?? "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
      stopReason,
      raw: response,
    };
  }
}

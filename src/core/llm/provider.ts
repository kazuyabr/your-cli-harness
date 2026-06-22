// src/core/llm/provider.ts

import type { Message } from "../../shared/types.js";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason?: "stop" | "tool_use" | "max_tokens" | "error";
  raw?: unknown;
}

export interface StreamChunk {
  content: string;
  toolCall?: Partial<ToolCall>;
  done: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMConfig {
  provider: "anthropic" | "openai" | "azure" | "openrouter" | "groq" | "together" | "lmstudio" | "ollama" | "xai" | "google";
  model: string;
  apiKey?: string;
  baseURL?: string;
  maxTokens: number;
  temperature: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface AzureConfig extends LLMConfig {
  provider: "azure";
  resourceName: string;
  deploymentName: string;
  apiVersion: string;
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  readonly maxTokens: number;

  chat(
    messages: Message[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse>;

  stream(
    messages: Message[],
    systemPrompt: string,
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk>;

  countTokens(text: string): number;
}

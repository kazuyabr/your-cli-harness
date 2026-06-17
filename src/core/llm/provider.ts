// src/core/llm/provider.ts

import type { Message } from "../../shared/types.js";

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  chat(messages: Message[], systemPrompt: string): Promise<LLMResponse>;
  stream(messages: Message[], systemPrompt: string): AsyncGenerator<string>;
}

// src/core/llm/anthropic.ts

import Anthropic from "@anthropic-ai/sdk";

import type { Message } from "../../shared/types.js";
import type { LLMProvider, LLMResponse } from "./provider.js";
import { LLMError } from "../../shared/errors.js";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly model: string;
  private client: Anthropic;

  constructor(model: string = "claude-sonnet-4-20250514", apiKey?: string) {
    this.model = model;
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(messages: Message[], systemPrompt: string): Promise<LLMResponse> {
    try {
      const anthropicMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      const content = response.content
        .filter((c) => c.type === "text")
        .map((c) => (c as Anthropic.TextBlock).text)
        .join("\n");

      return {
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      throw new LLMError(`Anthropic API error: ${err}`, err as Error);
    }
  }

  async *stream(messages: Message[], systemPrompt: string): AsyncGenerator<string> {
    try {
      const anthropicMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
    } catch (err) {
      throw new LLMError(`Anthropic stream error: ${err}`, err as Error);
    }
  }
}
